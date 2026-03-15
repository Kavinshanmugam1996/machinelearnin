import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY, AI_USE_CASES } from '../services/constants.js';

const html = htm.bind(React.createElement);

const { useState } = React;

export function CompanyProfile({ onNext, clients, activeClientId, onSwitchClient, onLogout, onHome, initialProfile }) {
  const [form, setForm] = useState({
    companyName: initialProfile?.companyName || "",
    industry: initialProfile?.industry || "",
    companySize: initialProfile?.companySize || "",
    regulatory: initialProfile?.regulatory || "",
    techMaturity: initialProfile?.techMaturity || ""
  });
  
  // Sync with initialProfile if it changes (e.g. after async load)
  React.useEffect(() => {
    if (initialProfile) {
      setForm(prev => ({
        ...prev,
        companyName: initialProfile.companyName || prev.companyName,
        industry: initialProfile.industry || prev.industry,
        companySize: initialProfile.companySize || prev.companySize,
        regulatory: initialProfile.regulatory || prev.regulatory,
        techMaturity: initialProfile.techMaturity || prev.techMaturity
      }));
      
      if (initialProfile.inventory) {
        setInventory(initialProfile.inventory);
      }
    }
  }, [initialProfile, activeClientId]);

  const [inventory, setInventory] = useState(() => {
    const initial = initialProfile?.inventory || [];
    if (initial.length === 0) return [
      { description: "", useCase: "" },
      { description: "", useCase: "" },
      { description: "", useCase: "" },
    ];
    // Always provide at least 3 slots if they have fewer
    if (initial.length < 3) {
      const needed = 3 - initial.length;
      return [...initial, ...Array(needed).fill({ description: "", useCase: "" })];
    }
    return initial;
  });

  const [errors, setErrors] = useState({});

  const f = (err) => ({
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${err ? B.red : B.border}`,
    borderRadius: 8, fontSize: 14, color: B.black, background: B.white,
    outline: "none", boxSizing: "border-box", fontFamily: BODY,
    appearance: "none", WebkitAppearance: "none"
  });

  const selectWrapper = (err) => ({
    position: "relative",
    width: "100%"
  });

  const selectArrow = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.2s ease"
  };

  const autoMap = (text) => {
    if (!text) return "";
    const t = text.toLowerCase();
    if (t.includes("chat") || t.includes("bot") || t.includes("support")) return "Customer chatbot";
    if (t.includes("copilot") || t.includes("productivity") || t.includes("employee")) return "Employee copilot";
    if (t.includes("code") || t.includes("dev") || t.includes("program")) return "Developer or coding assistant";
    if (t.includes("summary") || t.includes("summarize") || t.includes("doc")) return "Document summarization";
    if (t.includes("search") || t.includes("qa") || t.includes("find")) return "Search and question-answering";
    if (t.includes("generate") || t.includes("write") || t.includes("content")) return "Content generation";
    if (t.includes("email") || t.includes("message") || t.includes("comm")) return "Email or communications assistant";
    if (t.includes("data") || t.includes("analy") || t.includes("insight")) return "Data analysis and insights";
    if (t.includes("hiring") || t.includes("recruit") || t.includes("hr")) return "AI used in hiring";
    if (t.includes("predict") || t.includes("forecast") || t.includes("decision")) return "Decision support";
    if (t.includes("recommend") || t.includes("personal")) return "Recommendations or personalization";
    if (t.includes("automation") || t.includes("workflow")) return "Workflow automation";
    if (t.includes("train") || t.includes("model") || t.includes("tune")) return "Model training or fine-tuning";
    if (t.includes("risk") || t.includes("harm") || t.includes("safe")) return "AI use case with high potential for human harm";
    return "General AI assistant";
  };

  const upd = (i, k, v) => {
    const n = [...inventory];
    n[i] = { ...n[i], [k]: v };
    if (k === "description" && !n[i].useCase) {
      n[i].useCase = autoMap(v);
    }
    setInventory(n);
  };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.industry) e.industry = "Required";
    if (!form.companySize) e.companySize = "Required";
    if (!form.regulatory) e.regulatory = "Required";
    if (!form.techMaturity) e.techMaturity = "Required";
    if (!inventory.some(i => i.description.trim())) e.inventory = "Describe at least one AI usage";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY }}>
      <${Nav}
        steps=${["Profile", "Teams", "Questions", "Complete"]}
        current=${0}
        clients=${clients}
        activeClientId=${activeClientId}
        onSwitchClient=${onSwitchClient}
        onLogout=${onLogout}
        onHome=${onHome}
      />
      <div style=${{ maxWidth: 760, margin: "40px auto", padding: "0 24px 60px" }}>
        <div style=${{ marginBottom: 32 }}>
          <h1 style=${{ fontSize: 28, fontWeight: 800, color: B.black, margin: "0 0 6px", letterSpacing: "-0.3px", fontFamily: DISPLAY }}>Company Profile</h1>
          <p style=${{ color: B.gray500, fontSize: 14, margin: 0 }}>Tell us about your organisation to personalise your assessment.</p>
        </div>

        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: "32px", marginBottom: 20, boxShadow: B.shadow }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style=${{ width: 4, height: 20, background: B.red, borderRadius: 2 }} />
            <span style=${{ fontSize: 13, fontWeight: 700, color: B.black, letterSpacing: "0.06em" }}>I. ORGANISATION DETAILS</span>
          </div>

          <div style=${{ display: "grid", gap: 18 }}>
            <div>
              <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Company Name *</label>
              <input value=${form.companyName} onChange=${e => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Acme Corporation" style=${f(errors.companyName)} />
              ${errors.companyName && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.companyName}</span>`}
            </div>
            <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Industry *</label>
                <div className="select-wrapper" style=${selectWrapper(errors.industry)}>
                  <select value=${form.industry} onChange=${e => setForm({ ...form, industry: e.target.value })} style=${{ ...f(errors.industry), cursor: "pointer", paddingRight: 38 }}>
                    <option value="">Select industry...</option>
                    ${["Healthcare", "Banking", "Retail", "E-Commerce", "Education", "Other"].map(i => html`<option key=${i}>${i}</option>`)}
                  </select>
                  <div className="dropdown-arrow" style=${selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: "#9CA3AF" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                ${errors.industry && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.industry}</span>`}
              </div>
              <div>
                <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Company Size *</label>
                <div className="select-wrapper" style=${selectWrapper(errors.companySize)}>
                  <select value=${form.companySize} onChange=${e => setForm({ ...form, companySize: e.target.value })} style=${{ ...f(errors.companySize), cursor: "pointer", paddingRight: 38 }}>
                    <option value="">Select size...</option>
                    <option value="small">Small (1–100 employees)</option>
                    <option value="medium">Medium (100–1,000 employees)</option>
                    <option value="large">Large (1,000–2,500 employees)</option>
                    <option value="enterprise">Enterprise (2,500+ employees)</option>
                  </select>
                  <div className="dropdown-arrow" style=${selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: "#9CA3AF" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                ${errors.companySize && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.companySize}</span>`}
              </div>
            </div>
          </div>
        </div>

        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: "32px", marginBottom: 20, boxShadow: B.shadow }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style=${{ width: 4, height: 20, background: B.red, borderRadius: 2 }} />
            <span style=${{ fontSize: 13, fontWeight: 700, color: B.black, letterSpacing: "0.06em" }}>II. REGULATORY JURISDICTION</span>
          </div>
          <div>
            <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Select Jurisdiction *</label>
            <p style=${{ fontSize: 12, color: B.gray500, margin: "0 0 12px", lineHeight: 1.5 }}>Choose the primary regulatory framework applicable to your organisation's AI use.</p>
            <div className="select-wrapper" style=${{ ...selectWrapper(errors.regulatory), maxWidth: 400 }}>
              <select value=${form.regulatory} onChange=${e => setForm({ ...form, regulatory: e.target.value })} style=${{ ...f(errors.regulatory), cursor: "pointer", paddingRight: 38 }}>
                <option value="">Select jurisdiction...</option>
                <option value="EU-CA/ON">Canada / Ontario</option>
                <option value="EU-CAN/QU">Canada / Quebec</option>
                <option value="EU-CAN/OTHR">Canada / Other</option>
                <option value="USA-CA">USA – California</option>
                <option value="USA-IL">USA – Illinois</option>
                <option value="USA-A">USA – Framework A</option>
                <option value="USA-B">USA – Framework B</option>
                <option value="EU">EU (AI Act)</option>
              </select>
              <div className="dropdown-arrow" style=${selectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: "#9CA3AF" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            ${errors.regulatory && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.regulatory}</span>`}
          </div>
        </div>

        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: "32px", marginBottom: 20, boxShadow: B.shadow }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style=${{ width: 4, height: 20, background: B.red, borderRadius: 2 }} />
            <span style=${{ fontSize: 13, fontWeight: 700, color: B.black, letterSpacing: "0.06em" }}>III. MATURITY ASSESSMENT</span>
          </div>
          <div>
            <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Technological Maturity Level</label>
            <p style=${{ fontSize: 12, color: B.gray500, margin: "0 0 12px", lineHeight: 1.5 }}>What is your organisation's technological maturity? (1 = Generic → 5 = Very sophisticated)</p>
            <div className="select-wrapper" style=${{ ...selectWrapper(errors.techMaturity), maxWidth: 320 }}>
              <select value=${form.techMaturity} onChange=${e => setForm({ ...form, techMaturity: e.target.value })} style=${{ ...f(errors.techMaturity), cursor: "pointer", paddingRight: 38 }}>
                <option value="">Select level...</option>
                <option value="1">1 – Generic</option>
                <option value="2">2 – Good</option>
                <option value="3">3 – Strong</option>
                <option value="4">4 – Advanced</option>
                <option value="5">5 – Very Sophisticated</option>
              </select>
              <div className="dropdown-arrow" style=${selectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: "#9CA3AF" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            ${errors.techMaturity && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.techMaturity}</span>`}
          </div>
        </div>

        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: "32px", boxShadow: B.shadow }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style=${{ width: 4, height: 20, background: B.blue, borderRadius: 2 }} />
            <span style=${{ fontSize: 13, fontWeight: 700, color: B.black, letterSpacing: "0.06em" }}>AI INVENTORY</span>
          </div>
          <p style=${{ color: B.gray500, fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>Describe how your organisation uses AI. Our system will automatically suggest the best Use Case categories.</p>

          ${errors.inventory && html`
            <div style=${{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7, padding: "10px 12px", color: B.red, fontSize: 13, marginBottom: 16 }}>
              ${errors.inventory}
            </div>
          `}

          <div style=${{ display: "flex", flexDirection: "column", gap: 16 }}>
            ${inventory.map((item, i) => html`
              <div key=${i} style=${{
                background: B.gray50, border: `1px solid ${B.border}`, borderRadius: 10, padding: "20px"
              }}>
                <div style=${{ fontSize: 12, fontWeight: 700, color: i === 0 ? B.red : B.blue, marginBottom: 14, letterSpacing: "0.08em" }}>
                  AI USAGE DESCRIPTION ${i + 1}${i === 0 ? " *" : " (optional)"}
                </div>
                <div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style=${{ fontSize: 12, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 5 }}>What does this AI do?</label>
                    <input value=${item.description} onChange=${e => upd(i, "description", e.target.value)}
                      placeholder="e.g. We use a chatbot for customer support..."
                      style=${{ ...f(false), background: B.white }} />
                  </div>
                  <div>
                    <label style=${{ fontSize: 12, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 5 }}>Mapped Use Case</label>
                    <div className="select-wrapper" style=${selectWrapper(false)}>
                      <select value=${item.useCase} onChange=${e => upd(i, "useCase", e.target.value)}
                        style=${{ ...f(false), background: B.white, cursor: "pointer", paddingRight: 38 }}>
                        <option value="">Select type...</option>
                        ${AI_USE_CASES.map(uc => html`<option key=${uc} value=${uc}>${uc}</option>`)}
                      </select>
                      <div className="dropdown-arrow" style=${selectArrow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: "#9CA3AF" }}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `)}
          </div>
          
          <button onClick=${() => setInventory([...inventory, { description: "", useCase: "" }])}
            style=${{
              marginTop: 16, background: "none", border: `1.5px dashed ${B.blue}`, borderRadius: 10,
              color: B.blue, padding: "12px", width: "100%", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s"
            }}
            onMouseEnter=${e => { e.currentTarget.style.background = `${B.blue}08`; }}
            onMouseLeave=${e => { e.currentTarget.style.background = "none"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Another AI Usage
          </button>
        </div>
        
        <div style=${{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
          <button onClick=${() => {
            if (validate()) {
              const cleanedInventory = inventory.filter(i => i.description.trim() && i.useCase);
              onNext({ ...form, inventory: cleanedInventory });
            }
          }}
            style=${{
              padding: "13px 36px", background: B.red, border: "none", borderRadius: 8,
              color: B.white, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em"
            }}>
            Continue to Team Selection →
          </button>
        </div>
      </div>
    </div>
  `;
}
