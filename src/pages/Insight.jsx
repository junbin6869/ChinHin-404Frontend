import "./Insight.css";
import { getRole } from "../auth";
import React, { useEffect, useMemo, useState } from "react";
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
      <div className="pb-plot">
        {/* Row 1 Col 1: Y axis ticks (aligned to grid lines) */}
        <div className="pb-y-axis">
          {tickValues.map((t, i) => {
            const topPct = (i / (tickValues.length - 1)) * 100; // 0..100
            return (
              <div
                key={t}
                className="pb-y-tick"
                style={{ top: `${topPct}%` }}
              >
                {t.toLocaleString()}
              </div>
            );
          })}
        </div>

        {/* Row 1 Col 2: Plot area */}
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

        {/* Row 2 Col 1: empty spacer */}
        <div className="pb-spacer" />

        {/* Row 2 Col 2: X labels BELOW x-axis */}
        <div className="pb-xrow">
          {data.map((d) => (
            <div key={d.id} className="pb-xcol">
              <div className="pb-xlabel">{d.label}</div>
            </div>
          ))}
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

  // ===== Procurement state =====
  const [pendingPOs, setPendingPOs] = useState([]);
  const [deliveryReqs, setDeliveryReqs] = useState([]);
  const [procLoading, setProcLoading] = useState(false);
  const [procError, setProcError] = useState("");

  const [procAIResult, setProcAIResult] = useState(null);
  const [procAILoading, setProcAILoading] = useState(false);
  const [procAIError, setProcAIError] = useState("");
  // ===== Promotion state =====
  const [promoItems, setPromoItems] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [monitorText, setMonitorText] = useState("");
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState("");

  // ✅ load page -> only fetch active sales (chart)
  useEffect(() => {
    const run = async () => {
      try {
        setPromoLoading(true);
        setPromoError("");

        const data = await callBackend("/insight/promotion/active-sales");
        const items = (data?.items || []).map((x) => ({
          ...x,
          net_sales: Number(x.net_sales || 0),
        }));

        setPromoItems(items);
      } catch (e) {
        setPromoError(e?.message || "Failed to load promotion sales.");
      } finally {
        setPromoLoading(false);
      }
    };

    run();
  }, []);

  // ✅ load procurement lists on page load (no AI)
  useEffect(() => {
    if (!canSee.procurement) return;

    const run = async () => {
      try {
        setProcLoading(true);
        setProcError("");

        const [poRes, drRes] = await Promise.all([
          callBackend("/insight/procurement/pending-pos"),
          callBackend("/insight/procurement/delivery-requests"),
        ]);

        setPendingPOs(poRes?.items || []);
        setDeliveryReqs(drRes?.items || []);
      } catch (e) {
        setProcError(e?.message || "Failed to load procurement data.");
      } finally {
        setProcLoading(false);
      }
    };

    run();
  }, [canSee.procurement]);

  const refreshProcurementLists = async () => {
    const [poRes, drRes] = await Promise.all([
      callBackend("/insight/procurement/pending-pos"),
      callBackend("/insight/procurement/delivery-requests"),
    ]);
    setPendingPOs(poRes?.items || []);
    setDeliveryReqs(drRes?.items || []);
  };

  // ✅ button click -> run procurement AI insight
  const runProcurementAI = async () => {
    try {
      setProcAILoading(true);
      setProcAIError("");
      setProcAIResult(null);

      const res = await callBackend("/insight/procurement/ai-insight/run", {
        method: "POST",
        body: JSON.stringify({ horizon_days: 14, candidate_n: 80 }),
      });

      setProcAIResult(res || null);
      await refreshProcurementLists();
    } catch (e) {
      setProcAIError(e?.message || "Procurement AI insight failed.");
    } finally {
      setProcAILoading(false);
    }
  };

  // ✅ button click -> call monitor agent
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

  async function approvePO(po_id) {
  const url = `${import.meta.env.VITE_API_BASE_URL}/approve/${po_id}`;
  const res = await fetch(url, { method: "POST" });

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    console.error("Backend error:", body);
    throw new Error(
      typeof body === "string" ? body : (body?.detail || body?.error || "Request failed")
    );
  }

  console.log("Approve OK:", body);
  return body;
}


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
                    <div className="insight-blocktitle">Pending Manager Approval</div>
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

                              {/* Button */}
                              {x.status === "Pending" && (
                                <button
                                  className="approve-btn"
                                  onClick={() => approvePO(x.po_id)}
                                >
                                  Approve
                                </button>
                              )}

                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="insight-muted">No pending purchase requests.</div>
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
                      <button
                        className="btn-primary"
                        onClick={runProcurementAI}
                        disabled={procAILoading}
                      >
                        {procAILoading ? "Analyzing…" : "Run AI Insight"}
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
                          <div className="proc-ai__title">Created Purchase Orders (Pending)</div>
                          {(procAIResult?.created?.purchase_orders || []).length ? (
                            (procAIResult.created.purchase_orders || []).map((po, idx) => (
                              <div key={po.po_id ?? idx} className="proc-ai__item">
                                <div>
                                  PO <b>{String(po.po_id)}</b> — {po.product_name || po.product_id} x {String(po.quantity)}
                                </div>
                                {po.ai_reason ? (
                                  <div className="proc-ai__reason">Reason: {po.ai_reason}</div>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="insight-muted">No new pending PO created.</div>
                          )}
                        </div>

                        <div className="proc-ai__section">
                          <div className="proc-ai__title">Created Delivery Requests</div>
                          {(procAIResult?.created?.delivery_requests || []).length ? (
                            (procAIResult.created.delivery_requests || []).map((dr, idx) => (
                              <div key={dr.delivery_id ?? idx} className="proc-ai__item">
                                <div>
                                  DR <b>{String(dr.delivery_id)}</b> — {dr.product_name || dr.product_id} x {String(dr.quantity)}
                                  {dr.po_id ? ` (PO ${dr.po_id})` : ""}
                                </div>
                                {dr.reason ? (
                                  <div className="proc-ai__reason">{dr.reason}</div>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="insight-muted">No delivery request created.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="insight-muted">
                        Click <b>Run AI Insight</b> to generate replenishment actions.
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
                    <div className="insight-blocktitle">
                      Active Promotion Sales (Net Sales)
                    </div>
                    <PromotionBarChart items={promoItems} />

                    <div className="insight-divider" />

                    <div className="insight-actions">
                      <button
                        className="btn-primary"
                        onClick={runMonitor}
                        disabled={monitorLoading || !promoItems.length}
                      >
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