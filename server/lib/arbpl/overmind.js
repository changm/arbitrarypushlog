/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at:
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Messaging Code.
 *
 * The Initial Developer of the Original Code is
 *   The Mozilla Foundation
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Andrew Sutherland <asutherland@asutherland.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Main processing pipeline logic.  We operate based on a time-window based
 *  mode of operation.  In steady state, the window is open-ended from the last
 *  grab time.  In backfill, it's a specific window based on our backfill chunk
 *  size.
 *
 * General operation looks like this:
 * - Figure out the appropriate time window for a given Tinderbox tree.  This is
 *    hinted by checking the database for a tree and finding the most recent
 *    completed build timestamp we have heard about.
 * - Fetch the tinderbox data for that time window.
 * - Fetch the pushlog data corresponding to the revisions the tinderbox told us
 *    about.  If our time window is intended to cover through "now", issue the
 *    query open-ended so we might see push data that does not yet have builds
 *    triggered.
 * - Ask the database about everything we have heard about.
 * - Figure out what the database does not know about for the data we already
 *    have and store it.
 * - Figure out what build logs are interesting to us that we have not already
 *    fetched and processed and fetch them.
 **/

define(
  [
    "q", "q-http",
    "./datastore",
    "./tinderboxer",
    "./xpcshell-logfrob", "./mozmill-logfrob",
    "arbcommon/repodefs",
    "./hackjobs",
    "exports"
  ],
  function(
    $Q, $Qhttp,
    $datastore,
    $tinderboxer,
    $frobXpcshell, $frobMozmill,
    $repodefs,
    $hackjobs,
    exports
  ) {

var when = $Q.when;

var DB = new $datastore.HStore();

var HOURS_IN_MS = 60 * 60 * 1000;

/**
 * The pushlog has ugly internal date parsing plus a fallback to the python
 *  "parsedatetime" module.  We opt to fail the custom date parsing regex and
 *  so go straight to parsedatetime which can understand time zones reliably.
 */
function PushlogDateString(d){
 function pad(n) {
   return n<10 ? '0'+n : n;
 };
 return encodeURIComponent(
   pad(d.getUTCMonth()+1) + '/' +
   pad(d.getUTCDate()) + '/' +
   d.getUTCFullYear() + ' ' +
   + pad(d.getUTCHours())+':'
   + pad(d.getUTCMinutes())+':'
   + pad(d.getUTCSeconds()) + 'Z');
}

function Overmind(tinderTreeDef) {
  this.tinderTree = tinderTreeDef;

  this.tinderboxer = new $tinderboxer.Tinderboxer(tinderTreeDef.name);

  this.state = "inactive";
  this._syncDeferred = null;

  /**
   * How many pushlog queries are in flight to the hg server?  We track this
   *  so we can resolve a promise when the number hits zero and stays there.
   *  (We may temporarily hit zero during the resolution process, but it
   *  will rebound to 1 before control flow is yielded.)
   */
  this._pendingPushFetches = 0;

  /**
   * How many log processing jobs are active?  This is used
   */
  this._activeLogFrobbers = [];
  /**
   * Queued log processing jobs.
   */
  this._logProcJobs = null;
}
Overmind.prototype = {
  _noteState: function(newState) {
    this.state = newState;
    console.log("Overmind state is now:", this.state);
  },

  bootstrap: function() {
    return DB.bootstrap();
  },

  /**
   * Attempt to bring us up-to-date based on the current state.  Which means
   *  asking for what has happened in the last 12 hours (or whatever the
   *  tinderbox actually gives us from its "now" file) since it can involve
   *  starred stuff, slow builds, and the like.
   */
  syncUp: function() {
    return this.syncTimeRange({
      // We kick endTime into the future to cause a fast-path branch
      //  to be taken where we don't even issue a query proper but just
      //  ask for the "current" file.  (We are _not_ trying to fight
      //  clock skew on the server!  This just needs to be offset
      //  enough that the given duration has not ellapsed by the time
      //  we get to that fast-path check.)
      endTime: Date.now() + (20 * 1000),
      duration: 12 * HOURS_IN_MS,
    });
  },

  syncTimeRange: function(timeRange) {
    console.log("syncTimeRange...");
    if (!this._syncDeferred)
      this._syncDeferred = $Q.defer();

    this._logProcJobs = [];

    this._noteState("tinderbox:fetching");

    when(this.tinderboxer.fetchRange(timeRange),
      this._procTinderboxBuildResults.bind(this),
      function(err) { console.error("problem getting tinderbox results."); });

    return this._syncDeferred.promise;
  },

  /**
   * Group results by build revision tuples, then ask the pushlog server for
   *  those revisions we do not currently know about.
   */
  _procTinderboxBuildResults: function(results) {
    this._noteState("tinderbox:processing");

    var RE_RELEASES = /^releases\//;
    /**
     * Given a repo-name from the tinderbox (basically the repo path), try
     *  and find the `CodeRepoDef` for that repository.
     */
    function findRepoDef(repoName) {
      if (RE_RELEASES.test(repoName)) {
        repoName = repoName.substring(9);
      }

      if ($repodefs.REPOS.hasOwnProperty(repoName)) {
        return $repodefs.REPOS[repoName];
      }
      return null;
    }

    /** Map repo families to revision map depth... */
    var familyPrioMap = {};
    for (var iRepo = 0; iRepo < this.tinderTree.repos.length; iRepo++) {
      familyPrioMap[this.tinderTree.repos[iRepo].family] = iRepo;
    }

    /**
     * Hierarchical map that clusters the builds.  In the case of comm-central,
     *  the outer map will contain the comm-central revisions as keys, and the
     *  values with be maps with mozilla-central revisions as keys.  In
     *  the case of mozilla-central, there will only be the revMap whose keys
     *  are mozilla-central revisions.
     *
     * The values/leaf nodes in the map will be dictionaries with objects with
     *  a "builds" list in it.
     */
    var revMap = this._revMap = {};
    var repoAndRevs = {};
    var i, revision, repoDef;
    var earliest = null, latest = null;

    for (var buildId in results) {
      var build = results[buildId];

      if (earliest == null || build.startTime < earliest)
        earliest = build.startTime;
      if (latest == null || build.startTime > latest)
        latest = build.startTime;

      // Resolve and order the repositories based on our tupling hierarchy.
      // (We can't just key into build.revs in the order we want because on try
      //  servers we cannot guarantee that the exact repo we expect will be in
      //  use; that might be the variation that was being tried!)
      var orderedRevInfo = [];
      for (var revRepo in build.revs) {
        revision = build.revs[revRepo];
        repoDef = findRepoDef(revRepo);
        if (!repoDef || !familyPrioMap.hasOwnProperty(repoDef.family))
          throw new Error("Completely unknown repo: " + revRepo);
        orderedRevInfo[familyPrioMap[repoDef.family]] = [repoDef, revision];

        // update our pushlog fetch info
        if (!repoAndRevs.hasOwnProperty(revRepo))
          repoAndRevs[revRepo] = {repo: repoDef, revs: []};
        if (repoAndRevs[revRepo].revs.indexOf(revision) == -1)
          repoAndRevs[revRepo].revs.push(revision);
      }
      // now map the contributions into the revMap
      var curMap = revMap;
      for (i = 0; i < orderedRevInfo.length; i++) {
        repoDef = orderedRevInfo[i][0];
        revision = orderedRevInfo[i][1];
        // final nesting?
        if (i == orderedRevInfo.length - 1) {
          if (curMap.hasOwnProperty(revision)) {
            curMap = curMap[revision];
            curMap.builds.push(build);
          }
          else {
            curMap = curMap[revision] = {builds: [build]};
          }
        }
        // hierarchy stage still
        else {
          if (curMap.hasOwnProperty(revision))
            curMap = curMap[revision];
          else
            curMap = curMap[revision] = {};
        }
      }
    }

    this._getPushInfoForRevisions(repoAndRevs, earliest, latest);
  },

  /**
   * Retrieve the push and changeset information given one or more trees and
   *  a set of revisions for each tree.  We assume temporal locality for the
   *  revisions we are provided and try to just ask the server for an expanded
   *  time range
   *
   * @args[
   *   @param[repoAndRevs @dictof[repoName @dict[
   *     @key[repo CodeRepoDef]
   *     @key[revs @listof[String]]{
   *       The list of revision strings that the pushlog will find acceptable.
   *     }
   *   ]]]
   *   @param[earliestTime Date]{
   *     The earliest time that we think correlates with the revisions.  When
   *     going off of builds, this means the earliest timestamp for the start of
   *     a build.  We will apply a fudge factor; no one upstream of us should.
   *   }
   *   @param[latestTime Date]{
   *     The latest time that we think correlates with the revisions.  When
   *     going off of builds, this means the latest timestamp for the start of
   *     a build.
   *   }
   * ]
   */
  _getPushInfoForRevisions: function(repoAndRevs, earliestTime, latestTime) {
    this._noteState("pushlog:fetch");

    // map (repo+rev) => {push: blah, changeset: blah}
    this._revInfoByRepoAndRev = {};

    // normalize to millis
    earliestTime = earliestTime.valueOf();
    latestTime = latestTime.valueOf();

    // fudge earliestTime by a lot because the one-off fetches are really
    //  slow.
    earliestTime -= 12 * HOURS_IN_MS;

    var earliestTimeStr = PushlogDateString(new Date(earliestTime));
    var latestTimeStr = PushlogDateString(new Date(latestTime));

    for (var repoName in repoAndRevs) {
      var repoAndRev = repoAndRevs[repoName];

      console.log("Repo", repoName, "wants", repoAndRev.revs);
      this._fetchSpecificPushInfo(repoAndRev.repo, repoAndRev.revs,
                                  "&startdate=" + earliestTimeStr +
                                  "&enddate=" + latestTimeStr);
    }
  },

  _fetchSpecificPushInfo: function(repoDef, revs, paramStr) {
    var self = this;
    var url = repoDef.url + "json-pushes?full=1" + paramStr;
    // XXX promises feel like they would be cleaner, but the Q abstractions are
    //  concerning still right now.
    this._pendingPushFetches++;

    console.log("fetching push info for", repoDef.name, "paramstr", paramStr);
    when($Qhttp.read(url),
      function(jsonBuffer) {
        self._pendingPushFetches--;

        var jsonStr = jsonBuffer.toString("utf8");
        var pushes = JSON.parse(jsonStr);

        console.log("repo", repoDef.name, "got JSON");
        for (var pushId in pushes) {
          var pinfo = pushes[pushId];
          pinfo.id = pushId;

          for (var iChange = 0; iChange < pinfo.changesets.length; iChange++) {
            var csinfo = pinfo.changesets[iChange];

            var shortRev = csinfo.node.substring(0, 12);
            csinfo.shortRev = shortRev;

            var aggrKey = repoDef.name + ":" + shortRev;
            self._revInfoByRepoAndRev[aggrKey] = {
              push: pinfo,
              changeset: csinfo,
            };
            console.log("  resolving rev", shortRev, revs.indexOf(shortRev));
            if (revs.indexOf(shortRev) != -1)
              revs.splice(revs.indexOf(shortRev), 1);
          }
        }

        // Issue one-off requests for any missing changesets; chained, so only
        //  trigger for one right now.
        if (revs.length) {
          console.log("... still have pending revs", revs);
          self._fetchSpecificPushInfo(repoDef, revs, "&changeset=" + revs[0]);
        }
        else {
          if (self._pendingPushFetches == 0)
            self._processNextPush();
        }
      },
      function(err) {
        self._pendingPushFetches--;
        console.error("Push fetch error", err, err.stack);
      });
  },

  /**
   * Figure out what the database does not yet know; persist newfound state and
   *  initiate follow-on processing of logs and the like not yet processed.
   *
   * Now that we have the tinderbox builds and information on all the pushes
   *  mentioned by the tinderbox builds, we need to check what the database
   *  already knows.  Anything it does not know that we just found out, we need
   *  to tell.  Additionally, any derived information (like analysis of build
   *  logs) that has not been performed should also be scheduled.
   */
  _processNextPush: function() {
    this._noteState("db-delta:fetch");

    var repoDef = this.tinderTree.repos[0];
    var self = this;
    for (var changeset in this._revMap) {
      var aggrKey = repoDef.name + ":" + changeset;
      if (!this._revInfoByRepoAndRev.hasOwnProperty(aggrKey))
        throw new Error("Unable to map changeset " + changeset);
      var csmeta = this._revInfoByRepoAndRev[aggrKey];
      when(DB.getPushInfo(this.tinderTree.id, csmeta.push.id),
        function(rowResults) {
          self._gotDbInfoForPush(changeset, rowResults);
        },
        function(err) {
          console.error("Failed to find good info on push...");
        });
      // we did something. leave!
      return;
    }
    // (we only reach here if there were no more changesets to process)
    this._noteState("logproc");
    this._processNextLog();
  },

  /**
   * Now that we have what the database knows for this push, we can figure out
   *  what to tell the database and what log processing jobs we should trigger.
   */
  _gotDbInfoForPush: function(changeset, rowResults) {
    this._noteState("db-delta:check");
    var self = this;

    var rootRepoDef = this.tinderTree.repos[0];
    var isComplexRepo = this.tinderTree.repos.length > 1;

    var revInfo = this._revMap[changeset];
    delete this._revMap[changeset];

    // -- slurp dbstate into a map
    var dbstate = DB.normalizeOneRow(rowResults);
    var setstate = {};

    var rootPush =
      this._revInfoByRepoAndRev[rootRepoDef.name + ":" + changeset].push;

    // -- handle root "s:r" records.
    if (!dbstate.hasOwnProperty("s:r")) {
      setstate["s:r"] = rootPush;
    }

    /**
     * Figure out if the build is something we can perform follow-on processing
     *  for.  Currently this is true for xpcshell and Thunderbird mozmill runs.
     *  Everything else can go pound sand.
     */
    function isBuildLoggable(build) {
      return ((build.builder.type.type === "test") &&
              ((build.builder.type.subtype === "mozmill") ||
               (build.builder.type.subtype === "xpcshell")));
    }

    // -- normalized logic for both 'b' variants and log job checking
    function rockBuilds(keyExtra, builds) {
      for (var iBuild = 0; iBuild < builds.length; iBuild++) {
        var build = builds[iBuild];

        var bKey = "s:b" + keyExtra + ":" + build.id;
        var jsonStr = JSON.stringify(build);
        if (!dbstate.hasOwnProperty(bKey) ||
            dbstate[bKey] != jsonStr)
          setstate[bKey] = jsonStr;

        if (isBuildLoggable(build)) {
          var lKey = "s:l" + keyExtra + ":" + build.id;
          if (!dbstate.hasOwnProperty(lKey)) {
            self._logProcJobs.push({
              pushId: rootPush.id,
              key: lKey,
              build: build,
            });
          }
        }
      }
    }

    // -- fire off normalized logic
    function walkRevMap(accumKey, revMap, subRepos) {
      if (subRepos.length) {
        var repoDef = subRepos[0];
        for (var csKey in revMap) {
          var minfo = self._revInfoByRepoAndRev[repoDef.name + ":" + csKey];
          var curPush = minfo.push;

          var kidAccumKey = accumKey + ":" + curPush.id;
          var rKey = "s:r" + kidAccumKey;
          if (!dbstate.hasOwnProperty(rKey)) {
            setstate[rKey] = curPush;
          }

          walkRevMap(kidAccumKey,
                     revMap[csKey],
                     subRepos.slice(1));
        }
      }
      else {
        rockBuilds(accumKey, revMap.builds);
      }
    }
    walkRevMap("", revInfo, this.tinderTree.repos.slice(1));

    when(DB.putPushStuff(this.tinderTree.id, rootPush.id, setstate),
      function() {
        console.log("db write completed:", self.tinderTree.id, rootPush.id);
        // - kickoff next processing step.
        self._processNextPush();
      },
      function(err) {
        console.error("failed to write our many stories!");
      });
  },

  /**
   * How many logs should we try and process in parallel?  Let's keep this
   *  at 1 unless it turns out the tinderbox is really bad at serving us our
   *  requested files in a timely fasion.
   */
  MAX_CONCURRENT_LOG_FROBS: 1,

  /**
   * Trigger the processing of (one or more) logs.  We do this in a streaming
   *  fashion rather than promise fashion because these logs can end up being
   *  rather large.
   *
   * Log processing occurs as a follow-on process after all pushes have been
   *  process for no particular reason.  We could just as easily process all
   *  the logs for a push before moving on to the next push.
   */
  _processNextLog: function() {
    while ((this._activeLogFrobbers.length < this.MAX_CONCURRENT_LOG_FROBS) &&
           (this._logProcJobs.length)) {
      var job = this._logProcJobs.pop();

      var frobber = null;
      switch (job.build.builder.type.subtype) {
        case "xpcshell":
          frobber = this._processXpcshellLog(job);
          break;

        case "mozmill":
          frobber = this._processMozmillLog(job);
          break;

        default:
          console.error("dunnae how to frobben", job);
          break;
      }

      if (frobber)
        this._activeLogFrobbers.push(frobber);
    }

    if (this._activeLogFrobbers.length === 0 &&
        this._logProcJobs.length === 0) {
      console.log("Active log frobbers:", this._activeLogFrobbers);
      console.log("Log proc jobs:", this._logProcJobs);
      this._allDone();
    }
  },

  /**
   * Notify that a frobber has completed operation, saving its result state to
   *  the datastore and potentially triggering a new frobber.
   * XXX this implementation is verging on spaghetti-logic; the redeeming grace
   *  is we are still pretty small...
   *
   * @args[
   *   @param[frobber]{
   *     The frobber instance that completed processing, so that we can splice
   *     it out of the list of active frobbers.
   *   }
   *   @param[job]{
   *     The job the frobber was working; this provides us with the information
   *     required so we know where to write to.
   *   }
   *   @param[logResultObj]{
   *     The state object to persist to the datastore.  This will be JSON
   *     serialized at a lower level, so barring a great reason, there is no
   *     need to pre-serialize things.
   *   }
   * ]
   */
  _frobberDone: function(frobber, job, logResultObj) {
    var self = this;
    var stateObj = {};
    stateObj[job.key] = logResultObj;
    // Although we could potentially overlap the next request with this
    //  request, this is the easiest way to make sure that _allDone does not
    //  kill the VM prematurely.  XXX The datastore should probably be able to
    //  handle out a promise for when it has quiesced.
    console.log("frobber db write to", job.pushId);
    when(DB.putPushStuff(this.tinderTree.id, job.pushId, stateObj),
      function() {
        console.log(" frobber db write completed");
        self._activeLogFrobbers.splice(
          self._activeLogFrobbers.indexOf(frobber), 1);
        self._processNextLog();
      });
  },

  _processMozmillLog: function(job) {
    console.log("MOZMILL LOG GOBBLE", job);
    var self = this;

    var stream = $hackjobs.gimmeStreamForThing(job.build.logURL);
    var frobber = new $frobMozmill.MozmillFrobber(stream, function(failures) {
      self._frobberDone(frobber, job, failures);
    });
    return frobber;
  },

  _processXpcshellLog: function(job) {
    console.log("XPCSHELL LOG GOBBLE", job);
    var self = this;

    var stream = $hackjobs.gimmeStreamForThing(job.build.logURL);
    var frobber = new $frobXpcshell.XpcshellFrobber(stream, function(failures) {
      self._frobberDone(frobber, job, failures);
    });
    return frobber;
  },

  _allDone: function() {
    console.log("ALL DONE, quitting.");
    process.stdout.end();
    process.exit(0);
  },
};
exports.Overmind = Overmind;

}); // end define
