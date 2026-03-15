import React from 'react';
import htm from 'htm';
import { Nav } from '../components/Nav.js';
import { BizcomLogo } from '../components/BizcomLogo.js';
import { B, DISPLAY, BODY, CLUSTER_COLORS, MANDATORY_COMPONENT_GROUPS } from '../services/constants.js';

const html = htm.bind(React.createElement);
const { useState, useEffect } = React;

export function QuestionFlow({ 
  questions = [], profile, onBack, onFinish, onExit, 
  initialIndex = 0, onIndexChange, initialAnswers = {}, onAnswersChange, 
  clients, activeClientId, onSwitchClient, onLogout, departmentName 
}) {
  const [current, setCurrent] = useState(() => {
    const startIdx = (typeof initialIndex === 'number' && !isNaN(initialIndex)) ? initialIndex : 0;
    return Math.min(Math.max(0, startIdx), Math.max(0, questions.length - 1));
  });

  useEffect(() => {
    if (onIndexChange) onIndexChange(current);
  }, [current]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (onAnswersChange) onAnswersChange(answers);
  }, [answers]);

  const q = questions[current] || questions[0];
  const pct = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const clusterColor = CLUSTER_COLORS[q?.cluster] || B.blue;
  const isMandatory = MANDATORY_COMPONENT_GROUPS.includes(q?.component_group);

  const handleSelection = (val) => {
    if (fade) return;
    const next = { ...answers, [q.qid]: val };
    setAnswers(next);
    
    setFade(true);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setFade(false);
      } else {
        onFinish(next, questions);
      }
    }, 250);
  };

  const goPrev = () => {
    if (fade) return;
    setFade(true);
    setTimeout(() => {
      if (current > 0) {
        setCurrent(c => c - 1);
        setFade(false);
      } else {
        onBack();
      }
    }, 250);
  };

  const customOpts = q?.options?.length > 0 ? q.options : ["Yes", "No", "Maybe", "Non-applicable"];
  const opts = customOpts.map(opt => {
    const l = opt.toLowerCase();
    if (l.startsWith("yes") || l.startsWith("compliant") || l.startsWith("full")) return { label: opt, color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" };
    if (l.startsWith("no") || l.startsWith("non-compliant") || l.startsWith("not-compliant")) return { label: opt, color: B.red, bg: "#FEF2F2", border: "#FECACA" };
    if (l.startsWith("partial") || l.startsWith("maybe") || l.startsWith("some")) return { label: opt, color: B.blue, bg: "#EFF6FF", border: "#93C5FD" };
    return { label: opt, color: B.gray500, bg: B.gray50, border: B.gray300 };
  });

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY, paddingBottom: 100 }}>
       <${Nav}
        steps=${["Profile", "Teams", "Questions", "Complete"]}
        current=${2}
        clients=${clients}
        activeClientId=${activeClientId}
        onSwitchClient=${onSwitchClient}
        onLogout=${onLogout}
        onHome=${onExit}
      />

      <div style=${{ maxWidth: 840, margin: "40px auto", padding: "0 24px" }}>
        
        <!-- Question Header / Context -->
        <div style=${{ 
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", 
          marginBottom: 20, padding: "0 8px"
        }}>
          <div>
            <div style=${{ 
              display: "flex", alignItems: "center", gap: 8, 
              fontSize: 12, fontWeight: 700, color: B.blue, letterSpacing: "0.1em", marginBottom: 8 
            }}>
              <span style=${{ width: 8, height: 8, borderRadius: "50%", background: B.blue }} />
              ${departmentName?.toUpperCase() || "DEPARTMENT ASSESSMENT"}
            </div>
            <div style=${{ fontSize: 13, color: B.gray500, fontWeight: 600 }}>
              Question ${current + 1} of ${questions.length}
            </div>
          </div>
          <div style=${{ textAlign: "right" }}>
            <span style=${{ fontSize: 13, fontWeight: 800, color: B.black }}>${pct}% Complete</span>
          </div>
        </div>

        <!-- Main Question Container -->
        <div style=${{
          opacity: fade ? 0 : 1, 
          transform: fade ? "scale(0.98) translateY(10px)" : "scale(1) translateY(0)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          background: B.white,
          borderRadius: 24,
          boxShadow: B.shadowLg,
          overflow: "hidden",
          border: `1px solid ${B.border}`
        }}>
          <!-- Cluster Banner -->
          <div style=${{ 
            height: 6, width: "100%", background: clusterColor,
            opacity: 0.8
          }} />

          <div style=${{ padding: "44px 48px" }}>
            <div style=${{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
              ${q?.cluster && q?.cluster !== "nan" && html`
                <span style=${{
                  padding: "6px 14px", borderRadius: 30, fontSize: 11, fontWeight: 700,
                  background: clusterColor + "15", color: clusterColor, border: `1px solid ${clusterColor}22`
                }}>
                  ${q?.cluster.split(":")[0]}
                </span>
              `}
              ${isMandatory && html`
                <span style=${{
                  padding: "6px 14px", borderRadius: 30, fontSize: 11, fontWeight: 700,
                  background: "#FEF9C3", color: "#A16207", border: "1px solid #FDE047"
                }}>⚡ CRITICAL CONTROL</span>
              `}
            </div>

            <h2 style=${{ 
              fontSize: 22, fontWeight: 700, color: B.black, lineHeight: 1.5, 
              margin: "0 0 40px", letterSpacing: "-0.3px", fontFamily: DISPLAY 
            }}>
              ${q?.text}
            </h2>

            <!-- Options Grid -->
            <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              ${opts.map(opt => {
                const selected = answers[q?.qid] === opt.label;
                return html`
                  <button 
                    key=${opt.label} 
                    onClick=${() => handleSelection(opt.label)} 
                    style=${{
                      padding: "20px 24px", cursor: "pointer",
                      background: selected ? opt.bg : B.gray50,
                      border: `2px solid ${selected ? opt.color : "transparent"}`,
                      borderRadius: 16, 
                      fontSize: 15, fontWeight: selected ? 700 : 600,
                      color: selected ? opt.color : B.gray700,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
                      textAlign: "left",
                      display: "flex", alignItems: "center", gap: 14,
                      boxShadow: selected ? `0 8px 20px ${opt.color}22` : "none",
                      transform: selected ? "translateY(-2px)" : "none"
                    }}
                  >
                    <div style=${{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${selected ? opt.color : B.gray300}`,
                      background: selected ? opt.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s"
                    }}>
                      ${selected && html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`}
                    </div>
                    ${opt.label}
                  </button>
                `;
              })}
            </div>
          </div>

          <!-- Card Footer Progress -->
          <div style=${{ 
            background: B.gray50, padding: "20px 48px", borderTop: `1px solid ${B.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style=${{ flex: 1, marginRight: 40 }}>
              <div style=${{ height: 6, background: B.gray200, borderRadius: 3, overflow: "hidden" }}>
                <div style=${{ 
                  height: "100%", width: `${pct}%`, background: B.blue,
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }} />
              </div>
            </div>
            <span style=${{ fontSize: 11, fontWeight: 700, color: B.gray400, letterSpacing: "0.05em" }}>SECTION PROGRESS</span>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div style=${{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button onClick=${goPrev}
            style=${{
              padding: "12px 24px", background: "none", border: `1.5px solid ${B.border}`, borderRadius: 10,
              color: B.gray600, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}>
            ← Previous Question
          </button>

          <button onClick=${onExit}
            style=${{
              padding: "12px 24px", background: "none", border: "none",
              color: B.gray400, fontSize: 13, fontWeight: 700, cursor: "pointer", 
              textDecoration: "underline", transition: "all 0.2s"
            }}>
            Save & Exit to Dashboard
          </button>
        </div>
      </div>
    </div>
  `;
}
