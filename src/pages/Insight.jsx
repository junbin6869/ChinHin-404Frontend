import "./Insight.css";
import { getRole } from "../auth";

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

export default function Insight() {
  const role = (getRole() || "").toLowerCase();

  const canSee = {
    procurement: role === "procurement" || role === "admin",
    promotion: role === "promotion" || role === "admin",
    document: role === "document" || role === "admin",
  };

  const noAccess = !canSee.procurement && !canSee.promotion && !canSee.document;

  return (
    <div className="insight-root">
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
          No access. Please login with a valid role (promotion / procurement /
          document / admin).
        </div>
      ) : (
        <div className="insight-grid">
          {canSee.procurement && (
            <SectionCard title="Procurement">
              <div className="insight-placeholder">
                Procurement insights content goes here.
              </div>
            </SectionCard>
          )}

          {canSee.promotion && (
            <SectionCard title="Promotion">
              <div className="insight-placeholder">
                Promotion insights content goes here.
              </div>
            </SectionCard>
          )}

          {canSee.document && (
            <SectionCard title="Document">
              <div className="insight-placeholder">
                Document insights content goes here.
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}