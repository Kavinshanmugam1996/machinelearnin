import React from 'react';
import htm from 'htm';
import { BizcomLogo } from './BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);

const { useState, useEffect } = React;

export function Nav({ steps, current, clients = [], activeClientId, onSwitchClient, onLogout, onHome }) {
  const [showMenu, setShowMenu] = useState(false);
  const activeClient = clients.find(c => c.id === activeClientId);

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
          <div style=${{ fontSize: 20, fontWeight: 900, color: B.black, letterSpacing: "-0.5px", lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                  display: window.innerWidth < 1000 && i !== current ? "none" : "block"
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
          onClick=${() => setShowMenu(!showMenu)}
          style=${{
            display: "flex", alignItems: "center", gap: 8, background: B.gray50,
            border: `1px solid ${B.border}`, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <div style=${{ width: 24, height: 24, borderRadius: "50%", background: B.red, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>
            ${activeClient?.name?.[0] || "A"}
          </div>
          <span style=${{ fontSize: 13, fontWeight: 600, color: B.black }}>${activeClient?.name || "Initialising..."}</span>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ transform: showMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        ${showMenu && html`
          <div>
            <div style=${{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick=${() => setShowMenu(false)} />
            <div style=${{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
              background: "white", borderRadius: 12, padding: "8px", zIndex: 1001,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: `1px solid ${B.border}`
            }}>
              <div style=${{ padding: "8px 12px 12px", borderBottom: `1px solid ${B.border}`, marginBottom: 8 }}>
                <div style=${{ fontSize: 11, fontWeight: 700, color: B.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Assessing Client</div>
                <div style=${{ fontSize: 14, fontWeight: 700, color: B.black }}>${activeClient?.name || "None Selected"}</div>
              </div>

              <div style=${{ maxHeight: 200, overflowY: "auto" }}>
                ${clients.map(c => html`
                  <button key=${c.id} onClick=${() => { onSwitchClient(c.id); setShowMenu(false); }} style=${{
                    width: "100%", padding: "10px 12px", textAlign: "left", background: c.id === activeClientId ? B.gray50 : "none",
                    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: c.id === activeClientId ? 700 : 500,
                    display: "flex", alignItems: "center", gap: 10, color: c.id === activeClientId ? B.blue : B.gray700
                  }}>
                    <div style=${{ width: 8, height: 8, borderRadius: "50%", background: c.id === activeClientId ? B.blue : B.gray300 }} />
                    ${c.name}
                  </button>
                `)}
              </div>

              <div style=${{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${B.border}` }}>
                <button onClick=${() => {
                  const name = prompt("Enter Client Name:");
                  if (name) onSwitchClient("new", name);
                  setShowMenu(false);
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
  `;
}
