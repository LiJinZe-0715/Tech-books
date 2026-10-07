# 知识书架

计算机基础、Java 后端工程和日商簿记的统一阅读网站。支持书架入口、章节目录、小节导航、前后章切换、代码与表格阅读，以及可展开的习题答案。

| 书籍 | 内容 |
| --- | --- |
| 计算机基础与后端应用 | 13 章、91 个知识主题、273 道中日双语习题 |
| Java 后端工程手册 | 8 章、464 条工程规则与代码示例 |
| 日商簿记二级备考参考书 | 阅读指南、32 章正文与练习、6 个附录，共 39 个目录项 |

## 开发与检查

需要 Node.js 24 或以上版本。

```sh
npm ci
npm run dev
```

默认地址：http://localhost:4187 。指定其他端口：`npm run dev -- --port 4188`。

```sh
npm run build   # 校验全部书籍，清理并生成根目录 dist/
npm test        # 内容、领域规则、依赖方向、Markdown 安全和 Pages 链接检查
npm outdated    # 检查依赖更新
npm audit      # 检查已知依赖漏洞
```

开发服务启动时会构建网站；修改内容或代码后运行 `npm run build`，再刷新浏览器。

## DDD 架构

“学习书库”为限界上下文，`Book` 是聚合根，内部包含 `Chapter` 和内容块。领域模型不可变，负责标识唯一性、章节关系、题答对应、题目所属主题、表格结构和考试适用日期等约束。

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 数据 | `content/books/*.json` | 三本书的统一正文及语义元数据 |
| 外观配置 | `content/library.json` | 书架顺序、封面主题、封面标识 |
| 领域 | `src/domain/` | 聚合、章节实体、内容约束、仓储契约 |
| 应用 | `src/application/` | 书库和阅读用例，输出普通页面数据对象 |
| 基础设施 | `src/infrastructure/` | JSON 文件仓储及目录读取 |
| 表现 | `src/presentation/` | 页面模板、内容渲染、浏览器交互与 CSS |
| 组装 | `src/bootstrap.mjs` | 注入仓储、加载外观配置 |
| 工具 | `scripts/` | 静态构建与本地服务 |

领域层不依赖文件系统、Markdown、DOM 或 CSS。应用层仅依赖仓储契约和领域对象；仓储实现与页面模板均在外层。封面颜色不属于领域模型，模板不计算前后章节或硬编码书籍数量。

正文格式为 `Book → Chapter → Section → Block`；内容块支持段落、Markdown、代码、表格、提醒、来源链接和习题。Markdown 禁用可执行原始 HTML 与危险 URL 协议，结构化段落保留粗体和官方来源链接。

## 维护数据

- 编辑 `content/books/computer.json`、`java.json`、`boki.json` 中的书名、简介、章节和正文。
- 编辑 `content/library.json` 中的顺序、主题和标识。主题支持 `blue`、`orange`、`green`。
- 每个书籍、章节和小节 ID 使用小写英文字母、数字及连字符；题目答案必须引用现有选项 ID，题目主题必须对应同章小节。
- 增加书籍时添加一个书籍 JSON，并在目录中登记 ID；页面和章节计数自动生成。对应的内容基线测试需随资料更新。
- 簿记正文适用 2026 年度考试（至 2027-03-31），2027 年度改版衔接在附录 D。维护范围时应核对 [官方出题区分表](https://www.kentei.ne.jp/bookkeeping/35697-2)，避免混用年度。

原始压缩包及旧数据保存在本地 `.archive/`，仅用于恢复和对照，不参与构建、部署或 Git 提交。网站只依赖当前统一数据，不依赖归档资料。页面字体使用系统字体，无外部字体请求。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 在 push 到 `main` 或手动运行时安装依赖、构建、检查并发布 `dist/`。运行环境使用 Node.js 24，官方 Actions 使用固定发布版本。

首次启用：

1. 提交并 push 网站源码及工作流。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions → Deploy bookshelf to GitHub Pages** 查看运行结果；如果首次运行时尚未启用 Pages，可重新运行工作流。

部署成功后的默认地址： https://lijinze0715-hub.github.io/certification-exam-prep-books/ 。页面及资源使用相对链接，也可部署在其他静态服务器的子路径下。

## Git 提交范围

提交 `.github/`、`.gitignore`、`package.json`、`package-lock.json`、`README.md`、`content/`、`src/`、`scripts/`、`tests/`。

不提交根目录 `dist/`、`node_modules/`、`.archive/`、`.idea/`、日志和临时文件。旧的 `content/sources/` 与 `src/infrastructure/source-book-repository.mjs` 已由统一 JSON 数据和仓储取代；若它们之前被提交，应一并提交删除。
