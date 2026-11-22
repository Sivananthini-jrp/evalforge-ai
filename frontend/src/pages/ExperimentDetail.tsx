// evalforge-ai/frontend/src/pages/ExperimentDetail.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  Coins,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Loader2,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react';

type Status = 'pending' | 'running' | 'completed' | 'failed' | string;

type Experiment = {
  id: string;
  name: string;
  status: Status;
  error_message?: string | null;
};

type ModelPerf = { avg_latency_ms: number; total_cost: number };

type Report = {
  performance: Record<string, ModelPerf>;
  per_model_metrics: Record<string, Record<string, { avg?: number } | undefined>>;
  recommendations: string[];
};

type Evaluation = { error?: string | null };

/* ---------- small pieces ---------- */

function StatusPill({ status, hasErrors }: { status: Status; hasErrors: boolean }) {
  const resolved: 'failed' | 'completed' | 'running' =
    hasErrors || status === 'failed' ? 'failed' : status === 'completed' ? 'completed' : 'running';

  const config: Record<typeof resolved, { label: string; cls: string; icon: ReactNode }> = {
    failed: {
      label: 'Failed',
      cls: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    completed: {
      label: 'Completed',
      cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    running: {
      label: status === 'pending' ? 'Pending' : 'Running',
      cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
  };

  const { label, cls, icon } = config[resolved];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function PerfCard({
  model,
  perf,
  delay,
}: {
  model: string;
  perf: ModelPerf;
  delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1]"
      style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both', animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/30 opacity-40 blur-2xl transition-all duration-500 group-hover:opacity-70 group-hover:scale-125" />

      <div className="relative flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-200 ring-1 ring-inset ring-white/10">
          <Cpu size={16} />
        </div>
        <h3 className="truncate font-semibold text-white" title={model}>
          {model}
        </h3>
      </div>

      <div className="relative mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock size={14} /> Latency
          </span>
          <span className="font-semibold text-white tabular-nums">
            {perf.avg_latency_ms.toLocaleString()} ms
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Coins size={14} /> Cost
          </span>
          <span className="font-semibold text-white tabular-nums">
            ${perf.total_cost.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function ExperimentDetail() {
  const { id } = useParams();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [responses, setResponses] = useState<Evaluation[]>([]);
  const [, setPolling] = useState(true);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/experiments/${id}`);
        if (cancelled) return;
        setExp(data);

        if (data.status === 'completed') {
          setPolling(false);
          const [reportRes, evalRes] = await Promise.all([
            api.get(`/reports/${id}`),
            api.get(`/evaluations/experiments/${id}`),
          ]);
          if (cancelled) return;
          setReport(reportRes.data);
          setResponses(evalRes.data);
        } else if (data.status === 'failed') {
          setPolling(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setPolling(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (!exp) {
    return (
      <div className="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-slate-300 backdrop-blur-xl">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
          Loading experiment...
        </div>
      </div>
    );
  }

  const isRunning = exp.status === 'pending' || exp.status === 'running';

  const apiErrors = Array.from(
    new Set(responses.filter((r) => r.error).map((r) => r.error as string)),
  );
  const hasErrors = apiErrors.length > 0;

  const chartData = report
    ? Object.keys(report.per_model_metrics).map((model) => {
        const m = report.per_model_metrics[model] ?? {};
        return {
          name: model,
          Correctness: (m.correctness?.avg || 0) * 100,
          Faithfulness: (m.faithfulness?.avg || 0) * 100,
          Relevance: (m.relevance?.avg || 0) * 100,
          Hallucination: (m.hallucination_rate?.avg || 0) * 100,
        };
      })
    : [];

  const downloadPDF = async () => {
    setDownloadError(false);
    try {
      const response = await api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `evalforge_${exp.name.replace(/\s+/g, '_')}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF', err);
      setDownloadError(true);
    }
  };

  const statusForPill: Status = hasErrors ? 'failed' : exp.status;

  return (
    <div className="space-y-6">
      {/* local keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(24px, -32px, 0) scale(1.1); }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>

      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl"
          style={{ animation: 'floatBlob 14s ease-in-out infinite' }}
        />
        <div
          className="absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/25 blur-3xl"
          style={{ animation: 'floatBlob 18s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/20 blur-3xl"
          style={{ animation: 'floatBlob 22s ease-in-out infinite' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        {/* back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* header */}
        <header
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both' }}
        >
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              Experiment Report
            </div>

            <h1 className="mt-4 truncate text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {exp.name}
            </h1>

            <p className="mt-1 truncate font-mono text-xs text-slate-500">
              ID: {exp.id}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            <StatusPill status={statusForPill} hasErrors={hasErrors} />
          </div>
        </header>

        {/* running state */}
        {isRunning && (
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-12 text-center backdrop-blur-xl"
            style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '80ms' }}
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border-2 border-indigo-400/20"
                style={{ animation: 'spinSlow 1.6s linear infinite' }}
              >
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
              </span>
              <Zap className="h-6 w-6 text-indigo-300" />
            </div>

            <h2 className="mt-6 text-xl font-semibold text-white">
              Evaluating models...
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Sending prompts to LLMs and calculating metrics. This usually takes a minute —
              this page will update automatically.
            </p>

            <div className="mx-auto mt-6 flex max-w-xs items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
              </div>
            </div>
          </div>
        )}

        {/* API errors */}
        {hasErrors && (
          <div
            className="relative overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-6 backdrop-blur-xl"
            style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both' }}
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/50 to-transparent" />

            <h2 className="flex items-center gap-2 font-semibold text-rose-100">
              <AlertCircle size={18} /> API Error Detected
            </h2>
            <p className="mt-2 text-sm text-rose-200/90">
              The AI models failed to return answers. Here is the error from the provider:
            </p>
            <ul className="mt-3 space-y-1 rounded-lg border border-rose-400/20 bg-rose-950/40 p-3 font-mono text-xs text-rose-200">
              {apiErrors.map((err, i) => (
                <li key={i} className="break-words">
                  {err}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-rose-200/80">
              Check your API keys in the{' '}
              <code className="rounded bg-rose-950/50 px-1.5 py-0.5 font-mono text-xs">
                .env
              </code>{' '}
              file and restart the backend.
            </p>
          </div>
        )}

        {/* failed state */}
        {exp.status === 'failed' && !hasErrors && (
          <div
            className="relative overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-6 backdrop-blur-xl"
            style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both' }}
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/50 to-transparent" />
            <h2 className="flex items-center gap-2 font-semibold text-rose-100">
              <TriangleAlert size={18} /> Experiment Failed
            </h2>
            <p className="mt-2 text-sm text-rose-200/90">
              {exp.error_message || 'Unknown error occurred.'}
            </p>
          </div>
        )}

        {/* results */}
        {report && !hasErrors && (
          <>
            {/* per-model perf */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(report.performance).map(([model, perf], i) => (
                <PerfCard key={model} model={model} perf={perf} delay={100 + i * 70} />
              ))}
            </section>

            {/* chart */}
            <section
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
              style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '220ms' }}
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 text-fuchsia-200 ring-1 ring-inset ring-white/10">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-lg font-semibold text-white">Metric Comparison</h2>
              </div>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                    barGap={6}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.92)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12,
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                        color: '#e2e8f0',
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend
                      wrapperStyle={{ color: '#cbd5e1', fontSize: 12, paddingTop: 8 }}
                      iconType="circle"
                    />
                    <Bar dataKey="Correctness" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Faithfulness" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Relevance" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Hallucination" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* recommendations */}
            <section
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
              style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '300ms' }}
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-200 ring-1 ring-inset ring-white/10">
                    <Sparkles size={16} />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Recommendations</h2>
                </div>

                <button
                  type="button"
                  onClick={downloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/25 hover:bg-white/[0.1]"
                >
                  <FileDown size={16} />
                  Download PDF
                </button>
              </div>

              {downloadError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Failed to download PDF. Please try again.</span>
                </div>
              )}

              <ul className="mt-5 space-y-3">
                {report.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.06]"
                    style={{
                      animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
                      animationDelay: `${340 + i * 60}ms`,
                    }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}