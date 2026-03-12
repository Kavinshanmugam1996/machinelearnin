import React from 'react';
import { Nav } from '../components/Nav.js';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { api } from '../services/api.js';
import { B, DISPLAY, BODY, CLUSTER_COLORS, CLUSTER_DESCRIPTIONS } from '../services/constants.js';

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

      <main style=${{ flex: 1, padding: "40px 24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <h1 style=${{ fontSize: 32, fontWeight: 800, color: B.black, margin: "0 0 8px", fontFamily: DISPLAY, letterSpacing: "-0.5px" }}>Risk Insights Dashboard</h1>
            <p style=${{ fontSize: 16, color: B.gray500, margin: 0 }}>Enterprise AI Governance Analysis for ${profile.companyName || "Your Company"}</p>
          </div>
          <button onClick=${() => window.print()} style=${{ background: B.white, border: `1px solid ${B.border}`, padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Download PDF Report
          </button>
        </div>

        <div style=${{ display: "flex", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
          <${MetricCard} label="Governance Match" value=${`${reportData.overallScore}%`} color=${B.blue} />
          <${MetricCard} label="Risk Tier" value=${reportData.tier} color=${reportData.tierColor} />
          <${MetricCard} label="Assessments Scale" value=${profile.scale || "N/A"} />
        </div>

        <div style=${{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32, marginBottom: 40 }}>
          <div style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 16, padding: 32, boxShadow: B.shadow }}>
            <h3 style=${{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, fontFamily: DISPLAY }}>Domain Breakdown</h3>
            <div style=${{ maxWidth: 400, margin: "0 auto" }}>
              <canvas ref=${chartRef}></canvas>
            </div>
          </div>

          <div style=${{ display: "flex", flexDirection: "column", gap: 16 }}>
             ${reportData.domains.map(domain => html`
               <div key=${domain} style=${{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 20 }}>
                 <div style=${{ width: 44, height: 44, background: `${CLUSTER_COLORS[domain]}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                   <div style=${{ width: 8, height: 8, borderRadius: "50%", background: CLUSTER_COLORS[domain] }} />
                 </div>
                 <div style=${{ flex: 1 }}>
                   <div style=${{ fontSize: 14, fontWeight: 700, color: B.black, marginBottom: 4 }}>${domain}</div>
                   <div style=${{ fontSize: 12, color: B.gray500, lineHeight: 1.4 }}>${CLUSTER_DESCRIPTIONS[domain].slice(0, 80)}...</div>
                 </div>
                 <div style=${{ fontSize: 20, fontWeight: 800, color: B.black }}>${reportData.scores[domain]}%</div>
               </div>
             `)}
          </div>
        </div>

        ${remediation.length > 0 && html`
          <div style=${{ marginBottom: 40 }}>
            <h3 style=${{ fontSize: 22, fontWeight: 800, color: B.black, marginBottom: 24, fontFamily: DISPLAY }}>Intelligent Mitigation Roadmap</h3>
            <div style=${{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
              ${remediation.map((item, idx) => html`
                <div key=${idx} style=${{ background: B.white, border: `1px dashed ${B.blue}`, borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
                   <div style=${{ position: "absolute", top: 0, right: 0, padding: "4px 12px", background: B.blue, color: B.white, fontSize: 10, fontWeight: 800, borderBottomLeftRadius: 12 }}>${item.standard}</div>
                   <div style=${{ fontSize: 13, fontWeight: 700, color: B.gray400, marginBottom: 8 }}>${item.qid}</div>
                   <div style=${{ fontSize: 14, fontWeight: 600, color: B.black, marginBottom: 16, lineHeight: 1.4 }}>${item.question_text}</div>
                   <div style=${{ background: B.gray50, borderRadius: 8, padding: 12, borderLeft: `4px solid ${B.blue}` }}>
                     <div style=${{ fontSize: 12, fontWeight: 800, color: B.blue, textTransform: "uppercase", marginBottom: 4 }}>Remediation Advice</div>
                     <div style=${{ fontSize: 13, color: B.gray700, lineHeight: 1.5 }}>${item.advice}</div>
                   </div>
                </div>
              `)}
            </div>
          </div>
        `}

        <div style=${{ borderTop: `1px solid ${B.border}`, paddingTop: 40, marginTop: 40, textAlign: "center", opacity: 0.6 }}>
           <${BizcomLogo} size=${32} />
           <p style=${{ fontSize: 12, marginTop: 12, fontWeight: 600, color: B.gray400 }}>PROPERTY OF BIZCOM AI GROUP • HIGHLY CONFIDENTIAL</p>
        </div>
      </main>
    </div>
  `;
}
