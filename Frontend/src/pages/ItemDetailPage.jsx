
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getItemById, closeItem } from '../api/items';
import { getItemReturn } from '../api/returns';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Badge } from '../components/ui/Badge';
import {
  MapPin,
  Calendar,
  Tag,
  User,
  ArrowLeft,
  Edit3,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import ReturnRecordCard from '../components/claims/ReturnRecordCard';
import { toast } from 'sonner';

/**
 * @typedef {import('../api/types').ItemResponse} ItemResponse
 */

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: item,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemById(id),
  });

  const {
    data: returnRecord,
    isLoading: isReturnLoading
  } = useQuery({
    queryKey: ['item-return', id],
    queryFn: () => getItemReturn(id),
    enabled: !!item && item.status === 'returned',
  });

  const { mutateAsync: closeReport, isPending: isClosing } = useMutation({
    mutationFn: (itemId) => closeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      toast.success('Report closed successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to close report');
    },
  });

  if (isLoading && !item) return <ItemDetailSkeleton />;
  if (isError) return <ErrorState message="Could not load item details" onRetry={refetch} />;
  if (!item) return <ErrorState message="Item not found" />;

  const isReporter = user?.id === item.reporter.id;
  const isAdmin = user?.role === 'admin';

  const statusColors = {
    open: 'bg-cobalt-100 text-cobalt-700 border-cobalt-200',
    claimed: 'bg-found-100 text-found-700 border-found-200',
    returned: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-line-100 text-line-600 border-line-200',
  };

  const typeColors = {
    lost: 'bg-lost-100 text-lost-700',
    found: 'bg-found-100 text-found-700',
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <section className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-line-500 hover:text-cobalt-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to search</span>
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Image & Primary Info */}
        <section className="space-y-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-surface border border-line shadow-sm relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x600?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface text-line-400">
                <span>No image available</span>
              </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Badge className={cn("px-3 py-1", typeColors[item.item_type])}>
                {item.item_type.toUpperCase()}
              </Badge>
              <Badge className={cn("px-3 py-1 border", statusColors[item.status])}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-semibold text-ink">Quick Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <DetailItem icon={<MapPin className="w-4 h-4" />} label="Location" value={item.location} />
              <DetailItem
                icon={<Calendar className="w-4 h-4" />}
                label="Event Date"
                value={format(new Date(item.event_date), 'PPP')}
              />
              <DetailItem icon={<Tag className="w-4 h-4" />} label="Category" value={item.category.name} />
              <DetailItem icon={<User className="w-4 h-4" />} label="Reporter" value={item.reporter.full_name} />
            </div>
          </div>
        </section>

        {/* Right Column: Description & Actions */}
        <section className="flex flex-col space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-ink mb-2">{item.title}</h1>
            <p className="text-line-600 leading-relaxed text-lg">
              {item.description}
            </p>
          </div>

          {item.status === 'returned' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-line-500 uppercase tracking-wider">Return Details</h3>
              {isReturnLoading ? (
                <div className="h-32 w-full bg-line-100 rounded-3xl animate-pulse" />
              ) : (
                <ReturnRecordCard returnRecord={returnRecord} />
              )}
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-line flex flex-wrap gap-3">
            {!isReporter && (
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => user ? navigate(`/items/${id}/claim`) : navigate('/login')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit Claim
              </Button>
            )}

            {isReporter && (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => navigate(`/report/edit/${id}`)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Report
                </Button>
                <Button
                  variant="outline"
                  disabled={isClosing}
                  className="flex-1 text-danger hover:bg-danger-50 border-danger"
                  onClick={async () => {
                    if(window.confirm('Are you sure you want to close this report?')) {
                      try {
                        await closeReport(id);
                      } catch (e) {
                        // Error handled by mutation
                      }
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isClosing ? 'Closing...' : 'Close Report'}
                </Button>
              </>
            )}

            {isAdmin && (
              <Button
                variant="secondary"
                className="flex-1 bg-cobalt-600 text-white hover:bg-cobalt-700"
                onClick={() => navigate(`/admin/items/${id}`)}
              >
                Moderate Item
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="text-cobalt-600 mt-1">{icon}</div>
    <div className="flex flex-col">
      <p className="text-xs text-line-500 uppercase font-medium tracking-wider">{label}</p>
      <p className="text-ink font-medium">{value}</p>
    </div>
  </div>
);

const ItemDetailSkeleton = () => (
  <main className="max-w-4xl mx-auto px-4 py-8">
    <div className="h-4 w-32 bg-line-100 rounded animate-pulse mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="space-y-6">
        <div className="aspect-square rounded-2xl bg-line-100 animate-pulse" />
        <div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
          <div className="h-5 w-32 bg-line-100 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-line-100 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-line-100 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-line-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex flex-col space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-line-100 rounded animate-pulse" />
          <div className="h-4 w-full bg-line-100 rounded animate-pulse" />
          <div className="h-4 w-full bg-line-100 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-line-100 rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-6 border-t border-line flex gap-3">
          <div className="h-12 flex-1 bg-line-100 rounded-xl animate-pulse" />
          <div className="h-12 flex-1 bg-line-100 rounded-xl animate-pulse" />
        </div>
      </section>
    </div>
  </main>
);

export default ItemDetailPage;
