import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin';
import DataTable from '../../components/admin/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tag, Plus, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useListParams } from '../../hooks/useListParams';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import CategoryFormDialog from '../../components/admin/CategoryFormDialog';

const AdminCategoriesPage = () => {
  const queryClient = useQueryClient();
  const { params, setParams } = useListParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-categories', params],
    queryFn: () => getAdminCategories({
      page_size: 12,
      ...params
    }),
    keepPreviousData: true,
  });

  const categories = Array.isArray(data)
    ? data
    : (data?.data && Array.isArray(data.data))
      ? data.data
      : [];

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (data.id) {
        return updateCategory(data.id, data);
      }
      return createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(selectedCategory ? 'Category updated' : 'Category created');
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to save category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete category');
    },
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val) => <span className="font-medium text-ink">{val}</span>
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-sm text-line-600 truncate max-w-xs">{val || 'No description'}</span>
    },
    {
      key: 'items_count',
      label: 'Items',
      render: (val) => (
        <Badge variant="gray">
          {val} reports
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs">
          {val ? <span className="text-found">● Active</span> : <span className="text-danger">● Inactive</span>}
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
            onClick={() => {
              setSelectedCategory(row);
              setIsModalOpen(true);
            }}
            title="Edit Category"
          >
            <Edit3 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmAction({ type: 'delete', id: row.id })}
            title="Delete"
            className="text-danger"
            disabled={row.items_count > 0}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <main className="p-6"><DataTable columns={columns} data={[]} isLoading={true} /></main>;
  if (isError) return <ErrorState message="Could not load categories" onRetry={refetch} />;

  return (
    <main className="space-y-6 p-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Category Management</h1>
          <p className="text-line-600">Organize reports into logical categories.</p>
        </div>
        <Button onClick={() => {
          setSelectedCategory(null);
          setIsModalOpen(true);
        }}>
          <Plus size={18} className="mr-2" />
          New Category
        </Button>
      </header>

      <section>
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          onSort={(key) => setParams({ ...params, sort_by: key })}
          currentSort={{ key: params.sort_by || 'name', order: params.order || 'asc' }}
        />
      </section>

      {confirmAction && (
        <ConfirmDialog
          title="Confirm Deletion"
          description={
            confirmAction.type === 'delete'
              ? "Are you sure you want to permanently delete this category? This is only allowed if the category has no associated items."
              : "Are you sure?"
          }
          onConfirm={() => {
            deleteMutation.mutate(confirmAction.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <CategoryFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(formData) => saveMutation.mutate({ ...formData, id: selectedCategory?.id })}
        initialData={selectedCategory}
      />
    </main>
  );
};

export default AdminCategoriesPage;
