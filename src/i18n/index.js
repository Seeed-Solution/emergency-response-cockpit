/**
 * SenseCraft Cockpit i18n Dictionary and Language Resolver.
 * Follows SenseCraft UI standard: ?lang=en / ?lang=zh overrides browser default.
 */

const DICTIONARY = {
  zh: {
    appTitle: "SenseCraft 离网防灾与环境监测驾驶舱",
    systemHealthy: "系统运转正常",
    storageLabel: "存储后端",
    storageMode: "存储后端",
    storageNone: "纯网关透传 (内存总线)",
    storageSqlite: "本地轻量时序 (SQLite)",
    storageTdengine: "生产级时序库 (TDengine)",
    networkOffgrid: "全离网 LoRa Mesh",
    onlineNodes: "在线节点",
    telemetryMatrix: "实时态势感知矩阵",
    mapHeader: "现场离线态势底图 (PMTiles Range 加载)",
    mapOfflineReady: "100% 离线矢量自给",
    mapFallbackOsm: "在线 OSM 瓦片模式",
    mapNotReady: "离线底图包未挂载 (降级模式)",
    mapOfflineNotice: "当前环境未加载在线底图或离线 PMTiles 切片，已进入无底图矢量点位标绘模式。",
    controlHeader: "物理继电器与执行机构 (两段式确认)",
    battery: "剩余电量",
    voltage: "供电电压",
    temp: "空气温度",
    humidity: "空气湿度",
    liquidDepth: "积水与液位深度",
    rainfall: "小时降雨量",
    soilMoisture: "土壤水分 (VWC)",
    flow: "累计流量",
    snr: "LoRa 链路 SNR",
    meshSignal: "LoRa 链路 SNR",
    statusSafe: "安全",
    statusWarning: "预警",
    statusNormal: "正常",
    statusComfort: "适宜",
    statusAbundant: "充足",
    statusOptimal: "极优",
    statusStandby: "待命",
    drainagePump: "强排抽水主泵 (Node #1)",
    spillwayGate: "溢洪泄水闸门 (Node #2)",
    alarmSiren: "大分贝高音警报器 (Node #3)",
    btnOpen: "开启",
    btnClose: "关闭",
    statusSent: "指令已下发...",
    statusDelivered: "Mesh 链路已送达",
    statusApplied: "硬件触点已确认",
    statusUnknown: "超时未回读 (待核实)",
    mapBaseLayer: "底图来源",
    offlinePmtiles: "离线矢量底图 (PMTiles)",
    onlineOsm: "在线 OpenStreetMap",
    lastHeartbeat: "最近心跳",
    auditRecord: "物理操作硬审计已写入本地 SQLite WAL，断电与离网下保证状态追溯与幂等。",
    simulatedBadge: "演示模拟模式",
    liveBadge: "网关直连模式",
    markerNode1Title: "强排主泵站 #1",
    markerNode1Desc: "Node !7a8b9c0d",
    markerNode1Val: "液位 0.85 m",
    markerNode2Title: "溢洪分流闸 #2",
    markerNode2Desc: "Node !7a8b9c0e",
    markerNode2Val: "开度 100%",
    markerNode3Title: "高音警报塔 #3",
    markerNode3Desc: "Node !7a8b9c0f",
    markerNode3Val: "就绪 (待命)",
  },
  en: {
    appTitle: "SenseCraft Off-Grid Disaster & Environmental Cockpit",
    systemHealthy: "All Systems Operational",
    storageLabel: "Storage Backend",
    storageMode: "Storage Backend",
    storageNone: "Gateway Passthrough (In-Memory)",
    storageSqlite: "Local Embedded Time-Series (SQLite)",
    storageTdengine: "High-Throughput Time-Series (TDengine)",
    networkOffgrid: "Off-Grid LoRa Mesh",
    onlineNodes: "Online Nodes",
    telemetryMatrix: "Real-time Telemetry Matrix",
    mapHeader: "Offline Site Map (PMTiles HTTP Range)",
    mapOfflineReady: "100% Offline Vector Ready",
    mapFallbackOsm: "Online OSM Fallback",
    mapNotReady: "Offline Basemap Missing (Degraded)",
    mapOfflineNotice: "Offline basemap and online tiles unavailable. Running in tile-less point mode.",
    controlHeader: "Physical Actuators & Relays (Two-Phase Verification)",
    battery: "Battery Level",
    voltage: "Supply Voltage",
    temp: "Air Temperature",
    humidity: "Air Humidity",
    liquidDepth: "Water Level / Depth",
    rainfall: "Hourly Rainfall",
    soilMoisture: "Soil Moisture (VWC)",
    flow: "Total Water Flow",
    snr: "LoRa RF SNR",
    meshSignal: "LoRa RF SNR",
    statusSafe: "Safe",
    statusWarning: "Warning",
    statusNormal: "Normal",
    statusComfort: "Comfortable",
    statusAbundant: "Good",
    statusOptimal: "Optimal",
    statusStandby: "Standby",
    drainagePump: "Main Drainage Pump (Node #1)",
    spillwayGate: "Spillway Sluice Gate (Node #2)",
    alarmSiren: "High-Decibel Siren (Node #3)",
    btnOpen: "Activate",
    btnClose: "Deactivate",
    statusSent: "Command Dispatched...",
    statusDelivered: "Mesh Delivered (ACK)",
    statusApplied: "GPIO Hardware Confirmed",
    statusUnknown: "Timeout (Unverified)",
    mapBaseLayer: "Basemap Source",
    offlinePmtiles: "Offline Vector (PMTiles)",
    onlineOsm: "Online OpenStreetMap",
    lastHeartbeat: "Last Heartbeat",
    auditRecord: "Physical command audit ledger durably committed to local SQLite WAL for fail-closed idempotency.",
    simulatedBadge: "Simulated Demo Mode",
    liveBadge: "Live Gateway Connected",
    markerNode1Title: "Main Drainage Pump #1",
    markerNode1Desc: "Node !7a8b9c0d",
    markerNode1Val: "Depth 0.85 m",
    markerNode2Title: "Spillway Sluice Gate #2",
    markerNode2Desc: "Node !7a8b9c0e",
    markerNode2Val: "Opening 100%",
    markerNode3Title: "Siren Tower #3",
    markerNode3Desc: "Node !7a8b9c0f",
    markerNode3Val: "Ready (Standby)",
  },
};

export function resolveLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get("lang");
  if (langParam) {
    return langParam.toLowerCase().startsWith("en") ? "en" : "zh";
  }
  const browserLang = navigator.language || navigator.userLanguage || "zh";
  return browserLang.toLowerCase().startsWith("en") ? "en" : "zh";
}

let currentLang = resolveLanguage();

export function t(key) {
  return DICTIONARY[currentLang]?.[key] || DICTIONARY.zh[key] || key;
}

export function setLanguage(lang) {
  currentLang = lang && lang.toLowerCase().startsWith("en") ? "en" : "zh";
  document.documentElement.lang = currentLang === "en" ? "en" : "zh-CN";
}

export function getCurrentLanguage() {
  return currentLang;
}
