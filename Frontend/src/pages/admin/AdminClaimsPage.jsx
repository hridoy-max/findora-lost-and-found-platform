import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminClaims, getAdminClaimsPending } from '../../api/admin';
import DataTable from '../../components/admin/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useListParams } from '../../hooks/useListParams';

const AdminClaimsPage = () => {
  const navigate = useNavigate();
  const { params, setParams } = useListParams();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending'

  const isPending = activeTab === 'pending';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-claims', activeTab, params],
    queryFn: () => {
      if (isPending) {
        return getAdminClaimsPending({ ...params });
      }
      return getAdminClaims({ ...params });
    },
    keepPreviousData: true,
  });

  const columns = [
    {
      key: 'id',
      label: 'Claim ID',
      render: (val) => (
        <span className="font-mono text-xs text-line-600">
          {val?.slice(0, 8)}...
        </span>
      )
    },
    {
      key: 'item',
      label: 'Item',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink truncate max-w-[200px]">
            {row.item?.title}
          </span>
          <span className="text-xs text-line-600">
            ID: {row.item?.id.slice(0, 8)}...
          </span>
        </div>
      )
    },
    {
      key: 'claimant',
      label: 'Claimant',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm text-ink/80">{row.claimant?.full_name}</span>
          <span className="text-[10px] text-line-500 font-mono">{row.claimant?.id.slice(0, 8)}...</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const statusColors = {
          pending: 'amber',
          approved: 'found',
          rejected: 'danger',
        };
        return (
          <Badge variant={statusColors[val] || 'gray'}>
            {val}
          </Badge>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => (
        <span className="text-sm text-line-600">
          {val ? new Date(val).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/claims/${row.id}`)}
            className="text-xs font-medium text-cobalt hover:text-cobalt/80 transition-colors"
          >
            Review Claim
          </button>
        </div>
      )
    }
  ];

  if (isLoading) return <div className="p-6"><DataTable columns={columns} data={[]} isLoading={true} /></div>;
  if (isError) return <ErrorState message="Could not load claims" onRetry={refetch} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Claims Oversight</h1>
          <p className="text-line-600">Monitor and manage all item claims across the platform.</p>
        </div>
      </div>

      <div className="flex border-b border-line">
        <button
          onClick={() => {
            setActiveTab('all');
            setParams({});
          }}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all border-b-2",
            activeTab === 'all'
              ? "border-cobalt text-cobalt"
              : "border-transparent text-line-600 hover:text-ink"
          )}
        >
          All Claims
        </button>
        <button
          onClick={() => {
            setActiveTab('pending');
            setParams({});
          }}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all border-b-2",
            activeTab === 'pending'
              ? "border-cobalt text-cobalt"
              : "border-transparent text-line-600 hover:text-ink"
          )}
        >
          Pending Review
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        onSort={(key) => setParams({ ...params, sort_by: key })}
        currentSort={{ key: params.sort_by || 'created_at', order: params.order || 'desc' }}
      />
    </div>
  );
};

// Helper for conditional classes
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default AdminClaimsPage;
