/**
 * AIRES API Service
 * Centralized communication layer with the backend.
 */

const API_BASE = ""; // Relative to host

export const api = {
  /**
   * Login to obtain a JWT token
   */
  async login(email, password) {
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
    const res = await fetch(`${API_BASE}/api/clients`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
  },

  /**
   * Fetch questions filtered by inventory and industry
   */
  async getQuestions(token, inventory, industry) {
    const res = await fetch(`${API_BASE}/api/get-questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ inventory, industry })
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Failed to fetch questions");
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
  }
};
