# evalforge-ai/backend/update_models.py
from app.database import SessionLocal
from app.models.model import Model

db = SessionLocal()

# 1. Fix Groq Models
groq_8b = db.query(Model).filter(Model.model_name == 'llama-3.1-8b-instant').first()
if groq_8b:
    groq_8b.model_name = 'llama3-8b-8192'
    groq_8b.display_name = 'Llama 3 8B (Groq)'

groq_70b = db.query(Model).filter(Model.model_name == 'llama-3.3-70b-versatile').first()
if groq_70b:
    # If 70b is also failing, we'll swap it to Mixtral which is very stable on Groq
    groq_70b.model_name = 'mixtral-8x7b-32768'
    groq_70b.display_name = 'Mixtral 8x7B (Groq)'

# 2. Fix Gemini Model
gemini = db.query(Model).filter(Model.model_name == 'gemini-1.5-flash').first()
if gemini:
    gemini.model_name = 'gemini-1.5-flash-latest'
    gemini.display_name = 'Gemini 1.5 Flash (Latest)'

db.commit()
print("Database models updated successfully! You can now restart your backend.")
db.close()