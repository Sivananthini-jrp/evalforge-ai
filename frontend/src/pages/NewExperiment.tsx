// evalforge-ai/frontend/src/pages/NewExperiment.tsx
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  FlaskConical,
  Loader2,
  Play,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';

type Dataset = { id: string; name: string; test_case_count: number };
type Model = { id: string; display_name: string; provider: string; model_name: string };

export default function NewExperiment() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState({
    name: '',
    dataset_id: '',
    model_ids: [] as string[],
    prompt_template:
      'Answer the question using only the context.\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/datasets'), api.get('/models')])
      .then(([dsRes, mRes]) => {
        setDatasets(dsRes.data);
        setModels(mRes.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load datasets or models. Please refresh.');
      });
  }, []);

  const toggleModel = (id: string) => {
    setForm((f) => ({
      ...f,
      model_ids: f.model_ids.includes(id)
        ? f.model_ids.filter((x) => x !== id)
        : [...f.model_ids, id],
    }));
  };

  // live prompt-template validation
  const promptChecks = useMemo(
    () => ({
      context: form.prompt_template.includes('{context}'),
      question: form.prompt_template.includes('{question}'),
    }),
    [form.prompt_template],
  );

  const promptValid = promptChecks.context && promptChecks.question;
  const canSubmit =
    !!form.name.trim() &&
    !!form.dataset_id &&
    form.model_ids.length > 0 &&
    promptValid &&
    !isSubmitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.model_ids.length === 0) {
      setError('Select at least one model to evaluate.');
      return;
    }
    if (!promptValid) {
      setError('Prompt template must include {context} and {question}.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/experiments', form);
      navigate(`/experiments/${data.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to start experiment. Please try again.');
      setIsSubmitting(false);
    }
  };

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
          className="absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-emerald-400/20 blur-3xl"
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

      <form
        onSubmit={submit}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl shadow-2xl shadow-black/40 sm:p-8"
        style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both' }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* header */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            EvalForge AI
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/40">
              <FlaskConical size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                New{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                  Experiment
                </span>
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Pick a dataset, choose models, and run your evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative space-y-6">
          {/* name */}
          <div>
            <label
              htmlFor="exp-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Experiment Name
            </label>
            <input
              id="exp-name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20"
              placeholder="e.g., Llama vs Gemini on Refund Policy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* dataset */}
          <div>
            <label
              htmlFor="exp-dataset"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Dataset
            </label>
            <div className="group relative">
              <Database className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-300" />
              <select
                id="exp-dataset"
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20 [&>option]:bg-slate-900 [&>option]:text-white"
                value={form.dataset_id}
                onChange={(e) => setForm({ ...form, dataset_id: e.target.value })}
                required
              >
                <option value="">Select a dataset...</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.test_case_count} cases)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {/* models */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Models to Evaluate</label>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-slate-300">
                <Cpu className="h-3 w-3 text-indigo-300" />
                {form.model_ids.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {models.map((m, i) => {
                const active = form.model_ids.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-200 ${
                      active
                        ? 'border-indigo-400/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                    style={{
                      animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
                      animationDelay: `${120 + i * 60}ms`,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      onChange={() => toggleModel(m.id)}
                    />

                    {/* custom checkbox */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
                        active
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-white/25 bg-white/[0.04] text-transparent group-hover:border-white/40'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {m.display_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {m.provider} / {m.model_name}
                      </p>
                    </div>
                  </label>
                );
              })}

              {models.length === 0 && (
                <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-slate-400">
                  No models available.
                </div>
              )}
            </div>
          </div>

          {/* prompt template */}
          <div>
            <label
              htmlFor="exp-prompt"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Prompt Template
            </label>
            <div className="relative">
              <Terminal className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <textarea
                id="exp-prompt"
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 font-mono text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20"
                rows={7}
                value={form.prompt_template}
                onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">Requires:</span>
              <VariableChip label="{context}" valid={promptChecks.context} />
              <VariableChip label="{question}" valid={promptChecks.question} />
            </div>
          </div>

          {/* error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 backdrop-blur-md"
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

          {/* submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Experiment
              </>
            )}
          </button>

          {!canSubmit && !isSubmitting && (
            <p className="text-center text-xs text-slate-500">
              {form.model_ids.length === 0
                ? 'Select at least one model to continue.'
                : !promptValid
                  ? 'Prompt template must include {context} and {question}.'
                  : !form.dataset_id
                    ? 'Select a dataset to continue.'
                    : 'Fill in all fields to continue.'}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

/* ---------- small pieces ---------- */

function VariableChip({ label, valid }: { label: string; valid: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium transition-colors ${
        valid
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
          : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      }`}
    >
      {valid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}