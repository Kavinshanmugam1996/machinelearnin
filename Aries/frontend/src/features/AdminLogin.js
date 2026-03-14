import React from 'react';
import htm from 'htm';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);

const { useState } = React;

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("AIRES_token", data.access_token);
        onLogin();
      } else {
        const data = await res.json();
        setError(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
      }
    } catch (err) {
      setError("Network error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div style=${{
      minHeight: "100vh", background: B.gray50,
      display: "flex", flexDirection: window.innerWidth < 900 ? "column" : "row", fontFamily: BODY
    }}>
      <div style=${{
        width: window.innerWidth < 900 ? "100%" : "48%", 
        minHeight: window.innerWidth < 900 ? "auto" : "100vh",
        background: `linear-gradient(145deg, #0A0F1D 0%, #112240 50%, #0A0F1D 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: window.innerWidth < 600 ? "40px 32px" : "64px 72px", 
        position: "relative", overflow: "hidden",
        borderRight: window.innerWidth < 900 ? "none" : "1px solid rgba(255,255,255,0.05)",
        borderBottom: window.innerWidth < 900 ? "1px solid rgba(255,255,255,0.05)" : "none",
        boxShadow: "inset -10px 0 20px rgba(0,0,0,0.2)"
      }}>
        <div className="hero-glow" style=${{ top: "-10%", left: "-10%", width: "60vh", height: "60vh", background: "rgba(59, 155, 200, 0.15)", animationDuration: "15s" }} />
        <div className="hero-glow" style=${{ bottom: "-20%", right: "-10%", width: "70vh", height: "70vh", background: "rgba(200, 24, 30, 0.1) ", animationDuration: "18s", animationDelay: "-5s" }} />
        <div style=${{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "40px 40px", opacity: 0.5, pointerEvents: "none" }} />
        <div style=${{ position: "relative", zIndex: 1 }}>
          <div style=${{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 40 }}>
            <div style=${{ width: 8, height: 8, borderRadius: "50%", background: B.blue, boxShadow: `0 0 10px ${B.blue}` }} />
            <span style=${{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Enterprise Grade</span>
          </div>
        </div>
        <div style=${{ position: "relative", zIndex: 1, marginTop: window.innerWidth < 900 ? "40px" : "auto", marginBottom: window.innerWidth < 900 ? "40px" : "80px" }}>
          <h1 style=${{ color: B.white, fontSize: window.innerWidth < 600 ? 36 : 52, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1px", fontFamily: DISPLAY }}>
            Assess Risk.<br />Ensure Trust.<br />
            <span style=${{ background: "linear-gradient(90deg, #3B9BC8, #89C4E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Govern AI</span><br />
            with Confidence.
          </h1>
          <p style=${{ color: "rgba(255,255,255,0.65)", fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 440, fontWeight: 400 }}>
            Helping you with controls, risk management and regulatory challenges of AI today and tomorrow.
          </p>
        </div>
        <div style=${{ position: "relative", zIndex: 1 }}>
          <div style=${{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Built for Compliance</div>
          <div style=${{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            ${[
              { icon: "🛡", label: "ISO 42001" },
              { icon: "📋", label: "NIST RMF" },
              { icon: "⚖", label: "EU AI Act" },
            ].map((b, i) => html`
              <div key=${b.label} className="trust-badge" style=${{ animation: `float2 ${10 + i * 2}s ease-in-out infinite alternate`, minWidth: window.innerWidth < 600 ? "90px" : "110px" }}>
                <div style=${{ fontSize: 24, marginBottom: 8, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>${b.icon}</div>
                <div style=${{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>${b.label}</div>
              </div>
            `)}
          </div>
        </div>
      </div>
      <div style=${{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: window.innerWidth < 600 ? "24px" : "40px", background: "#f8f9fa", position: "relative"
      }}>
        <div style=${{ position: "absolute", top: "10%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(59,155,200,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div className="auth-card" style=${{ width: "100%", maxWidth: 440, position: "relative", zIndex: 10, padding: window.innerWidth < 600 ? "32px 24px" : "48px" }}>
          <div style=${{ marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style=${{ marginBottom: 24, display: "inline-flex" }}>
              <${BizcomLogo} size=${64} />
            </div>

            <h2 style=${{ fontSize: 28, fontWeight: 800, color: B.black, margin: "0 0 8px", letterSpacing: "-0.5px", textAlign: "center", fontFamily: DISPLAY }}>
              Welcome back
            </h2>
            <p style=${{ color: B.gray500, fontSize: 15, margin: 0, textAlign: "center" }}>Sign in to your admin account</p>
          </div>
          <div style=${{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label style=${{ fontSize: 13, fontWeight: 700, color: B.gray700, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
              <div style=${{ position: "relative" }}>
                <input
                  className=${`auth-input ${error ? 'error' : ''}`}
                  type="email" value=${email}
                  style=${{ paddingLeft: 44, boxSizing: "border-box" }}
                  onChange=${e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown=${e => e.key === "Enter" && doLogin()}
                  placeholder="Enter your email address"
                />
                <div style=${{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: B.gray400, pointerEvents: "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label style=${{ fontSize: 13, fontWeight: 700, color: B.gray700, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <div style=${{ position: "relative" }}>
                <input
                  className=${`auth-input ${error ? 'error' : ''}`}
                  type=${showPw ? "text" : "password"} value=${pw}
                  style=${{ paddingLeft: 44, paddingRight: 48, boxSizing: "border-box" }}
                  onChange=${e => { setPw(e.target.value); setError(""); }}
                  onKeyDown=${e => e.key === "Enter" && doLogin()}
                  placeholder="••••••••"
                />
                <div style=${{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: B.gray400 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <button 
                  onClick=${() => setShowPw(!showPw)}
                  style=${{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: B.gray400,
                    padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter=${e => e.target.style.color = B.blue}
                  onMouseLeave=${e => e.target.style.color = B.gray400}
                  type="button"
                >
                  ${showPw ? html`
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ` : html`
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  `}
                </button>
              </div>
            </div>
            ${error && html`
              <div style=${{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 12, padding: "14px", color: B.red, fontSize: 13,
                display: "flex", alignItems: "flex-start", gap: 10, marginTop: -4,
                lineHeight: 1.5
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                   <span style=${{ fontWeight: 800 }}>Login Failed:</span> ${error}
                </div>
              </div>
            `}
            <button
              className="auth-btn"
              onClick=${doLogin} disabled=${loading || !email || !pw}
              style=${{ height: 52, marginTop: 8 }}
            >
              ${loading ? "Verifying Credentials..." : html`
                <span style=${{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Sign In to AIRES 
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              `}
            </button>
            
            <div style=${{ marginTop: 16, textAlign: "center" }}>
              <p style=${{ fontSize: 13, color: B.gray500 }}>
                Don't have an admin account? <a href="#" style=${{ color: B.blue, fontWeight: 700, textDecoration: "none" }}>Contact IT Support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
