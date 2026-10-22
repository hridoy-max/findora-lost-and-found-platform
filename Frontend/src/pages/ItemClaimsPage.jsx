import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItemClaims, reviewClaim } from '../api/claims';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/ui/ErrorState';
import { toast } from 'sonner';
import ClaimsList from '../components/claims/ClaimsList';
import ClaimReviewPanel from '../components/claims/ClaimReviewPanel';
import { Badge } from '../components/ui/Badge';
import { Package, ShieldCheck } from 'lucide-react';

const ItemClaimsPage = () => {
  const { id: itemId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedClaim, setSelectedClaim] = useState(null);

  const {
    data: claimsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['item-claims', itemId],
    queryFn: () => getItemClaims(itemId),
  });

  const mutation = useMutation({
    mutationFn: reviewClaim,
    onSuccess: () => {
      toast.success('Claim reviewed successfully');
      queryClient.invalidateQueries({ queryKey: ['item-claims', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to review claim');
    },
  });

  const handleReview = (claimId, reviewData) => {
    mutation.mutate({ claimId, data: reviewData });
  };

  if (isLoading) return <ItemClaimsSkeleton />;
  if (isError) return <ErrorState message="Could not load claims" onRetry={refetch} />;

  const claims = claimsData?.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-ink">Manage Claims</h1>
          <p className="text-line-600">Review ownership proof and verify claims for this item.</p>
        </div>
        <Badge className="px-4 py-2 bg-cobalt-100 text-cobalt-700 border-cobalt-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span className="uppercase text-[10px] font-bold">Reporter View</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ClaimsList
            claims={claims}
            viewMode="reporter"
            onClaimClick={(id) => setSelectedClaim(id)}
          />
        </div>
        <div className="lg:col-span-1">
          {selectedClaim ? (
            <ClaimReviewPanel
              claim={claims.find(c => c.id === selectedClaim)}
              onReview={(data) => handleReview(selectedClaim, data)}
              isReviewing={mutation.isPending}
            />
          ) : (
            <div className="bg-surface border border-line rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-line-50 rounded-full flex items-center justify-center mx-auto text-line-300">
                <Package size={32} />
              </div>
              <p className="text-sm text-line-500">Select a claim from the list to review the proof and make a decision.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ItemClaimsSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 py-12">
    <div className="h-8 w-48 bg-line-100 rounded animate-pulse mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 w-full bg-line-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 w-full bg-line-100 rounded-3xl animate-pulse" />
    </div>
  </div>
);

export default ItemClaimsPage;
