# AGENTS.md

## 项目定位

P-Inpaint 是一个运行在浏览器中的 AI 图像修复工具，主要用于移除图片水印和修补指定区域。

项目当前技术栈：

- Vue 3 Composition API
- Vite
- ONNX Runtime Web
- Canvas 2D
- IndexedDB

项目是纯前端静态应用。除非需求明确要求，否则不要引入后端、账号系统或图片上传服务。

## 核心原则

1. 图片必须保留在用户浏览器中处理，不得在用户不知情的情况下上传到第三方。
2. 不提交密钥、令牌、个人账号信息或用户图片。
3. `node_modules/`、`dist/`、`public/models/*.onnx` 不进入版本控制。
4. 不做与当前任务无关的框架迁移或大范围重构。
5. 修改模型地址、CDN、推理输入格式或模型文件时，必须同时处理失败回退、用户提示和 README 说明。

## 目录结构

```text
src/
  components/       # 顶栏、画布、工具面板和状态栏
  composables/      # 画布、历史和推理逻辑
  styles/           # 全局主题和布局样式
scripts/            # 本地辅助脚本
public/             # 静态资源；ONNX 模型不提交
```

`src/composables/useCanvas.js` 管理图片、遮罩和画布事件，`src/composables/useInpainting.js` 管理模型下载、缓存和推理，`src/composables/useHistory.js` 管理遮罩撤销与重做。

## 开发命令

本机使用 Windows PowerShell：

```powershell
npm ci
npm run dev
npm run build
npm run preview
```

首次打开应用时，浏览器会下载 MI-GAN ONNX 模型并缓存到 IndexedDB。开发环境默认地址为 `http://localhost:3000`。

## 修改要求

- 保持 Vue 3 + Vite 技术栈，不混用其他前端框架。
- 业务状态优先放在 composables 中，组件负责展示和事件转发。
- 画布坐标必须按缩放比例换算，避免高 DPI 或窗口缩放后遮罩错位。
- 新增交互要同时考虑键盘可访问性、加载状态和错误状态。
- 新增可测试逻辑时必须补充测试；如果任务引入测试框架，同时增加 `npm test` 脚本并更新 README。
- 用户可见行为、安装步骤或外部依赖发生变化时，同步更新 README。

## 交付检查

至少完成以下检查：

1. 运行 `npm run build`，确保生产构建成功。
2. 上传一张图片，验证画笔和框选遮罩。
3. 验证 AI 修复、撤销、重做、重置和下载。
4. 确认控制台没有新增报错。
5. 确认没有把模型、构建产物、依赖目录或敏感信息加入 Git。

如果外部模型或 CDN 不可用，记录具体失败环节，不要把未完成的验证描述为通过。

## 安全与合规

- 不收集、不上传用户图片。
- 示例和测试图片必须具有使用权限。
- 不将工具宣传为可绕过版权、隐私或平台规则的万能方案。
- 水印移除可能涉及著作权、肖像权或平台条款，相关风险由使用者自行承担。
