/**
 * Metric Card Component for SenseCraft Cockpit.
 * Supports status badge (normal/warning/danger/disabled), unit, and thresholding.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMetricCard({
  title,
  value,
  unit,
  status = "normal",
  statusText = "",
  hint = "",
  icon = "",
}) {
  const safeTitle = escapeHtml(title);
  const safeValue = escapeHtml(value);
  const safeUnit = escapeHtml(unit);
  const safeStatusText = escapeHtml(statusText);
  const safeHint = escapeHtml(hint);
  const safeStatus = ["normal", "warning", "danger", "disabled"].includes(status) ? status : "normal";

  return `
    <div class="sc-metric-card" style="
      background: var(--sc-color-bg-container);
      border: 1px solid var(--sc-color-border);
      border-radius: var(--sc-radius-lg);
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; color: var(--sc-color-text-secondary); font-weight: 500;">
          ${icon ? `<span style="margin-right: 6px;">${escapeHtml(icon)}</span>` : ""}
          ${safeTitle}
        </span>
        <span class="sc-status-badge sc-status-${safeStatus}">
          ${safeStatusText}
        </span>
      </div>
      <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 32px; font-weight: 700; color: var(--sc-color-text); letter-spacing: -0.02em;">
          ${safeValue}
        </span>
        <span style="font-size: 14px; font-weight: 500; color: var(--sc-color-text-secondary);">
          ${safeUnit}
        </span>
      </div>
      ${safeHint ? `<div style="font-size: 12px; color: var(--sc-color-text-tertiary);">${safeHint}</div>` : ""}
    </div>
  `;
}
