import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY } from '../services/constants.js';

const html = htm.bind(React.createElement);
const { useState } = React;

export function TeamSelection({ questions = [], answers = {}, onNext, onBack, onFinish, clients, activeClientId, onSwitchClient, onLogout, onHome }) {
  const [hovered, setHovered] = useState(null);

  if (!questions || questions.length === 0) {
    return html`
      <div style=${{ minHeight: '100vh', background: B.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', fontFamily: BODY }}>
        <div style=${{ textAlign: 'center' }}>
          <div style=${{ width: 48, height: 48, border: '4px solid rgba(0,0,0,0.05)', borderTopColor: B.blue, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
          <p style=${{ color: B.gray500, fontWeight: 600 }}>Assembling your expert teams...</p>
        </div>
      </div>
    `;
  }

  // Group questions by department
  const depts = questions.reduce((acc, q) => {
    const d = q.department || "Other";
    if (!acc[d]) acc[d] = [];
    acc[d].push(q);
    return acc;
  }, {});

  const departmentList = Object.keys(depts).sort();
  
  // Overall stats
  const totalQuestions = questions.length;
  const totalAnswered = Object.keys(answers).length;
  const overallPct = Math.round((totalAnswered / totalQuestions) * 100);

  const getStatus = (dept) => {
    const qs = depts[dept];
    const answered = qs.filter(q => answers[q.qid]).length;
    const isComplete = answered === qs.length;
    const isStarted = answered > 0 && answered < qs.length;
    
    return {
      count: qs.length,
      answered,
      isComplete,
      isStarted,
      pct: Math.round((answered / qs.length) * 100),
      label: isComplete ? "COMPLETE" : (isStarted ? "IN PROGRESS" : "READY")
    };
  };

  const allComplete = totalAnswered === totalQuestions;

  const deptIcons = {
    "AI Engineering": "🤖",
    "Cybersecurity": "🛡️",
    "Data & Privacy": "🔒",
    "Legal & Regulatory": "🏛️",
    "IT Infrastructure": "☁️",
    "Risk & Security": "📋",
    "Ethics & Responsible AI": "⚖️",
    "Universal": "🌐",
    "Management": "👔",
    "Other": "📁"
  };

  return html`
    <div style=${{ minHeight: '100vh', background: B.gray50, fontFamily: BODY, paddingBottom: 60 }}>
      <${Nav}
        steps=${["Profile", "Teams", "Questions", "Complete"]}
        current=${1}
        clients=${clients}
        activeClientId=${activeClientId}
        onSwitchClient=${onSwitchClient}
        onLogout=${onLogout}
        onHome=${onHome}
      />
      
      <div style=${{ maxWidth: 1000, margin: '40px auto', padding: '0 24px' }}>
        
        <!-- Summary Section -->
        <div style=${{ 
          background: "linear-gradient(135deg, white 0%, #F9FAFB 100%)",
          border: `1px solid ${B.border}`,
          borderRadius: 24,
          padding: "32px",
          marginBottom: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: B.shadow
        }}>
          <div>
            <h1 style=${{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, color: B.black, margin: '0 0 8px', letterSpacing: "-0.5px" }}>
              Assessment by Department
            </h1>
            <p style=${{ color: B.gray500, fontSize: 16, margin: 0, maxWidth: 500 }}>
              Your assessment is broken down by functional expert teams. Complete each section to generate your full risk profile.
            </p>
          </div>

          <div style=${{ textAlign: "right", minWidth: 200 }}>
            <div style=${{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
              <span style=${{ fontSize: 36, fontWeight: 800, color: B.black }}>${overallPct}%</span>
              <span style=${{ fontSize: 14, color: B.gray500, fontWeight: 600 }}>COMPLETE</span>
            </div>
            <div style=${{ height: 8, width: 200, background: B.gray100, borderRadius: 4, overflow: "hidden", marginLeft: "auto" }}>
              <div style=${{ height: "100%", width: `${overallPct}%`, background: B.red, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
            <div style=${{ fontSize: 12, color: B.gray400, marginTop: 8, fontWeight: 600 }}>
              ${totalAnswered} OF ${totalQuestions} QUESTIONS ANSWERED
            </div>
          </div>
        </div>

        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          ${departmentList.map(dept => {
            const status = getStatus(dept);
            const isHover = hovered === dept;
            const icon = deptIcons[dept] || deptIcons["Other"];

            return html`
              <div 
                key=${dept}
                onClick=${() => onNext(dept)}
                onMouseEnter=${() => setHovered(dept)}
                onMouseLeave=${() => setHovered(null)}
                style=${{
                  padding: '28px',
                   background: isHover ? B.white : "rgba(255,255,255,0.7)",
                  border: `2px solid ${status.isComplete ? '#16A34A44' : (isHover ? B.blue + "44" : B.border)}`,
                  borderRadius: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  boxShadow: isHover ? B.shadowMd : "none",
                  transform: isHover ? "translateY(-6px)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  backdropFilter: "blur(10px)"
                }}
              >
                <!-- Status Tag -->
                <div style=${{
                  position: 'absolute', top: 16, right: 16,
                  padding: '4px 10px',
                  background: status.isComplete ? '#DCFCE7' : (status.isStarted ? '#DBEAFE' : B.gray100),
                  color: status.isComplete ? '#16A34A' : (status.isStarted ? B.blue : B.gray500),
                  fontSize: 10, fontWeight: 800, borderRadius: 6,
                  letterSpacing: "0.05em"
                }}>
                  ${status.label}
                </div>
                
                <div style=${{ 
                  fontSize: 36, marginBottom: 20,
                  width: 60, height: 60, borderRadius: 16,
                  background: isHover ? B.gray100 : B.gray50,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s"
                }}>${icon}</div>
                
                <h3 style=${{ fontSize: 19, fontWeight: 800, color: B.black, marginBottom: 6, letterSpacing: "-0.2px" }}>${dept}</h3>
                
                <div style=${{ fontSize: 13, color: B.gray500, marginBottom: 24, fontWeight: 500 }}>
                  ${status.answered} / ${status.count} Questions
                </div>

                <div style=${{ marginTop: "auto" }}>
                  <div style=${{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: B.gray400, marginBottom: 8 }}>
                    <span>PROGRESS</span>
                    <span>${status.pct}%</span>
                  </div>
                  <div style=${{ height: 6, background: B.gray100, borderRadius: 3, overflow: 'hidden' }}>
                    <div style=${{ 
                      height: '100%', 
                      width: `${status.pct}%`, 
                      background: status.isComplete ? '#16A34A' : B.blue,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>
            `;
          })}
        </div>

        <!-- Sticky Bottom Actions -->
        <div style=${{ 
          marginTop: 60,
          padding: "32px",
          background: B.white,
          border: `1px solid ${B.border}`,
          borderRadius: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: B.shadow
        }}>
          <button 
            onClick=${onBack}
            style=${{ 
              background: 'transparent', 
              border: `1.5px solid ${B.border}`, 
              color: B.gray600, 
              padding: "12px 24px",
              borderRadius: 10,
              fontSize: 14, 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: "all 0.2s"
            }}
          >
            ← Back to Use Cases
          </button>

          <button 
            onClick=${onFinish}
            disabled=${!allComplete && Object.keys(answers).length === 0}
            style=${{
              padding: '14px 32px',
              background: allComplete ? '#16A34A' : B.red,
              color: B.white,
              border: "none",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: allComplete ? '0 10px 20px rgba(22, 163, 74, 0.2)' : '0 10px 20px rgba(200, 24, 30, 0.15)',
              transition: 'all 0.3s'
            }}
          >
            ${allComplete ? 'Finalize & View Full Risk Report →' : 'Skip to Preliminary Report'}
          </button>
        </div>
      </div>
    </div>
  `;
}
