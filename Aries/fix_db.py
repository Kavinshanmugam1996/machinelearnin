import pandas as pd
import json

df = pd.read_excel('Data/Aries_QA_DB.xlsx')
raw = df.to_dict(orient='records')
out = []

domain_map = {
    "Cluster 1": "Domain 1: ",
    "Cluster 2": "Domain 2: ",
    "Cluster 3": "Domain 3: ",
    "Cluster 4": "Domain 4: ",
    "Cluster 5": "Domain 5: ",
    "Cluster 6": "Domain 6: ",
    "Cluster 7": "Domain 7: "
}

import re

def clean_text(text):
    text = str(text)
    if text == "nan": return ""
    # Fix the common utf-8 mojibake
    text = text.replace("â€”", "—").replace("â€™", "'").replace("â€˜", "'").replace("â€œ", '"').replace("â€", '"')
    # AIRES Rebranding - Case Insensitive
    text = re.sub(r'Aries', 'AIRES', text, flags=re.IGNORECASE)
    text = re.sub(r'Organisation', 'Organization', text, flags=re.IGNORECASE)
    return text.strip()

for r in raw:
    if str(r.get('qid_code')) == 'nan':
        continue
        
    cluster_raw = str(r.get('cluster', ''))
    
    # Clean the cluster name
    cluster_formatted = cluster_raw
    for key, val in domain_map.items():
        if key in cluster_raw:
            cluster_formatted = val + clean_text(cluster_raw.split(key)[-1]).strip(" -")
            break
            
    # Extract and parse response options
    response_raw = str(r.get('response_type', ''))
    options = []
    if response_raw and response_raw != 'nan':
        # Split by | since that's what the DB uses
        options = [clean_text(opt) for opt in response_raw.split('|')]
    else:
        # Fallback to defaults if missing
        options = ["Yes", "No", "Maybe", "Non-applicable"]
        
    # Extract trigger points for scoring
    trigger_raw = str(r.get('trigger_points', ''))
    trigger_points = []
    if trigger_raw and trigger_raw != 'nan':
        trigger_points = [clean_text(tp) for tp in trigger_raw.split('|')]
    else:
        # Default triggers for safety
        trigger_points = ["No", "Maybe", "Partial", "Non-compliant"]
            
    # Clean the text properly
    text_clean = clean_text(r.get('question_text', ''))
            
    out.append({
        'qid': str(r.get('qid_code')),
        'text': text_clean,
        'component_group': str(r.get('component_group', '')),
        'cluster': cluster_formatted.strip().replace("\u2014", "—").replace("Aries", "AIRES").replace("Organisation", "Organization"),
        'options': options,
        'trigger_points': trigger_points,
        'is_universal': bool(r.get('is_universal', 0))
    })

with open('Data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2)

print(f"Successfully exported {len(out)} clean questions.")
