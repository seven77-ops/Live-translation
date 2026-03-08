# 课堂实时听讲助手

面向中国留学生的课堂辅助网站：**实时语音转英文文字** + **英译中翻译**，上课听不懂时打开即可使用。

## 功能

- **实时语音转文字**：使用浏览器麦克风，将老师说的英文实时转成英文文本（基于 Web Speech API，需 Chrome/Edge）。
- **英译中**：点击「翻译成中文」将当前英文内容翻译成中文。

## 使用方式

1. **本地运行**（麦克风必须在「安全上下文」下才能用，请务必用 **localhost** 或 **HTTPS** 打开）：
   ```bash
   npx serve .
   ```
2. **在本机浏览器中打开**：请访问 **http://localhost:3000**（不要用 192.168.x.x 或本机 IP），否则浏览器会以「不安全」为由禁止麦克风。
3. 用 Chrome 或 Edge 打开，允许麦克风权限。
4. 点击「开始听写」，对着设备说话或听老师讲课，英文会实时出现在左侧。
5. 需要中文时点击「翻译成中文」，右侧会显示翻译结果。

**若要用手机/平板在同一 WiFi 下访问**，需用 HTTPS。可先生成自签名证书再启动：
   ```bash
   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
   npx http-server -p 3000 -S -C cert.pem -K key.pem
   ```
   然后在本机用 **https://localhost:3000** 打开，在浏览器里信任证书；手机则用 **https://你的电脑IP:3000** 打开并信任证书。

## 让别人在他的电脑上也可以使用（部署到网上）

把网站部署到带 **HTTPS** 的服务器后，任何人用浏览器打开你的链接就能用（麦克风在 HTTPS 下可用）。推荐用免费静态托管，无需自己的服务器。

### 方式一：Vercel（推荐，最简单）

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 或邮箱注册并登录。
2. 点击 **Add New → Project**，把本地的 `translate` 文件夹拖进去，或连接 GitHub 仓库后选该仓库。
3. 直接点 **Deploy**，等几十秒。
4. 部署完成后会得到一个地址，例如 `https://xxx.vercel.app`。**把这个链接发给同学**，对方用 Chrome/Edge 打开即可使用。

### 方式二：Netlify

1. 打开 [netlify.com](https://netlify.com)，注册并登录。
2. 在首页把整个 **translate 文件夹**拖到「Drag and drop your site output folder」区域。
3. 部署完成后会得到 `https://xxx.netlify.app`，把链接发给别人即可。

### 方式三：GitHub Pages

1. 在 GitHub 新建一个仓库，把本项目的 `index.html`、`styles.css`、`app.js` 放进去（可包含 README）。
2. 仓库里点 **Settings → Pages**，Source 选 **main** 分支、根目录，保存。
3. 等一两分钟后，页面地址为 `https://你的用户名.github.io/仓库名/`。把该链接发给别人即可。

---

部署后记得把**最终网址**发给同学，对方用浏览器打开即可，无需安装任何东西。

## 文件说明

- `index.html`：页面结构
- `styles.css`：样式（深色、大字号，适合课堂观看）
- `app.js`：语音识别与翻译逻辑

## 说明与限制

- **系统**：**Windows、macOS、手机/平板** 都可以用，只要用 Chrome 或 Edge 打开即可。
- **语音识别**：依赖浏览器内置能力，建议使用 **Chrome** 或 **Edge**，并保持网络畅通（部分引擎需联网）。
- **翻译**：使用 [MyMemory](https://mymemory.translated.net/) 免费接口，无需注册，有每日请求限制；若需更高额度或更稳定，可自行替换为其他翻译 API 并在 `app.js` 中修改 `translateToChinese`。
- **隐私**：语音在浏览器内或发送至浏览器厂商的识别服务，翻译内容会发送至所选翻译服务，请勿在涉及敏感内容的场合使用。

## 后续可扩展

- 接入自己的翻译 API（如 Google Translate API、Azure Translator）以提升额度与质量。
- 增加「自动翻译」开关：每积累一定字数或每句结束后自动请求翻译。
- 支持导出/复制原文与译文。
