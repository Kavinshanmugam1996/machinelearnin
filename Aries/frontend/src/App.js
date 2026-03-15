import React from 'react';
import htm from 'htm';
import { AdminLogin } from './features/AdminLogin.js';
import { LandingPage } from './features/LandingPage.js';
import { CompanyProfile } from './features/CompanyProfile.js';
import { QuestionFlow } from './features/QuestionFlow.js';
import { RiskReport } from './features/RiskReport.js';
import { api } from './services/api.js';
import { B, BODY, DISPLAY } from './services/constants.js';

const html = htm.bind(React.createElement);

const { useState, useEffect } = React;

export default function App() {
  const [page, setPage] = useState("loading"); // login, landing, profile, questions, results
  const [showDefaultClientModal, setShowDefaultClientModal] = useState(false);
  const [newAssessmentName, setNewAssessmentName] = useState("");
  
  // Client Management
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(() => {
    const saved = localStorage.getItem("AIRES_active_client");
    if (saved) console.log("%c[AIRES] Resuming session for client:", "color: #10B981; font-weight: bold", saved);
    return saved || "default";
  });

  // --- IDLE TIMEOUT LOGIC (15 MINS) ---
  useEffect(() => {
    if (page === "login" || page === "loading") return;

    let timeoutId;
    const IDLE_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn("[AIRES] Idle timeout reached. Logging out...");
        logout();
      }, IDLE_TIME);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    
    resetTimer(); // Start timer

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [page]);

  // Client-specific persistences
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [questions, setQuestions] = useState([]);
  const [loadError, setLoadError] = useState("");

  // Server Sync Logic
  const syncToServer = async () => {
    if (!profile) return;
    const token = localStorage.getItem("AIRES_token");
    if (!token) return;

    try {
      const activeClient = clients.find(c => c.id === activeClientId);
      const payload = {
        id: activeClientId,
        name: activeClient ? activeClient.name : "Default Client",
        profile,
        answers,
        currentQuestionIndex,
        totalQuestions: questions.length > 0 ? questions.length : (activeClient ? activeClient.totalQuestions : 0)
      };
      await api.saveAssessment(token, payload);
    } catch (err) {
      if (err.message === "UNAUTHORIZED") logout();
      console.error("[AIRES] Failed to sync to server:", err);
    }
  };

  // Update client progress in the clients array
  useEffect(() => {
    if (questions.length > 0 && activeClientId) {
      setClients(prev => prev.map(c => {
        if (c.id === activeClientId) {
          const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
          return { ...c, progress };
        }
        return c;
      }));
    }
  }, [currentQuestionIndex, questions.length, activeClientId]);

  // Initial load: Clients
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("AIRES_token");
      if (!token) {
        setPage("login"); // Show login page first
        return;
      }

      try {
        const serverClients = await api.getClients(token);
        if (serverClients.length > 0) {
          setClients(serverClients);
          
          // Prefer the previously saved activeClientId from localStorage.
          // Only fall back to the first client if our saved ID genuinely doesn't
          // exist on the server (e.g. was deleted).
          const savedId = localStorage.getItem("AIRES_active_client");
          let currentId = savedId && serverClients.find(c => c.id === savedId)
            ? savedId
            : serverClients[0].id;

          setActiveClientId(currentId);
          localStorage.setItem("AIRES_active_client", currentId);

          // Fetch data for the active ID
          const assessment = await api.getAssessment(token, currentId);
          if (assessment) {
            setProfile(assessment.profile);
            setAnswers(assessment.answers || {});
            setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);
          }
        } else {
          // Server has no clients yet — try to restore from localStorage list
          // so we don't wipe a previously created client.
          const savedClients = localStorage.getItem("AIRES_clients");
          if (savedClients) {
            const parsed = JSON.parse(savedClients);
            if (parsed.length > 0) {
              setClients(parsed);
              const savedId = localStorage.getItem("AIRES_active_client");
              const validId = savedId && parsed.find(c => c.id === savedId)
                ? savedId
                : parsed[0].id;
              setActiveClientId(validId);
              return;
            }
          }
          setClients([{ id: "default", name: "Default Client", progress: 0 }]);
          setActiveClientId("default");
        }
        setPage("landing");
        console.log("%c[AIRES] SYSTEM v1.0.5-security-update INITIALIZED", "color: #10B981; font-weight: bold; background: #ECFDF5; padding: 4px 8px; border-radius: 4px");
      } catch (err) {
        if (err.message === "UNAUTHORIZED") {
          localStorage.removeItem("AIRES_token");
          setPage("login"); // Fallback to login
        } else {
          console.error("[AIRES] Failed to initialize:", err);
          setLoadError("Failed to connect to backend. Make sure the server is running.");
        }
      }
    };
    init();
  }, []);

  // Load active client data when client switches
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("AIRES_token");
      if (!token) return;

      try {
        const assessment = await api.getAssessment(token, activeClientId);
        if (assessment) {
          setProfile(assessment.profile);
          setAnswers(assessment.answers || {});
          setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);
        }
      } catch (err) {
        console.error("[AIRES] Failed to fetch client data on switch:", err);
      }
    };
    
    loadData();
    localStorage.setItem("AIRES_active_client", activeClientId);
  }, [activeClientId]);

  // Show mandatory modal if active client is Default Client and no other assessments exist
  useEffect(() => {
    const activeClient = clients.find(c => c.id === activeClientId);
    // Only show modal if Default Client is active AND there's only 1 client (the default itself)
    if (activeClient?.name === "Default Client" && clients.length === 1 && page !== "login" && page !== "loading") {
      setShowDefaultClientModal(true);
    } else {
      setShowDefaultClientModal(false);
    }
  }, [activeClientId, clients, page]);

  // Sync state to keyed localStorage AND Server
  useEffect(() => {
    if (profile) {
      localStorage.setItem(`AIRES_client_${activeClientId}_profile`, JSON.stringify(profile));
      syncToServer();
    } else {
      localStorage.removeItem(`AIRES_client_${activeClientId}_profile`);
    }
  }, [profile, activeClientId]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(`AIRES_client_${activeClientId}_answers`, JSON.stringify(answers));
    localStorage.setItem(`AIRES_client_${activeClientId}_q_index`, currentQuestionIndex.toString());
    syncToServer();
  }, [answers, currentQuestionIndex, questions.length, activeClientId]);

  useEffect(() => {
    localStorage.setItem("AIRES_clients", JSON.stringify(clients));
  }, [clients]);

  // Helper function to check if profile has all required fields
  const isProfileComplete = (prof) => {
    return prof && 
           prof.companyName && 
           prof.industry && 
           prof.companySize && 
           prof.regulatory;
  };

  const switchClient = async (id, name) => {
    if (id === "new") {
      const nid = "c_" + Date.now();
      const newClient = { id: nid, name, progress: 0 };
      const updatedClients = [...clients, newClient];
      setClients(updatedClients);
      setActiveClientId(nid);
      
      // Pre-fill company name and clear other data
      const newProfile = { companyName: name, industry: "", companySize: "", regulatory: "", techMaturity: "" };
      setProfile(newProfile);
      setAnswers({});
      setQuestions([]);
      setCurrentQuestionIndex(0);
      
      // Save new client to server
      try {
        const token = localStorage.getItem("AIRES_token");
        if (token) {
          await api.saveAssessment(token, {
            id: nid,
            name,
            profile: {},
            answers: {},
            currentQuestionIndex: 0,
            totalQuestions: 0
          });
        }
      } catch (err) {
        console.error("Failed to save new client to server:", err);
      }
      
      setPage("profile");
    } else {
      // Switching to existing client - FIRST clear all previous data
      setProfile(null);
      setAnswers({});
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setActiveClientId(id);
      
      const token = localStorage.getItem("AIRES_token");
      if (!token) {
        setPage("login");
        return;
      }

      setPage("loading");
      try {
        const assessment = await api.getAssessment(token, id);
        if (assessment) {
          setProfile(assessment.profile);
          setAnswers(assessment.answers || {});
          setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);

          // Check if finished, profile is complete, or need to fill profile
          const client = clients.find(c => c.id === id);
          if (client && client.progress === 100) {
            setPage("results");
          } else if (isProfileComplete(assessment.profile)) {
            const qs = await api.getQuestions(token, assessment.profile.inventory, assessment.profile.industry);
            setQuestions(qs);
            setPage("questions");
          } else {
            // Profile incomplete - redirect to fill it
            setPage("profile");
          }
        } else {
          setPage("profile");
        }
      } catch (err) {
        console.error("Switch client failed:", err);
        setPage("landing");
      }
    }
  };

  const resumeClient = async (id) => {
    // FIRST: Clear all previous data
    setProfile(null);
    setAnswers({});
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setActiveClientId(id);
    
    const token = localStorage.getItem("AIRES_token");
    if (!token) {
      setPage("login");
      return;
    }

    setPage("loading");
    try {
      const assessment = await api.getAssessment(token, id);
      if (assessment) {
        setProfile(assessment.profile);
        setAnswers(assessment.answers || {});
        setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);

        // Check if finished, profile is complete, or need to fill profile
        const client = clients.find(c => c.id === id);
        if (client && client.progress === 100) {
          setPage("results");
        } else if (isProfileComplete(assessment.profile)) {
          const qs = await api.getQuestions(token, assessment.profile.inventory, assessment.profile.industry);
          setQuestions(qs);
          setPage("questions");
        } else {
          // Profile incomplete - redirect to fill it
          setPage("profile");
        }
      } else {
        setPage("profile"); // Fallback for new-ish clients with no server data
      }
    } catch (err) {
      console.error("Resume client failed:", err);
      setPage("landing");
    }
  };

  const logout = () => {
    localStorage.removeItem("AIRES_token");
    setPage("login");
  };

  if (loadError) {
    return html`
      <div style=${{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1D", fontFamily: BODY }}>
        <div style=${{ textAlign: "center", maxWidth: 560, padding: 40 }}>
          <div style=${{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
          <h2 style=${{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 16, fontFamily: DISPLAY }}>Data Loading Error</h2>
          <p style=${{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>${loadError}</p>
          <button onClick=${() => window.location.reload()} className="auth-btn" style=${{ padding: "14px 32px", fontSize: 15 }}>Retry</button>
        </div>
      </div>
    `;
  }

  if (page === "loading") {
    return html`
      <div style=${{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1D", fontFamily: BODY }}>
        <div style=${{ textAlign: "center" }}>
          <div style=${{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.1)", borderTopColor: B.blue, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
          <p style=${{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500 }}>Loading data...</p>
        </div>
      </div>
    `;
  }

  const cleanReset = () => {
    const token = localStorage.getItem("AIRES_token");
    if (!token) {
      setPage("login");
      return;
    }
    localStorage.removeItem(`AIRES_client_${activeClientId}_profile`);
    localStorage.removeItem(`AIRES_client_${activeClientId}_answers`);
    localStorage.removeItem(`AIRES_client_${activeClientId}_q_index`);
    setProfile(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setPage("profile");
  };

  const resume = async () => {
    const token = localStorage.getItem("AIRES_token");
    if (!token) {
      setPage("login");
      return;
    }

    // Identify current progress if possible
    const currentClient = clients.find(c => c.id === activeClientId);
    if (currentClient && currentClient.progress === 100) {
      setPage("results");
      return;
    }

    if (isProfileComplete(profile)) {
      if (questions.length === 0) {
        setPage("loading");
        try {
          const qs = await api.getQuestions(token, profile.inventory, profile.industry);
          setQuestions(qs);
          setPage("questions");
        } catch (err) {
          console.error("Failed to fetch questions during resume:", err);
          setPage("profile"); 
        }
      } else {
        setPage("questions");
      }
    } else {
      // Profile incomplete - redirect to fill it
      setPage("profile");
    }
  };

  return html`
    <div style=${{ fontFamily: BODY }}>
      ${showDefaultClientModal && html`
        <div style=${{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style=${{
            background: "white", borderRadius: 16, padding: "32px", width: "90%", maxWidth: 450,
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)", border: `2px solid ${B.red}`
          }}>
            <div style=${{ marginBottom: 28 }}>
              <div style=${{ fontSize: 16, fontWeight: 900, color: B.red, marginBottom: 8 }}>⚠️ Default Client</div>
              <div style=${{ fontSize: 20, fontWeight: 900, color: B.black, marginBottom: 12 }}>Create a new assessment to get started</div>
              <div style=${{ fontSize: 13, fontWeight: 500, color: B.gray600, lineHeight: 1.6 }}>
                You're currently using the "Default Client" placeholder. Please create a new assessment with your company name to begin the AI risk evaluation.
              </div>
            </div>

            <div style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style=${{ padding: "20px", background: B.gray50, borderRadius: 10, border: `1px solid ${B.border}` }}>
                <label style=${{ fontSize: 12, fontWeight: 700, color: B.gray600, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Create New Assessment</label>
                <input 
                  type="text" 
                  value=${newAssessmentName}
                  onInput=${(e) => setNewAssessmentName(e.target.value)}
                  placeholder="Enter company name"
                  onKeyDown=${(e) => {
                    if (e.key === "Enter" && newAssessmentName.trim()) {
                      e.preventDefault();
                      // Trigger create
                      const btn = e.target.parentElement.querySelector("button");
                      if (btn) btn.click();
                    }
                  }}
                  style=${{
                    width: "100%", padding: "10px 12px", border: `1px solid ${B.border}`, borderRadius: 8,
                    fontSize: 14, fontFamily: BODY, boxSizing: "border-box", marginBottom: 12
                  }}
                />
                <button onClick=${async () => {
                  if (newAssessmentName.trim()) {
                    try {
                      const token = localStorage.getItem("AIRES_token");
                      const newClientId = "client_" + Date.now();
                      const newClient = { id: newClientId, name: newAssessmentName, progress: 0 };
                      
                      // Save to server immediately
                      await api.saveAssessment(token, {
                        id: newClientId,
                        name: newAssessmentName,
                        profile: {},
                        answers: {},
                        currentQuestionIndex: 0,
                        totalQuestions: 0
                      });
                      
                      // Update local state
                      setClients(prev => [...prev, newClient]);
                      setActiveClientId(newClientId);
                      setShowDefaultClientModal(false);
                      setNewAssessmentName("");
                      setPage("profile");
                    } catch (err) {
                      alert("Failed to create new assessment");
                      console.error("Create failed:", err);
                    }
                  } else {
                    alert("Please enter a company name");
                  }
                }} style=${{
                  width: "100%", background: B.red, color: "white", border: "none",
                  padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                  cursor: newAssessmentName.trim() ? "pointer" : "not-allowed",
                  opacity: newAssessmentName.trim() ? 1 : 0.5,
                  transition: "all 0.2s"
                }}>
                  ➕ Create New Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      `}

      ${page === "login" && html`<${AdminLogin} onLogin=${() => setPage("landing")} />`}
      ${page === "landing" && html`
        <${LandingPage}
          onBegin=${cleanReset}
          onResume=${resume}
          onResumeClient=${resumeClient}
          hasSaved=${!!profile}
          clients=${clients}
          activeClientId=${activeClientId}
          onSwitchClient=${switchClient}
          onLogout=${logout}
          onHome=${() => setPage("landing")}
        />
      `}
      ${page === "profile" && html`<${CompanyProfile}
        initialProfile=${profile}
        onNext=${async p => {
          setProfile(p);
          if (p.companyName) {
            setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, name: p.companyName } : c));
          }
          
          setPage("loading");
          try {
            const token = localStorage.getItem("AIRES_token");
            const qs = await api.getQuestions(token, p.inventory, p.industry);
            setQuestions(qs);
            setPage("questions");
          } catch (err) {
            if (err.message === "UNAUTHORIZED") logout();
            else {
              alert("Failed to fetch questions from server.");
              setPage("profile");
            }
          }
        }}
        clients=${clients}
        activeClientId=${activeClientId}
        onSwitchClient=${switchClient}
        onLogout=${logout}
        onHome=${() => setPage("landing")}
      />`}
      ${page === "questions" && profile && questions.length > 0 && html`
        <${QuestionFlow}
          questions=${questions}
          profile=${profile}
          onBack=${() => setPage("profile")}
          onFinish=${(a, q) => {
            setAnswers(a);
            setQuestions(q);
            setPage("results");
            // NOTE: We no longer clear the draft immediately to allow for a more robust completion state
          }}
          onExit=${() => setPage("landing")}
          initialIndex=${currentQuestionIndex}
          onIndexChange=${setCurrentQuestionIndex}
          initialAnswers=${answers}
          onAnswersChange=${setAnswers}
          clients=${clients}
          activeClientId=${activeClientId}
          onSwitchClient=${switchClient}
          onLogout=${logout}
        />
      `}
      ${page === "results" && profile && html`
        <${RiskReport}
          profile=${profile}
          answers=${answers}
          questions=${questions}
          clients=${clients}
          activeClientId=${activeClientId}
          onSwitchClient=${switchClient}
          onLogout=${logout}
          onHome=${() => setPage("landing")}
        />
      `}
    </div>
  `;
}
