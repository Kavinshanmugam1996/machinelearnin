import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { api } from '../services/api.js';
import { B, DISPLAY, BODY, CLUSTER_COLORS, CLUSTER_DESCRIPTIONS } from '../services/constants.js';

const html = htm.bind(React.createElement);

const { useEffect, useState, useRef, useMemo } = React;

export function RiskReport({ profile, answers, questions, clients, activeClientId, onSwitchClient, onLogout, onHome }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [remediation, setRemediation] = useState([]);

  useEffect(() => {
    const fetchRemediation = async () => {
      try {
        const token = localStorage.getItem("AIRES_token");
        const data = await api.getRemediation(token, activeClientId);
        setRemediation(data);
      } catch (err) {
        console.error("Failed to fetch remediation:", err);
      }
    };
    fetchRemediation();
  }, [activeClientId]);

  const reportData = useMemo(() => {
    const scores = {};
    const domains = Object.keys(CLUSTER_COLORS);
    
    domains.forEach(domain => {
      const domainQuestions = questions.filter(q => q.cluster === domain);
      if (domainQuestions.length === 0) {
        scores[domain] = 100;
        return;
      }
      
      const yesCount = domainQuestions.filter(q => answers[q.qid] === "Yes").length;
      scores[domain] = Math.round((yesCount / domainQuestions.length) * 100);
    });

    const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / domains.length);
    
    let tier = "Critical";
    let tierColor = "#EF4444";
    if (overallScore >= 80) { tier = "Low Risk / Optimized"; tierColor = "#10B981"; }
    else if (overallScore >= 60) { tier = "Moderate / Emerging"; tierColor = "#F59E0B"; }
    else if (overallScore >= 40) { tier = "High / Reactive"; tierColor = "#F97316"; }

    return { scores, overallScore, tier, tierColor, domains };
  }, [answers, questions]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: reportData.domains.map(d => d.split(":")[0]),
          datasets: [{
            label: 'Governance Match (%)',
            data: reportData.domains.map(d => reportData.scores[d]),
            backgroundColor: 'rgba(59, 155, 200, 0.2)',
            borderColor: B.blue,
            pointBackgroundColor: B.blue,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: B.blue
          }]
        },
        options: {
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { display: false, stepSize: 20 },
              grid: { color: 'rgba(0,0,0,0.05)' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }, [reportData]);

  const MetricCard = ({ label, value, color }) => html`
    <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: 20, flex: 1, minWidth: 200 }}>
      <div style=${{ fontSize: 13, fontWeight: 700, color: B.gray500, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>${label}</div>
      <div style=${{ fontSize: 24, fontWeight: 800, color: color || B.black, fontFamily: DISPLAY }}>${value}</div>
    </div>
  `;

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
            Thanks for completing the questionnaire, Bizcom team will get back to you as earliest.
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
