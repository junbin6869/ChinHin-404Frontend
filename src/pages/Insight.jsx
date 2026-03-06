import "./Insight.css";
import { getRole } from "../auth";
import React, { useEffect, useState } from "react";
import { callBackend } from "../api";

function SectionCard({ title, children }) {
  return (
    <div className="insight-card">
      <div className="insight-card__header">
        <div className="insight-card__title">{title}</div>
      </div>
      <div className="insight-card__body">{children}</div>
    </div>
  );
}

function PromotionBarChart({ items = [] }) {
  const data = (items || []).map((x, idx) => {
    const label = String(x.promotion_code || x.name || "Unnamed");
    const value = Number(x.net_sales ?? 0);
    return {
      id: x.promotion_id ?? x.id ?? `${label}-${idx}`,
      label,
      value: Number.isFinite(value) ? value : 0,
    };
  });

  if (!data.length) return <div className="pb-muted">No promotion data.</div>;

  const rawMax = Math.max(0, ...data.map((d) => d.value));
  const ticksCount = 5;
  const chartMinWidth = Math.max(420, data.length * 88 + 96);

  function niceCeil(n) {
    if (n <= 0) return 1;
    const exp = Math.floor(Math.log10(n));
    const base = 10 ** exp;
    const frac = n / base;
    let nice;
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
    return nice * base;
  }

  const niceMax = niceCeil(rawMax);
  const step = niceMax / ticksCount;
  const tickValues = Array.from({ length: ticksCount + 1 }, (_, i) =>
    Math.round(niceMax - step * i)
  );

  return (
    <div className="pb-wrap">
      <div className="pb-scroll">
        <div className="pb-plot" style={{ minWidth: `${chartMinWidth}px` }}>
          <div className="pb-y-axis">
            {tickValues.map((t) => (
              <div key={t} className="pb-y-tick">
                {t.toLocaleString()}
              </div>
            ))}
          </div>

          <div className="pb-area">
            <div className="pb-grid">
              {tickValues.map((t) => (
                <div key={t} className="pb-grid-line" />
              ))}
            </div>

            <div className="pb-bars">
              {data.map((d) => {
                const heightPct = niceMax > 0 ? (d.value / niceMax) * 100 : 0;
                return (
                  <div key={d.id} className="pb-col">
                    <div className="pb-barwrap" data-tip={d.value.toLocaleString()}>
                      <div className="pb-bar" style={{ height: `${heightPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pb-spacer" />

          <div className="pb-xrow">
            {data.map((d) => (
              <div key={d.id} className="pb-xcol">
                <div className="pb-xlabel">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Insight() {
  const role = (getRole() || "").toLowerCase();

  const canSee = {
    procurement: role === "procurement" || role === "admin",
    promotion: role === "promotion" || role === "admin",
  };

  const noAccess = !canSee.procurement && !canSee.promotion;

  const [pendingPOs, setPendingPOs] = useState([]);
  const [deliveryReqs, setDeliveryReqs] = useState([]);
  const [procLoading, setProcLoading] = useState(false);
  const [procError, setProcError] = useState("");
  const [procAIResult, setProcAIResult] = useState(null);
  const [procAILoading, setProcAILoading] = useState(false);
  const [procAIError, setProcAIError] = useState("");

  const [promoItems, setPromoItems] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [monitorText, setMonitorText] = useState("");
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setPromoLoading(true);
        setPromoError("");
        const data = await callBackend("/insight/promotion/active-sales");
        setPromoItems(
          (data?.items || []).map((x) => ({
            ...x,
            net_sales: Number(x.net_sales || 0),
          }))
        );
      } catch (e) {
        setPromoError(e?.message || "Failed to load promotion sales.");
      } finally {
        setPromoLoading(false);
      }
    };
    run();
  }, []);

  const refreshProcurementLists = async () => {
    const [poRes, drRes] = await Promise.all([
      callBackend("/insight/procurement/pending-pos"),
      callBackend("/insight/procurement/delivery-requests"),
    ]);

    const nextPending = poRes?.items || [];
    const nextDelivery = drRes?.items || [];
    setPendingPOs(nextPending);
    setDeliveryReqs(nextDelivery);
    return { nextPending, nextDelivery };
  };

  useEffect(() => {
    if (!canSee.procurement) return;
    const run = async () => {
      try {
        setProcLoading(true);
        setProcError("");
        await refreshProcurementLists();
      } catch (e) {
        setProcError(e?.message || "Failed to load procurement data.");
      } finally {
        setProcLoading(false);
      }
    };
    run();
  }, [canSee.procurement]);

  const runProcurementAI = async () => {
    try {
      setProcAILoading(true);
      setProcAIError("");
      setProcAIResult(null);

      const res = await callBackend("/insight/procurement/ai-insight/run", {
        method: "POST",
        body: JSON.stringify({ horizon_days: 14, candidate_n: 80 }),
      });

      const refreshed = await refreshProcurementLists();
      setProcAIResult({
        ...(res || {}),
        current_pr_po_count:
          typeof res?.current_pr_po_count === "number"
            ? res.current_pr_po_count
            : refreshed?.nextPending?.length || 0,
      });
    } catch (e) {
      setProcAIError(e?.message || "Procurement AI insight failed.");
    } finally {
      setProcAILoading(false);
    }
  };

  const runMonitor = async () => {
    try {
      setMonitorLoading(true);
      setMonitorError("");
      setMonitorText("");

      if (!promoItems.length) {
        setMonitorText("No active promotion data to analyze.");
        return;
      }

      const res = await callBackend("/insight/promotion/monitor", {
        method: "POST",
        body: JSON.stringify({ items: promoItems }),
      });
      setMonitorText(res?.analysis || "");
    } catch (e) {
      setMonitorError(e?.message || "Monitor agent failed.");
    } finally {
      setMonitorLoading(false);
    }
  };

const approvePO = async (poId) => {
  const ok = window.confirm(`Are you sure you want to approve PR ${poId}?`);
  if (!ok) return;

  try {
    const res = await callBackend(`/approve/${poId}`, { method: "POST" });

    await refreshProcurementLists();

    setProcAIResult((prev) =>
      prev
        ? {
            ...prev,
            approval_message: res?.message || `PR ${poId} has been approved successfully.`,
          }
        : prev
    );

    alert(res?.message || `PR ${poId} has been approved successfully.`);
  } catch (e) {
    const msg = e?.message || "Approve failed.";
    setProcAIError(msg);
    alert(msg);
  }
};

  return (
    <div className="insight-root">
      <div className="insight-inner">
        <div className="insight-header">
          <div className="insight-text">
            <div className="insight-title">Insight</div>
            <div className="insight-subtitle">
              Role: <b>{role || "unknown"}</b>
            </div>
          </div>
        </div>

        {noAccess ? (
          <div className="insight-empty">
            No access. Please login with a valid role (promotion / procurement / admin).
          </div>
        ) : (
          <div className="insight-grid">
            {canSee.procurement && (
              <SectionCard title="Procurement">
                {procLoading ? (
                  <div className="insight-muted">Loading procurement data…</div>
                ) : procError ? (
                  <div className="insight-error">{procError}</div>
                ) : (
                  <>
                    <div className="proc-summary">
                      <div className="proc-summary__card">
                        <div className="proc-summary__label">Current Open PR/PO Count</div>
                        <div className="proc-summary__value">{pendingPOs.length}</div>
                      </div>

                      <div className="proc-summary__card">
                        <div className="proc-summary__label">Open Delivery Request Count</div>
                        <div className="proc-summary__value">{deliveryReqs.length}</div>
                      </div>
                    </div>

                    <div className="insight-blocktitle">Current PR/PO List</div>
                    {pendingPOs?.length ? (
                      <div className="proc-list">
                        {pendingPOs.map((x) => (
                          <div key={x.po_id} className="proc-row">
                            <div className="proc-row__main">
                              <div className="proc-row__title">
                                PO <b>{String(x.po_id)}</b>
                                <span className="proc-chip">{String(x.status || "")}</span>
                              </div>

                              <div className="proc-row__meta">
                                <span>Order date: {String(x.order_date || "-")}</span>
                                <span>Supplier: {String(x.supplier_id ?? "-")}</span>
                                <span>Total qty: {String(x.total_quantity ?? "-")}</span>
                              </div>

                              <div className="proc-row__desc">{x.items_summary || "(no items)"}</div>
                              {x.ai_reason ? (
                                <div className="proc-row__desc proc-row__reason">AI reason: {x.ai_reason}</div>
                              ) : null}

                              {(x.status === "Recommended" || x.status === "Pending") && (
                                <button className="approve-btn" onClick={() => approvePO(x.po_id)}>
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="insight-muted">No open PR items.</div>
                    )}

                    <div className="insight-divider" />

                    <div className="insight-blocktitle">Delivery Requests</div>
                    {deliveryReqs?.length ? (
                      <div className="proc-list">
                        {deliveryReqs.map((x) => (
                          <div key={x.delivery_id} className="proc-row">
                            <div className="proc-row__main">
                              <div className="proc-row__title">
                                DR <b>{String(x.delivery_id)}</b>
                                <span className="proc-chip">{String(x.status || "")}</span>
                              </div>
                              <div className="proc-row__meta">
                                <span>Request date: {String(x.request_date || "-")}</span>
                                <span>Supplier: {String(x.supplier_id ?? "-")}</span>
                                <span>PO: {String(x.po_id ?? "-")}</span>
                                <span>
                                  ETA: {String(x.estimated_arrival || "-")}
                                  {x.delay_days > 0 ? ` (Delay ${x.delay_days}d)` : ""}
                                </span>
                              </div>
                              <div className="proc-row__desc">{x.items_summary || "(no items)"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="insight-muted">No delivery requests.</div>
                    )}

                    <div className="insight-divider" />

                    <div className="insight-actions">
                      <button className="btn-primary" onClick={runProcurementAI} disabled={procAILoading}>
                        {procAILoading ? "Analyzing…" : "Show AI Insight"}
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setProcAIResult(null);
                          setProcAIError("");
                        }}
                        disabled={procAILoading}
                      >
                        Clear
                      </button>

                      <div className="insight-actions__hint">
                        * AI insight only runs when you click (save tokens).
                      </div>
                    </div>

                    <div className="insight-blocktitle">AI Insight Result</div>
                    {procAIError ? (
                      <div className="insight-error">{procAIError}</div>
                    ) : procAIResult ? (
                      <div className="proc-ai">
                        <div className="proc-ai__section">
                          <div className="proc-ai__title">Approval Priority Suggestion</div>
                          {procAIResult?.approval_message ? (
                            <div className="insight-monitor">{procAIResult.approval_message}</div>
                          ) : (
                            <div className="insight-muted">No approval explanation returned.</div>
                          )}
                        </div>

                        <div className="proc-ai__section">
                          <div className="proc-ai__title">Newly Generated PRs (using PO table)</div>
                          {(procAIResult?.created?.purchase_requests || []).length ? (
                            (procAIResult.created.purchase_requests || []).map((po, idx) => (
                              <div key={po.po_id ?? idx} className="proc-ai__item">
                                <div>
                                  PO <b>{String(po.po_id)}</b> — {po.product_name || po.product_id} x {String(po.requested_quantity ?? po.quantity)}
                                </div>
                                {po.ai_reason ? <div className="proc-ai__reason">{po.ai_reason}</div> : null}
                              </div>
                            ))
                          ) : (
                            <div className="insight-muted">No new PR was created.</div>
                          )}
                        </div>

                        <div className="proc-ai__section">
                          <div className="proc-ai__title">Stock Is Sufficient</div>
                          {(procAIResult?.sufficient_products || []).length ? (
                            (procAIResult.sufficient_products || []).slice(0, 12).map((x, idx) => (
                              <div key={x.product_id ?? idx} className="proc-ai__item">
                                <div>
                                  {x.product_name || x.product_id} — available {String(x.available_total)} / safety {String(x.safety_stock)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="insight-muted">No products were marked as sufficient in this run.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="insight-muted">
                        Click <b>Show AI Insight</b> to generate replenishment actions.
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            )}

            {canSee.promotion && (
              <SectionCard title="Promotion">
                {promoLoading ? (
                  <div className="insight-muted">Loading active promotions…</div>
                ) : promoError ? (
                  <div className="insight-error">{promoError}</div>
                ) : (
                  <>
                    <div className="insight-blocktitle">Active Promotion Sales (Net Sales)</div>
                    <PromotionBarChart items={promoItems} />

                    <div className="insight-divider" />

                    <div className="insight-actions">
                      <button className="btn-primary" onClick={runMonitor} disabled={monitorLoading || !promoItems.length}>
                        {monitorLoading ? "Analyzing…" : "Run AI Insight"}
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setMonitorText("");
                          setMonitorError("");
                        }}
                        disabled={monitorLoading}
                      >
                        Clear
                      </button>

                      <div className="insight-actions__hint">
                        * AI insight only runs when you click (save tokens).
                      </div>
                    </div>

                    <div className="insight-blocktitle">AI Insight</div>
                    {monitorError ? (
                      <div className="insight-error">{monitorError}</div>
                    ) : monitorText ? (
                      <div className="insight-monitor">{monitorText}</div>
                    ) : (
                      <div className="insight-muted">
                        Click <b>Run AI Insight</b> to analyze the promotions.
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
