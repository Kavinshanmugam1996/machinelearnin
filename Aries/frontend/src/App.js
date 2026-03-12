import React from 'react';
import { AdminLogin } from './features/AdminLogin.js';
import { LandingPage } from './features/LandingPage.js';
import { CompanyProfile } from './features/CompanyProfile.js';
import { QuestionFlow } from './features/QuestionFlow.js';
import { RiskReport } from './features/RiskReport.js';
import { api } from './services/api.js';
import { B, BODY, DISPLAY } from './services/constants.js';

const { useState, useEffect } = React;

export default function App() {
  const [page, setPage] = useState("loading"); // login, landing, profile, questions, results
  
  // Client Management
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(() => {
    return localStorage.getItem("AIRES_active_client") || "default";
  });

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
        currentQuestionIndex
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
        setPage("landing"); // Show landing page first
        return;
      }

      try {
        const serverClients = await api.getClients(token);
        if (serverClients.length > 0) {
          setClients(serverClients);
        } else {
          setClients([{ id: "default", name: "Default Client" }]);
        }
        setPage("landing");
      } catch (err) {
        if (err.message === "UNAUTHORIZED") {
          localStorage.removeItem("AIRES_token");
          setPage("landing"); // Still fallback to landing
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
    const pKey = `AIRES_client_${activeClientId}_profile`;
    const aKey = `AIRES_client_${activeClientId}_answers`;
    const iKey = `AIRES_client_${activeClientId}_q_index`;

    const savedP = localStorage.getItem(pKey);
    const savedA = localStorage.getItem(aKey);
    const savedI = localStorage.getItem(iKey);

    setProfile(savedP ? JSON.parse(savedP) : null);
    setAnswers(savedA ? JSON.parse(savedA) : {});
    setCurrentQuestionIndex(savedI ? parseInt(savedI) : 0);

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
    localStorage.setItem(`AIRES_client_${activeClientId}_answers`, JSON.stringify(answers));
    syncToServer();
  }, [answers, activeClientId]);

  useEffect(() => {
    localStorage.setItem(`AIRES_client_${activeClientId}_q_index`, currentQuestionIndex.toString());
    syncToServer();
  }, [currentQuestionIndex, activeClientId]);

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

  const resume = () => {
    const token = localStorage.getItem("AIRES_token");
    if (!token) {
      setPage("login");
      return;
    }
    if (profile && Object.keys(answers).length > 0) setPage("questions");
    else setPage("profile");
  };

  return html`
    <div style=${{ fontFamily: BODY }}>
      ${page === "login" && html`<${AdminLogin} onLogin=${() => setPage("landing")} />`}
      ${page === "landing" && html`
        <${LandingPage}
          onBegin=${cleanReset}
          onResume=${resume}
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
            localStorage.removeItem(`AIRES_client_${activeClientId}_profile`);
            localStorage.removeItem(`AIRES_client_${activeClientId}_answers`);
            localStorage.removeItem(`AIRES_client_${activeClientId}_q_index`);
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
