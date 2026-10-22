import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClaimById } from '../api/claims';
import { recordReturn, getItemReturn } from '../api/returns';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { cn } from '../utils/cn';
import ContactCard from '../components/claims/ContactCard';
import ReturnRecordCard from '../components/claims/ReturnRecordCard';
import RecordReturnDialog from '../components/claims/RecordReturnDialog';
import { Calendar, User, Package, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

const ClaimDetailPage = () => {
  const { id: claimId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: claim,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => getClaimById(claimId),
  });

  const {
    data: returnRecord,
    isLoading: isReturnLoading
  } = useQuery({
    queryKey: ['item-return', claim?.item?.id],
    queryFn: () => getItemReturn(claim?.item?.id),
    enabled: !!claim?.item?.id && claim?.item?.status === 'returned',
  });

  const returnMutation = useMutation({
    mutationFn: (data) => recordReturn(claimId, data),
    onSuccess: () => {
      toast.success('Return recorded successfully');
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['item', claim?.item?.id] });
      queryClient.invalidateQueries({ queryKey: ['item-return', claim?.item?.id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record return');
    },
  });

  if (isLoading) return <ClaimDetailSkeleton />;
  if (isError) return <ErrorState message="Could not load claim details" onRetry={refetch} />;
  if (!claim) return <ErrorState message="Claim not found" />;

  const statusColors = {
    pending: 'bg-cobalt-100 text-cobalt-700 border-cobalt-200',
    approved: 'bg-found-100 text-found-700 border-found-200',
    rejected: 'bg-danger-100 text-danger-700 border-danger-200',
  };

  const canRecordReturn =
    claim.status === 'approved' &&
    claim.item.status === 'claimed' &&
    (user?.role === 'admin' || claim.item.reporter.id === user?.id);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <section className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-line-500 hover:text-cobalt-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-ink">Claim Details</h1>
                <div className="flex items-center gap-2">
                  <Badge className={cn("px-3 py-1", statusColors[claim.status])}>
                    {claim.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-line-400">ID: {claim.id.slice(0, 8)}...</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-line-500 uppercase tracking-wider">Submitted</p>
                <p className="text-sm text-ink">{format(new Date(claim.created_at), 'PPP')}</p>
              </div>
            </div>

            <hr className="border-line" />

            <div className="space-y-6">
              <DetailRow
                icon={<Package className="w-4 h-4" />}
                label="Item"
                value={claim.item.title}
                link={`/items/${claim.item.id}`}
              />
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Claimant"
                value={claim.claimant.full_name}
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-line-500 uppercase tracking-wider block">
                  Ownership Proof
                </label>
                <div className="p-4 bg-paper border border-line rounded-2xl text-ink leading-relaxed italic">
                  "{claim.ownership_proof}"
                </div>
              </div>

              {claim.review_note && (
                <div className="p-4 bg-line-50 border border-line rounded-2xl space-y-1">
                  <p className="text-xs font-semibold text-line-500 uppercase tracking-wider">Reviewer Note</p>
                  <p className="text-sm text-ink italic">"{claim.review_note}"</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {claim.status === 'approved' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink px-2">Contact Information</h3>
              <ContactCard contact={claim.counterparty_contact} role={user?.role} />

              {claim.item.status === 'returned' ? (
                <ReturnRecordCard returnRecord={returnRecord} />
              ) : canRecordReturn ? (
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => setIsDialogOpen(true)}
                  disabled={returnMutation.isPending}
                >
                  Record Handover
                </Button>
              ) : null}
            </div>
          )}
          {claim.status !== 'approved' && (
            <div className="bg-surface border border-line rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-line-100 rounded-full flex items-center justify-center mx-auto text-line-400">
                <User size={24} />
              </div>
              <p className="text-sm text-line-500">
                Contact details will be revealed once the claim is approved.
              </p>
            </div>
          )}
        </section>
      </div>

      {isDialogOpen && (
        <RecordReturnDialog
          claimId={claimId}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={(data) => returnMutation.mutate(data)}
          isPending={returnMutation.isPending}
        />
      )}
    </main>
  );
};

const DetailRow = ({ icon, label, value, link }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-cobalt-600">{icon}</span>
        <span className="text-sm font-medium text-line-500">{label}</span>
      </div>
      {link ? (
        <a href={link} className="text-sm font-bold text-cobalt-600 hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-sm font-bold text-ink">{value}</span>
      )}
    </div>
  );
};

const ClaimDetailSkeleton = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="h-4 w-24 bg-line-100 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-line rounded-3xl p-6 space-y-6">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton width={150} height={24} />
                <Skeleton width={100} height={14} />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton width={60} height={12} />
                <Skeleton width={80} height={16} />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton width="100%" height={20} />
              <Skeleton width="100%" height={20} />
              <Skeleton width="100%" height={80} />
            </div>
          </div>
        </section>
        <section className="h-64 w-full bg-line-100 rounded-3xl animate-pulse" />
      </div>
    </main>
  );
};

export default ClaimDetailPage;
