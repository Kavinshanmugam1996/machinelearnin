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

def clean_text(text):
    text = str(text)
    if text == "nan": return ""
    # Fix the common utf-8 mojibake
    text = text.replace("â€”", "—").replace("â€™", "'").replace("â€˜", "'").replace("â€œ", '"').replace("â€", '"')
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
            
    # Clean the text properly
    text_clean = clean_text(r.get('question_text', ''))
            
    out.append({
        'qid': str(r.get('qid_code')),
        'text': text_clean,
        'component_group': str(r.get('component_group', '')),
        'cluster': cluster_formatted.strip(),
        'is_universal': bool(r.get('is_universal', 0))
    })

with open('Data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2)

print(f"Successfully exported {len(out)} clean questions.")
