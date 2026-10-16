/**
 * SenseCraft Vibe Cockpit Main Application Entry.
 * Integrates Telemetry Metrics, Offline PMTiles Map, and Two-Phase Controls with Race-Condition Guards.
 */

import { t, getCurrentLanguage, setLanguage } from "./i18n/index.js";
import { renderMetricCard } from "./components/MetricCard.js";
import { renderControlButton } from "./components/TwoPhaseControlButton.js";
import { initOfflineMap } from "./components/OfflineMapView.js";

// Mode Configuration: Simulated or Live Gateway
const config = {
  isSimulatedMode: true,
  storageBackend: "sqlite", // 'none' | 'sqlite' | 'tdengine'
};

// Application State
const state = {
  points: {
    liquidDepth: { val: 0.85, unit: "m", status: "normal", statusKey: "statusSafe", icon: "🌊" },
    rainfall: { val: 18.2, unit: "mm/h", status: "warning", statusKey: "statusWarning", icon: "🌧️" },
    flow: { val: 1420.5, unit: "m³", status: "normal", statusKey: "statusNormal", icon: "🚰" },
    soilMoisture: { val: 38.2, unit: "%", status: "normal", statusKey: "statusNormal", icon: "🌱" },
    temp: { val: 24.6, unit: "°C", status: "normal", statusKey: "statusComfort", icon: "🌡️" },
    humidity: { val: 62.4, unit: "%RH", status: "normal", statusKey: "statusComfort", icon: "💧" },
    battery: { val: 92.0, unit: "%", status: "normal", statusKey: "statusAbundant", icon: "🔋" },
    snr: { val: 8.8, unit: "dB", status: "normal", statusKey: "statusOptimal", icon: "📡" },
  },
  controls: {
    pump: { id: "pump", titleKey: "drainagePump", nodeId: "!7a8b9c0d", state: 0, phase: null, txId: null },
    sluice: { id: "sluice", titleKey: "spillwayGate", nodeId: "!7a8b9c0e", state: 1, phase: null, txId: null },
    siren: { id: "siren", titleKey: "alarmSiren", nodeId: "!7a8b9c0f", state: 0, phase: null, txId: null },
  },
  mapLayerType: "unknown",
};

function getMapMarkers() {
  return [
    {
      id: "node-1",
      lat: 22.528,
      lon: 113.938,
      title: t("markerNode1Title"),
      description: t("markerNode1Desc"),
      value: t("markerNode1Val"),
      status: "normal",
      icon: "P",
    },
    {
      id: "node-2",
      lat: 22.531,
      lon: 113.942,
      title: t("markerNode2Title"),
      description: t("markerNode2Desc"),
      value: t("markerNode2Val"),
      status: "warning",
      icon: "G",
    },
    {
      id: "node-3",
      lat: 22.525,
      lon: 113.935,
      title: t("markerNode3Title"),
      description: t("markerNode3Desc"),
      value: t("markerNode3Val"),
      status: "normal",
      icon: "S",
    },
  ];
}

// Active command timer cancellation map to prevent race conditions
const activeTimers = new Map();

function renderMetrics() {
  const container = document.getElementById("metrics-grid");
  if (!container) return;

  container.innerHTML = Object.entries(state.points)
    .map(([key, item]) =>
      renderMetricCard({
        title: t(key),
        value: item.val,
        unit: item.unit,
        status: item.status,
        statusText: t(item.statusKey),
        icon: item.icon,
      })
    )
    .join("");
}

function renderControls() {
  const container = document.getElementById("controls-grid");
  if (!container) return;

  container.innerHTML = Object.values(state.controls)
    .map((ctrl) =>
      renderControlButton({
        id: ctrl.id,
        title: t(ctrl.titleKey),
        nodeId: ctrl.nodeId,
        currentState: ctrl.state,
        pendingPhase: ctrl.phase,
        txId: ctrl.txId,
      })
    )
    .join("");
}

function updateStorageBadge() {
  const labelEl = document.getElementById("storage-label-text");
  if (labelEl) {
    labelEl.textContent = t("storageLabel");
  }

  const badgeEl = document.getElementById("storage-badge");
  if (!badgeEl) return;
  const keyMap = {
    none: "storageNone",
    sqlite: "storageSqlite",
    tdengine: "storageTdengine",
  };
  badgeEl.textContent = t(keyMap[config.storageBackend] || "storageSqlite");
}

function updateMapStatusBadge(layerType) {
  state.mapLayerType = layerType;
  const badgeEl = document.getElementById("map-status-badge");
  if (!badgeEl) return;

  if (layerType === "pmtiles") {
    badgeEl.className = "sc-status-badge sc-status-normal";
    badgeEl.textContent = t("mapOfflineReady");
  } else if (layerType === "osm") {
    badgeEl.className = "sc-status-badge sc-status-warning";
    badgeEl.textContent = t("mapFallbackOsm");
  } else {
    badgeEl.className = "sc-status-badge sc-status-disabled";
    badgeEl.textContent = t("mapNotReady");
  }
}

/**
 * Live Gateway API dispatch skeleton with fail-closed timeout handling.
 */
async function dispatchToGateway(ctrlId, nodeId, targetState, txId) {
  const ctrl = state.controls[ctrlId];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch("/api/v1/commands/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command_id: txId,
        node_id: nodeId,
        target_state: targetState,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Gateway returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (ctrl.txId !== txId) return; // Stale check

    if (data.status === "applied") {
      ctrl.phase = "applied";
      ctrl.state = targetState;
      renderControls();
      setTimeout(() => {
        if (ctrl.txId === txId) {
          ctrl.phase = null;
          ctrl.txId = null;
          renderControls();
        }
      }, 1200);
    } else if (data.status === "delivered") {
      ctrl.phase = "delivered";
      renderControls();
    } else {
      ctrl.phase = "timeout";
      renderControls();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (ctrl.txId === txId) {
      console.warn(`[Control] Gateway dispatch error for ${ctrlId}:`, err);
      // Fail-closed: Never assume success on error
      ctrl.phase = "timeout";
      renderControls();
    }
  }
}

// Global hook for Two-Phase Control execution with race-condition guards
export function dispatchControl(ctrlId, nodeId, targetState) {
  const ctrl = state.controls[ctrlId];
  if (!ctrl) return;

  // Clear any existing in-flight timer for this control
  if (activeTimers.has(ctrlId)) {
    activeTimers.get(ctrlId).forEach((tId) => clearTimeout(tId));
    activeTimers.delete(ctrlId);
  }

  const currentTimers = [];
  const txId = `tx-${Date.now().toString().slice(-4)}`;
  ctrl.txId = txId;
  ctrl.phase = "sent";
  renderControls();

  console.info(`[Control] ${ctrlId} (${txId}) dispatched target_state=${targetState}`);

  if (config.isSimulatedMode) {
    // Phase 2: Mesh RF ACK delivered after 500ms
    const t1 = setTimeout(() => {
      if (ctrl.txId !== txId) return; // Stale check
      ctrl.phase = "delivered";
      renderControls();

      // Phase 3: Hardware GPIO confirmation read back after 1000ms
      const t2 = setTimeout(() => {
        if (ctrl.txId !== txId) return; // Stale check
        ctrl.phase = "applied";
        ctrl.state = targetState;
        renderControls();

        // Clear transient APPLIED highlight after 1200ms
        const t3 = setTimeout(() => {
          if (ctrl.txId !== txId) return;
          ctrl.phase = null;
          ctrl.txId = null;
          activeTimers.delete(ctrlId);
          renderControls();
        }, 1200);
        currentTimers.push(t3);
      }, 1000);
      currentTimers.push(t2);
    }, 500);
    currentTimers.push(t1);

    activeTimers.set(ctrlId, currentTimers);
  } else {
    dispatchToGateway(ctrlId, nodeId, targetState, txId);
  }
}

window.dispatchControl = dispatchControl;

window.switchLang = function (lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.location.href = url.toString();
};

function setupEventDelegation() {
  const controlsGrid = document.getElementById("controls-grid");
  if (!controlsGrid) return;

  controlsGrid.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-action='control']");
    if (!btn || btn.disabled) return;

    const ctrlId = btn.getAttribute("data-ctrl-id");
    const nodeId = btn.getAttribute("data-node-id");
    const targetState = parseInt(btn.getAttribute("data-target-state"), 10);

    if (ctrlId && nodeId && !isNaN(targetState)) {
      dispatchControl(ctrlId, nodeId, targetState);
    }
  });
}

export function initApp() {
  setLanguage(getCurrentLanguage());

  // Localize text elements
  document.getElementById("app-title").textContent = t("appTitle");
  document.getElementById("telemetry-title").textContent = t("telemetryMatrix");
  document.getElementById("map-header-title").textContent = t("mapHeader");
  document.getElementById("control-header-title").textContent = t("controlHeader");
  document.getElementById("audit-note").textContent = t("auditRecord");
  document.getElementById("mode-badge").textContent = config.isSimulatedMode ? t("simulatedBadge") : t("liveBadge");

  updateStorageBadge();
  renderMetrics();
  renderControls();
  setupEventDelegation();

  // Initialize Map with Range Preflight and Callback
  setTimeout(async () => {
    await initOfflineMap({
      containerId: "map-viewport",
      center: [22.528, 113.938],
      zoom: 15,
      markers: getMapMarkers(),
      onLayerChanged: (layerType) => {
        updateMapStatusBadge(layerType);
      },
    });
  }, 50);
}

document.addEventListener("DOMContentLoaded", initApp);
