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
 * The Original Code is Mozilla Raindrop Code.
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
 * mozilla-central-ish repo definitions; mainly Thunderbird stuff now, but we
 *  used to process non-Thunderbird stuff and that's visible-though-bitrotting
 *  in here.
 *
 * This could be defined elsewhere as data, but it's much easier with it this
 *  way.  See `repodefs.js` for further discussion.
 **/

define(
  [
    './reposchema',
    'exports'
  ],
  function(
    $reposchema,
    exports
  ) {

var CodeRepoDef = $reposchema.CodeRepoDef,
    BuildTreeDef = $reposchema.BuildTreeDef;

var CC_MAPPING = {
  // - Thunderbird Stuff
  "mail": {
    _: "Mail",
    branding: "Branding",
    components: {
      "about-support": "about:support",
      activity: "Activity Manager",
      addrbook: "Address Book",
      build: "Mail Build",
      compose: "Compose",
      migration: "Migration Wizard",
      phishing: "Phishing",
      preferences: "Prefs",
      search: "Search"
    },
    extensions: {
      smime: "SMIME"
    },
    installer: "Installer",
    jquery: "jQuery",
    locales: "l10n",
    steel: "STEEL",
    themes: {
      gnomestripe: "Linux Theme",
      pinstripe: "Mac Theme",
      qute: "Windows Theme",
    },
  },
  "mailnews": {
    _: "MailNews",
    addrbook: "Address Book",
    base: "MailNews Core",
    build: "MailNews Build",
    compose: "Compose",
    db: {
      gloda: "Gloda",
      msgdb: "Message DB",
    },
    extensions: {
      "bayesian-spam-filter": "Spam",
      fts3: "Gloda",
      mdn: "Message Receipts",
      newsblog: "Feeds",
      smime: "SMIME",
    },
    imap: "IMAP",
    "import": "Mail Import",
    local: "Local Folders",
    mapi: "Windows MAPI",
    mime: "libmime",
    news: "NNTP",
  },
  // - Other Product Top-levels
  suite: "SeaMonkey",
  calendar: "Calendar",
  // - Other stuff,
  ldap: "LDAP",
  editor: "CC Editor",
};


var MC_MAPPING = {
  accessible: "Accessibility",
  browser: "Firefox",
  content: "Content",
  config: "Build System",
  db: {
    mdb: "Mork",
    mork: "Mork",
    morkreader: "Mork",
    sqlite3: "SQLite",
  },
  docshell: "Layout",
  dom: {
    _: "Layout",
    indexedDB: "IndexedDB",
  },
  editor: "Editor",
  embedding: "Embedding",
  extensions: {
    _: "Extensions",
    inspector: "DOM Inspector",
    spellcheck: "Spelling",
  },
  gfx: "Graphics",
  intl: "l10n",
  ipc: "electrolysis",
  jpeg: "Graphics",
  js: {
    _: "Spidermonkey",
    ipc: "electrolysis",
    jetpack: "Jetpack",
    jsd: "JS Debugging",
    src: {
      ctypes: "JS CTypes",
      methodjit: "Spidermonkey Method JIT",
      nanjoit: "Spidermonkey NanoJIT",
      xpconnect: "XPConnect"
    }
  },
  layout: {
    _: "Layout",
    xul: "XUL",
  },
  media: "Video",
  memory: {
    jemalloc: "jemalloc",
    mozalloc: "mozalloc",
  },
  modules: {
    _: "Generic Modules",
    freetype2: "FreeType",
    lib7z: "Compression Libs",
    libbz2: "Compression Libs",
    libimg: "Graphics",
    libjar: "Compression Libs",
    libmar: "Compression Libs",
    libpr0n: "Graphics",
    libpref: "Preferences",
    // libreg ??
    plugin: "Plugins",
    zlib: "Compression Libs",
  },
  netwerk: {
    _: "Necko",
    mime: "libmime outpost",
  },
  nsprpub: "NSPR",
  "other-licenses": {
    _: "Generic Modules",
    "7zstub": "Installer",
    android: "Mobile",
    "atk-1.0": "Accessibility",
    branding: "Branding",
    bsdiff: "Installer",
    nsis: "Installer",
  },
  parser: {
    expat: "XML",
    html: "HTML Parser",
    htmlparser: "HTML Parser",
    xml: "XML",
  },
  probes: "DTrace",
  profile: "Profile",
  rdf: "RDF",
  security: {
    _: "Security",
    nss: "NSS",
  },
  services: {
    crypto: "Security",
    sync: "Weave",
  },
  startupcache: "Startup Cache",
  storage: "mozStorage",
  testing: "Test Infrastructure",
  toolkit: {
    _: "Toolkit",
    components: {
      places: "Places",
      printing: "Printing",
      satchel: "Form History",
    },
    crashreporter: "Crash Reporter",
    mozapps: {
      downloads: "Downloads",
    },
    system: {
      dbus: "DBUS",
    },
    themes: {
      _: "Other Theme",
      gnomestripe: "Linux Theme",
      pinstripe: "Mac Theme",
      winstripe: "Windows Theme",
    },
  },
  tools: "Generic Tools",
  widget: "Widget",
  xpcom: "XPCOM",
  xpfe: "XPFE",
  xpisntall: "xpinstall",
  xulrunner: "XULRunner",
};

var REPOS = exports.REPOS = {
  //////////////////////////////////////////////////////////////////////////////
  // comm-* dev repos
  "comm-central": new CodeRepoDef({
    name: "comm-central",
    url: "http://hg.mozilla.org/comm-central/",
    kind: "trunk",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),
  "try-comm-central": new CodeRepoDef({
    name: "try-comm-central",
    url: "http://hg.mozilla.org/try-comm-central/",
    kind: "try",
    relto: "comm-central",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),

  //////////////////////////////////////////////////////////////////////////////
  // mozilla-* dev repos
  "mozilla-central": new CodeRepoDef({
    name: "mozilla-central",
    url: "http://hg.mozilla.org/mozilla-central/",
    kind: "trunk",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-aurora": new CodeRepoDef({
    name: "mozilla-aurora",
    url: "http://hg.mozilla.org/mozilla-aurora/",
    kind: "aurora",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-beta": new CodeRepoDef({
    name: "mozilla-beta",
    url: "http://hg.mozilla.org/mozilla-beta/",
    kind: "beta",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "try": new CodeRepoDef({
    name: "try",
    url: "http://hg.mozilla.org/try/",
    kind: "try",
    relto: "mozilla-central",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  // focused project branches
  "tracemonkey": new CodeRepoDef({
    name: "tracemonkey",
    url: "http://hg.mozilla.org/tracemonkey/",
    kind: "team",
    relto: "mozilla-central",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "jaegermonkey": new CodeRepoDef({
    name: "birch",
    url: "http://hg.mozilla.org/projects/jaegermonkey/",
    kind: "team",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "electrolysis": new CodeRepoDef({
    name: "birch",
    url: "http://hg.mozilla.org/projects/electrolysis/",
    kind: "team",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),

  // reusable project branches
  "birch": new CodeRepoDef({
    name: "birch",
    url: "http://hg.mozilla.org/projects/birch/",
    kind: "team",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "cedar": new CodeRepoDef({
    name: "cedar",
    url: "http://hg.mozilla.org/projects/cedar/",
    kind: "team",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "maple": new CodeRepoDef({
    name: "maple",
    url: "http://hg.mozilla.org/projects/maple/",
    kind: "team",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),

  //////////////////////////////////////////////////////////////////////////////
  // comm-* release repos
  "comm-miramar": new CodeRepoDef({
    name: "comm-miramar",
    url: "http://hg.mozilla.org/releases/comm-miramar/",
    kind: "release",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),
  "comm-2.0": new CodeRepoDef({
    name: "comm-2.0",
    url: "http://hg.mozilla.org/releases/comm-2.0/",
    kind: "release",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),
  "comm-1.9.2": new CodeRepoDef({
    name: "comm-1.9.2",
    url: "http://hg.mozilla.org/releases/comm-1.9.2/",
    kind: "release",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),
  "comm-1.9.1": new CodeRepoDef({
    name: "comm-1.9.1",
    url: "http://hg.mozilla.org/releases/comm-1.9.1/",
    kind: "release",
    path_mapping: CC_MAPPING,
    family: "comm",
    dependent: true,
  }),

  //////////////////////////////////////////////////////////////////////////////
  // mozilla-* release repos
  "mozilla-miramar": new CodeRepoDef({
    name: "mozilla-miramar",
    url: "http://hg.mozilla.org/releases/mozilla-miramar/",
    kind: "release",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-2.1": new CodeRepoDef({
    name: "mozilla-2.1",
    url: "http://hg.mozilla.org/releases/mozilla-2.1/",
    kind: "release",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-2.0": new CodeRepoDef({
    name: "mozilla-2.0",
    url: "http://hg.mozilla.org/releases/mozilla-2.0/",
    kind: "release",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-1.9.2": new CodeRepoDef({
    name: "mozilla-1.9.2",
    url: "http://hg.mozilla.org/releases/mozilla-1.9.2/",
    kind: "release",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "mozilla-1.9.1": new CodeRepoDef({
    name: "mozilla-1.9.1",
    url: "http://hg.mozilla.org/releases/mozilla-1.9.1/",
    kind: "release",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
};

var TB_TYPE_GROUPS = [
  "build",
  "xpcshell",
  "mozmill",
  "nightly",
];

var TMPL_MOCHITEST_TYPE_GROUP = {
  name: "mochitest",
  subgroups: [
    {name: "1", subtype: "mochitest", capture: "1"},
    {name: "2", subtype: "mochitest", capture: "2"},
    {name: "3", subtype: "mochitest", capture: "3"},
    {name: "4", subtype: "mochitest", capture: "4"},
    {name: "5", subtype: "mochitest", capture: "5"},
    {name: "oth", subtype: "mochitest", capture: "other"},
  ]
};
var TMPL_REFTEST_TYPE_GROUP = {
  name: "reftest",
  subgroups: [
    {name: "crash", subtype: "reftest", capture: "crashtest"},
    {name: "crash-ipc", subtype: "reftest", capture: "crashtest-ipc"},
    {name: "js", subtype: "reftest", capture: "jsreftest"},
    {name: "reftest", subtype: "reftest", capture: "reftest"},
    {name: "reftest-ipc", subtype: "reftest", capture: "reftest-ipc"},
  ]
};
var TMPL_DESKTOP_TALOS_TYPE_GROUP = {
  name: "talos",
  subgroups: [
    {name: "a11y", subtype: "talos", capture: "a11y"},
    {name: "chrome", subtype: "talos", capture: "chrome"},
    {name: "dirty", subtype: "talos", capture: "dirty"},
    {name: "dromaeo", subtype: "talos", capture: "dromaeo"},
    {name: "nochrome", subtype: "talos", capture: "nochrome"},
    {name: "scroll", subtype: "talos", capture: "scroll"},
    {name: "svg", subtype: "talos", capture: "svg"},
    {name: "tp4", subtype: "talos", capture: "tp4"},
  ]
};

// TraceMonkey has added v8; it may spread?
var TMPL_DESKTOP_EXTENDED_TALOS_TYPE_GROUP = {
  name: "talos",
  subgroups: [
    {name: "a11y", subtype: "talos", capture: "a11y"},
    {name: "chrome", subtype: "talos", capture: "chrome"},
    {name: "dirty", subtype: "talos", capture: "dirty"},
    {name: "dromaeo", subtype: "talos", capture: "dromaeo"},
    {name: "nochrome", subtype: "talos", capture: "nochrome"},
    {name: "paint", subtype: "talos", capture: "paint"},
    {name: "scroll", subtype: "talos", capture: "scroll"},
    {name: "svg", subtype: "talos", capture: "svg"},
    {name: "tp4", subtype: "talos", capture: "tp4"},
    {name: "v8", subtype: "talos", capture: "v8"},
  ]
};


var FF_TYPE_GROUPS = [
  "build",
  "xpcshell",
  TMPL_MOCHITEST_TYPE_GROUP,
  TMPL_REFTEST_TYPE_GROUP,
  TMPL_DESKTOP_TALOS_TYPE_GROUP,
  "nightly",
];

var RESERVABLE_TYPE_GROUPS = [
  {
    name: "build",
    subgroups: [
      {name: "build", subtype: "build"},
      {name: "mobile", subtype: "mobile"},
    ]
  },
  "xpcshell",
  TMPL_MOCHITEST_TYPE_GROUP,
  TMPL_REFTEST_TYPE_GROUP,
  TMPL_DESKTOP_TALOS_TYPE_GROUP,
  "nightly",
];

var TINDER_TREES = exports.TINDER_TREES = {
  ThunderbirdTrunk: new BuildTreeDef({
    id: "cc",
    name: "ThunderbirdTrunk",
    desc: "comm-central built using mozilla-central; eventually TB 3.4",
    product: "Thunderbird",
    repos: [REPOS["comm-central"], REPOS["mozilla-central"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
    typeGroups: TB_TYPE_GROUPS,
  }),
  Miramar: new BuildTreeDef({
    id: "c20",
    name: "Miramar",
    desc: "comm-central built using mozilla-2.0; next TB release, TB 3.3",
    product: "Thunderbird",
    repos: [REPOS["comm-central"], REPOS["mozilla-2.0"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
    typeGroups: TB_TYPE_GROUPS,
  }),
  ThunderbirdTry: new BuildTreeDef({
    id: "ctry",
    name: "ThunderbirdTry",
    desc: "comm-central try server",
    product: "Thunderbird",
    repos: [REPOS["try-comm-central"], REPOS["mozilla-central"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
    typeGroups: TB_TYPE_GROUPS,
  }),
};

/**
 * We used to support these, but ArbPL has now reduced scope to only be about
 *  Thunderbird.
 */
var ABANDONED_TREES = {
  // releases/comm-1.9.2 => c192
  // releases/comm-1.9.1 => c191

  // mozilla-central => mc
  Firefox: new BuildTreeDef({
    id: "mc",
    name: "Firefox",
    desc: "Firefox trunk",
    product: "Firefox",
    repos: [REPOS["mozilla-central"]],
    mount: {
    },
    typeGroups: FF_TYPE_GROUPS,
  }),
  // try => mtry
  MozillaTry: new BuildTreeDef({
    id: "mtry",
    name: "MozillaTry",
    desc: "Firefox / mozilla-central try server",
    product: "Firefox",
    repos: [REPOS["try"]],
    mount: {
    },
    typeGroups: FF_TYPE_GROUPS,
  }),

  Birch: new BuildTreeDef({
    id: "birch",
    name: "Birch",
    desc: "Firefox reservable project branch",
    product: "Firefox",
    repos: [REPOS["birch"]],
    mount: {
    },
    typeGroups: RESERVABLE_TYPE_GROUPS,
  }),
  Cedar: new BuildTreeDef({
    id: "cedar",
    name: "Cedar",
    desc: "Firefox reservable project branch",
    product: "Firefox",
    repos: [REPOS["cedar"]],
    mount: {
    },
    typeGroups: RESERVABLE_TYPE_GROUPS,
  }),
  // There are serious problems with the maple tree; even TBPL gets upset.
  // (It does not kill us, but we do abort processing the tree, and no point in
  //  cluttering up our logs with known aborts.)
  /*
  Maple: new BuildTreeDef({
    id: "maple",
    name: "Maple",
    desc: "Firefox reservable project branch",
    product: "Firefox",
    repos: [REPOS["maple"]],
    mount: {
    },
    typeGroups: FF_TYPE_GROUPS,
  }),
  */

  // tracemonkey => tm
  TraceMonkey: new BuildTreeDef({
    id: "tm",
    name: "TraceMonkey",
    desc: "JavaScript team's mozilla-central branch",
    product: "Firefox",
    repos: [REPOS["tracemonkey"]],
    mount: {
    },
    typeGroupBundles: [
      {
        name: "desktop",
        platforms: {
          linux: true,
          mac: true,
          win: true,
        },
        typeGroups: [
          {
            name: "build",
            subgroups: [
              {name: "build", subtype: "build"},
              {name: "QT", subtype: "qt"},
              {name: "mobile", subtype: "mobile"},
              {name: "no mjit", subtype: "nomethodjit"},
              {name: "no trace", subtype: "notracejit"},
              {name: "dtrace", subtype: "dtrace"},
              {name: "shark", subtype: "shark"},
              {name: "nightly", subtype: "nightly"},
              {name: "warnaserr", subtype: "warnaserr"},
            ],
          },
          "xpcshell",
          TMPL_MOCHITEST_TYPE_GROUP,
          TMPL_REFTEST_TYPE_GROUP,
          TMPL_DESKTOP_EXTENDED_TALOS_TYPE_GROUP,
        ],
      },
      {
        name: "mobile",
        platforms: {
          android: true,
          maemo: true,
        },
        typeGroups: [
          {
            name: "build",
            subgroups: [
              {name: "build", subtype: "build"},
              {name: "nightly", subtype: "nightly"},
            ],
          },
          {
            name: "mochitest",
            subgroups: [
              {name: "1", subtype: "mochitest", capture: "1"},
              {name: "2", subtype: "mochitest", capture: "2"},
              {name: "3", subtype: "mochitest", capture: "3"},
              {name: "4", subtype: "mochitest", capture: "4"},
            ]
          },
          { name: "crash", subtype: "reftest", capture: "crashtest"},
          {
            name: "talos", subgroups: [
              {name: "tdhtml", subtype: "talos", capture: "tdhtml"},
              {name: "twinopen", subtype: "talos", capture: "twinopen"},
              {name: "tp4", subtype: "talos", capture: "tp4"},
              {name: "ts", subtype: "talos", capture: "ts"},
              {name: "tsspider", subtype: "talos", capture: "tsspider"},
              {name: "tp4_nochrome", subtype: "talos", capture: "tp4_nochrome"},
              {name: "tsvg", subtype: "talos", capture: "tsvg"},
              {name: "tpan", subtype: "talos", capture: "tpan"},
            ]
          },
        ],
      },
    ],
  }),

  // projects/places => places

  // releases/mozilla-2.0 => m20
  // releases/mozilla-1.9.2 => m192
  // releases/mozilla-1.9.1 => m191

  SeaMonkey: new BuildTreeDef({
    id: "st",
    name: "SeaMonkey",
    desc: "SeaMonkey suite (browser/mailnews client/composer/more)",
    product: "SeaMonkey",
    repos: [REPOS["comm-central"], REPOS["mozilla-central"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
    typeGroups: [
      "build",
      "xpcshell",
      {
        name: "mochitest",
        subgroups: [
          {name: "1", subtype: "mochitest", capture: "1"},
          {name: "2", subtype: "mochitest", capture: "2"},
          {name: "3", subtype: "mochitest", capture: "3"},
          {name: "4", subtype: "mochitest", capture: "4"},
          {name: "5", subtype: "mochitest", capture: "5"},
          {name: "oth", subtype: "mochitest", capture: "other"},
        ]
      },
      {
        name: "reftest",
        subgroups: [
          {name: "crash", subtype: "reftest", capture: "crash"},
          {name: "reftest", subtype: "reftest", capture: "reftest"},
        ]
      },
    ],
  }),

};


}); // end define
