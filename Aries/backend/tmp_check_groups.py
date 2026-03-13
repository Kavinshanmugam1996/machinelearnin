import asyncio
import json
from pathlib import Path

def check_groups():
    path = Path('Data/questions.json')
    if not path.exists():
        print("File not found")
        return
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    groups = set(q.get('component_group', '') for q in data)
    print(f"Unique Component Groups found in JSON: {groups}")
    
    # Count specific categories
    mandatory = ["privacy", "security", "reliability", "legal_regulatory"]
    found_mandatory = [g for g in groups if g in mandatory]
    print(f"Mandatory groups found: {found_mandatory}")

if __name__ == "__main__":
    check_groups()
