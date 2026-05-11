import React from 'react';
import htm from 'htm';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);
const { useState, useEffect } = React;

export function VerifyEmail({ onSuccess }) {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const res = await fetch(`/api/verify-email?token=${token}`, {
          method: "GET"
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error: Please check your connection");
      }
    };

    verifyEmail();
  }, [onSuccess]);

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
            <span style=${{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Secure Verification</span>
          </div>
        </div>

        <div style=${{ position: "relative", zIndex: 1, marginTop: "auto", marginBottom: "80px" }}>
          <h1 style=${{ color: B.white, fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1px", fontFamily: DISPLAY }}>
            Email<br />
            <span style=${{ background: "linear-gradient(90deg, #3B9BC8, #89C4E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Verification</span>
          </h1>
          <p style=${{ color: "rgba(255,255,255,0.65)", fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 440, fontWeight: 400 }}>
            We're verifying your email address to activate your AIRES™ account.
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
        <div style=${{ width: "100%", maxWidth: 460, textAlign: "center" }}>
          ${status === "verifying" ? html`
            <div style=${{ marginBottom: 32 }}>
              <div style=${{
                width: 80, height: 80, margin: "0 auto 24px",
                border: `4px solid ${B.border}`,
                borderTopColor: B.blue,
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <h2 style=${{ fontSize: 28, fontWeight: 900, color: B.black, margin: "0 0 12px", fontFamily: DISPLAY }}>
                Verifying Email...
              </h2>
              <p style=${{ fontSize: 15, color: B.gray600, margin: 0, fontWeight: 500 }}>
                Please wait while we verify your email address
              </p>
            </div>
          ` : null}

          ${status === "success" ? html`
            <div style=${{ marginBottom: 32 }}>
              <div style=${{
                width: 80, height: 80, margin: "0 auto 24px",
                background: "#E7F7ED",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40
              }}>
                ✓
              </div>
              <h2 style=${{ fontSize: 28, fontWeight: 900, color: B.black, margin: "0 0 12px", fontFamily: DISPLAY }}>
                Email Verified!
              </h2>
              <p style=${{ fontSize: 15, color: B.gray600, margin: "0 0 24px", fontWeight: 500 }}>
                ${message}
              </p>
              <div style=${{ background: "#E7F7ED", border: "1px solid #C3E6CB", padding: "14px 18px", borderRadius: 10, color: "#155724", fontSize: 14, fontWeight: 600 }}>
                Redirecting to login in 3 seconds...
              </div>
            </div>
          ` : null}

          ${status === "error" ? html`
            <div style=${{ marginBottom: 32 }}>
              <div style=${{
                width: 80, height: 80, margin: "0 auto 24px",
                background: "#FEE",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40
              }}>
                ⚠️
              </div>
              <h2 style=${{ fontSize: 28, fontWeight: 900, color: B.black, margin: "0 0 12px", fontFamily: DISPLAY }}>
                Verification Failed
              </h2>
              <div style=${{ background: "#FEE", border: "1px solid #FCC", padding: "14px 18px", borderRadius: 10, marginBottom: 24, color: "#C33", fontSize: 14, fontWeight: 600 }}>
                ${message}
              </div>
              <button
                onClick=${onSuccess}
                style=${{
                  padding: "14px 32px", background: B.blue, color: "white",
                  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: BODY
                }}
              >
                Return to Login
              </button>
            </div>
          ` : null}
        </div>
      </div>

      <style>
        ${`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  `;
}
