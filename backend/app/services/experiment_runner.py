# evalforge-ai/backend/app/services/experiment_runner.py
"""
Background runner. Called from routers/experiments.py via BackgroundTasks.

Steps:
  1. Load experiment, test cases, and selected models.
  2. For every (test_case, model) pair, call the model.
  3. Persist raw responses.
  4. For each response, run evaluators; persist evaluation_results.
  5. Mark experiment completed.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.dataset import TestCase
from app.models.evaluation import EvaluationResult
from app.models.experiment import Experiment
from app.models.response import ModelResponse
from app.services.evaluators import correctness, faithfulness, hallucination, relevance
from app.services.llm_providers.factory import build_provider_from_model


async def run_experiment(experiment_id: UUID) -> None:
    db: Session = SessionLocal()
    try:
        exp = db.get(Experiment, experiment_id)
        if not exp:
            return
        exp.status = "running"
        db.commit()

        test_cases = (
            db.query(TestCase)
            .filter(TestCase.dataset_id == exp.dataset_id)
            .all()
        )
        models = [link.model for link in exp.model_links]

        # --- 1. generate responses (concurrent per model × test case) ---
        async def call_one(model_row, case: TestCase):
            provider = build_provider_from_model(model_row)
            prompt = exp.prompt_template.format(
                question=case.question,
                context=case.context or "",
            )
            try:
                result = await provider.generate(prompt)
                return (model_row, case, result, None)
            except Exception as exc:
                return (model_row, case, None, str(exc))

        tasks = [call_one(m, c) for m in models for c in test_cases]
        generated = await asyncio.gather(*tasks)

        for model_row, case, result, err in generated:
            db.add(
                ModelResponse(
                    experiment_id=exp.id,
                    test_case_id=case.id,
                    model_id=model_row.id,
                    response=result.text if result else None,
                    latency_ms=result.latency_ms if result else None,
                    input_tokens=result.input_tokens if result else None,
                    output_tokens=result.output_tokens if result else None,
                    cost=result.cost if result else None,
                    error=err,
                )
            )
        db.commit()

        # --- 2. evaluate each response ---
        responses = (
            db.query(ModelResponse)
            .filter(ModelResponse.experiment_id == exp.id)
            .all()
        )
        for mr in responses:
            if mr.error or not mr.response:
                continue
            case = db.get(TestCase, mr.test_case_id)
            if not case:
                continue

            # correctness
            if case.expected_answer:
                r = correctness.evaluate(case.expected_answer, mr.response)
                db.add(EvaluationResult(
                    response_id=mr.id, metric="correctness",
                    score=r["score"], details=r,
                ))

            # relevance
            r = relevance.evaluate(case.question, mr.response)
            db.add(EvaluationResult(
                response_id=mr.id, metric="relevance",
                score=r["score"], details=r,
            ))

            # faithfulness + hallucination (only if context exists)
            if case.context:
                f = faithfulness.evaluate(case.context, mr.response)
                db.add(EvaluationResult(
                    response_id=mr.id, metric="faithfulness",
                    score=f["score"], details=f,
                ))
                h = hallucination.analyze(case.context, mr.response)
                db.add(EvaluationResult(
                    response_id=mr.id, metric="hallucination_rate",
                    score=h["hallucination_rate"], details=h,
                ))
        db.commit()

        exp.status = "completed"
        exp.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        db.rollback()
        exp = db.get(Experiment, experiment_id)
        if exp:
            exp.status = "failed"
            exp.error_message = str(exc)[:500]
            db.commit()
    finally:
        db.close()