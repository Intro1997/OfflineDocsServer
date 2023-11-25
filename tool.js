const fs = require("fs");
const networkInterfaces = require("os").networkInterfaces;
const net = require("net");
const extract = require("extract-zip");
const Downloader = require("nodejs-file-downloader");
const ProgressBar = require("progress");
// reserve port
const reservePort = [
  1,
  7,
  9,
  11,
  13,
  15,
  17,
  19,
  20,
  21,
  22,
  23,
  25,
  37,
  42,
  43,
  53,
  69,
  77,
  79,
  87,
  95,
  101,
  102,
  103,
  104,
  109,
  110,
  111,
  113,
  115,
  117,
  119,
  123,
  135,
  137,
  139,
  143,
  161,
  179,
  389,
  427,
  465,
  512,
  513,
  514,
  515,
  526,
  530,
  531,
  532,
  540,
  548,
  554,
  556,
  563,
  587,
  601,
  636,
  993,
  995,
  1719,
  1720,
  1723,
  2049,
  3659,
  4045,
  5060,
  5061,
  6000,
  6566,
  6665,
  6666,
  6667,
  6668,
  6669,
  6697,
  10080, // Amanda
];
const reservePortUsage = [
  "tcpmux",
  "echo",
  "discard",
  "systat",
  "daytime",
  "netstat",
  "qotd",
  "chargen",
  "ftp data",
  "ftp access",
  "ssh",
  "telnet",
  "smtp",
  "time",
  "name",
  "nicname",
  "domain",
  "tftp",
  "priv-rjs",
  "finger",
  "ttylink",
  "supdup",
  "hostriame",
  "iso-tsap",
  "gppitnp",
  "acr-nema",
  "pop2",
  "pop3",
  "sunrpc",
  "auth",
  "sftp",
  "uucp-path",
  "nntp",
  "NTP",
  "loc-srv /epmap",
  "netbios",
  "netbios",
  "imap2",
  "snmp",
  "BGP",
  "ldap",
  "SLP (Also used by Apple Filing Protocol)",
  "smtp+ssl",
  "print / exec",
  "login",
  "shell",
  "printer",
  "tempo",
  "courier",
  "chat",
  "netnews",
  "uucp",
  "AFP (Apple Filing Protocol)",
  "rtsp",
  "remotefs",
  "nntp+ssl",
  "smtp (rfc6409)",
  "syslog-conn (rfc3195)",
  "ldap+ssl",
  "ldap+ssl",
  "pop3+ssl",
  "h323gatestat",
  "h323hostcall",
  "pptp",
  "nfs",
  "apple-sasl / PasswordServer",
  "lockd",
  "sip",
  "sips",
  "X11",
  "sane-port",
  "Alternate IRC [Apple addition]",
  "Alternate IRC [Apple addition]",
  "Standard IRC [Apple addition]",
  "Alternate IRC [Apple addition]",
  "Alternate IRC [Apple addition]",
  "IRC + TLS",
  "Amanda",
];
/**
 * getRemoteIpv4
 * @description: get ipv4 address string
 * @returns: ipv4 remote ip string
 */
function getRemoteIpv4() {
  const nets = networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push(net.address);
      }
    }
  }
  if (results.length > 0) {
    return results[0];
  }
  return "";
}
async function portIsAvaliable(port) {
  const reserveIdx = reservePort.indexOf(port);
  if (port != null && reserveIdx != -1) {
    return new Promise((resolve, reject) => {
      console.error(
        `Error: port:${port} has been reserved, the usage of ${port} is ${reservePortUsage[reserveIdx]}, use other random port`
      );
      return reject(false);
    });
  }
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (error) => {
      console.error("Error :: ", error.name, " : ", error.message);
      reject(false);
    });
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}
async function getPort(port) {
  let begin = 8000,
    end = 10000;
  let retPort = begin;
  if (typeof port === "number") {
    if (await portIsAvaliable(port)) {
      return port;
    }
    throw `Error:: ${port} is not avaliable`;
  } else {
    const portRange = port;
    if (portRange && portRange.begin && portRange.end) {
      begin = Math.min(portRange.begin, portRange.end);
      end = Math.max(portRange.begin, portRange.end);
    }
  }
  let count = 0;
  let maxCnt = 10;
  retPort = Math.floor(Math.random() * (end - begin)) + begin;
  let isGet = false;
  do {
    count++;
    retPort = Math.floor(Math.random() * (end - begin)) + begin;
    isGet = await portIsAvaliable(retPort);
  } while (count < maxCnt && !isGet);
  if (!isGet) {
    throw `Avaliable port not found! (have tried ${maxCnt} times)`;
  }
  return retPort;
}

function LoadJsonStringByFile(file_path) {
  if (file_path == "") {
    console.error("File path cannot be empty!");
    return "";
  }

  if (!fs.existsSync(file_path)) {
    console.error("Cannot find config file, please create first!");
    return "";
  }
  return fs.readFileSync(file_path).toString();
}

async function DownloadZip(zip_url, save_path, zip_name, proxy) {
  if (proxy == undefined || proxy == null) {
    proxy = "";
  }
  let bar = null;
  const downloader = new Downloader({
    proxy,
    url: zip_url,
    directory: save_path,
    fileName: zip_name,
    onResponse: (response) => {
      console.log("Download...");
      bar = new ProgressBar("-> downloading [:bar] :percent :etas", {
        width: 40,
        complete: "=",
        incomplete: " ",
        renderThrottle: 1,
        total: parseInt(response.headers["content-length"]),
      });
    },
    onProgress: (percentage, chunk, remainingSize) => {
      try {
        if (bar != null) {
          bar.tick(chunk.length);
        }
      } catch (e) {}
    },
  });

  try {
    console.log(`Connecting ${zip_url} ...`);
    await downloader.download();
    console.log("Download success!\n");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function UnzipFile(zip_file_path, unzip_path) {
  console.log(`Unzipping file ${zip_file_path}...`);
  try {
    await extract(zip_file_path, {
      dir: unzip_path,
    }).then(() => {
      console.log(`Uzip success, remove file ${zip_file_path}\n`);
      fs.rmSync(zip_file_path);
    });
  } catch (err) {
    console.error(`Unzip failed: ${err}\n`);
    return false;
  }
  return true;
}

exports.getRemoteIpv4 = getRemoteIpv4;
exports.getPort = getPort;
exports.LoadJsonStringByFile = LoadJsonStringByFile;
exports.UnzipFile = UnzipFile;
exports.DownloadZip = DownloadZip;
