import pandas as pd
import json
import re

excel_file = 'Data/Aries_QA_DB.xlsx'
xl = pd.ExcelFile(excel_file)

# Map sheet names to standardized industry labels used in the UI
sheet_map = {
    'questions_enriched_updated': 'Universal',
    'Healthcare': 'Healthcare',
    'banking': 'Banking',
    'Ecommerce': 'E-Commerce',
    'Education': 'Education',
    'retails': 'Retail'
}

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
    # AIRES Rebranding
    text = re.sub(r'\bAries\b', 'AIRES™', text, flags=re.IGNORECASE)
    text = re.sub(r'\bOrganisation\b', 'organisation', text, flags=re.IGNORECASE)
    return text.strip()

out = []

for sheet_name, industry_label in sheet_map.items():
    if sheet_name not in xl.sheet_names:
        print(f"Warning: Sheet '{sheet_name}' not found in Excel.")
        continue
        
    df = xl.parse(sheet_name)
    raw = df.to_dict(orient='records')
    
    print(f"Processing sheet '{sheet_name}' ({len(raw)} rows)...")

    for r in raw:
        qid = str(r.get('qid_code'))
        if qid == 'nan' or not qid:
            continue
            
        cluster_raw = str(r.get('cluster', ''))
        cluster_formatted = cluster_raw
        for key, val in domain_map.items():
            if key in cluster_raw:
                cluster_formatted = val + clean_text(cluster_raw.split(key)[-1]).strip(" -")
                break
                
        response_raw = str(r.get('response_type', ''))
        options = []
        if response_raw and response_raw != 'nan':
            options = [clean_text(opt) for opt in response_raw.split('|')]
        else:
            options = ["Yes", "No", "Maybe", "Non-applicable"]
            
        trigger_raw = str(r.get('trigger_points', ''))
        trigger_points = []
        if trigger_raw and trigger_raw != 'nan':
            trigger_points = [clean_text(tp) for tp in trigger_raw.split('|')]
        else:
            trigger_points = ["No", "Maybe", "Partial", "Non-compliant"]
                
        text_clean = clean_text(r.get('question_text', ''))
                
        out.append({
            'qid': qid,
            'text': text_clean,
            'component_group': str(r.get('component_group', '')),
            'cluster': cluster_formatted.strip().replace("\u2014", "—"),
            'options': options,
            'trigger_points': trigger_points,
            'is_universal': bool(r.get('is_universal', 0)) if industry_label == 'Universal' else False,
            'industry': industry_label
        })

with open('Data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2)

print(f"\nSuccessfully exported {len(out)} clean questions to questions.json.")

