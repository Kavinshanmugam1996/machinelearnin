import React from 'react';
import htm from 'htm';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);
const { useState } = React;

export function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const doForgotPassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Password reset link sent! Check your email.");
        setEmail("");
      } else {
        setError(data.detail || "Failed to send reset link");
      }
    } catch (err) {
      setError("Network error: Please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      doForgotPassword();
    }
  };

  return html`
    <div style=${{
      minHeight: "100vh", background: B.gray50,
      display: "flex", fontFamily: BODY
    }}>
      <div style=${{
        width: "48%", background: "linear-gradient(145deg, #0A0F1D 0%, #112240 50%, #0A0F1D 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "64px 72px", position: "relative", overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset -10px 0 20px rgba(0,0,0,0.2)"
      }}>
        <div className="hero-glow" style=${{ top: "-10%", left: "-10%", width: "60vh", height: "60vh", background: "rgba(59, 155, 200, 0.15)", animationDuration: "15s" }} />
        <div className="hero-glow" style=${{ bottom: "-20%", right: "-10%", width: "70vh", height: "70vh", background: "rgba(200, 24, 30, 0.1)", animationDuration: "18s", animationDelay: "-5s" }} />

        <div style=${{ position: "relative", zIndex: 1 }}>
          <div style=${{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 40 }}>
            <div style=${{ width: 8, height: 8, borderRadius: "50%", background: B.blue, boxShadow: `0 0 10px ${B.blue}` }} />
            <span style=${{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Secure Recovery</span>
          </div>
        </div>

        <div style=${{ position: "relative", zIndex: 1, marginTop: "auto", marginBottom: "80px" }}>
          <h1 style=${{ color: B.white, fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1px", fontFamily: DISPLAY }}>
            Reset Your<br />
            <span style=${{ background: "linear-gradient(90deg, #3B9BC8, #89C4E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Password</span>
          </h1>
          <p style=${{ color: "rgba(255,255,255,0.65)", fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 440, fontWeight: 400 }}>
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </div>

        <div style=${{ position: "relative", zIndex: 1 }}>
          <${BizcomLogo} />
        </div>
      </div>

      <div style=${{
        width: "52%", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 48px", background: "white"
      }}>
        <div style=${{ width: "100%", maxWidth: 460 }}>
          <div style=${{ marginBottom: 48 }}>
            <h2 style=${{ fontSize: 36, fontWeight: 900, color: B.black, margin: "0 0 12px", fontFamily: DISPLAY }}>Forgot Password</h2>
            <p style=${{ fontSize: 15, color: B.gray600, margin: 0, fontWeight: 500 }}>
              We'll send you reset instructions
            </p>
          </div>

          ${error ? html`
            <div style=${{ background: "#FEE", border: "1px solid #FCC", padding: "14px 18px", borderRadius: 10, marginBottom: 24, color: "#C33", fontSize: 14, fontWeight: 600 }}>
              ⚠️ ${error}
            </div>
          ` : null}

          ${success ? html`
            <div style=${{ background: "#E7F7ED", border: "1px solid #C3E6CB", padding: "14px 18px", borderRadius: 10, marginBottom: 24, color: "#155724", fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
              ✓ ${success}
              <div style=${{ fontSize: 12, marginTop: 8, fontWeight: 500 }}>
                The link will expire in 1 hour.
              </div>
            </div>
          ` : null}

          <div style=${{ marginBottom: 32 }}>
            <label style=${{ display: "block", fontSize: 13, fontWeight: 700, color: B.gray700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input
              type="email"
              value=${email}
              onInput=${e => setEmail(e.target.value)}
              onKeyDown=${handleKeyDown}
              placeholder="you@company.com"
              style=${{
                width: "100%", padding: "14px 18px", border: `2px solid ${B.border}`,
                borderRadius: 10, fontSize: 15, fontFamily: BODY, transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              disabled=${loading || !!success}
            />
          </div>

          <button
            onClick=${doForgotPassword}
            disabled=${loading || !!success}
            className="auth-btn"
            style=${{
              width: "100%", padding: "16px", background: loading || success ? B.gray300 : B.blue,
              color: "white", border: "none", borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: loading || success ? "not-allowed" : "pointer",
              transition: "all 0.2s", fontFamily: BODY, marginBottom: 24
            }}
          >
            ${loading ? "Sending..." : success ? "Email Sent!" : "Send Reset Link"}
          </button>

          <div style=${{ textAlign: "center", fontSize: 14, color: B.gray600 }}>
            Remember your password?
            <button
              onClick=${onBack}
              style=${{
                background: "none", border: "none", color: B.blue, fontWeight: 700,
                cursor: "pointer", marginLeft: 6, textDecoration: "underline", fontFamily: BODY
              }}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
