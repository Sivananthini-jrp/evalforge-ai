# evalforge-ai/backend/tests/test_providers_smoke.py
"""
Manual smoke test. Run with:
  pytest -s tests/test_providers_smoke.py
Set GROQ_API_KEY in .env first. Skips automatically if key missing.
"""
import asyncio
import os

import pytest

from app.services.llm_providers.factory import build_provider


@pytest.mark.skipif(not os.getenv("GROQ_API_KEY"), reason="GROQ_API_KEY not set")
def test_groq_generate():
    async def _run():
        p = build_provider("groq", "llama-3.1-8b-instant")
        return await p.generate("Reply with exactly: OK")

    result = asyncio.run(_run())
    assert result.text
    assert result.latency_ms >= 0
    print(
        f"\n[groq] text={result.text!r} "
        f"in={result.input_tokens} out={result.output_tokens} "
        f"latency={result.latency_ms}ms cost=${result.cost:.6f}"
    )


def test_unknown_provider():
    with pytest.raises(Exception):
        build_provider("does-not-exist", "any")