# evalforge-ai/backend/fix_groq_models.py
from app.database import SessionLocal
from app.models.model import Model

db = SessionLocal()

# Update Groq models to the current active ones
groq_models = db.query(Model).filter(Model.provider == 'groq').all()

if len(groq_models) >= 2:
    groq_models[0].model_name = 'openai/gpt-oss-20b'
    groq_models[0].display_name = 'GPT-OSS 20B (Groq)'
    
    groq_models[1].model_name = 'openai/gpt-oss-120b'
    groq_models[1].display_name = 'GPT-OSS 120B (Groq)'
elif len(groq_models) == 1:
    groq_models[0].model_name = 'openai/gpt-oss-20b'
    groq_models[0].display_name = 'GPT-OSS 20B (Groq)'

db.commit()
print("Groq models updated to openai/gpt-oss-20b and openai/gpt-oss-120b.")
db.close()