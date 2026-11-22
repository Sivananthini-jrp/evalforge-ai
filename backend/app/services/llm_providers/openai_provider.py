# evalforge-ai/backend/app/services/llm_providers/openai_provider.py
from __future__ import annotations

import time

from openai import APIError, AsyncOpenAI, RateLimitError

from app.config import settings
from app.services.llm_providers.base import BaseProvider, LLMResult, ProviderError


class OpenAIProvider(BaseProvider):
    provider_name = "openai"

    def __init__(
        self,
        model_name: str,
        cost_per_1k_input: float = 0.0,
        cost_per_1k_output: float = 0.0,
    ) -> None:
        super().__init__(model_name, cost_per_1k_input, cost_per_1k_output)
        if not settings.OPENAI_API_KEY:
            raise ProviderError("OPENAI_API_KEY not configured")
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResult:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        start = time.perf_counter()
        try:
            resp = await self._client.chat.completions.create(
                model=self.model_name,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except RateLimitError as exc:
            raise ProviderError(f"OpenAI rate limit: {exc}") from exc
        except APIError as exc:
            raise ProviderError(f"OpenAI API error: {exc}") from exc
        latency_ms = int((time.perf_counter() - start) * 1000)

        choice = resp.choices[0].message.content or ""
        usage = resp.usage
        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0

        return LLMResult(
            text=choice,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost=self._estimate_cost(input_tokens, output_tokens),
        )