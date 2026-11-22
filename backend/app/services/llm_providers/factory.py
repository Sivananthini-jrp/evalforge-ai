# evalforge-ai/backend/app/services/llm_providers/factory.py
from __future__ import annotations

from typing import Any

from app.services.llm_providers.base import BaseProvider, ProviderError
from app.services.llm_providers.gemini_provider import GeminiProvider
from app.services.llm_providers.groq_provider import GroqProvider
from app.services.llm_providers.ollama_provider import OllamaProvider
from app.services.llm_providers.openai_provider import OpenAIProvider


_REGISTRY: dict[str, type[BaseProvider]] = {
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "groq": GroqProvider,
    "ollama": OllamaProvider,
}


def build_provider(
    provider: str,
    model_name: str,
    cost_per_1k_input: float = 0.0,
    cost_per_1k_output: float = 0.0,
) -> BaseProvider:
    cls = _REGISTRY.get(provider)
    if cls is None:
        raise ProviderError(f"Unknown provider: {provider!r}")
    return cls(model_name, cost_per_1k_input, cost_per_1k_output)


def build_provider_from_model(model_row: Any) -> BaseProvider:
    """Convenience for the experiment runner: accept a `models` ORM row."""
    return build_provider(
        provider=model_row.provider,
        model_name=model_row.model_name,
        cost_per_1k_input=float(model_row.cost_per_1k_input or 0),
        cost_per_1k_output=float(model_row.cost_per_1k_output or 0),
    )