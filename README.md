# SenseCraft Emergency Response Cockpit (emergency-response-cockpit)

面向快速搭建应急响应与防灾监控看板、离网环境与科技平权项目的**单一开箱即用驾驶舱前端模板**。

遵循 **SenseCraft UI** 统一设计规范（@suharvest/ui-kit 设计 Tokens），专为边缘工业网关（reComputer R1100 / R1000）与完全离网现场定制，用于快速搭建应急响应与防灾监控看板。

---

## 核心特性

1. **统一 SenseCraft UI 视觉语言**
   - 浅色体系沉浸式驾驶舱：`--sc-color-primary: #8CC020`、`--sc-color-bg-layout: #f7fbf0`；
   - 严格规范的四态徽标：`normal`（绿）、`warning`（黄）、`danger`（红）、`disabled`（灰）；
   - 双语自适应：遵循 SenseCraft UI 标准，支持通过 URL 参数 `?lang=en` / `?lang=zh` 强制切换。

2. **零外部 GIS 服务依赖的离线地图（PMTiles）**
   - 通过 `protomaps-leaflet` 对本地挂载的 `.pmtiles` 单文件发起 HTTP Range 请求按需取块；
   - 现场完全断网时仍可顺畅缩放、拖拽与高亮设备标记；
   - 兼具在线 OpenStreetMap 优雅回落。

3. **两段式物理控制确认状态机（Two-Phase Confirmation）**
   - 绝不展示伪“成功”；
   - **Phase 1: `SENT`**（本地指令已通过网关发送）；
   - **Phase 2: `DELIVERED`**（收到 Meshtastic LoRa RF ACK 报文，确认链路送达对端）；
   - **Phase 3: `APPLIED`**（远端执行机构硬件引脚状态回读确认，标记动作真正闭合）；
   - 超时未收到回读状态则转入 `statusUnknown` 待核实告警，并由网关层 SQLite WAL 预写硬审计记录。

4. **时序存储解耦**
   - 支持网关的 `STORAGE_BACKEND` 开关（`none` 纯透传 / `sqlite` 轻量缓存 / `tdengine` 集中时序），前端自适应显示与订阅。

---

## 快速运行与预览

### 方式 1：直接双击或本地静态 HTTP 服务（Zero Build，无需 Node 环境）
```bash
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080/index.html
# 或切换英文：http://localhost:8080/index.html?lang=en
```

### 方式 2：使用 Vite 开发与构建
```bash
npm install
npm run dev
```

---

## 目录结构

```
emergency-response-cockpit/
├── index.html                  # 页面主入口 (SenseCraft AppShell 布局)
├── package.json
├── README.md
└── src/
    ├── main.js                 # 核心数据编排与控制交互调度
    ├── theme/
    │   └── tokens.css          # SenseCraft UI 官方设计 Token
    ├── i18n/
    │   └── index.js            # 双语字典 (zh/en) 与语言归一
    └── components/
        ├── MetricCard.js       # 工业测点指标卡 (四态状态)
        ├── TwoPhaseControlButton.js # 两段式物理控制按钮
        └── OfflineMapView.js   # PMTiles 离线矢量地图挂载
```
