import csv
import json
import os

def convert_questions():
    # Use workspace relative paths
    base_dir = r'c:\Users\shanm\Desktop\Machinelearnin\Aries\Data'
    csv_path = os.path.join(base_dir, 'Aries_Questions_Extracted.csv')
    json_path = os.path.join(base_dir, 'questions.json')
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    questions = []
    with open(csv_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            qid = row.get('QID Code', '').strip()
            if not qid:
                continue
                
            # Mapping
            text = row.get('Question Text', '').strip()
            category = row.get('Category', '').strip()
            cluster = row.get('Cluster', '').strip()
            domain = row.get('Domain', '').strip()
            response_type = row.get('Response Type', '').strip()
            trigger_points_str = row.get('Trigger Points', '').strip()
            is_universal = row.get('Is Universal', '').strip() == '1'
            
            # Options parsing
            options = [opt.strip() for opt in response_type.split('|')] if response_type else ["Yes", "Partial", "No", "N/A"]
            
            # Trigger points parsing
            if trigger_points_str:
                trigger_points = [tp.strip() for tp in trigger_points_str.split('|')]
            else:
                trigger_points = ["Partial", "No"]
                
            department = row.get('Department', '').strip()
                
            questions.append({
                "qid": qid,
                "text": text,
                "component_group": category,
                "cluster": cluster,
                "industry": "Universal" if domain == "General" else domain,
                "is_universal": is_universal,
                "department": department,
                "options": options,
                "trigger_points": trigger_points
            })
            
    with open(json_path, mode='w', encoding='utf-8') as f:
        json.dump(questions, f, indent=4)
    print(f"Successfully converted {len(questions)} questions to {json_path}")

if __name__ == "__main__":
    convert_questions()
