# 🌏 Geo-Blog: 我的地理足迹与个人博客

欢迎来到 **Geo-Blog**！这是我的第一个 GitHub 开源项目。

这是一个将"地理足迹"、"摄影相册"与"知识库博客"深度结合的个人主页。它不仅记录了我走过的路，也承载了我思考的痕迹。

---

## ✨ 项目初衷：为什么做这个？

**好玩**

---

## 🤖 开发者宣言：Vibe Coding

本项目是 **Vibe Coding** 的产物。

我并没有从零开始手写每一行代码，而是在 **Claude Code** 和 **Google AI Studio (Gemini)** 的深度协助下完成。

---

## 🛠️ 核心架构

| 层级       | 技术栈                                          | 说明                                                     |
| ---------- | ----------------------------------------------- | -------------------------------------------------------- |
| 🎨 前端     | React + Vite + Tailwind CSS                     | 追求极致的响应式与视觉体验                               |
| ⚙️ 后端     | Node.js + Express                               | 轻量、高效的 API 驱动                                    |
| 🗺️ 地图引擎 | Mapbox GL JS                                    | 专业级的 3D 地理空间渲染                                 |
| 🧠 笔记引擎 | [Quartz 4](https://github.com/jackyzha0/quartz) | 基于 Markdown 的第二大脑                                 |
| ☁️ 存储服务 | Cloudflare R2                                   | 兼顾低成本与全球加速的 S3 兼容对象存储，用于托管高清照片 |
| 🐳 部署方案 | Nginx + Podman/Docker                           | 容器化一键部署                                           |

---

## 📂 项目目录结构

```text
.
├── api/                    # 后端服务 (Node.js + Express)
│   ├── server.ts           # 核心逻辑：处理足迹、配置及 R2 上传
│   └── Dockerfile          # 后端容器化配置
├── data/                   # 持久化数据存储 (JSON 格式)
│   ├── app-config.json     # 网站全局配置 (如下一个目的地)
│   └── locations.json      # 已记录的足迹数据
├── frontend/               # 前端应用 (React + Vite)
│   ├── src/components/     # UI 组件 (地图、相册、Auto Cruise、关于等)
│   ├── src/lib/            # 工具函数与身份验证逻辑
│   └── metadata.json       # 站点元数据配置
├── nginx/                  # 反向代理配置
│   └── nginx.conf          # 核心路由：分发 API、前端及 Quartz 笔记请求
├── docker-compose.yml      # 多容器编排配置
└── start.sh                # 一键启动脚本
```

### 关键目录说明

- **`api/`** — 负责处理前端请求，读写 `data/` 文件夹下的 JSON 文件，并对接 Cloudflare R2 对象存储。
- **`data/`** — 项目的"轻量级数据库"。为了极致的便携性，直接使用本地 JSON 文件存储足迹坐标和配置。
- **`frontend/`** — 包含所有视觉组件。地图部分基于 Mapbox，样式采用 Tailwind CSS，确保在移动端和网页端都有出色的跨屏适配表现。
- **`nginx/`** — 项目的"流量大脑"。它负责把 `/api/` 的请求转给后端，把 `/notes/` 的请求转给 Quartz 容器，其余请求交给前端 React 页面。

---

## ✈️ 最新功能：航线动画 (Auto Cruise)

新上线**自动航线巡游功能**。以 3D 上帝视角飞越记录的每一个足迹点。

---

## 🚀 快速开始

### 1. 准备工作

在运行本项目之前，你需要准备以下外部服务：

- **Mapbox API Token** — 前往 [Mapbox 官网](https://www.mapbox.com/) 注册并获取 Access Token。这是渲染精美 3D 地球的前提。
- **Cloudflare R2**
  - 开通 Cloudflare R2 存储池
  - 获取 Account ID、Access Key、Secret Key
  - 配置一个公开访问的 URL (Public URL)
- **Quartz 笔记** — 建议先根据 [Quartz 官方文档](https://quartz.jzhao.xyz/) 编译并配置好你的 Markdown 笔记库。

### 2. 配置环境变量

在项目根目录下创建一个 `.env` 文件，并参考以下内容填写：

```env
# Mapbox 令牌 (必填)
VITE_MAPBOX_ACCESS_TOKEN=你的mapbox_token

# 管理员鉴权 (用于后台添加足迹)
JWT_SECRET=随机的复杂长字符串
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的强密码

# Cloudflare R2 配置 (用于相册图片上传)
R2_ACCOUNT_ID=你的account_id
R2_ACCESS_KEY=你的access_key
R2_SECRET_KEY=你的secret_key
R2_BUCKET=你的bucket名称
R2_PUBLIC_URL=你的公开访问域名

# 应用 URL
APP_URL=http://localhost
```

### 3. 使用 Docker/Podman 一键启动

项目已经配置好了 `docker-compose.yml`，请确保你已经安装了 npm 以及 Docker 或 Podman。

```bash
# 进入项目目录
cd /opt/geo-blog
mv .env.example .env

# 执行一键启动脚本
sh start.sh
```

🎉 **启动后即可访问：**

| 服务           | 地址                   |
| -------------- | ---------------------- |
| 🏠 主页         | http://localhost:80    |
| ⚙️ 管理后台     | http://localhost/login |
| 📝 完整笔记视图 | http://localhost:4001  |

> 在管理后台可添加你的足迹、文字和照片。

---

## 📖 笔记托管说明

本项目深度集成了 [Quartz](https://github.com/jackyzha0/quartz) 引擎。

- 你的本地 Markdown 笔记会被 Quartz 渲染成极具质感和互联性的知识图谱网页。
- 通过 Nginx 反向代理转发，这些笔记会无缝嵌入到 Geo-Blog 的 `/notes/` 路径下，保持站点域名与视觉体验的高度统一。

---

## 🤝 致谢

- 特别感谢 [Jacky Zhao](https://github.com/jackyzha0) 创造了如此优秀的 **Quartz** 笔记系统。
- 感谢 **Claude** 和 **Gemini**，你们是新时代最好的编程伙伴。

---

这是我 GitHub 生涯迈出的第一步。如果你觉得这个项目有趣或者对你有帮助，欢迎点个 ⭐ **Star** 支持一下！
