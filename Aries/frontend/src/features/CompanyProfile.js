import React from 'react';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY, AI_USE_CASES } from '../services/constants.js';

const { useState } = React;

export function CompanyProfile({ onNext, clients, activeClientId, onSwitchClient, onLogout, onHome }) {
  const [form, setForm] = useState({ companyName: "", industry: "", companySize: "", regulatory: "", techMaturity: "" });
  const [inventory, setInventory] = useState([
    { description: "", useCase: "" },
    { description: "", useCase: "" },
    { description: "", useCase: "" },
  ]);
  const [errors, setErrors] = useState({});

  const f = (err) => ({
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${err ? B.red : B.border}`,
    borderRadius: 8, fontSize: 14, color: B.black, background: B.white,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    appearance: "none", WebkitAppearance: "none"
  });

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.industry) e.industry = "Required";
    if (!form.companySize) e.companySize = "Required";
    if (!form.regulatory) e.regulatory = "Required";
    if (!inventory.some(i => i.useCase)) e.inventory = "Select at least one AI use case";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const upd = (i, k, v) => { const n = [...inventory]; n[i] = { ...n[i], [k]: v }; setInventory(n); };

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY }}>
      <${Nav}
        steps=${["Company Profile", "AI Inventory", "Questions", "Complete"]}
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
                <select value=${form.industry} onChange=${e => setForm({ ...form, industry: e.target.value })} style=${{ ...f(errors.industry), cursor: "pointer" }}>
                  <option value="">Select industry...</option>
                  ${["Healthcare", "Banking", "Retail", "E-Commerce", "Education", "Other"].map(i => html`<option key=${i}>${i}</option>`)}
                </select>
                ${errors.industry && html`<span style=${{ fontSize: 12, color: B.red, marginTop: 4, display: "block" }}>${errors.industry}</span>`}
              </div>
              <div>
                <label style=${{ fontSize: 13, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 6 }}>Company Size *</label>
                <select value=${form.companySize} onChange=${e => setForm({ ...form, companySize: e.target.value })} style=${{ ...f(errors.companySize), cursor: "pointer" }}>
                  <option value="">Select size...</option>
                  <option value="small">Small (1–100 employees)</option>
                  <option value="medium">Medium (100–1,000 employees)</option>
                  <option value="large">Large (1,000–2,500 employees)</option>
                  <option value="enterprise">Enterprise (2,500+ employees)</option>
                </select>
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
            <select value=${form.regulatory} onChange=${e => setForm({ ...form, regulatory: e.target.value })} style=${{ ...f(errors.regulatory), cursor: "pointer", maxWidth: 400 }}>
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
            <select value=${form.techMaturity} onChange=${e => setForm({ ...form, techMaturity: e.target.value })} style=${{ ...f(errors.techMaturity), cursor: "pointer", maxWidth: 320 }}>
              <option value="">Select level...</option>
              <option value="1">1 – Generic</option>
              <option value="2">2 – Good</option>
              <option value="3">3 – Strong</option>
              <option value="4">4 – Advanced</option>
              <option value="5">5 – Very Sophisticated</option>
            </select>
          </div>
        </div>

        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: "32px", boxShadow: B.shadow }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style=${{ width: 4, height: 20, background: B.blue, borderRadius: 2 }} />
            <span style=${{ fontSize: 13, fontWeight: 700, color: B.black, letterSpacing: "0.06em" }}>AI INVENTORY</span>
          </div>
          <p style=${{ color: B.gray500, fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>Describe how your organisation uses AI. Each entry drives targeted questions for your assessment.</p>

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
                  AI USE CASE ${i + 1}${i === 0 ? " *" : " (optional)"}
                </div>
                <div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style=${{ fontSize: 12, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 5 }}>Description</label>
                    <input value=${item.description} onChange=${e => upd(i, "description", e.target.value)}
                      placeholder="Briefly describe how your organisation uses this AI..."
                      style=${{ ...f(false), background: B.white }} />
                  </div>
                  <div>
                    <label style=${{ fontSize: 12, fontWeight: 600, color: B.gray700, display: "block", marginBottom: 5 }}>Use Case Type</label>
                    <select value=${item.useCase} onChange=${e => upd(i, "useCase", e.target.value)}
                      style=${{ ...f(false), background: B.white, cursor: "pointer" }}>
                      <option value="">Select type...</option>
                      ${AI_USE_CASES.map(uc => html`<option key=${uc} value=${uc}>${uc}</option>`)}
                    </select>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div style=${{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
          <button onClick=${() => validate() && onNext({ ...form, inventory: inventory.filter(i => i.useCase) })}
            style=${{
              padding: "13px 36px", background: B.red, border: "none", borderRadius: 8,
              color: B.white, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em"
            }}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  `;
}
