import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { api } from '../services/api.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);

const { useEffect, useState } = React;

export function RiskReport({ profile, answers, questions, clients, activeClientId, onSwitchClient, onLogout, onHome }) {

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <${Nav} steps=${["Profile", "Inventory", "Questions", "Complete"]} current=${3} onHome=${onHome} clients=${clients} activeClientId=${activeClientId} onSwitchClient=${onSwitchClient} onLogout=${onLogout} />

      <main style=${{ flex: 1, padding: "80px 24px", maxWidth: 800, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 24, padding: "60px 40px", boxShadow: B.shadow }}>
          <div style=${{ width: 80, height: 80, background: "#F0FDF4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: "#16A34A" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          
          <h1 style=${{ fontSize: 32, fontWeight: 800, color: B.black, margin: "0 0 16px", fontFamily: DISPLAY, letterSpacing: "-0.5px" }}>Assessment Submitted</h1>
          <p style=${{ fontSize: 18, color: B.gray600, lineHeight: 1.6, margin: "0 auto 40px", maxWidth: 500 }}>
            Thank you for completing the questionnaire. The Bizcom expert team will review your data and send your comprehensive risk profile within 24-48 hours.
          </p>
          
          <div style=${{ borderTop: `1px solid ${B.border}`, paddingTop: 40, marginTop: 40, opacity: 0.6 }}>
             <${BizcomLogo} size=${32} />
             <p style=${{ fontSize: 12, marginTop: 12, fontWeight: 600, color: B.gray400 }}>PROPERTY OF BIZCOM AI GROUP • HIGHLY CONFIDENTIAL</p>
          </div>
        </div>
        
        <button onClick=${onHome} style=${{ marginTop: 32, background: "none", border: "none", color: B.blue, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
          ← Return to Dashboard
        </button>
      </main>
    </div>
  `;
}
