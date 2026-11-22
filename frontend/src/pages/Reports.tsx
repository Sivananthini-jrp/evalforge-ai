// evalforge-ai/frontend/src/pages/Reports.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

type Experiment = {
  id: string;
  name: string;
  status: string;
  completed_at?: string | null;
};

export default function Reports() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

      <div className="mx-auto max-w-4xl">
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

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Completed{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                Reports
              </span>
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Browse the results of your finished experiments.
            </p>
          </div>

          {!isLoading && experiments.length > 0 && (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md sm:self-auto">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {experiments.length} {experiments.length === 1 ? 'report' : 'reports'} ready
            </div>
          )}
        </header>

        {/* list */}
        <div className="mt-8 space-y-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-2/5 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-white/[0.07]" />
                  </div>
                </div>
                <div className="h-9 w-28 animate-pulse rounded-lg bg-white/10" />
              </div>
            ))}

          {!isLoading &&
            experiments.map((exp, i) => (
              <div
                key={exp.id}
                className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1] hover:shadow-xl hover:shadow-indigo-500/10"
                style={{
                  animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
                  animationDelay: `${Math.min(i * 60, 400)}ms`,
                }}
              >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-200 ring-1 ring-inset ring-white/10 transition-colors duration-200 group-hover:text-indigo-100">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{exp.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-slate-400">
                      {exp.completed_at
                        ? new Date(exp.completed_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Completed'}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/experiments/${exp.id}`}
                  className="relative inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/25 hover:bg-white/[0.1]"
                >
                  View Report
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}

          {/* empty state */}
          {!isLoading && experiments.length === 0 && (
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-16 text-center backdrop-blur-xl"
              style={{ animation: 'fadeUp .6s cubic-bezier(.22,1,.36,1) both' }}
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                <Inbox size={24} />
              </div>

              <p className="mt-4 font-medium text-white">No completed reports yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
                Finish an experiment to see its results and recommendations here.
              </p>

              <Link
                to="/experiments/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.1]"
              >
                <ClipboardList className="h-4 w-4 text-indigo-300" />
                Start an experiment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}