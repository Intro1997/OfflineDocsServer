const fs = require("fs");
const server = require("./server.js");
const child_process = require("child_process");
const { LoadJsonStringByFile } = require("./tool.js");

if (!IsSystemSupport()) {
  process.exit(-1);
}

const DOCS_CONFIG_FILE = "./docs_config.json";

StartDocsServer();

function IsSystemSupport() {
  switch (process.platform) {
    case "darwin": {
      return true;
    }
    default: {
      console.error("unsupport now!");
      return false;
    }
  }
}

function CreateSystemTerminal(script_str) {
  switch (process.platform) {
    case "darwin": {
      child_process.spawn("osascript", [
        "-e",
        `tell app "Terminal" to do script "${script_str}"`,
      ]);
      break;
    }
    case "linux":
    case "win32": {
      return "";
    }
  }
}

function CheckNecessaryJsonConfig(obj) {
  let lack_config_items = "";
  if (obj.main_page == undefined) {
    lack_config_items += "main_page, ";
  }
  if (obj.docs_folder == undefined) {
    lack_config_items += "docs_folder, ";
  }
  if (obj.port == undefined) {
    lack_config_items += "port, ";
  }

  if (lack_config_items == "") {
    return true;
  } else {
    console.error(
      `Cannot find necessary config: [${lack_config_items.slice(0, -2)}]`
    );
    return false;
  }
}

function StartDocsServer() {
  if (
    process.argv.length > 2 &&
    process.argv[2] != undefined &&
    process.argv[3] != undefined
  ) {
    const doc_name = process.argv[2];
    const config_json = JSON.parse(atob(process.argv[3]));
    if (!CheckNecessaryJsonConfig(config_json)) {
      console.error(`Create ${doc_name} server failed`);
      return;
    }
    console.log(`\nStart doc ${doc_name} server`);
    StartDocServer(
      config_json.main_page,
      config_json.docs_folder,
      config_json.html_folds,
      Number(config_json.port)
    );
    return;
  }

  const config_string = LoadJsonStringByFile(DOCS_CONFIG_FILE);
  if (config_string == "") {
    console.error("Start server failed");
    process.exit(-1);
  }
  const docs = JSON.parse(config_string).docs;

  for (const idx in docs) {
    const doc = docs[idx];
    if (doc.enable == undefined || doc.enable == false) {
      continue;
    }
    if (!CheckNecessaryJsonConfig(doc)) {
      console.error(`Start ${idx} doc server failed`);
      process.exit(-1);
    }
    const doc_json_str = btoa(`${JSON.stringify(doc)}`);
    let start_script = `cd ${process.cwd()} && node start_server.js ${idx} ${doc_json_str}`;
    CreateSystemTerminal(start_script);
    console.log(`Start ${idx} in backend temrinal`);
  }
}

function StartDocServer(main_page, docs_folder, html_folds, port) {
  if (!fs.existsSync(docs_folder)) {
    console.error(`file ${docs_folder} not exist`);
  }
  if (
    main_page == null ||
    docs_folder == null ||
    port == null ||
    main_page == undefined ||
    docs_folder == undefined ||
    port == undefined ||
    typeof port !== "number"
  ) {
    console.error("main_page, docs_folder, port cannot be null!");
    return;
  }

  if (html_folds == null || html_folds == undefined) {
    html_folds = [];
  }

  for (let i = 0; i < html_folds.length; i++) {
    if (!fs.existsSync(docs_folder + "/" + html_folds[i])) {
      console.error(`file ${docs_folder + "/" + html_folds[i]} not exist`);
      return;
    }
  }

  const docs_server = new server.Server(main_page, docs_folder, html_folds);
  docs_server.start(port);
}
