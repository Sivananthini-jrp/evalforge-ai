# evalforge-ai/backend/app/services/llm_providers/ollama_provider.py
from __future__ import annotations

import time

import httpx

from app.config import settings
from app.services.llm_providers.base import BaseProvider, LLMResult, ProviderError


class OllamaProvider(BaseProvider):
    """Local inference via Ollama's HTTP API. No API key, no cost."""
    provider_name = "ollama"

    def __init__(
        self,
        model_name: str,
        cost_per_1k_input: float = 0.0,
        cost_per_1k_output: float = 0.0,
    ) -> None:
        super().__init__(model_name, cost_per_1k_input, cost_per_1k_output)
        self._base_url = settings.OLLAMA_BASE_URL.rstrip("/")

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

        payload: dict = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if max_tokens is not None:
            payload["options"]["num_predict"] = max_tokens

        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(f"{self._base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise ProviderError(f"Ollama error: {exc}") from exc
        latency_ms = int((time.perf_counter() - start) * 1000)

        text = (data.get("message") or {}).get("content", "")
        # Ollama reports token counts as prompt_eval_count / eval_count
        input_tokens = int(data.get("prompt_eval_count") or 0)
        output_tokens = int(data.get("eval_count") or 0)

        return LLMResult(
            text=text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost=0.0,
        )