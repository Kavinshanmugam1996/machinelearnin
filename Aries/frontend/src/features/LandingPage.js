import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY } from '../services/constants.js';
import { api } from '../services/api.js';

const html = htm.bind(React.createElement);
console.log("[AIRES] LandingPage.js loaded - v1.0.2");

export function LandingPage({ onBegin, onResume, onResumeClient, hasSaved, clients, activeClientId, onSwitchClient, onLogout, onHome }) {
  const [confirmingId, setConfirmingId] = React.useState(null);

  const handleDelete = async (e, client) => {
    e.stopPropagation();
    console.log("[AIRES] handleDelete triggered for:", client.id, client.name);
    
    // Step 1: Show confirmation state if not already confirming
    if (confirmingId !== client.id) {
      setConfirmingId(client.id);
      return;
    }

    // Step 2: Proceed with deletion
    try {
      const token = localStorage.getItem("AIRES_token");
      if (!token) {
        console.error("Error: No authentication token found.");
        return;
      }

      console.log("[AIRES] LandingPage calling API to delete...", client.id);
      const _api = (window.api || api);
      const res = await _api.deleteAssessment(token, client.id);
      console.log("[AIRES] LandingPage Delete response:", res);
      
      // Clear confirmation
      setConfirmingId(null);

      if (res && res.status === "success") {
        onHome(); 
      } else {
        console.error("Failed to delete assessment.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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
        padding: "100px 40px", position: "relative", overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div className="hero-grid-bg" />
        <div className="hero-glow" style=${{ top: "-10%", left: "10%", width: "60vh", height: "60vh", background: "rgba(59, 155, 200, 0.15)", animationDuration: "15s" }} />
        <div className="hero-glow" style=${{ bottom: "-10%", right: "5%", width: "70vh", height: "70vh", background: "rgba(200, 24, 30, 0.12)", animationDuration: "20s", animationDelay: "-5s" }} />

        <div style=${{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto" }}>
          <div style=${{ 
            display: "grid", 
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", 
            gap: 64, 
            alignItems: "center",
            textAlign: "left"
          }}>
            <div>
              <div style=${{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(200,24,30,0.15)", border: "1px solid rgba(200,24,30,0.4)",
                borderRadius: 100, padding: "8px 24px", marginBottom: 32,
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)"
              }}>
                <div style=${{ width: 8, height: 8, borderRadius: "50%", background: B.red, boxShadow: `0 0 12px ${B.red}` }} />
                <span style=${{ color: "#FCA5A5", fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>AI GOVERNANCE DIAGNOSTIC</span>
              </div>

              <h1 style=${{ color: B.white, fontSize: 72, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.05, fontFamily: DISPLAY }}>
                Assess AI Risks <br/> <span style=${{ color: "#3B9BC8" }}>Today</span>
              </h1>
              <h2 style=${{ color: "rgba(255,255,255,0.9)", fontSize: 56, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.02em", lineHeight: 1.05, fontFamily: DISPLAY }}>
                Avoid Failures <br/> <span style=${{ background: "linear-gradient(90deg, #FCA5A5, #C8181E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tomorrow</span>
              </h2>
              <p style=${{ color: "rgba(255,255,255,0.6)", maxWidth: 540, margin: "0 0 48px", fontSize: 20, lineHeight: 1.6, fontWeight: 400 }}>
                Empower your organisation with a risk framework that is measurable, repeatable, and regulation-ready. Build AI that scales, excels, and is future-proof.
              </p>

              <div style=${{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <button className="auth-btn btn-glow" onClick=${() => { onBegin(); }} style=${{
                  padding: "18px 44px", fontSize: 16, marginTop: 0,
                  background: hasSaved ? "transparent" : B.red,
                  border: hasSaved ? `2px solid ${B.red}` : "none",
                  color: hasSaved ? B.red : B.white,
                  borderRadius: 12
                }}>
                  ${hasSaved ? "START NEW ASSESSMENT" : "START AIRES™ RISK MAP →"}
                </button>
                ${hasSaved && html`
                  <button className="auth-btn" onClick=${onResume} style=${{
                    padding: "18px 44px", fontSize: 16, marginTop: 0,
                    borderRadius: 12, background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)"
                  }}>
                    CONTINUE ASSESSMENT →
                  </button>
                `}
              </div>
            </div>

            <div style=${{ position: "relative" }}>
               <div className="glass-card" style=${{ padding: 32, position: "relative", overflow: "hidden" }}>
                  <div className="hero-visual-box">
                    <div className="digital-grid" />
                    <div className="hero-visual-line" />
                    ${[...Array(12)].map((_, i) => html`
                      <div className="data-particle" style=${{
                        '--startX': `${(Math.random() * 200) - 100}px`,
                        '--endX': `${(Math.random() * 200) - 100}px`,
                        '--duration': `${3 + Math.random() * 4}s`,
                        '--delay': `${Math.random() * -5}s`,
                        left: `${Math.random() * 100}%`
                      }} />
                    `)}
                    <div style=${{ textAlign: "center", zIndex: 10 }}>
                      <div className="aires-text-glow">AIRES</div>
                    </div>
                  </div>
                  
                  <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
                    ${stats.slice(0, 2).map((s, i) => html`
                      <div key=${s.val} className="stat-item" style=${{
                        padding: "20px", background: "rgba(255,255,255,0.03)", 
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
                        transition: "all 0.3s ease"
                      }}>
                        <div style=${{ 
                          fontSize: 28, fontWeight: 800, color: i === 0 ? "#FCA5A5" : "#89C4E1",
                          fontFamily: DISPLAY, lineHeight: 1 
                        }}>${s.val}</div>
                        <div style=${{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>${s.label}</div>
                      </div>
                    `)}
                  </div>
                  <div className="stat-item" style=${{
                    padding: "16px 20px", background: "rgba(255,255,255,0.03)", 
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
                    marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.3s ease"
                  }}>
                    <div style=${{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>${stats[2].label} Integrated</div>
                    <div style=${{ fontSize: 20, fontWeight: 800, color: B.white, fontFamily: DISPLAY }}>${stats[2].val}</div>
                  </div>
               </div>
            </div>
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

          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
            ${clients.filter(c => c.name !== "Default Client").map(client => html`
              <div key=${client.id} 
                onClick=${() => onResumeClient ? onResumeClient(client.id) : onSwitchClient(client.id)} 
                onMouseEnter=${(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = B.blue;
                }}
                onMouseLeave=${(e) => {
                  if (activeClientId !== client.id) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = B.border;
                  }
                }}
                style=${{ 
                  background: activeClientId === client.id ? B.white : "rgba(255,255,255,0.7)", 
                  border: `2px solid ${activeClientId === client.id ? B.blue : B.border}`, 
                  borderRadius: 24, 
                  padding: 32, 
                  cursor: "pointer", 
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
                  position: "relative",
                  boxShadow: activeClientId === client.id ? B.shadowMd : "none",
                  transform: activeClientId === client.id ? "translateY(-8px)" : "none",
                  backdropFilter: "blur(12px)"
                }}>
                
                <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                   <div style=${{ 
                     padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 800, 
                     background: B.gray100, color: B.gray500, letterSpacing: "0.05em" 
                   }}>
                     ID: ${String(client.id).slice(0, 8)}
                   </div>
                   <div style=${{ display: "flex", alignItems: "center", gap: 12 }}>
                     <div style=${{ 
                       padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 800, 
                       background: client.progress === 100 ? "#DCFCE7" : "#DBEAFE", 
                       color: client.progress === 100 ? "#16A34A" : B.blue,
                       letterSpacing: "0.05em"
                     }}>
                       ${client.progress === 100 ? "COMPLETED" : "IN ANALYSIS"}
                     </div>
                      <div style=${{ display: "flex", alignItems: "center", gap: 8 }}>
                        ${confirmingId === client.id ? html`
                          <div style=${{ display: "flex", gap: 6 }}>
                            <button onClick=${(e) => { e.stopPropagation(); setConfirmingId(null); }} style=${{ background: B.gray100, border: "none", color: B.gray700, padding: "6px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>CANCEL</button>
                            <button onClick=${(e) => handleDelete(e, client)} style=${{ background: B.red, border: "none", color: "white", padding: "6px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>SURE?</button>
                          </div>
                        ` : html`
                          <button onClick=${(e) => handleDelete(e, client)} style=${{ 
                            background: "transparent", border: "none", cursor: "pointer", 
                            color: B.gray300, padding: "6px", display: "flex", alignItems: "center", 
                            justifyContent: "center", transition: "all 0.2s"
                          }} onMouseEnter=${(e) => e.currentTarget.style.color = B.red} onMouseLeave=${(e) => e.currentTarget.style.color = B.gray300}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        `}
                      </div>
                   </div>
                </div>

                <div style=${{ fontSize: 22, fontWeight: 800, color: B.black, marginBottom: 8, fontFamily: DISPLAY, letterSpacing: "-0.5px" }}>
                  ${String(client.name)}
                </div>
                <div style=${{ fontSize: 14, color: B.gray500, marginBottom: 28, fontWeight: 500 }}>
                  Strategic AI Risk Assessment
                </div>
                
                <div style=${{ marginBottom: 24 }}>
                  <div style=${{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style=${{ fontSize: 12, fontWeight: 700, color: B.gray400, textTransform: "uppercase", letterSpacing: "0.05em" }}>Analysis Progress</span>
                    <span style=${{ fontSize: 12, fontWeight: 800, color: client.progress === 100 ? "#16A34A" : B.blue }}>${client.progress}%</span>
                  </div>
                  <div style=${{ height: 8, background: B.gray100, borderRadius: 4, overflow: "hidden" }}>
                    <div style=${{ width: `${client.progress}%`, height: "100%", background: client.progress === 100 ? "#16A34A" : B.blue, borderRadius: 4, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                </div>

                <div style=${{ borderTop: `1px solid ${B.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style=${{ fontSize: 13, fontWeight: 800, color: B.blue, letterSpacing: "0.02em" }}>
                     ${client.progress === 100 ? "VIEW RESULTS →" : "CONTINUE ANALYSIS →"}
                   </span>
                   ${activeClientId === client.id && html`
                     <div style=${{ width: 10, height: 10, borderRadius: "50%", background: B.blue, boxShadow: `0 0 12px ${B.blue}` }} />
                   `}
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
            { n: "01", t: "Company Profile", d: "Tell us about your organisation, industry, and AI inventory." },
            { n: "02", t: "Expert Teams", d: "Identify the departments and stakeholders for your assessment." },
            { n: "03", t: "Targeted Questions", d: "Answer only questions relevant to your specific AI risks." },
            { n: "04", t: "Risk Insight", d: "Receive a comprehensive risk profile and remediation roadmap." },
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
        <div style=${{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style=${{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>© 2026, Bizcom – Building AI Governance Frameworks for Tomorrow. All Rights Reserved.</span>
          <span style=${{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>v1.0.5-idle-timeout</span>
        </div>
      </footer>
    </div>
  `;
}
