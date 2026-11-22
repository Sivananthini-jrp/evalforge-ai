# evalforge-ai/backend/app/services/llm_providers/base.py
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(slots=True)
class LLMResult:
    """Uniform result object returned by every provider."""
    text: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    cost: float = 0.0


class ProviderError(Exception):
    """Raised when a provider call fails in a way callers should surface."""


class BaseProvider(ABC):
    """
    Contract every LLM provider implements.

    Providers MUST:
      - accept a user prompt (and optional system prompt)
      - return an LLMResult with non-negative latency/token counts
      - raise ProviderError on failure (never silently return empty text)
    """

    provider_name: str = "base"

    def __init__(
        self,
        model_name: str,
        cost_per_1k_input: float = 0.0,
        cost_per_1k_output: float = 0.0,
    ) -> None:
        self.model_name = model_name
        self.cost_per_1k_input = float(cost_per_1k_input or 0.0)
        self.cost_per_1k_output = float(cost_per_1k_output or 0.0)

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResult:
        ...

    # helper used by concrete providers to keep cost math consistent
    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        return (
            (input_tokens / 1000.0) * self.cost_per_1k_input
            + (output_tokens / 1000.0) * self.cost_per_1k_output
        )