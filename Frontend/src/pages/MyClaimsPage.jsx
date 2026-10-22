import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyClaims } from '../api/claims';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import ClaimsList from '../components/claims/ClaimsList';

const MyClaimsPage = () => {
  const {
    data: claimsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['my-claims'],
    queryFn: () => getMyClaims(),
  });

  if (isLoading) return <MyClaimsSkeleton />;
  if (isError) return <ErrorState message="Could not load your claims" onRetry={refetch} />;

  const claims = claimsData?.data || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">My Claims</h1>
        <p className="text-line-600">Track the progress of your ownership claims.</p>
      </div>

      <ClaimsList
        claims={claims}
        viewMode="claimant"
        onClaimClick={(id) => window.location.href = `/claims/${id}`}
      />
    </div>
  );
};

const MyClaimsSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-12">
    <div className="text-center mb-10 space-y-3">
      <div className="h-8 w-48 bg-line-100 rounded-full mx-auto animate-pulse" />
      <div className="h-4 w-64 bg-line-100 rounded-full mx-auto animate-pulse" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 w-full bg-line-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  </div>
);

export default MyClaimsPage;
