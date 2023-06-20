const compareVersions = require("compare-versions");
const package = require("../package.json");
const parser = require("fast-xml-parser");
const fetch = require("node-fetch");
const https = require("https");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream/promises");

const config = {
  sockets: 100,
  domain: "com",
  format: "png",
  revision: false,
  prod: false,
  output: "../icons",
};

const opt = {
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 24000,
    maxSockets: 100,
    scheduling: "fifo",
  }),
};

async function fileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

async function fetchRaw(src) {
  const res = await fetch(src, opt);

  if (res.ok === false) {
    throw new Error(`${res.status} ${src}`);
  }

  return res;
}

async function fetchText(src) {
  const res = await fetchRaw(src);
  const txt = await res.text();

  return txt;
}

async function fetchJson(src) {
  const res = await fetchRaw(src);
  const txt = await res.json();

  return txt;
}

async function fetchOne(src, dst, replace = false) {
  dst = path.join(config.output, dst);

  if ((await fileExists(dst)) && replace === false) {
    return `skipped: ${src}`;
  }

  const res = await fetchRaw(src);

  await fs.promises.mkdir(path.dirname(dst), { recursive: true });
  await pipeline(res.body, fs.createWriteStream(dst));

  return `${res.status} ${src}`;
}

async function fetchMany(all, replace = false) {
  await Promise.allSettled(
    all.map((v) =>
      fetchOne(v.src, v.dst, replace)
        .then(console.log)
        .catch((err) => console.log(err.message))
    )
  );
}

async function fetchUntil(opt, i = 1, failed = 0) {
  try {
    console.log(
      await fetchOne(opt.src.replace("%i%", i), opt.dst.replace("%i%", i))
    );
    failed = 0;
  } catch (err) {
    console.log(err.message);
    failed++;
  } finally {
    if (failed < 3) {
      return fetchUntil(opt, ++i, failed);
    }
  }
}

async function parseXml(txt) {
  if (parser.validate(txt) !== true) {
    throw new Error("invalid xml");
  }

  return parser.parse(txt, {
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseNodeValue: false,
  });
}

async function checkUpdate() {
  const json = await fetchJson(
    "https://registry.npmjs.org/habbo-downloader/latest"
  );
  if (compareVersions(json.version, package.version) > 0) {
    console.log(
      `\u001b[33m[NOTE] A new version is available: "${json.version}". You are using version: "${package.version}". Please update habbo-downloader by running "npm i -g habbo-downloader" inside of the terminal.\u001b[0m\n`
    );
  }
}

async function initConfig(argv) {
  const c = argv.c || argv.command;
  const d = argv.d || argv.domain;
  const s = argv.s || argv.sockets;
  const f = argv.f || argv.format;
  const r = argv.r || argv.revision;
  const o = argv.o || argv.output;

  if (d) config.domain = d;
  if (s) config.sockets = s;
  if (r) config.revision = r;
  if (o) config.output = o;

  if (c === "badges" && f === "gif") {
    config.format = "gif";
  }

  config.prod = (
    await fetchText(
      `https://www.habbo.${config.domain}/gamedata/external_variables/0`
    )
  ).match(/(?<=flash\.client\.url).*(PRODUCTION-[^\/]+)/im)[1];
}

module.exports = {
  fetchText,
  fetchJson,
  fetchOne,
  fetchMany,
  fetchUntil,
  parseXml,
  checkUpdate,
  initConfig,
  config,
};
