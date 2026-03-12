import React from 'react';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

export function LandingPage({ onBegin, onResume, hasSaved, clients, activeClientId, onSwitchClient, onLogout, onHome }) {
  const stats = [
    { val: "500+", label: "Questions" },
    { val: "1000+", label: "Risks Mapped" },
    { val: "3+", label: "Frameworks" },
  ];

  return html`
    <div style=${{ minHeight: "100vh", background: B.white, fontFamily: BODY }}>
      <${Nav} clients=${clients} activeClientId=${activeClientId} onSwitchClient=${onSwitchClient} onLogout=${onLogout} onHome=${onHome} />
      
      <div style=${{
        background: `linear-gradient(170deg, #0D1F3C 0%, #1a3a6e 55%, #0D1F3C 100%)`,
        padding: "80px 40px 100px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style=${{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,155,200,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="hero-glow" style=${{ top: "0%", left: "10%", width: "40vh", height: "40vh", background: "rgba(59, 155, 200, 0.2)", animationDuration: "12s" }} />
        <div className="hero-glow" style=${{ bottom: "10%", right: "10%", width: "50vh", height: "50vh", background: "rgba(200, 24, 30, 0.15)", animationDuration: "16s", animationDelay: "-3s" }} />

        <div style=${{ position: "relative", zIndex: 10, width: "100%", maxWidth: "none", margin: "0", padding: "80px 40px", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 30px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style=${{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(200,24,30,0.1)", border: "1px solid rgba(200,24,30,0.3)",
            borderRadius: 100, padding: "8px 20px", marginBottom: 32
          }}>
            <div style=${{ width: 8, height: 8, borderRadius: "50%", background: B.red, boxShadow: `0 0 10px ${B.red}` }} />
            <span style=${{ color: "#FCA5A5", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI GOVERNANCE DIAGNOSTIC</span>
          </div>

          <h1 style=${{ color: B.white, fontSize: 64, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1px", lineHeight: 1.1, fontFamily: DISPLAY }}>
            Assess AI Risks Today
          </h1>
          <h2 style=${{ background: "linear-gradient(90deg, #3B9BC8, #89C4E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 56, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-1px", lineHeight: 1.1, fontFamily: DISPLAY }}>
            Avoid AI Failures Tomorrow
          </h2>
          <p style=${{ color: "rgba(255,255,255,0.7)", maxWidth: 640, margin: "0 auto 48px", fontSize: 18, lineHeight: 1.6, fontWeight: 400 }}>
            Empower your organisation with a risk framework that is measurable, repeatable, and regulation-ready. Build AI that scales, excels, and is future-proof.
          </p>

          <div style=${{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 56, flexWrap: "wrap" }}>
            <button className="auth-btn" onClick=${() => { if (hasSaved && !confirm("Starting new will clear your previous progress. Continue?")) return; onBegin(); }} style=${{
              padding: "16px 40px", fontSize: 16, marginTop: 0,
              background: hasSaved ? "transparent" : B.red,
              border: hasSaved ? `1.5px solid ${B.red}` : "none",
              color: hasSaved ? B.red : B.white
            }}>
              ${hasSaved ? "START NEW ASSESSMENT" : "START AIRES™ AI RISK MAP →"}
            </button>
            ${hasSaved && html`
              <button className="auth-btn" onClick=${onResume} style=${{
                padding: "16px 40px", fontSize: 16, marginTop: 0
              }}>
                CONTINUE ASSESSMENT →
              </button>
            `}
          </div>

          <div style=${{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
            ${stats.map((s, i) => html`
              <div key=${s.val} style=${{
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: "20px 32px",
                minWidth: 160,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                cursor: "default"
              }}>
                <div style=${{
                  fontSize: 36,
                  fontWeight: 800,
                  background: i === 0 ? "linear-gradient(90deg, #FCA5A5, #C8181E)" : i === 1 ? "linear-gradient(90deg, #89C4E1, #3B9BC8)" : "linear-gradient(90deg, #E2E4E9, #FFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: DISPLAY,
                  lineHeight: 1
                }}>${s.val}</div>
                <div style=${{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 8, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>${s.label}</div>
              </div>
            `)}
          </div>
        </div>
      </div>

      <div style=${{ padding: "80px 40px", background: B.white }}>
        <div style=${{ maxWidth: 1100, margin: "0 auto" }}>
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <div style=${{ fontSize: 12, fontWeight: 700, color: B.blue, letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>CONTROL CENTER</div>
              <h3 style=${{ fontSize: 30, fontWeight: 800, color: B.black, margin: 0, letterSpacing: "-0.3px", fontFamily: DISPLAY }}>Client Assessment Portfolio</h3>
            </div>
            <button onClick=${onBegin} style=${{ background: B.blue, color: B.white, border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: B.shadowMd }}>
              + ADD NEW CLIENT
            </button>
          </div>

          <div style=${{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            ${clients.map(client => html`
              <div key=${client.id} onClick=${() => onSwitchClient(client.id)} style=${{ 
                background: B.white, border: `1px solid ${B.border}`, borderRadius: 16, padding: 24, 
                cursor: "pointer", transition: "all 0.2s ease", position: "relative",
                boxShadow: activeClientId === client.id ? B.shadowMd : "none",
                borderColor: activeClientId === client.id ? B.blue : B.border
              }}>
                <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                   <div style=${{ fontSize: 12, fontWeight: 700, color: B.gray400 }}>ID: ${client.id.slice(0, 8)}...</div>
                   <div style=${{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: B.gray50, color: B.gray700 }}>ACTIVE</div>
                </div>
                <div style=${{ fontSize: 18, fontWeight: 800, color: B.black, marginBottom: 8, fontFamily: DISPLAY }}>${client.name}</div>
                <div style=${{ fontSize: 14, color: B.gray500, marginBottom: 20 }}>Enterprise Risk Assessment Profile</div>
                
                <div style=${{ borderTop: `1px solid ${B.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style=${{ fontSize: 12, fontWeight: 700, color: B.blue }}>VIEW ANALYSIS →</span>
                   ${activeClientId === client.id && html`<div style=${{ width: 8, height: 8, borderRadius: "50%", background: B.blue, boxShadow: `0 0 8px ${B.blue}` }} />`}
                </div>
              </div>
            `)}
            ${clients.length === 0 && html`
              <div style=${{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", background: B.gray50, borderRadius: 16, border: `2px dashed ${B.border}` }}>
                <div style=${{ color: B.gray400, fontSize: 16, fontWeight: 400 }}>No active assessments found. Get started by adding your first client.</div>
              </div>
            `}
          </div>
        </div>
      </div>

      <div style=${{ padding: "80px 40px", background: B.gray50 }}>
        <div style=${{ textAlign: "center", marginBottom: 48 }}>
          <div style=${{ fontSize: 12, fontWeight: 700, color: B.red, letterSpacing: "0.12em", marginBottom: 10 }}>ASSESSMENT FRAMEWORK</div>
          <h3 style=${{ fontSize: 30, fontWeight: 800, color: B.black, margin: 0, letterSpacing: "-0.3px", fontFamily: DISPLAY }}>Four Pillars of Governance</h3>
        </div>
        <div style=${{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          ${[
            { n: "01", t: "Company Profile", d: "Tell us about your organisation, industry, and the assessor." },
            { n: "02", t: "AI Inventory", d: "Tell us about your AI use cases." },
            { n: "03", t: "Targeted Questions", d: "Answer only questions relevant to your AI risks." },
            { n: "04", t: "Risk Insight", d: "Receive an automated risk profile with remediation roadmaps." },
          ].map((s, i) => html`
            <div key=${s.n} style=${{
              background: B.white, border: `1px solid ${B.border}`, borderRadius: 16,
              padding: "32px 28px", position: "relative", overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)", transition: "transform 0.2s ease", cursor: "default"
            }}>
              <div style=${{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: i === 0 ? B.red : i === 1 ? B.blue : i === 2 ? B.blueDark : B.gray900 }} />
              <div style=${{ fontSize: 40, fontWeight: 800, color: i === 0 ? B.red : i === 1 ? B.blue : i === 2 ? B.blueDark : B.gray900, marginBottom: 16, fontFamily: DISPLAY, letterSpacing: "-1px", opacity: 0.85 }}>${s.n}</div>
              <div style=${{ fontWeight: 800, fontSize: 18, color: B.black, marginBottom: 12, fontFamily: DISPLAY, letterSpacing: "-0.5px" }}>${s.t}</div>
              <div style=${{ fontSize: 14, color: B.gray500, lineHeight: 1.6, fontWeight: 400 }}>${s.d}</div>
            </div>
          `)}
        </div>
      </div>

      <footer style=${{
        background: "#0D1F3C", padding: "24px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <img src="bizcom.jpg" style=${{ height: 32, width: "auto" }} alt="Bizcom" />
        <span style=${{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>© 2026 Bizcom · AI Governance Platform</span>
      </footer>
    </div>
  `;
}
