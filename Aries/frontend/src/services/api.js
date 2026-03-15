/**
 * AIRES API Service
 * Centralized communication layer with the backend.
 */

const API_BASE = ""; // Relative to host

export const api = {
  // Debug helper to log all API calls
  _log(method, ...args) {
    console.log(`%c[API CALL] ${method}`, "background: #1e293b; color: #38bdf8; padding: 2px 5px; border-radius: 3px", ...args);
  },

  /**
   * Login to obtain a JWT token
   */
  async login(email, password) {
    this._log("login", email);
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Login failed");
    }
    return res.json();
  },

  /**
   * Fetch all clients (assessments)
   */
  async getClients(token) {
    this._log("getClients");
    const res = await fetch(`${API_BASE}/api/clients`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
  },

  /**
   * Fetch questions filtered by use cases and industry
   */
  async getQuestions(token, useCases, industry) {
    const res = await fetch(`${API_BASE}/api/get-questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ use_cases: useCases, industry })
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch questions");
    return res.json();
  },

  /**
   * Resolve use cases to component groups
   */
  async getComponents(token, useCases) {
    const res = await fetch(`${API_BASE}/api/get-components`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ use_cases: useCases })
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch components");
    return res.json();
  },

  /**
   * Save assessment progress to server
   */
  async saveAssessment(token, payload) {
    const res = await fetch(`${API_BASE}/api/save`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to save progress");
    return res.json();
  },

  /**
   * Fetch remediation advice for a client
   */
  async getRemediation(token, clientId) {
    const res = await fetch(`${API_BASE}/api/remediation/${clientId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch remediation");
    return res.json();
  },

  /**
   * Fetch full assessment data for a client
   */
  async getAssessment(token, clientId) {
    const res = await fetch(`${API_BASE}/api/assessment/${clientId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch assessment");
    return res.json();
  },

  /**
   * Delete an assessment
   */
  async deleteAssessment(token, clientId) {
    this._log("deleteAssessment", clientId);
    const res = await fetch(`${API_BASE}/api/assessment/${clientId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to delete assessment");
    return res.json();
  }
};

window.api = api;

