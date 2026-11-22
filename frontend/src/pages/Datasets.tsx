// evalforge-ai/frontend/src/pages/Datasets.tsx
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import api from '../api/client';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Inbox,
  Loader2,
  Plus,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  version: number;
  test_case_count: number;
  created_at: string;
}

type Message = { type: 'success' | 'error'; text: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = /\.(csv|json)$/i;

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = async () => {
    try {
      const { data } = await api.get('/datasets');
      setDatasets(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Could not load datasets. Please refresh.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // 1. Create dataset
      const { data: newDs } = await api.post('/datasets', {
        name: name.trim(),
        description: 'Uploaded via UI',
      });

      // 2. Upload test cases if a file is selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/datasets/${newDs.id}/upload`, formData);
      }

      setName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDatasets();
      setMessage({ type: 'success', text: `Dataset "${newDs.name}" created successfully.` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create dataset. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const acceptFile = (incoming: File | null) => {
    if (!incoming) return;
    if (!ACCEPTED.test(incoming.name)) {
      setMessage({ type: 'error', text: 'Please upload a .csv or .json file.' });
      return;
    }
    setMessage(null);
    setFile(incoming);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'question,expected_answer,context\n' +
      'What is the refund period?,7 days,Customers can request a refund within 7 days of purchase.\n' +
      'Is delivery free?,Yes for orders above 999,We offer free delivery for all orders above ₹999.\n' +
      'Can I cancel my order?,Yes before shipping,Orders can be cancelled at any time before they are shipped.';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'evalforge_sample_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalTestCases = datasets.reduce((sum, ds) => sum + ds.test_case_count, 0);

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
            Data
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              sets
            </span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Create a dataset, attach your test cases, and evaluate away.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md">
            <Database className="h-3.5 w-3.5 text-indigo-300" />
            {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {totalTestCases.toLocaleString()} test cases
          </div>
        </div>
      </header>

      {/* form card */}
      <form
        onSubmit={handleCreate}
        className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
        style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '80ms' }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">New Dataset</h2>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {/* name */}
          <div>
            <label
              htmlFor="dataset-name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Dataset Name
            </label>
            <input
              id="dataset-name"
              ref={nameInputRef}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Refund Policy Test Set"
              required
            />
          </div>

          {/* upload */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-300">Upload CSV / JSON</span>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
              >
                <Download className="h-3.5 w-3.5" />
                Download sample CSV
              </button>
            </div>

            <label
              htmlFor="dataset-file"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-2.5 transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-400/70 bg-indigo-500/10 ring-4 ring-indigo-500/20'
                  : file
                    ? 'border-emerald-400/40 bg-emerald-400/5 hover:bg-emerald-400/10'
                    : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
              }`}
            >
              <input
                id="dataset-file"
                type="file"
                accept=".csv,.json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="sr-only"
              />

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  file ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {file ? <FileSpreadsheet size={18} /> : <UploadCloud size={18} />}
              </div>

              <div className="min-w-0 flex-1">
                {file ? (
                  <>
                    <p className="truncate text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)} · ready to upload</p>
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm text-slate-300">
                      Drop a file here or <span className="text-indigo-300">browse</span>
                    </p>
                    <p className="text-xs text-slate-500">.csv or .json</p>
                  </>
                )}
              </div>

              {file && (
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove selected file"
                  className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>
        </div>

        {/* feedback */}
        {message && (
          <div
            role="status"
            className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
              message.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Dismiss message"
              className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !name.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Dataset
            </>
          )}
        </button>
      </form>

      {/* table card */}
      <div
        className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
        style={{ animation: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: '160ms' }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Version
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Test Cases
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div
                          className="h-4 animate-pulse rounded bg-white/10"
                          style={{ width: j === 0 ? '70%' : j === 3 ? '50%' : '30%' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                datasets.map((ds, index) => (
                  <tr
                    key={ds.id}
                    className="group transition-colors duration-200 hover:bg-white/[0.06]"
                    style={{
                      animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) both',
                      animationDelay: `${Math.min(index * 50, 400)}ms`,
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 ring-1 ring-inset ring-white/10 transition-colors duration-200 group-hover:text-indigo-200">
                          <Database size={16} />
                        </div>
                        <span className="font-medium text-white">{ds.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        v{ds.version}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-0.5 text-xs font-medium text-indigo-200 tabular-nums">
                        {ds.test_case_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(ds.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}

              {!isLoading && datasets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                        <Inbox size={24} />
                      </div>
                      <p className="mt-4 font-medium text-white">No datasets yet</p>
                      <p className="mt-1 max-w-xs text-sm text-slate-400">
                        Create your first dataset above to start evaluating your models.
                      </p>
                      <button
                        type="button"
                        onClick={() => nameInputRef.current?.focus()}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.1]"
                      >
                        <Plus className="h-4 w-4" />
                        Create your first dataset
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}