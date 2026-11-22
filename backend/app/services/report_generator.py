# evalforge-ai/backend/app/services/report_generator.py
"""
Aggregates per-model metrics for an experiment, generates recommendations,
and (optionally) renders a PDF.
"""
from __future__ import annotations

import io
from collections import defaultdict
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.evaluation import EvaluationResult
from app.models.model import Model
from app.models.response import ModelResponse


def aggregate(db: Session, experiment_id: UUID) -> dict:
    rows = (
        db.query(
            Model.display_name,
            EvaluationResult.metric,
            func.avg(EvaluationResult.score).label("avg_score"),
            func.count(EvaluationResult.id).label("n"),
        )
        .join(ModelResponse, ModelResponse.id == EvaluationResult.response_id)
        .join(Model, Model.id == ModelResponse.model_id)
        .filter(ModelResponse.experiment_id == experiment_id)
        .group_by(Model.display_name, EvaluationResult.metric)
        .all()
    )

    per_model: dict[str, dict[str, dict]] = defaultdict(dict)
    for model, metric, avg, n in rows:
        per_model[model][metric] = {
            "avg": round(float(avg or 0), 4),
            "n": int(n or 0),
        }

    perf_rows = (
        db.query(
            Model.display_name,
            func.avg(ModelResponse.latency_ms).label("avg_latency"),
            func.sum(ModelResponse.input_tokens + ModelResponse.output_tokens).label("tokens"),
            func.sum(ModelResponse.cost).label("cost"),
        )
        .join(Model, Model.id == ModelResponse.model_id)
        .filter(ModelResponse.experiment_id == experiment_id)
        .group_by(Model.display_name)
        .all()
    )

    performance = {
        name: {
            "avg_latency_ms": round(float(lat or 0), 1),
            "total_tokens": int(tok or 0),
            "total_cost": round(float(cost or 0), 6),
        }
        for name, lat, tok, cost in perf_rows
    }

    recommendations = _recommend(per_model, performance)
    return {
        "per_model_metrics": dict(per_model),
        "performance": performance,
        "recommendations": recommendations,
    }


def _recommend(per_model: dict, performance: dict) -> list[str]:
    recs: list[str] = []
    if not per_model:
        return recs

    def _avg(model: str, metric: str) -> float:
        return per_model[model].get(metric, {}).get("avg", 0.0)

    best_correct = max(per_model, key=lambda m: _avg(m, "correctness"))
    if _avg(best_correct, "correctness") > 0:
        recs.append(
            f"{best_correct} had highest correctness "
            f"({_avg(best_correct, 'correctness'):.1%})."
        )

    best_faith = max(per_model, key=lambda m: _avg(m, "faithfulness"))
    if _avg(best_faith, "faithfulness") > 0:
        recs.append(
            f"{best_faith} had highest faithfulness "
            f"({_avg(best_faith, 'faithfulness'):.1%})."
        )

    lowest_hall = min(per_model, key=lambda m: _avg(m, "hallucination_rate"))
    recs.append(
        f"{lowest_hall} had lowest hallucination rate "
        f"({_avg(lowest_hall, 'hallucination_rate'):.1%})."
    )

    if performance:
        fastest = min(performance, key=lambda m: performance[m]["avg_latency_ms"])
        recs.append(
            f"{fastest} was fastest "
            f"({performance[fastest]['avg_latency_ms']} ms avg)."
        )

    return recs


def render_pdf(aggregate_data: dict, experiment_name: str) -> bytes:
    """Minimal, single-page-ish PDF using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"EvalForge Report: {experiment_name}", styles["Title"]),
        Spacer(1, 12),
        Paragraph("Per-model metrics", styles["Heading2"]),
    ]

    header = ["Model", "Metric", "Avg", "n"]
    data = [header]
    for model, metrics in aggregate_data["per_model_metrics"].items():
        for metric, vals in metrics.items():
            data.append([model, metric, f"{vals['avg']:.2%}", str(vals["n"])])

    table = Table(data, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), "#e5e7eb"),
                ("GRID", (0, 0), (-1, -1), 0.5, "#9ca3af"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Recommendations", styles["Heading2"]))
    for rec in aggregate_data["recommendations"]:
        story.append(Paragraph(f"• {rec}", styles["BodyText"]))

    doc.build(story)
    return buf.getvalue()