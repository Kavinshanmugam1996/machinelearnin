// ─── FONT INJECTION ───────────────────────────────────────────────────────────
export const FONT_LINK = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap";

// Font stacks
export const DISPLAY = "'Plus Jakarta Sans', sans-serif";       // headings, brand names, stats
export const BODY = "'Inter', sans-serif"; // body, labels, UI text

// ─── BRAND ───────────────────────────────────────────────────────────────────
export const B = {
  red: "#C8181E",
  redHover: "#A51015",
  blue: "#3B9BC8",
  blueDark: "#2577A0",
  black: "#0D0D0D",
  gray900: "#1A1A1A",
  gray700: "#444",
  gray500: "#777",
  gray300: "#C4C4C4",
  gray100: "#F4F5F7",
  gray50: "#FAFAFA",
  white: "#FFFFFF",
  border: "#E2E4E9",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.1)",
  shadowLg: "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)"
};

export const CLUSTER_COLORS = {
  "Domain 1: AI Technical & Model Integrity": "#3B9BC8",
  "Domain 2: Data, Privacy & Information Assets": "#8B5CF6",
  "Domain 3: Responsible AI & Ethics": "#16A34A",
  "Domain 4: Governance, Compliance & Legal": "#D97706",
  "Domain 5: Operational & Infrastructure Risk": "#C8181E",
};

export const CLUSTER_DESCRIPTIONS = {
  "Domain 1: AI Technical & Model Integrity": "Evaluates the 'engine room' of your AI. Focuses on technical architecture, MLOps security, model weight integrity scans for PII, and automated lineage/traceability to ensure the AI's foundation is structurally sound.",
  "Domain 2: Data, Privacy & Information Assets": "Assesses how information is ingested, stored, and protected. Covers data lineage, differential privacy during training, differential access controls for vector databases (RAG), and cryptographic birth certificates for data points.",
  "Domain 3: Responsible AI & Ethics": "Focuses on human oversight and societal impact. Includes mechanisms for 'Human-in-the-loop' escalation, bias/fairness auditing in feature stores, and robust explainability (XAI) to ensure decisions are justifiable and fair.",
  "Domain 4: Governance, Compliance & Legal": "Examines the regulatory and policy framework. Covers AI impact assessments, alignment with EU AI Act/NIST-RMF, intellectual property protection, and formal accountability matrices (RACI) for AI deployments.",
  "Domain 5: Operational & Infrastructure Risk": "Evaluates uptime and systemic resilience. Covers resource starvation (GPU/Token) prevention, multi-cloud failover strategies, chaos engineering for AI systems, and disaster recovery runbooks (RTO/RPO).",
};

// ─── DATA (BACKEND MANAGED) ──────────────────────────────────────────────────
export const MANDATORY_COMPONENT_GROUPS = ["privacy", "security", "reliability", "legal_regulatory"];
export const AI_USE_CASES = [
  "General AI assistant",
  "Employee copilot",
  "Customer chatbot",
  "Search and question-answering",
  "Document summarization",
  "Content generation",
  "Email or communications assistant",
  "Meeting and productivity assistant",
  "Knowledge assistant",
  "Workflow automation",
  "AI connected to internal systems",
  "Data analysis and insights",
  "Decision support",
  "Recommendations or personalization",
  "Developer or coding assistant",
  "Sensitive-data AI use case",
  "Model training or fine-tuning",
  "Autonomous or multi-agent system",
  "AI built into our product",
  "AI embedded in third party software we use",
  "AI used to support company research projects",
  "AI used to prepare legal or regulatory reporting",
  "AI used in hiring",
  "AI use case with high potential for human harm",
  "Cloud/Other / not sure"
];
