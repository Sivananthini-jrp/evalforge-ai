// evalforge-ai/frontend/src/pages/Compare.tsx
import { useEffect, useState, type FormEvent } from 'react';
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
  AlertCircle,
  CheckCircle2,
  Crown,
  GitCompare,
  Loader2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

type Experiment = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type ModelMetrics = {
  correctness?: { avg?: number };
  faithfulness?: { avg?: number };
  relevance?: { avg?: number };
  hallucination_rate?: { avg?: number };
};

type Report = {
  per_model_metrics: Record<string, ModelMetrics>;
};

type ComparisonRow = {
  name: string;
  Correctness: number;
  Faithfulness: number;
  Relevance: number;
  Hallucination: number;
};

const METRIC_KEYS: { key: keyof ComparisonRow; label: string; higherIsBetter: boolean }[] = [
  { key: 'Correctness', label: 'Correctness', higherIsBetter: true },
  { key: 'Faithfulness', label: 'Faithfulness', higherIsBetter: true },
  { key: 'Relevance', label: 'Relevance', higherIsBetter: true },
  { key: 'Hallucination', label: 'Hallucination', higherIsBetter: false },
];

export default function Compare() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .get('/experiments')
      .then((res) => {
        if (cancelled) return;
        setExperiments(
          (res.data as Experiment[]).filter((e) => e.status === 'completed'),
        );
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load experiments. Please refresh.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExperiments(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelection = (id: string) => {
    setError('');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Select at least 2 experiments to compare.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const reports = await Promise.all(
        selectedIds.map((id) =>
          api.get(`/reports/${id}`).then((r) => ({ id, data: r.data as Report })),
        ),
      );

      const data: ComparisonRow[] = reports.map((r) => {
        const exp = experiments.find((e) => e.id === r.id);

        let correctness = 0;
        let faithfulness = 0;
        let relevance = 0;
        let hallucination = 0;
        let count = 0;

        Object.values(r.data.per_model_metrics).forEach((m) => {
          correctness += m.correctness?.avg || 0;
          faithfulness += m.faithfulness?.avg || 0;
          relevance += m.relevance?.avg || 0;
          hallucination += m.hallucination_rate?.avg || 0;
          count++;
        });

        return {
          name: exp?.name || 'Unknown',
          Correctness: count ? (correctness / count) * 100 : 0,
          Faithfulness: count ? (faithfulness / count) * 100 : 0,
          Relevance: count ? (relevance / count) * 100 : 0,
          Hallucination: count ? (hallucination / count) * 100 : 0,
        };
      });

      setComparisonData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load comparison data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // best experiment by higher-is-better metrics, lower hallucination
  const winner =
    comparisonData.length > 0
      ? comparisonData.reduce((best, row) => {
          const score = (r: ComparisonRow) =>
            (r.Correctness + r.Faithfulness + r.Relevance - r.Hallucination) / 4;
          return score(row) > score(best) ? row : best;
        })
      : null;

  const canCompare = selectedIds.length >= 2 && !loading;

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

      <div className="mx-auto max-w-6xl">
        {/* header */}
        <header
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both' }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              EvalForge AI
            </div>

            <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white shadow-lg shadow-fuchsia-600/30">
                <GitCompare size={22} />
              </span>
              Compare{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                Experiments
              </span>
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Select two or more completed experiments to see how they stack up.
            </p>
          </div>

          {selectedIds.length > 0 && (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur-md sm:self-auto">
              <GitCompare className="h-3.5 w-3.5" />
              {selectedIds.length} selected
            </div>
          )}
        </header>

        {/* selection card */}
        <section
          className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
          style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '80ms' }}
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-300" />
            <h2 className="text-lg font-semibold text-white">Select Experiments</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingExperiments &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="h-5 w-5 shrink-0 animate-pulse rounded-md bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.07]" />
                  </div>
                </div>
              ))}

            {!isLoadingExperiments &&
              experiments.map((exp, i) => {
                const active = selectedIds.includes(exp.id);
                return (
                  <label
                    key={exp.id}
                    className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-200 ${
                      active
                        ? 'border-indigo-400/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                    style={{
                      animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
                      animationDelay: `${120 + i * 50}ms`,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      onChange={() => toggleSelection(exp.id)}
                    />

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
                        active
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-white/25 bg-white/[0.04] text-transparent group-hover:border-white/40'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{exp.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(exp.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </label>
                );
              })}
          </div>

          {!isLoadingExperiments && experiments.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="font-medium text-white">No completed experiments found</p>
              <p className="mt-1 text-sm text-slate-400">
                Run a few first, then come back to compare them.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 backdrop-blur-md"
              style={{ animation: 'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error"
                className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" />
                Compare Selected
              </>
            )}
          </button>
        </section>

        {/* results */}
        {comparisonData.length > 0 && (
          <>
            {/* winner + summary */}
            {winner && (
              <div
                className="relative mt-6 overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-5 backdrop-blur-xl"
                style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both', animationDelay: '160ms' }}
              >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/30 blur-3xl" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                    <Crown size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                      Top performer
                    </p>
                    <p className="truncate text-lg font-semibold text-white">{winner.name}</p>
                  </div>
                  <Trophy className="ml-auto hidden h-6 w-6 text-amber-300 sm:block" />
                </div>
              </div>
            )}

            {/* chart */}
            <section
              className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
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
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={comparisonData}
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

              {/* metric legend note */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                {METRIC_KEYS.map((m) => (
                  <span key={m.key} className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        m.higherIsBetter ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    {m.label} {m.higherIsBetter ? '↑ higher is better' : '↓ lower is better'}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}