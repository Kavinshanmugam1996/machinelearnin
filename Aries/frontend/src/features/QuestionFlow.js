import React from 'react';
import { Nav } from '../components/Nav.js';
import { B, DISPLAY, BODY, CLUSTER_COLORS, MANDATORY_COMPONENT_GROUPS } from '../services/constants.js';

const { useState, useEffect } = React;

export function QuestionFlow({ questions, profile, onBack, onFinish, onExit, initialIndex, onIndexChange, initialAnswers, onAnswersChange, clients, activeClientId, onSwitchClient, onLogout }) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    if (onIndexChange) onIndexChange(current);
  }, [current]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (onAnswersChange) onAnswersChange(answers);
  }, [answers]);

  const q = questions[current];
  const pct = Math.round(((current + 1) / questions.length) * 100);
  const clusterColor = CLUSTER_COLORS[q?.cluster] || B.blue;
  const isMandatory = MANDATORY_COMPONENT_GROUPS.includes(q?.component_group);

  const go = (val) => {
    if (fade) return;
    const next = { ...answers, [q.qid]: val };
    setAnswers(next);
    setFade(true);
    setTimeout(() => {
      if (current < questions.length - 1) setCurrent(c => c + 1);
      else onFinish(next, questions);
      setFade(false);
    }, 220);
  };

  const prev = () => {
    if (fade) return;
    setFade(true);
    setTimeout(() => {
      if (current > 0) setCurrent(c => c - 1);
      else onBack();
      setFade(false);
    }, 220);
  };

  const customOpts = q?.options?.length > 0 ? q.options : ["Yes", "No", "Maybe", "Non-applicable"];
  const opts = customOpts.map(opt => {
    if (opt.startsWith("Partial") || opt.startsWith("Maybe")) return { label: opt, color: B.blue, bg: "#EFF6FF", border: "#93C5FD" };
    if (opt.startsWith("No") || opt.startsWith("Non-compliant") || opt.startsWith("Not-compliant")) return { label: opt, color: B.red, bg: "#FEF2F2", border: "#FECACA" };
    if (opt.startsWith("Yes") || opt.startsWith("Compliant") || opt.startsWith("Full")) return { label: opt, color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" };
    return { label: opt, color: B.gray500, bg: B.gray50, border: B.gray300 };
  });

  return html`
    <div style=${{ minHeight: "100vh", background: B.gray50, fontFamily: BODY }}>
      <${Nav}
        steps=${["Company Profile", "AI Inventory", "Questions", "Risk Report"]}
        current=${2}
        clients=${clients}
        activeClientId=${activeClientId}
        onSwitchClient=${onSwitchClient}
        onLogout=${onLogout}
        onHome=${onExit}
      />

      <div style=${{ background: B.white, borderBottom: `1px solid ${B.border}`, padding: "16px 40px" }}>
        <div style=${{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick=${prev} style=${{
            background: "none", border: `1.5px solid ${B.border}`, borderRadius: 8,
            padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: B.gray600, transition: "all 0.2s"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div style=${{ flex: 1 }}>
            <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style=${{ fontSize: 13, fontWeight: 600, color: B.black }}>
                Question ${current + 1} <span style=${{ color: B.gray400 }}>of ${questions.length}</span>
              </span>
              <span style=${{ fontSize: 13, fontWeight: 700, color: B.red }}>${pct}% complete</span>
            </div>
            <div style=${{ height: 6, background: B.gray100, borderRadius: 4, overflow: "hidden" }}>
              <div style=${{
                height: "100%", width: `${pct}%`,
                background: `linear-gradient(90deg, ${B.red}, #E85558)`,
                borderRadius: 4, transition: "width 0.4s ease"
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style=${{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
        <div style=${{
          opacity: fade ? 0 : 1, transform: fade ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.2s, transform 0.2s"
        }}>
          <div style=${{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            ${q?.cluster && q?.cluster !== "nan" && html`
              <span style=${{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: clusterColor + "15", color: clusterColor, border: `1px solid ${clusterColor}33`
              }}>
                <span style=${{ width: 6, height: 6, borderRadius: "50%", background: clusterColor }} />
                ${q?.cluster?.replace("Cluster ", "").replace(" — ", " · ")}
              </span>
            `}
            ${isMandatory && html`
              <span style=${{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: "#FEF9C3", color: "#A16207", border: "1px solid #FDE047"
              }}>⚡ Mandatory</span>
            `}
            <span style=${{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: B.gray100, color: B.gray500, border: `1px solid ${B.border}` }}>
              ${q?.qid}
            </span>
          </div>

          <div style=${{
            background: B.white, border: `1px solid ${B.border}`, borderRadius: 14,
            padding: "36px 36px 28px", boxShadow: B.shadowMd,
            borderLeft: `4px solid ${clusterColor}`
          }}>
            <p style=${{ fontSize: 19, fontWeight: 600, color: B.black, lineHeight: 1.6, margin: "0 0 32px", letterSpacing: "-0.1px" }}>
              ${q?.text}
            </p>

            <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              ${opts.map(opt => {
                const selected = answers[q?.qid] === opt.label;
                return html`
                  <button key=${opt.label} onClick=${() => go(opt.label)} style=${{
                    padding: "14px 20px", cursor: "pointer",
                    background: selected ? opt.bg : B.white,
                    border: `1.5px solid ${selected ? opt.color : B.border}`,
                    borderRadius: 10, fontSize: 14, fontWeight: selected ? 700 : 500,
                    color: selected ? opt.color : B.gray700,
                    transition: "all 0.12s", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 10
                  }}>
                    <span style=${{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${selected ? opt.color : B.gray300}`,
                      background: selected ? opt.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      ${selected && html`<span style=${{ width: 7, height: 7, borderRadius: "50%", background: B.white }} />`}
                    </span>
                    ${opt.label}
                  </button>
                `;
              })}
            </div>
          </div>

          <div style=${{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button onClick=${() => current > 0 && setCurrent(c => c - 1)} disabled=${current === 0}
              style=${{
                padding: "10px 20px", background: "transparent",
                border: `1px solid ${B.border}`, borderRadius: 8,
                color: current === 0 ? B.gray300 : B.gray700, cursor: current === 0 ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 500
              }}>
              ← Back
            </button>
            <button onClick=${() => onExit ? onExit() : null} style=${{
              padding: "10px 20px", background: "transparent",
              border: `1px solid ${B.border}`, borderRadius: 8,
              color: B.red, cursor: "pointer", fontSize: 13, fontWeight: 700
            }}>
              Save & Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
