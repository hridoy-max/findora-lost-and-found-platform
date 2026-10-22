
import { useQuery } from '@tanstack/react-query';
import { getUserDashboard } from '../api/users';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Package, Search, PlusCircle, MessageSquare } from 'lucide-react';
import StatCard from '../components/admin/StatCard';
import RecentItemsList from '../components/dashboard/RecentItemsList';
import PendingClaimsSection from '../components/dashboard/PendingClaimsSection';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: getUserDashboard,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState message="Could not load your dashboard" onRetry={refetch} />;
  if (!data) return <ErrorState message="Dashboard data unavailable" />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-ink">Welcome back!</h1>
          <p className="text-line-600">Here is a summary of your activity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/items')}>
            <Search className="w-4 h-4 mr-2" />
            Browse
          </Button>
          <Button variant="primary" onClick={() => navigate('/report/new')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Report Item
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Reports"
          value={data.my_items_total}
          icon={Package}
        />
        <StatCard
          label="Open Reports"
          value={data.my_items_by_status?.open || 0}
          icon={Package}
        />
        <StatCard
          label="Items Returned"
          value={data.my_items_by_status?.returned || 0}
          icon={Package}
        />
        <StatCard
          label="Pending Claims"
          value={data.my_claims_by_status?.pending || 0}
          icon={MessageSquare}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-ink">My Recent Reports</h3>
          <RecentItemsList items={data.recent_items} />
        </section>
        <section className="lg:col-span-1">
          <PendingClaimsSection
            claims={data.pending_claims_on_my_items?.recent || []}
          />
        </section>
      </div>
    </main>
  );
};

const DashboardSkeleton = () => (
  <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
    <header className="flex justify-between items-end">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-line-100 rounded animate-pulse" />
        <div className="h-4 w-64 bg-line-100 rounded animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-line-100 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-line-100 rounded-xl animate-pulse" />
      </div>
    </header>
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 w-full bg-line-100 rounded-3xl animate-pulse" />
      ))}
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-6 w-40 bg-line-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 w-full bg-line-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-64 w-full bg-line-100 rounded-3xl animate-pulse" />
    </div>
  </main>
);

export default DashboardPage;
