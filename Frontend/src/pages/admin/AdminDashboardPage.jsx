import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '../../api/admin';
import { ErrorState } from '../../components/ui/ErrorState';
import StatCard from '../../components/admin/StatCard';
import ItemsByCategoryChart from '../../components/admin/ItemsByCategoryChart';
import ItemsOverTimeChart from '../../components/admin/ItemsOverTimeChart';
import ClaimsByStatusChart from '../../components/admin/ClaimsByStatusChart';
import {
  Users,
  Package,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AdminDashboardPage = () => {
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return <AdminDashboardSkeleton />;
  if (isError) return <ErrorState message="Could not load admin dashboard" onRetry={refetch} />;
  if (!data) return <ErrorState message="Admin data unavailable" />;

  return (
    <main className="space-y-10">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-ink">System Overview</h1>
          <p className="text-line-600">Real-time analytics of the platform's health.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          label="Total Users"
          value={data.total_users}
          icon={Users}
        />
        <StatCard
          label="Active Users"
          value={data.active_users}
          icon={Users}
        />
        <StatCard
          label="Lost Items"
          value={data.total_lost_items}
          icon={Package}
        />
        <StatCard
          label="Found Items"
          value={data.total_found_items}
          icon={Package}
        />
        <StatCard
          label="Open"
          value={data.open_items}
          icon={Clock}
        />
        <StatCard
          label="Pending Claims"
          value={data.pending_claims}
          icon={AlertCircle}
        />
        <StatCard
          label="Returned"
          value={data.returned_items}
          icon={CheckCircle}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-ink">Items by Category</h3>
          <ItemsByCategoryChart data={data.items_by_category} />
        </div>
        <div className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-ink">Reporting Trends</h3>
          <ItemsOverTimeChart data={data.items_over_time} />
        </div>
      </section>

      <section className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-ink">Claims Distribution</h3>
        <div className="h-64">
          <ClaimsByStatusChart data={data.claims_by_status} />
        </div>
      </section>
    </main>
  );
};

const AdminDashboardSkeleton = () => (
  <main className="space-y-10">
    <header className="space-y-2">
      <div className="h-8 w-48 bg-line-100 rounded animate-pulse mb-6" />
      <div className="h-4 w-64 bg-line-100 rounded animate-pulse" />
    </header>
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="h-24 w-full bg-line-100 rounded-3xl animate-pulse" />
      ))}
    </section>
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-80 w-full bg-line-100 rounded-3xl animate-pulse" />
      <div className="h-80 w-full bg-line-100 rounded-3xl animate-pulse" />
    </section>
    <section className="h-80 w-full bg-line-100 rounded-3xl animate-pulse" />
  </main>
);

export default AdminDashboardPage;
