import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);

export function RiskReport({ profile, answers, questions, clients, activeClientId, onSwitchClient, onLogout, onHome }) {

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <${Nav} 
        steps=${["Profile", "Teams", "Questions", "Complete"]} 
        current=${3} 
        onHome=${onHome} 
        clients=${clients} 
        activeClientId=${activeClientId} 
        onSwitchClient=${onSwitchClient} 
        onLogout=${onLogout} 
      />

      <main style=${{ flex: 1, padding: "60px 24px", maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <div style=${{ 
          background: B.white, 
          border: `1px solid ${B.border}`, 
          borderRadius: 32, 
          padding: "80px 60px", 
          boxShadow: B.shadowLg,
          textAlign: "center",
          width: "100%",
          position: "relative",
          overflow: "hidden"
        }}>
          <!-- Decorative Top Gradient -->
          <div style=${{ 
            position: "absolute", top: 0, left: 0, right: 0, height: 8, 
            background: `linear-gradient(90deg, ${B.blue}, ${B.red})`,
            opacity: 0.8
          }} />

          <div style=${{ 
            width: 80, height: 80, background: "#F0FDF4", borderRadius: "50%", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 32px", color: "#16A34A",
            boxShadow: "0 0 0 8px #F0FDF4"
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          
          <h1 style=${{ fontSize: 36, fontWeight: 800, color: B.black, margin: "0 0 16px", fontFamily: DISPLAY, letterSpacing: "-1px" }}>
            Assessment Successfully Submitted
          </h1>
          <p style=${{ fontSize: 18, color: B.gray600, lineHeight: 1.6, margin: "0 auto 48px", maxWidth: 540 }}>
            Your data has been securely transmitted. Our AI Risk Experts will now perform a multi-dimensional analysis of your organization's risk profile.
          </p>

          <!-- "What's Next" Timeline -->
          <div style=${{ display: "flex", justifyContent: "space-between", maxWidth: 600, margin: "0 auto 60px", position: "relative" }}>
            <!-- Connector Line -->
            <div style=${{ position: "absolute", top: 22, left: 40, right: 40, height: 2, background: B.gray100, zIndex: 0 }} />
            
            <div style=${{ position: "relative", zIndex: 1, width: 120 }}>
              <div style=${{ width: 44, height: 44, borderRadius: "50%", background: B.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: "4px solid white" }}>
                <span style=${{ fontSize: 18 }}>🕵️</span>
              </div>
              <div style=${{ fontSize: 12, fontWeight: 800, color: B.black }}>Expert Review</div>
              <div style=${{ fontSize: 11, color: B.gray400, marginTop: 4 }}>In Progress</div>
            </div>

            <div style=${{ position: "relative", zIndex: 1, width: 120 }}>
              <div style=${{ width: 44, height: 44, borderRadius: "50%", background: B.gray100, color: B.gray400, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: "4px solid white" }}>
                <span style=${{ fontSize: 18, filter: "grayscale(1)" }}>📄</span>
              </div>
              <div style=${{ fontSize: 12, fontWeight: 800, color: B.gray400 }}>Report Ready</div>
              <div style=${{ fontSize: 11, color: B.gray400, marginTop: 4 }}>24-48 Hours</div>
            </div>

            <div style=${{ position: "relative", zIndex: 1, width: 120 }}>
              <div style=${{ width: 44, height: 44, borderRadius: "50%", background: B.gray100, color: B.gray400, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: "4px solid white" }}>
                <span style=${{ fontSize: 18, filter: "grayscale(1)" }}>📞</span>
              </div>
              <div style=${{ fontSize: 12, fontWeight: 800, color: B.gray400 }}>Strategic Call</div>
              <div style=${{ fontSize: 11, color: B.gray400, marginTop: 4 }}>Optional</div>
            </div>
          </div>

          <button 
            onClick=${onHome} 
            style=${{ 
              background: B.red, color: B.white, border: "none", 
              padding: "16px 48px", borderRadius: 14, fontWeight: 800, fontSize: 16,
              cursor: "pointer", boxShadow: "0 10px 25px rgba(200, 24, 30, 0.2)",
              transition: "all 0.3s"
            }}>
            Return to Control Centre
          </button>
          
          <div style=${{ borderTop: `1px solid ${B.border}`, paddingTop: 40, marginTop: 60, opacity: 0.8 }}>
             <${BizcomLogo} size=${32} />
             <p style=${{ fontSize: 12, marginTop: 12, fontWeight: 700, color: B.gray400, letterSpacing: "0.1em" }}>PROPERTY OF BIZCOM AI GROUP • HIGHLY CONFIDENTIAL DATA</p>
          </div>
        </div>
      </main>
    </div>
  `;
}
