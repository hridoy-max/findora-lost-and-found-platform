import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminItems, updateAdminItemStatus, deleteAdminItem } from '../../api/admin';
import DataTable from '../../components/admin/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Package, RotateCcw, Trash2, Eye, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useListParams } from '../../hooks/useListParams';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const AdminItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { params, setParams } = useListParams();
  const [confirmAction, setConfirmAction] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-items', params],
    queryFn: () => getAdminItems({
      page_size: 12,
      ...params
    }),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }) => updateAdminItemStatus(itemId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('Item status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update item status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteAdminItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('Item report deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete item');
    },
  });

  const columns = [
    {
      key: 'title',
      label: 'Item',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink truncate max-w-[200px]">{val}</span>
          <span className="text-xs text-line-600">{row.category?.name}</span>
        </div>
      )
    },
    {
      key: 'item_type',
      label: 'Type',
      render: (val) => (
        <Badge variant={val === 'lost' ? 'lost' : 'found'}>
          {val}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={
          val === 'open' ? 'cobalt' :
          val === 'claimed' ? 'amber' :
          val === 'returned' ? 'found' : 'gray'
        }>
          {val}
        </Badge>
      )
    },
    {
      key: 'reporter',
      label: 'Reporter',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm text-ink/80">{row.reporter?.full_name}</span>
          <span className="text-[10px] text-line-500 font-mono">{row.reporter?.id.slice(0, 8)}...</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/items/${row.id}`)}
            title="View Public Page"
          >
            <Eye size={16} />
          </Button>
          {row.status !== 'returned' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/items/${row.id}/edit`)}
              title="Edit Report"
            >
              <Edit3 size={16} />
            </Button>
          )}
          {row.status === 'closed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction({ type: 'reopen', itemId: row.id })}
              title="Reopen Item"
              className="text-found"
            >
              <RotateCcw size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmAction({ type: 'delete', itemId: row.id })}
            title="Delete Report"
            className="text-danger"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <main className="p-6"><DataTable columns={columns} data={[]} isLoading={true} /></main>;
  if (isError) return <ErrorState message="Could not load items" onRetry={refetch} />;

  return (
    <main className="space-y-6 p-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Item Moderation</h1>
          <p className="text-line-600">Manage all reports and handle closed/open status.</p>
        </div>
      </header>

      <section>
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onSort={(key) => setParams({ ...params, sort_by: key })}
          currentSort={{ key: params.sort_by || 'created_at', order: params.order || 'desc' }}
        />
      </section>

      {confirmAction && (
        <ConfirmDialog
          title="Confirm Moderation"
          description={
            confirmAction.type === 'reopen'
              ? "Are you sure you want to reopen this report? It will become visible to the public again."
              : "Are you sure you want to permanently delete this report? This action cannot be undone."
          }
          onConfirm={() => {
            if (confirmAction.type === 'reopen') {
              statusMutation.mutate({ itemId: confirmAction.itemId, status: 'open' });
            } else if (confirmAction.type === 'delete') {
              deleteMutation.mutate(confirmAction.itemId);
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </main>
  );
};

export default AdminItemsPage;
