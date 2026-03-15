from typing import List, Dict, Any

# Remediation Mapping based on Industry Standards (NIST, ISO, EU AI Act)
REMEDIATION_DATABASE = {
    # Domain 1: Technical
    "technical_architecture": {
        "advice": "Implement formal MLOps pipelines with automated model signing and weight integrity checks.",
        "standard": "NIST AI RMF 1.0"
    },
    "model_monitoring": {
        "advice": "Deploy real-time drift detection and automated re-training triggers for safety-critical models.",
        "standard": "ISO 42001"
    },
    # Domain 2: Data & Privacy
    "data_lineage": {
        "advice": "Establish an automated data provenance graph using tools like OpenLineage to ensure training data integrity.",
        "standard": "EU AI Act Art. 10"
    },
    "differential_privacy": {
        "advice": "Apply differential privacy or synthetic data generation techniques to training sets containing sensitive PII.",
        "standard": "GDPR / HIPAA"
    },
    # Domain 3: Ethics
    "bias_auditing": {
        "advice": "Conduct formal disparate impact analysis on feature stores using open-source tools like Aequitas or AI Fairness 360.",
        "standard": "IEEE P7003"
    },
    "human_in_the_loop": {
        "advice": "Define clear 'Human-in-the-loop' (HITL) protocols for high-confidence/high-impact AI decisions.",
        "standard": "EU AI Act Art. 14"
    },
    # Domain 4: Governance
    "impact_assessment": {
        "advice": "Perform a mandatory AI Impact Assessment (AIIA) prior to production deployment for high-risk use cases.",
        "standard": "NIST AI RMF / OECD"
    },
    "roam_raci": {
        "advice": "Develop a formal RACI matrix specifically for AI model owners, data providers, and compliance officers.",
        "standard": "Corporate Governance Best Practices"
    },
    # Domain 5: Infrastructure
    "gpu_starvation": {
        "advice": "Implement token-level rate limiting and multi-region GPU failover to prevent service denial.",
        "standard": "SRE Reliability Standards"
    },
    "chaos_engineering": {
        "advice": "Run periodic chaos experiments to verify AI system resilience against hallucination and downstream API failures.",
        "standard": "Modern Infrastructure Resilience"
    }
}

class RemediationService:
    @staticmethod
    def get_advice(questions: List[Any], answers: Dict[str, str]) -> List[Dict[str, str]]:
        """
        Maps skipped or 'No' answers to actionable remediation steps.
        """
        recommendations = []
        
        # Simple mapping logic: If answer is 'No', provide advice.
        # In a real scenario, this would use a more sophisticated tag-based lookup.
        for q in questions:
            # Check if we have advice for this specific question ID or a generic mapping
            # For this MVP, we match by common keywords in qid or cluster
            if answers.get(q.qid) == "No":
                # Fallback logic to find best matching advice
                matched_key = None
                for key in REMEDIATION_DATABASE.keys():
                    if key in q.qid.lower():
                        matched_key = key
                        break
                
                if matched_key:
                    advice_item = REMEDIATION_DATABASE[matched_key]
                    recommendations.append({
                        "qid": q.qid,
                        "question_text": q.text,
                        "advice": advice_item["advice"],
                        "standard": advice_item["standard"]
                    })
        
        return recommendations
