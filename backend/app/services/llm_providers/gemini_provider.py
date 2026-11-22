# evalforge-ai/backend/app/services/llm_providers/gemini_provider.py
from __future__ import annotations

import time

from google import genai
from google.genai import types

from app.config import settings
from app.services.llm_providers.base import BaseProvider, LLMResult, ProviderError


class GeminiProvider(BaseProvider):
    provider_name = "gemini"

    def __init__(self, model_name, cost_per_1k_input=0.0, cost_per_1k_output=0.0):
        super().__init__(model_name, cost_per_1k_input, cost_per_1k_output)
        if not settings.GOOGLE_API_KEY:
            raise ProviderError("GOOGLE_API_KEY not configured")
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def generate(self, prompt, system=None, temperature=0.0, max_tokens=None):
        config = types.GenerateContentConfig(temperature=temperature)
        if max_tokens is not None:
            config.max_output_tokens = max_tokens
        if system:
            config.system_instruction = system

        start = time.perf_counter()
        try:
            resp = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
        except Exception as exc:
            raise ProviderError(f"Gemini error: {exc}") from exc
        latency_ms = int((time.perf_counter() - start) * 1000)

        text = (resp.text or "").strip()
        usage = getattr(resp, "usage_metadata", None)
        input_tokens = int(getattr(usage, "prompt_token_count", 0) or 0)
        output_tokens = int(getattr(usage, "candidates_token_count", 0) or 0)

        return LLMResult(
            text=text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost=self._estimate_cost(input_tokens, output_tokens),
        )