# evalforge-ai/backend/app/services/evaluators/hallucination.py
import re
import httpx
import os
from app.config import settings

NUMBER_RE = re.compile(
    r"(?P<value>\d+(?:[.,]\d+)?)\s*"
    r"(?P<unit>days?|hours?|weeks?|months?|years?|%|rupees?|rs\.?|inr|usd|\$|dollars?)?",
    re.IGNORECASE,
)

def _extract_numeric(text: str) -> list[dict]:
    out = []
    for m in NUMBER_RE.finditer(text):
        try:
            val = float(m.group("value").replace(",", ""))
        except ValueError:
            continue
        out.append({"raw": m.group(0).strip(), "value": val, "unit": (m.group("unit") or "").lower()})
    return out

def _check_numeric(evidence: str, claim: str) -> list[dict]:
    ev = _extract_numeric(evidence)
    resp = _extract_numeric(claim)
    results = []
    for r in resp:
        matching = [e for e in ev if e["unit"] == r["unit"]]
        if not matching:
            results.append({**r, "status": "unsupported", "reason": "no matching evidence"})
            continue
        if any(abs(m["value"] - r["value"]) < 1e-6 for m in matching):
            results.append({**r, "status": "supported"})
        else:
            results.append({**r, "status": "contradicted", "expected": [m["value"] for m in matching]})
    return results

def _split_claims(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\b(?:and|but|while|whereas|however)\b", text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 5]

def nli_score(evidence: str, claim: str) -> dict:
    api_url = "https://api-inference.huggingface.co/models/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli"
    headers = {}
    hf_token = os.getenv("HF_TOKEN")
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"

    payload = {
        "inputs": evidence,
        "parameters": {"text_pair": claim, "top_k": 3}
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(api_url, headers=headers, json=payload)
            resp.raise_for_status()
            out = resp.json()
            
            if isinstance(out, list):
                labels = {d["label"].lower(): d["score"] for d in out}
            else:
                labels = {out["label"].lower(): out["score"]}

            entail = labels.get("entailment", 0.0)
            contra = labels.get("contradiction", 0.0)
            neutral = labels.get("neutral", 0.0)

            threshold = settings.DEFAULT_HALLUCINATION_THRESHOLD
            if entail >= threshold:
                return {"status": "supported", "score": entail}
            if contra >= threshold:
                return {"status": "contradicted", "score": contra}
            return {"status": "unsupported", "score": neutral}
    except Exception:
        return {"status": "unsupported", "score": 0.0}

def analyze(evidence: str | None, response: str | None) -> dict:
    if not evidence or not response:
        return {"claims": [], "hallucination_rate": 0.0, "has_hallucination": False}

    claims = _split_claims(response)
    results: list[dict] = []
    for claim in claims:
        numeric = _check_numeric(evidence, claim)
        if numeric and any(n["status"] == "contradicted" for n in numeric):
            results.append({"claim": claim, "status": "contradicted", "reason": "numeric contradiction", "details": numeric})
            continue
        s = nli_score(evidence, claim)
        results.append({"claim": claim, **s})

    n = len(results) or 1
    hallucinated = sum(1 for r in results if r["status"] in ("contradicted", "unsupported"))
    return {
        "claims": results,
        "hallucination_rate": round(hallucinated / n, 4),
        "has_hallucination": hallucinated > 0,
    }