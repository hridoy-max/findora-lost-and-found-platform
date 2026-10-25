import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getItemById, closeItem } from '../api/items';
import { getItemReturn } from '../api/returns';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import {
  MapPin,
  Calendar,
  Tag,
  User,
  ArrowLeft,
  Edit3,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Search,
  PackageCheck,
  ImageOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import ReturnRecordCard from '../components/claims/ReturnRecordCard';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Full class strings so Tailwind can detect them.
const TYPE_THEME = {
  lost: {
    label: 'Lost',
    icon: Search,
    text: 'text-cobalt',
    soft: 'bg-cobalt/10',
    border: 'border-cobalt/30',
    solid: 'bg-cobalt text-white hover:bg-cobalt/90',
  },
  found: {
    label: 'Found',
    icon: PackageCheck,
    text: 'text-found',
    soft: 'bg-found/10',
    border: 'border-found/30',
    solid: 'bg-found text-white hover:bg-found/90',
  },
};

const STATUS_THEME = {
  open: { label: 'Open', className: 'bg-cobalt/10 text-cobalt border-cobalt/30' },
  claimed: { label: 'Claimed', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  returned: { label: 'Returned', className: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: 'Closed', className: 'bg-ink/5 text-ink/60 border-line' },
};

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600?text=No+Image';

const formatDate = (value) => {
  try {
    return format(new Date(value), 'PPP');
  } catch {
    return 'Not specified';
  }
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: item, isLoading, isError, refetch } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemById(id),
  });

  const { data: returnRecord, isLoading: isReturnLoading } = useQuery({
    queryKey: ['item-return', id],
    queryFn: () => getItemReturn(id),
    enabled: !!item && item.status === 'returned',
  });

  const { mutateAsync: closeReport, isPending: isClosing } = useMutation({
    mutationFn: (itemId) => closeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Report closed successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to close report');
    },
  });

  if (isLoading && !item) return <ItemDetailSkeleton />;

  if (isError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <ErrorState message="Could not load item details" onRetry={refetch} />
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <ErrorState message="Item not found" />
      </main>
    );
  }

  const theme = TYPE_THEME[item.item_type] || TYPE_THEME.lost;
  const TypeIcon = theme.icon;
  const status = STATUS_THEME[item.status] || STATUS_THEME.open;

  const isReporter = !!user && user.id === item.reporter?.id;
  const isAdmin = user?.role === 'admin';
  const isActive = item.status === 'open' || item.status === 'claimed';
  const canClaim = !isReporter && isActive;

  const handleClaim = () => {
    if (user) navigate(`/items/${id}/claim`);
    else navigate('/login');
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close this report?')) return;
    try {
      await closeReport(id);
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={cn(
            'group inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70',
            theme.text
          )}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to results
        </button>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* ---------------- Left: image ---------------- */}
          <section aria-label="Item photo" className="lg:sticky lg:top-24 lg:self-start">
            <div
              className={cn(
                'aspect-square overflow-hidden rounded-2xl border border-t-4 bg-surface shadow-sm',
                theme.border,
                item.item_type === 'found' ? 'border-t-found' : 'border-t-cobalt'
              )}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/40">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-sm">No image available</span>
                </div>
              )}
            </div>
          </section>

          {/* ---------------- Right: content ---------------- */}
          <div className="space-y-6">
            {/* Header */}
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
                    theme.soft,
                    theme.text
                  )}
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  {theme.label} item
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                    status.className
                  )}
                >
                  {status.label}
                </span>
              </div>

              <h1
                className={cn(
                  'mt-4 text-3xl font-headings font-bold tracking-tight md:text-4xl',
                  theme.text
                )}
              >
                {item.title}
              </h1>
            </header>

            {/* Description */}
            <section aria-labelledby="description-heading">
              <h2
                id="description-heading"
                className="text-sm font-semibold uppercase tracking-wider text-ink/50"
              >
                Description
              </h2>
              <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-ink/80">
                {item.description}
              </p>
            </section>

            {/* Details */}
            <section
              aria-labelledby="details-heading"
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
            >
              <h2 id="details-heading" className="text-lg font-headings font-semibold text-ink">
                Item details
              </h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <DetailItem
                  icon={MapPin}
                  label={item.item_type === 'found' ? 'Found at' : 'Last seen at'}
                  value={item.location}
                  theme={theme}
                />
                <DetailItem
                  icon={Calendar}
                  label="Date"
                  value={formatDate(item.event_date)}
                  theme={theme}
                />
                <DetailItem icon={Tag} label="Category" value={item.category?.name} theme={theme} />
                <DetailItem
                  icon={User}
                  label="Reported by"
                  value={item.reporter?.full_name}
                  theme={theme}
                />
              </dl>
            </section>

            {/* Return record */}
            {item.status === 'returned' && (
              <section aria-labelledby="return-heading" className="space-y-3">
                <h2
                  id="return-heading"
                  className="text-sm font-semibold uppercase tracking-wider text-green-700"
                >
                  Return details
                </h2>
                {isReturnLoading ? (
                  <div className="h-32 w-full animate-pulse rounded-2xl bg-ink/10" />
                ) : (
                  <ReturnRecordCard returnRecord={returnRecord} />
                )}
              </section>
            )}

            {/* Actions */}
            <section
              aria-labelledby="actions-heading"
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
            >
              <h2 id="actions-heading" className="text-lg font-headings font-semibold text-ink">
                {isReporter ? 'Manage your report' : 'Is this yours?'}
              </h2>

              {!isReporter && (
                <p className="mt-1 text-sm leading-relaxed text-ink/60">
                  {canClaim
                    ? item.item_type === 'found'
                      ? 'If this item belongs to you, submit a claim with details that prove ownership.'
                      : 'If you have found this item, submit a claim so the owner can contact you.'
                    : 'This report is no longer accepting claims.'}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {!isReporter && (
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!canClaim}
                    className={cn('flex-1', canClaim && theme.solid)}
                    onClick={handleClaim}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {user ? 'Submit claim' : 'Sign in to submit a claim'}
                  </Button>
                )}

                {isReporter && (
                  <>
                    <Button
                      variant="secondary"
                      className={cn('flex-1 border', theme.soft, theme.text, theme.border)}
                      onClick={() => navigate(`/report/edit/${id}`)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit report
                    </Button>
                    {isActive && (
                      <Button
                        variant="outline"
                        disabled={isClosing}
                        className="flex-1 border-danger text-danger hover:bg-danger/10"
                        onClick={handleClose}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {isClosing ? 'Closing...' : 'Close report'}
                      </Button>
                    )}
                  </>
                )}

                {isAdmin && (
                  <Button
                    variant="secondary"
                    className="flex-1 bg-ink text-white hover:bg-ink/90"
                    onClick={() => navigate(`/admin/items/${id}`)}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Moderate item
                  </Button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const DetailItem = ({ icon: Icon, label, value, theme }) => (
  <div className="flex items-start gap-3">
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        theme.soft,
        theme.text
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-ink/50">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-ink">{value || 'Not specified'}</dd>
    </div>
  </div>
);

const Bar = ({ className = '' }) => (
  <div className={cn('animate-pulse rounded-lg bg-ink/10', className)} />
);

const ItemDetailSkeleton = () => (
  <main className="min-h-screen bg-paper" aria-busy="true">
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Bar className="h-4 w-32" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Bar className="aspect-square w-full rounded-2xl" />
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Bar className="h-6 w-24 rounded-full" />
              <Bar className="h-6 w-20 rounded-full" />
            </div>
            <Bar className="h-9 w-3/4" />
          </div>
          <div className="space-y-2">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-1/2" />
          </div>
          <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
            <Bar className="h-5 w-32" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bar className="h-9 w-9" />
                  <div className="flex-1 space-y-2">
                    <Bar className="h-3 w-16" />
                    <Bar className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Bar className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </main>
);

export default ItemDetailPage;