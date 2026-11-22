# 🛡️ EvalForge AI: LLM Reliability & Hallucination Evaluation Lab

An enterprise-grade, full-stack Generative AI platform designed to benchmark, evaluate, and compare the reliability of Large Language Models (LLMs). 

## The Business Problem
Companies are rushing to integrate LLMs (GPT, Llama, Gemini) into customer-facing applications. However, **AI hallucination**—where a model confidently generates false information—creates massive business risks. 
If a company's AI support bot tells a customer they have a "30-day refund policy" when the actual policy is "7 days," it results in financial loss and brand damage.

**EvalForge AI** solves this by providing a testing laboratory. It allows AI engineers to upload a ground-truth dataset, run identical prompts across multiple models, and mathematically measure which model is the most accurate, faithful, and cost-effective.

---

## Core Features

- **Multi-LLM Benchmarking:** Evaluate and compare models like Llama 3 (via Groq) and Gemini side-by-side.
- **Hybrid Hallucination Detection Engine:** Goes beyond basic text similarity by combining **Natural Language Inference (NLI)** with **Rule-Based Numeric Checking** to detect exact contradictions (e.g., 7 days vs. 30 days).
- **Automated Evaluation Metrics:** Calculates Answer Correctness, Faithfulness (grounding), Answer Relevance, and Hallucination Rate.
- **Performance & Cost Analytics:** Tracks response latency (ms) and token-based API costs.
- **Interactive Dashboards:** Beautiful, real-time Recharts visualizations comparing model performance.
- **Explainable Results:** Pinpoints exactly which claims in the AI's response were flagged as hallucinated.
- **Automated PDF Reporting:** Generates downloadable PDF reports with data-driven model recommendations.
- **Secure Authentication:** JWT-based user authentication and isolated datasets.

---

## 🧠 The "Secret Sauce" (How Evaluation Works)

Most beginner projects use "LLM-as-a-judge" (asking another AI to grade the answer), which is prone to its own biases. EvalForge AI uses a robust, multi-layered evaluation pipeline:

1. **Correctness:** Uses `SentenceTransformers` to calculate the semantic cosine similarity between the AI's answer and the ground-truth expected answer.
2. **Faithfulness & Hallucination:** 
   - **Step A (Claim Splitting):** The AI response is broken down into atomic claims.
   - **Step B (Numeric Check):** Regex extracts numbers/dates/currencies and verifies them against the context. (Catches the classic "7 days vs 30 days" error).
   - **Step C (NLI Check):** A HuggingFace `DeBERTa-v3` model (fine-tuned on MNLI/FEVER/ANLI) performs Natural Language Inference to determine if the context entails, contradicts, or is neutral to the claim.

---

## Technology Stack

Frontend:
- React (Vite + TypeScript)
- Tailwind CSS (Styling)
- Recharts (Data Visualization)
- Zustand (State Management)
- Axios (API Client)

Backend:
- Python 3.11 & FastAPI
- PostgreSQL (Hosted on Neon)
- SQLAlchemy ORM & Alembic
- Passlib & JWT (Security)
- ReportLab (PDF Generation)

AI / Machine Learning:
- `sentence-transformers` (all-MiniLM-L6-v2)
- `transformers` (HuggingFace)
- Groq API (Llama models) & Google Gemini API

---

## Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Sivananthini-jrp/evalforge-ai.git
cd evalforge-ai