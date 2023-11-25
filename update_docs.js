const { LoadJsonStringByFile, DownloadZip, UnzipFile } = require("./tool.js");

const DOCS_CONFIG_FILE = "./docs_config.json";
const SAVE_ROOT_PATH = "./docs";

UpdateDocsByConfig();

async function UpdateDocsByConfig() {
  const config = JSON.parse(LoadJsonStringByFile(DOCS_CONFIG_FILE));
  const docs = config.docs;
  const proxy = config.proxy;
  if (docs == undefined || docs == null) {
    console.error("Cannot find docs node in config file");
    return;
  }

  for (const doc_name in docs) {
    const doc = docs[doc_name];

    const zip_url = doc.doc_download_address;
    if (zip_url == undefined || zip_url == "" || zip_url == null) {
      console.warn(
        `Update ${doc_name} doc failed, cannot find doc_download_address node`
      );
      continue;
    }

    const zip_name = `${doc_name}.zip`;
    let zip_path = `${SAVE_ROOT_PATH}/${zip_name}`;
    if (await DownloadZip(zip_url, SAVE_ROOT_PATH, zip_name, proxy)) {
      const unzip_path = `${SAVE_ROOT_PATH}/${doc_name}`;
      await UnzipFile(zip_path, __dirname + "/" + unzip_path);
    }
  }
}
