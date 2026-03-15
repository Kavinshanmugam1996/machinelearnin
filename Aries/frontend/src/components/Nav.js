import React from 'react';
import htm from 'htm';
import { BizcomLogo } from './BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';
import { api } from '../services/api.js';

const html = htm.bind(React.createElement);

const { useState, useEffect } = React;

export function Nav({ steps, current, clients = [], activeClientId, onSwitchClient, onLogout, onHome }) {
  const [confirmingId, setConfirmingId] = useState(null);

  const handleDelete = async (e, client) => {
    e.stopPropagation();
    console.log("[AIRES] Nav handleDelete triggered for:", client.id, client.name);
    
    // Step 1: Show confirmation state if not already confirming
    if (confirmingId !== client.id) {
      setConfirmingId(client.id);
      return;
    }

    // Step 2: Proceed with deletion
    try {
      const token = localStorage.getItem("AIRES_token");
      if (!token) {
        console.error("Error: No authentication token found. Please logout and login again.");
        return;
      }

      console.log("[AIRES] Nav calling API to delete...", client.id);
      const _api = (window.api || api);
      const res = await _api.deleteAssessment(token, client.id);
      console.log("[AIRES] Nav Delete response:", res);
      
      // Clear confirmation
      setConfirmingId(null);
      
      if (res && res.status === "success") {
        onHome();
      } else {
        console.error("Failed to delete assessment. Server responded with an error.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(() => {
    // Show welcome modal on first visit only if clients exist
    const hasVisited = localStorage.getItem('aires_visited');
    return !hasVisited && clients.length > 0;
  });
  
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Mark that user has visited after first render
    if (showFirstTimeModal) {
      localStorage.setItem('aires_visited', 'true');
    }
    
    // Responsive handling
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const activeClient = clients.find(c => c.id === activeClientId);

  // Simple sanitization function for user input (client name)
  function sanitizeInput(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }

  // Escape output for display
  function escapeOutput(str) {
    return typeof str === "string" ? sanitizeInput(str) : str;
  }

  const [newClientName, setNewClientName] = useState("");
  const [createError, setCreateError] = useState("");

  return html`
    <nav style=${{
      background: B.white, borderBottom: `1px solid ${B.border}`,
      padding: "0 40px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 90,
      position: "sticky", top: 0, zIndex: 1000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
    }}>
      <div
        onClick=${onHome}
        style=${{ display: "flex", alignItems: "center", gap: 24, cursor: onHome ? "pointer" : "default" }}
      >
        <${BizcomLogo} size=${56} />
        <div style=${{ width: 1, height: 40, background: B.border }} />
        <div style=${{ display: "flex", flexDirection: "column" }}>
          <div style=${{ fontSize: 20, fontWeight: 900, color: B.black, letterSpacing: "-0.5px", lineHeight: 1, fontFamily: DISPLAY }}>
            AIRES™
          </div>
          <div style=${{ fontSize: 12, fontWeight: 700, color: B.red, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 4 }}>
            Risk Profiler
          </div>
        </div>
      </div>

      ${steps ? html`
        <div style=${{ display: "flex", alignItems: "center", gap: 0 }}>
          ${steps.map((s, i) => html`
            <div key=${s} style=${{ display: "flex", alignItems: "center" }}>
              <div style=${{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px" }}>
                <div style=${{
                  width: 24, height: 24, borderRadius: "50%",
                  background: i < current ? B.red : (i === current ? B.red : B.white),
                  border: `2px solid ${i <= current ? B.red : B.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  color: i <= current ? B.white : B.gray400,
                  boxShadow: i === current ? `0 0 10px ${B.red}44` : "none"
                }}>
                  ${i < current ? "✓" : i + 1}
                </div>
                <span style=${{
                  fontSize: 12, fontWeight: i === current ? 700 : 500,
                  color: i === current ? B.black : B.gray400,
                  display: width < 1000 && i !== current ? "none" : "block"
                }}>${s}</span>
              </div>
              ${i < steps.length - 1 && html`
                <div style=${{ width: 32, height: 2, background: i < current ? B.red : B.border, borderRadius: 1 }} />
              `}
            </div>
          `)}
        </div>
      ` : null}

      <div style=${{ position: "relative" }}>
        <button
          onClick=${() => setShowDropdown(!showDropdown)}
          style=${{
            display: "flex", alignItems: "center", gap: 8, background: B.gray50,
            border: `1px solid ${B.border}`, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <div style=${{ width: 24, height: 24, borderRadius: "50%", background: B.red, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>
            ${String(activeClient?.name?.[0] || "A")}
          </div>
          <span style=${{ fontSize: 13, fontWeight: 600, color: B.black }}>${String(activeClient?.name || "Initialising...")}</span>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ transform: showDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        ${showDropdown && html`
          <div>
            <div style=${{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick=${() => setShowDropdown(false)} />
            <div style=${{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
              background: "white", borderRadius: 12, padding: "8px", zIndex: 1001,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: `1px solid ${B.border}`
            }}>
              <div style=${{ padding: "8px 12px 12px", borderBottom: `1px solid ${B.border}`, marginBottom: 8 }}>
                <div style=${{ fontSize: 11, fontWeight: 700, color: B.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Assessing Client</div>
                <div style=${{ fontSize: 14, fontWeight: 700, color: B.black }}>${String(activeClient?.name || "None Selected")}</div>
              </div>

              <div style=${{ maxHeight: 200, overflowY: "auto" }}>
                ${clients.map(c => html`
                  <div key=${c.id} onClick=${() => { onSwitchClient(c.id); setShowDropdown(false); }} style=${{
                    width: "100%", padding: "10px 12px", textAlign: "left", background: c.id === activeClientId ? B.gray50 : "none",
                    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: c.id === activeClientId ? 700 : 500,
                    display: "flex", alignItems: "center", gap: 10, color: c.id === activeClientId ? B.blue : B.gray700,
                    boxSizing: "border-box"
                  }}>
                    <div style=${{ width: 8, height: 8, borderRadius: "50%", background: c.id === activeClientId ? B.blue : B.gray300 }} />
                    <span style=${{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${c.name}</span>
                    <div style=${{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                     <div style=${{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: c.progress === 100 ? "#DCFCE7" : B.gray50, color: c.progress === 100 ? "#16A34A" : B.gray700 }}>
                       ${c.progress === 100 ? "COMPLETED" : "IN PROGRESS"}
                     </div>
                      <div style=${{ display: "flex", alignItems: "center", gap: 8 }}>
                        ${confirmingId === c.id ? html`
                          <div style=${{ display: "flex", gap: 4 }}>
                            <button onClick=${(e) => { e.stopPropagation(); setConfirmingId(null); }} style=${{ background: B.gray100, border: "none", color: B.gray700, padding: "3px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>NO</button>
                            <button onClick=${(e) => handleDelete(e, c)} style=${{ background: B.red, border: "none", color: "white", padding: "3px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>YES</button>
                          </div>
                        ` : html`
                          <button onClick=${(e) => handleDelete(e, c)} style=${{ 
                            background: "transparent", border: "none", cursor: "pointer", 
                            color: B.gray400, padding: "4px", display: "flex", alignItems: "center", 
                            justifyContent: "center", transition: "color 0.2s",
                            opacity: 0.6
                          }} onMouseEnter=${(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = B.red; }} onMouseLeave=${(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = B.gray400; }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style=${{ pointerEvents: "none" }}>
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        `}
                      </div>
                    </div>
                  </div>
                `)}
              </div>

              <div style=${{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${B.border}` }}>
                <button onClick=${() => {
                  onSwitchClient("new", "New Assessment");
                  setShowDropdown(false);
                }} style=${{
                  width: "100%", padding: "10px 12px", textAlign: "left", background: "none",
                  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 10, color: B.red
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-7-7v14" />
                  </svg>
                  New Assessment
                </button>
                <button onClick=${onLogout} style=${{
                  width: "100%", padding: "10px 12px", textAlign: "left", background: "none",
                  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 10, color: B.gray500
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    </nav>

    ${showFirstTimeModal && html`
      <div style=${{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
        <div style=${{
          background: "white", borderRadius: 16, padding: "24px", width: "90%", maxWidth: 300,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: `1px solid ${B.border}`
        }}>
          <div style=${{ marginBottom: 20 }}>
            <div style=${{ fontSize: 16, fontWeight: 900, color: B.black, marginBottom: 4 }}>Welcome to AIRES™</div>
            <div style=${{ fontSize: 13, fontWeight: 500, color: B.gray600 }}>Select or create an assessment to begin</div>
          </div>

          <div style=${{ maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
            ${clients.length > 0 ? html`
              ${clients.map(c => html`
                <button key=${c.id} onClick=${() => { onSwitchClient(c.id); setShowFirstTimeModal(false); }} style=${{
                  width: "100%", padding: "12px", textAlign: "left", background: c.id === activeClientId ? B.gray50 : "none",
                  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: c.id === activeClientId ? 700 : 500,
                  display: "flex", alignItems: "center", gap: 10, color: c.id === activeClientId ? B.blue : B.gray700,
                  marginBottom: 6
                }}>
                  <div style=${{ width: 10, height: 10, borderRadius: "50%", background: c.id === activeClientId ? B.blue : B.gray300 }} />
                  ${String(escapeOutput(c.name))}
                </button>
              `)}
            ` : html`
              <div style=${{ padding: "16px", textAlign: "center", color: B.gray400, fontSize: 12 }}>No assessments yet</div>
            `}
          </div>

          <div style=${{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style=${{ display: "flex", gap: 8, marginBottom: 4 }}>
              <input
                type="text"
                value=${newClientName}
                onChange=${e => { setNewClientName(e.target.value); setCreateError(""); }}
                placeholder="Enter Client Name"
                style=${{
                  flex: 1,
                  padding: "10px 12px",
                  border: `1px solid ${B.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: B.black,
                  background: "#F9FAFB"
                }}
              />
              <button
                onClick=${() => {
                  const sanitized = sanitizeInput(newClientName.trim());
                  if (!sanitized) {
                    setCreateError("Client name required");
                    return;
                  }
                  onSwitchClient("new", sanitized);
                  setShowFirstTimeModal(false);
                  setNewClientName("");
                }}
                style=${{
                  background: B.red,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "white",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7v14" />
                </svg>
                Create
              </button>
            </div>
            ${createError && html`<div style=${{ color: B.red, fontSize: 12, marginBottom: 4 }}>${createError}</div>`}
            ${clients.length > 0 && html`
              <button onClick=${() => setShowFirstTimeModal(false)} style=${{
                width: "100%", padding: "10px 12px", background: "none", border: `1px solid ${B.border}`,
                borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: B.gray600, transition: "all 0.2s"
              }}>
                Skip for Now
              </button>
            `}
          </div>
        </div>
      </div>
    `}
  `;
}

