import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminItemById, updateAdminItemStatus, deleteAdminItem } from '../../api/admin';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  ShieldCheck,
  XCircle,
  CheckCircle,
  Trash2,
  Package,
  User,
  Calendar,
  MapPin,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const AdminItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: item, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-item', id],
    queryFn: () => getAdminItemById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateAdminItemStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-item', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('Item status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteAdminItem(itemId),
    onSuccess: () => {
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      navigate('/admin/items');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete item');
    },
  });

  if (isLoading) return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt" /></div>;
  if (isError) return <ErrorState message="Could not load item details" onRetry={refetch} />;
  if (!item) return <ErrorState message="Item not found" />;

  return (
    <main className="p-6 space-y-8">
      <header className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-cobalt hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          Back to list
        </button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-danger border-danger hover:bg-danger/10"
            onClick={() => {
              if(window.confirm('Permanently delete this report?')) {
                deleteMutation.mutate(id);
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} className="mr-2" />
            Delete Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={item.item_type === 'found' ? 'found' : 'cobalt'}>
                    {item.item_type}
                  </Badge>
                  <Badge variant="gray">{item.status}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-ink">{item.title}</h1>
              </div>
            </div>

            <p className="text-lg text-ink/80 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line">
              <div className="flex items-center gap-3 text-sm text-ink/70">
                <MapPin size={16} />
                <span>{item.location || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink/70">
                <Calendar size={16} />
                <span>{item.event_date ? format(new Date(item.event_date), 'PPP') : 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink/70">
                <Tag size={16} />
                <span>{item.category?.name || 'Uncategorized'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink/70">
                <User size={16} />
                <span>{item.reporter?.full_name || 'Unknown'}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-ink">Moderation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink/60">Change Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['open', 'closed'].map(status => (
                    <Button
                      key={status}
                      variant={item.status === status ? 'primary' : 'secondary'}
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminItemDetailPage;
