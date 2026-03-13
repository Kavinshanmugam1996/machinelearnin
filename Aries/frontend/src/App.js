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
          
          // Reconcile active clientId
          let currentId = activeClientId;
          if (!serverClients.find(c => c.id === activeClientId)) {
            currentId = serverClients[0].id;
            setActiveClientId(currentId);
          }

          // Fetch data for the active ID
          const assessment = await api.getAssessment(token, currentId);
          if (assessment) {
            setProfile(assessment.profile);
            setAnswers(assessment.answers || {});
            setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);
          }
        } else {
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

  const switchClient = (id, name) => {
    if (id === "new") {
      const nid = "c_" + Date.now();
      const updatedClients = [...clients, { id: nid, name }];
      setClients(updatedClients);
      setActiveClientId(nid);
      setPage("landing");
    } else {
      setActiveClientId(id);
      setPage("landing");
    }
  };

  const resumeClient = async (id) => {
    // 1. Switch Active Client
    setActiveClientId(id);
    
    // 2. Fetch data (Wait for it if needed)
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

        // Check if finished or need questions
        const client = clients.find(c => c.id === id);
        if (client && client.progress === 100) {
          setPage("results");
        } else if (assessment.profile) {
          const qs = await api.getQuestions(token, assessment.profile.inventory, assessment.profile.industry);
          setQuestions(qs);
          setPage("questions");
        } else {
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

    if (profile) {
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
      // Robust fallback: if no profile in state, try to re-fetch from server
      setPage("loading");
      try {
        const assessment = await api.getAssessment(token, activeClientId);
        if (assessment && assessment.profile) {
          setProfile(assessment.profile);
          setAnswers(assessment.answers || {});
          setCurrentQuestionIndex(assessment.currentQuestionIndex || 0);
          
          const qs = await api.getQuestions(token, assessment.profile.inventory, assessment.profile.industry);
          setQuestions(qs);
          setPage("questions");
        } else {
          setPage("profile");
        }
      } catch (err) {
        setPage("profile");
      }
    }
  };

  return html`
    <div style=${{ fontFamily: BODY }}>
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
