## 说明

由于 docs.gl 提供的离线版本，其 API 描述所在 html 文件名没有提供 html 后缀，导致 chrome 跳转到该文件的时候不显示网页，因此需要在 server 端修改 content-type 来完成。考虑到这可能是一个通用的行为，因此这里提供一个通用 server 工具来完成这个事情

工具以 docs.gl 本地启动为例，使用 nodejs 来完成启动服务

由于需要使用 nodejs 新建系统终端，因此需要在不同系统中进行测试，目前测试成功的有以下系统：

- [x] macOS Ventura 13.2 (use osascript)
- [ ] Windows
- [ ] Linux

## 文件结构

```
├── README.md
├── docs_config.json    配置需要启动服务的 docs
├── package.json
├── server.js           server class 负责启动/停止服务器
├── start_server.js     读取 docs_config.json，配置 docs 服务
├── tool.js             存放 server, downloader, unzip function
└── update_docs.js      更新 docs 资源
```

## 使用

### docs_config.json 配置

节点说明：

```json
{
  "proxy": "代理服务器地址",
  "docs": {
    "文档名称1": {
      "main_page": "主页 html 文件",
      "docs_folder": "主页 html 文件所在文件夹",
      "html_folds": [
        "是一个数组",
        "，",
        "每个元素都是 docs_folder 节点下的文件夹",
        "，",
        "每个文件夹下都是需要被服务器识别为 html 类型的文件"
      ],
      "port": "启动服务的端口号",
      "doc_download_address": "更新文档使用的下载地址",
      "enable": "是否启用该文档的服务"
    }
  }
}
```

其中 `main_page`, `docs_folder`, `port` 为必填项，以下为配置实例：

```json
{
  "proxy": "http://0.0.0.0:1087",
  "docs": {
    "glm": {
      "main_page": "index.html",
      "docs_folder": "docs/glm/glm-master/doc/api",
      "port": "20482",
      "doc_download_address": "https://github.com/g-truc/glm/archive/refs/heads/master.zip",
      "enable": true
    },
    "opengl": {
      "main_page": "index.html",
      "docs_folder": "docs/opengl/htdocs",
      "html_folds": ["el3", "es2", "es3", "gl2", "gl3", "gl4", "sl4"],
      "port": "20481",
      "doc_download_address": "https://docs.gl/docs.gl.zip",
      "enable": true
    }
  }
}
```

### update_docs.js 说明

1. 默认下载文档压缩文件到 docs 文件夹下，由 `SAVE_ROOT_PATH` 指定，目前不可以通过 config 指定；
2. 压缩包解压完成后会自动删除

### 启动服务器

启动服务输入以下命令：

```
npm install
npm run update_docs
npm run start
```
