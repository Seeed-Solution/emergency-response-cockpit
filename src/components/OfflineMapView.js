/**
 * OfflineMapView Component.
 * Supports offline PMTiles via HTTP Range Requests with robust preflight checking and graceful OSM fallback.
 */

import { t } from "../i18n/index.js";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const STATUS_COLOR_MAP = {
  normal: "var(--sc-color-primary)",
  warning: "var(--sc-color-warning)",
  danger: "var(--sc-color-error)",
  disabled: "var(--sc-color-text-tertiary)",
};

export async function probePmtilesFile(url, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-511" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    // Accept partial 206, or 200 if small payload
    if (res.status !== 206 && res.status !== 200) {
      return false;
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 2) return false;
    const view = new Uint8Array(buffer);
    // PMTiles v3 starts with 0x4D, 0x50 ('PM' in ASCII)
    return view[0] === 0x4d && view[1] === 0x50;
  } catch (err) {
    clearTimeout(timer);
    return false;
  }
}

function renderFallbackPointList(container, markers) {
  container.innerHTML = `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px; height: 100%; box-sizing: border-box; justify-content: center; align-items: center; text-align: center;">
      <div style="font-size: 36px;">🗺️</div>
      <div style="font-size: 14px; font-weight: 600; color: var(--sc-color-text);">${t("offlineBasemapUnavailable")}</div>
      <div style="font-size: 12px; color: var(--sc-color-text-secondary); max-width: 380px;">${t("mapOfflineNotice")}</div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px;">
        ${markers
          .map(
            (m) => `
          <div style="
            background: var(--sc-color-bg-layout);
            border: 1px solid var(--sc-color-border);
            border-radius: var(--sc-radius-md);
            padding: 8px 12px;
            font-size: 12px;
            text-align: left;
          ">
            <span style="font-weight: 600; color: var(--sc-color-text);">${escapeHtml(m.title)}</span>
            <span style="color: var(--sc-color-text-secondary); margin-left: 6px;">${escapeHtml(m.value)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

export async function initOfflineMap({
  containerId = "map-container",
  center = [22.528, 113.938],
  zoom = 15,
  pmtilesUrl = "/uploads/pmtiles/site.pmtiles",
  markers = [],
  onLayerChanged = null,
}) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (typeof L === "undefined") {
    renderFallbackPointList(container, markers);
    if (typeof onLayerChanged === "function") {
      onLayerChanged("fallback_points");
    }
    return null;
  }

  const map = L.map(containerId, {
    center: center,
    zoom: zoom,
    zoomControl: true,
  });

  let activeLayer = null;
  let layerType = "osm";

  // Preflight check PMTiles availability
  const isPmtilesAvailable = typeof protomapsL !== "undefined" && (await probePmtilesFile(pmtilesUrl));

  if (isPmtilesAvailable) {
    try {
      activeLayer = protomapsL.leafletLayer({
        url: pmtilesUrl,
        theme: "light",
        maxDataZoom: 18,
      }).addTo(map);
      layerType = "pmtiles";
      console.info("Loaded verified offline PMTiles layer from:", pmtilesUrl);
    } catch (e) {
      console.warn("Failed attaching PMTiles layer, falling back to OSM:", e);
    }
  }

  if (!activeLayer) {
    activeLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerType = "osm";
  }

  if (typeof onLayerChanged === "function") {
    onLayerChanged(layerType);
  }

  // Add Markers with 4-state color coding
  markers.forEach((m) => {
    const markerColor = STATUS_COLOR_MAP[m.status] || STATUS_COLOR_MAP.normal;
    const icon = L.divIcon({
      className: "custom-map-marker",
      html: `
        <div style="
          background: ${markerColor};
          color: var(--sc-color-text-inverse, #ffffff);
          width: 32px;
          height: 32px;
          border-radius: var(--sc-radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          border: 2px solid var(--sc-color-bg-container);
        ">
          ${escapeHtml(m.icon || "•")}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([m.lat, m.lon], { icon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: var(--sc-font-sans); padding: 4px;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: var(--sc-color-text);">${escapeHtml(m.title)}</h4>
        <div style="font-size: 12px; color: var(--sc-color-text-secondary); margin-bottom: 4px;">${escapeHtml(m.description || "")}</div>
        <div style="font-size: 14px; font-weight: 600; color: var(--sc-color-primary-dark);">${escapeHtml(m.value || "")}</div>
      </div>
    `);
  });

  return { map, layerType };
}
