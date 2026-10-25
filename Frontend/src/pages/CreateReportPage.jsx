import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  MapPin,
  ShieldCheck,
  FileText,
  Search,
  PackageCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCategories } from '../api/categories';
import { createItem } from '../api/items';
import ItemForm from '../components/forms/ItemForm';
import { ErrorState } from '../components/ui/ErrorState';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Full class strings so Tailwind can detect them.
const THEME = {
  lost: {
    label: 'I lost something',
    badge: 'Lost item',
    icon: Search,
    text: 'text-cobalt',
    soft: 'bg-cobalt/10',
    border: 'border-cobalt/30',
    buttonActive: 'bg-cobalt text-white border-cobalt shadow-sm',
    buttonIdle: 'bg-surface text-cobalt border-cobalt/30 hover:bg-cobalt/10',
    title: 'Report a lost item',
    description:
      'Tell us what you lost and where you last saw it. Your report will appear on the community board so anyone who finds it can contact you.',
  },
  found: {
    label: 'I found something',
    badge: 'Found item',
    icon: PackageCheck,
    text: 'text-found',
    soft: 'bg-found/10',
    border: 'border-found/30',
    buttonActive: 'bg-found text-white border-found shadow-sm',
    buttonIdle: 'bg-surface text-found border-found/30 hover:bg-found/10',
    title: 'Report a found item',
    description:
      'Tell us what you found and where. Your report helps the owner recognize their belongings and claim them safely.',
  },
};

const TIPS = [
  {
    icon: FileText,
    title: 'Be specific',
    text: 'Include the brand, color, size, and any distinguishing marks.',
  },
  {
    icon: MapPin,
    title: 'Add the location and time',
    text: 'Note where and roughly when the item was lost or found.',
  },
  {
    icon: Camera,
    title: 'Upload a clear photo',
    text: 'A well-lit photo helps owners recognize their item quickly.',
  },
  {
    icon: ShieldCheck,
    title: 'Protect private details',
    text: 'Leave out serial or ID numbers. Use them later to verify ownership.',
  },
];

/** Turn an API error into a readable message (handles FastAPI 422 arrays). */
const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    const field = Array.isArray(first?.loc) ? first.loc[first.loc.length - 1] : null;
    return field ? `${field}: ${first.msg}` : first.msg;
  }
  return 'Failed to submit the report. Please try again.';
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const CreateReportPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const reportType = searchParams.get('type') === 'found' ? 'found' : 'lost';
  const theme = THEME[reportType];
  const TypeIcon = theme.icon;

  const {
    data: categoryData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      toast.success('Your report has been submitted.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['home-recent-items'] });
      navigate(`/items/${newItem.id}`);
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error(getErrorMessage(error));
    },
  });

  const handleFormSubmit = (data) => mutation.mutate(data);

  const handleTypeChange = (type) => {
    setSearchParams({ type }, { replace: true });
  };

  if (categoriesLoading) return <ReportPageSkeleton />;

  if (categoriesError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Unable to load the form"
          message="We could not load the item categories. Please try again."
          onRetry={refetchCategories}
        />
      </main>
    );
  }

  const categories = Array.isArray(categoryData)
    ? categoryData
    : (categoryData?.data && Array.isArray(categoryData.data))
      ? categoryData.data
      : [];

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Back link */}
        <Link
          to="/items"
          className={`inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70 ${theme.text}`}
        >
          <ArrowLeft size={16} />
          Back to items
        </Link>

        {/* Header */}
        <header className="mt-6 max-w-3xl">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${theme.soft} ${theme.text}`}
          >
            <TypeIcon size={14} />
            {theme.badge}
          </span>

          <h1
            className={`mt-4 text-3xl font-headings font-bold tracking-tight md:text-4xl ${theme.text}`}
          >
            {theme.title}
          </h1>

          <p className="mt-3 leading-relaxed text-ink/70">{theme.description}</p>

          <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink/50">
            <Clock size={15} />
            Takes about two minutes. Fields marked * are required.
          </p>
        </header>

        {/* Report type switch */}
        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-ink/60">What would you like to report?</p>
          <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-3">
            {Object.entries(THEME).map(([value, t]) => {
              const active = reportType === value;
              const Icon = t.icon;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTypeChange(value)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    active ? t.buttonActive : t.buttonIdle
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            aria-label="Item details form"
            className={`rounded-2xl border border-t-4 bg-surface p-6 shadow-sm md:p-10 ${theme.border} ${
              reportType === 'lost' ? 'border-t-cobalt' : 'border-t-found'
            }`}
          >
            <ItemForm
              key={reportType}
              defaultType={reportType}
              onSubmit={handleFormSubmit}
              isSubmitting={mutation.isPending}
              categories={categories}
            />
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className={`text-lg font-headings font-semibold ${theme.text}`}>
                Tips for a good report
              </h2>
              <ul className="mt-5 space-y-5">
                {TIPS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.soft} ${theme.text}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink/60">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

const Bar = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-ink/10 ${className}`} />
);

const ReportPageSkeleton = () => (
  <main className="min-h-screen bg-paper" aria-busy="true">
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Bar className="h-4 w-28" />
      <div className="mt-6 space-y-3">
        <Bar className="h-6 w-24 rounded-full" />
        <Bar className="h-9 w-64" />
        <Bar className="h-4 w-full max-w-lg" />
      </div>
      <div className="mt-8 flex gap-3">
        <Bar className="h-11 w-44 rounded-lg" />
        <Bar className="h-11 w-44 rounded-lg" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8 rounded-2xl border border-line bg-surface p-6 md:p-10">
          <Bar className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Bar className="h-12 w-full rounded-xl" />
            <Bar className="h-12 w-full rounded-xl" />
          </div>
          <Bar className="h-32 w-full rounded-xl" />
          <Bar className="h-12 w-full rounded-xl" />
          <Bar className="h-40 w-full rounded-xl" />
          <Bar className="ml-auto h-12 w-32 rounded-xl" />
        </div>
        <div className="hidden space-y-4 rounded-2xl border border-line bg-surface p-6 lg:block">
          <Bar className="h-5 w-40" />
          <Bar className="h-14 w-full" />
          <Bar className="h-14 w-full" />
          <Bar className="h-14 w-full" />
        </div>
      </div>
    </div>
  </main>
);

export default CreateReportPage;