/**
 * Two-Phase Physical Control Button Component.
 * Enforces the industrial two-phase state confirmation model:
 *   SENT -> DELIVERED (Mesh RF ACK) -> APPLIED (GPIO Readback Confirmed)
 * Never displays premature optimistic success.
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

export function renderControlButton({
  id,
  title,
  nodeId,
  currentState = 0, // 0 = OFF, 1 = ON
  pendingPhase = null, // null | 'sent' | 'delivered' | 'applied' | 'timeout'
  txId = null,
}) {
  const isOpen = currentState === 1;
  const isPending = pendingPhase === "sent" || pendingPhase === "delivered";

  let statusBadgeClass = isOpen ? "sc-status-normal" : "sc-status-disabled";
  let statusLabel = isOpen ? t("btnOpen") : t("btnClose");

  if (pendingPhase === "sent") {
    statusBadgeClass = "sc-status-warning";
    statusLabel = t("statusSent");
  } else if (pendingPhase === "delivered") {
    statusBadgeClass = "sc-status-warning";
    statusLabel = t("statusDelivered");
  } else if (pendingPhase === "applied") {
    statusBadgeClass = "sc-status-normal";
    statusLabel = t("statusApplied");
  } else if (pendingPhase === "timeout") {
    statusBadgeClass = "sc-status-danger";
    statusLabel = t("statusUnknown");
  }

  const safeId = escapeHtml(id);
  const safeTitle = escapeHtml(title);
  const safeNodeId = escapeHtml(nodeId);

  return `
    <div class="sc-control-card" id="card-${safeId}" style="
      background: var(--sc-color-bg-container);
      border: 1px solid var(--sc-color-border);
      border-radius: var(--sc-radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    ">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: var(--sc-color-text);">${safeTitle}</h4>
          <span class="sc-status-badge ${statusBadgeClass}" id="badge-${safeId}">
            ${statusLabel}
          </span>
        </div>
        <div style="font-size: 13px; color: var(--sc-color-text-secondary);">
          Node ID: <code style="background: var(--sc-status-disabled-bg); color: var(--sc-color-text); padding: 2px 6px; border-radius: var(--sc-radius-sm); font-family: monospace;">${safeNodeId}</code>
          ${txId ? `<span style="margin-left: 8px; font-size: 11px; color: var(--sc-color-text-tertiary);">TX: ${escapeHtml(txId)}</span>` : ""}
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button
          type="button"
          data-action="control"
          data-ctrl-id="${safeId}"
          data-node-id="${safeNodeId}"
          data-target-state="1"
          ${isPending ? "disabled" : ""}
          style="
            flex: 1;
            padding: 10px 16px;
            background: ${isOpen ? "var(--sc-color-primary)" : "var(--sc-color-bg-container)"};
            color: ${isOpen ? "var(--sc-color-text-inverse, #ffffff)" : "var(--sc-color-text)"};
            border: 1px solid ${isOpen ? "var(--sc-color-primary)" : "var(--sc-color-border)"};
            border-radius: var(--sc-radius-md);
            font-family: inherit;
            font-weight: 600;
            font-size: 14px;
            cursor: ${isPending ? "not-allowed" : "pointer"};
            transition: all 0.15s ease;
          "
        >
          ${t("btnOpen")}
        </button>
        <button
          type="button"
          data-action="control"
          data-ctrl-id="${safeId}"
          data-node-id="${safeNodeId}"
          data-target-state="0"
          ${isPending ? "disabled" : ""}
          style="
            flex: 1;
            padding: 10px 16px;
            background: ${!isOpen ? "var(--sc-color-text-secondary)" : "var(--sc-color-bg-container)"};
            color: ${!isOpen ? "var(--sc-color-text-inverse, #ffffff)" : "var(--sc-color-text)"};
            border: 1px solid ${!isOpen ? "var(--sc-color-text-secondary)" : "var(--sc-color-border)"};
            border-radius: var(--sc-radius-md);
            font-family: inherit;
            font-weight: 600;
            font-size: 14px;
            cursor: ${isPending ? "not-allowed" : "pointer"};
            transition: all 0.15s ease;
          "
        >
          ${t("btnClose")}
        </button>
      </div>
    </div>
  `;
}
