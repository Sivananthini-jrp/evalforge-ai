// evalforge-ai/frontend/src/pages/Dashboard.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Database,
  FlaskConical,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  UploadCloud,
  Play,
} from 'lucide-react';

type Stats = { datasets: number; experiments: number };

/* ---------- helpers ---------- */

const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Smoothly animates a number from its previous value to `target`. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/* ---------- sub-components ---------- */

type StatCardProps = {
  to: string;
  label: string;
  hint: string;
  value: number;
  icon: ReactNode;
  tileClass: string;
  glowClass: string;
  loading: boolean;
  delay: number;
};

function StatCard({
  to,
  label,
  hint,
  value,
  icon,
  tileClass,
  glowClass,
  loading,
  delay,
}: StatCardProps) {
  const count = useCountUp(value);

  return (
    <Link
      to={to}
      style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1] hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      {/* top glass highlight */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {/* hover glow orb */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-90 group-hover:scale-125 ${glowClass}`}
      />

      <div className="relative flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg ${tileClass}`}>
          {icon}
        </div>
        <ArrowUpRight className="h-5 w-5 text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </div>

      <p className="relative mt-6 text-sm font-medium text-slate-400">{label}</p>

      {loading ? (
        <div className="relative mt-2 h-10 w-24 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="relative mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">
          {count}
        </p>
      )}

      <p className="relative mt-3 text-xs text-slate-500">{hint}</p>
    </Link>
  );
}

type ActionCardProps = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  tileClass: string;
  delay: number;
};

function ActionCard({ to, title, description, icon, tileClass, delay }: ActionCardProps) {
  return (
    <Link
      to={to}
      style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${delay}ms` }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1] hover:shadow-xl hover:shadow-black/20"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${tileClass}`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-sm text-slate-400">{description}</p>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
    </Link>
  );
}

/* ---------- page ---------- */

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ datasets: 0, experiments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const [dsRes, expRes] = await Promise.all([
          api.get('/datasets'),
          api.get('/experiments'),
        ]);
        if (!cancelled) {
          setStats({
            datasets: dsRes.data.length,
            experiments: expRes.data.length,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* local keyframes so the file stays self-contained */}
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

      {/* ambient background blobs */}
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
        {/* subtle grid texture */}
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
            {greeting()},{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              welcome back
            </span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">{today} · Your workspace at a glance</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          All systems operational
        </div>
      </header>

      {/* stat cards */}
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard
          to="/datasets"
          label="Total Datasets"
          hint="Click to browse your dataset library"
          value={stats.datasets}
          loading={loading}
          delay={80}
          icon={<Database size={22} />}
          tileClass="bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40"
          glowClass="bg-indigo-500/40"
        />
        <StatCard
          to="/experiments"
          label="Experiments Run"
          hint="Click to review experiment history"
          value={stats.experiments}
          loading={loading}
          delay={160}
          icon={<FlaskConical size={22} />}
          tileClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40"
          glowClass="bg-emerald-500/40"
        />
      </section>

      {/* quick start */}
      <section
        className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
        style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '240ms' }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">Quick Start</h2>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Two steps to your first evaluation run.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ActionCard
            to="/datasets"
            title="Upload a Dataset"
            description="Import CSV or JSON to get started"
            icon={<UploadCloud size={20} />}
            tileClass="bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40"
            delay={300}
          />
          <ActionCard
            to="/experiments/new"
            title="Run an Experiment"
            description="Compare models against your data"
            icon={<Play size={20} />}
            tileClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40"
            delay={360}
          />
        </div>
      </section>
    </div>
  );
}