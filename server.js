const tool = require("./tool.js");
const { getPort, getRemoteIpv4 } = tool;
const http = require("http");
const fs = require("fs");
const libPath = require("path")

function removeHeadSlash(str) {
  if (str[0] === "/") {
    str = str.slice(1);
  }
  return str;
}

function getFileType(filePath) {
  var ext = libPath.extname(filePath);
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".gif":
      return "image/gif";
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".ico":
      return "image/icon";
    default:
      return "application/octet-stream";
  }
}

class Server {
  // base_path must be absolute path
  constructor(main_page, absolut_base_path, html_folders) {
    this.sockets = [];
    this.html_folders = html_folders;
    this.main_page = main_page;
    this.server = undefined;
    process.chdir(absolut_base_path);
    this.server = http.createServer(this.requestListener.bind(this));
    this.server.on("connection", (socket) => {
      this.sockets.push(socket);
    });
  }

  requestListener(req, res) {
    const baseURL = req.protocol + "://" + req.headers.host + "/";
    let pathName = new URL(req.url, baseURL).pathname;
    pathName = removeHeadSlash(pathName);
    if (pathName.length === 0) {
      pathName = this.main_page;
    }
    this.resLoadFile(res, pathName);
  }

  async start(port) {
    this.serverPort = await getPort(port);
    this.serverUrl = getRemoteIpv4();
    if (this.serverUrl === "") {
      console.error(`Error:: get address failed`);
      process.exit(1);
    }
    const _this = this;
    // avoid exception in end with ctrl+c
    process.on("SIGINT", () => {
      _this.stop();
    });
    this.server.listen(this.serverPort, this.serverUrl, () => {
      const add = this.server.address();
      if (add.address) {
        console.log(`server running at http://${add.address}:${add.port}/`);
      } else if (add != null) {
        console.log(`server running at ${add}`);
      } else {
        console.error("error! get address failed");
      }
    });
  }

  resLoadFile(res, filePath) {
    let content_type = "";
    for (let i = 0; i < this.html_folders.length; i++) {
      if (filePath.indexOf(this.html_folders[i]) != -1) {
        content_type = "text/html";
      }
    }
    if (content_type === "") {
      content_type = getFileType(filePath);
    }

    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": content_type });
      fs.createReadStream(filePath, {
        flags: "r",
      })
        .on("error", function () {
          console.log(`load ${filePath} failed`)
          res.writeHead(404);
          res.end("<h1>404 Read Error</h1>");
        })
        .pipe(res);
    } else {
      console.log(`${filePath} not found`)
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
    }
  }
  stop() {
    if (this.server) {
      this.server.close((error) => {
        console.log("server closed");
      });
      this.sockets.forEach((socket) => {
        socket.destroy();
      });
    }
  }
}

exports.Server = Server;

