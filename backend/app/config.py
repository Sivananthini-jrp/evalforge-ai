# evalforge-ai/backend/app/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App ---
    APP_NAME: str = "EvalForge AI"
    APP_ENV: str = "development"  # development | production
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # --- Security / Auth ---
    SECRET_KEY: str = "change-me-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # --- Database ---
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/evalforge"

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # --- LLM Providers (optional; used by services/llm_providers) ---
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # --- Judge (LLM-as-a-judge default) ---
    JUDGE_MODEL_PROVIDER: str = "groq"
    JUDGE_MODEL_NAME: str = "llama-3.1-70b-versatile"

    # --- Evaluation defaults ---
    DEFAULT_CORRECTNESS_THRESHOLD: float = 0.75
    DEFAULT_RELEVANCE_THRESHOLD: float = 0.50
    DEFAULT_HALLUCINATION_THRESHOLD: float = 0.60  # NLI contradiction cutoff


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()