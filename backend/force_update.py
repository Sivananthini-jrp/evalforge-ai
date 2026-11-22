# evalforge-ai/backend/force_update.py
from app.database import SessionLocal
from app.models.model import Model

db = SessionLocal()

# 1. Update Gemini to the absolute latest free model
gemini = db.query(Model).filter(Model.provider == 'gemini').first()
if gemini:
    print(f"Changing Gemini from {gemini.model_name} to gemini-2.5-flash")
    gemini.model_name = 'gemini-2.5-flash'
    gemini.display_name = 'Gemini 2.5 Flash'

# 2. Update Groq to the latest supported versions
groq_models = db.query(Model).filter(Model.provider == 'groq').all()
for m in groq_models:
    if '8b' in m.model_name.lower() or 'instant' in m.model_name.lower():
        print(f"Changing {m.model_name} to llama-3.1-8b-instant")
        m.model_name = 'llama-3.1-8b-instant'
        m.display_name = 'Llama 3.1 8B (Groq)'
    else:
        print(f"Changing {m.model_name} to llama-3.3-70b-versatile")
        m.model_name = 'llama-3.3-70b-versatile'
        m.display_name = 'Llama 3.3 70B (Groq)'

db.commit()
print("Database forced update complete! You MUST restart your backend now.")
db.close()