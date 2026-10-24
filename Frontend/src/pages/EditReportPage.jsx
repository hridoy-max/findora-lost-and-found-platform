
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItemById } from '../api/items';
import { updateItem } from '../api/items';
import { getCategories } from '../api/categories';
import ItemForm from '../components/forms/ItemForm';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { toast } from 'sonner';

const EditReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Item Data
  const {
    data: itemData,
    isLoading: itemLoading,
    isError: itemError,
    refetch: refetchItem
  } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemById(id),
  });

  // 2. Fetch Categories
  const {
    data: categoryData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // 3. Mutation to update the item
  const mutation = useMutation({
    mutationFn: async ({ itemId, data }) => {
      return updateItem(itemId, data);
    },
    onSuccess: () => {
      toast.success('Report updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate(`/items/${id}`);
    },
    onError: (error) => {
      const message = error.response?.data?.detail;
      if (typeof message === 'string') {
        toast.error(message);
      } else if (Array.isArray(message)) {
        // FastAPI validation errors are arrays of objects
        const firstError = message[0]?.msg || 'Validation error';
        toast.error(firstError);
      } else {
        toast.error('Failed to update report');
      }
    },
  });

  const handleFormSubmit = (data) => {
    mutation.mutate({ itemId: id, data });
  };

  // Handle loading states
  if (itemLoading || categoriesLoading) return <EditReportSkeleton />;
  if (itemError || categoriesError) {
    return (
      <ErrorState
        message="Could not load report data"
        onRetry={() => {
          refetchItem();
          refetchCategories();
        }}
      />
    );
  }

  if (!itemData) return <ErrorState message="Item not found" />;

  const categories = Array.isArray(categoryData)
    ? categoryData
    : (categoryData?.data && Array.isArray(categoryData.data))
      ? categoryData.data
      : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Edit Report</h1>
        <p className="text-line-600">
          Update the details of your report to keep the community informed.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-6 md:p-10 shadow-sm">
        <ItemForm
          initialData={itemData}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate(-1)}
          isSubmitting={mutation.isPending}
          categories={categories}
        />
      </div>
    </div>
  );
};

const EditReportSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <div className="text-center mb-10 space-y-3">
      <div className="h-8 w-48 bg-line-100 rounded-full mx-auto animate-pulse" />
      <div className="h-4 w-64 bg-line-100 rounded-full mx-auto animate-pulse" />
    </div>
    <div className="bg-surface border border-line rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
      <div className="h-12 w-full bg-line-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-12 w-full bg-line-100 rounded-xl animate-pulse" />
        <div className="h-12 w-full bg-line-100 rounded-xl animate-pulse" />
      </div>
      <div className="h-32 w-full bg-line-100 rounded-xl animate-pulse" />
      <div className="h-12 w-full bg-line-100 rounded-xl animate-pulse" />
      <div className="h-40 w-full bg-line-100 rounded-xl animate-pulse" />
      <div className="h-12 w-32 bg-line-100 rounded-xl animate-pulse ml-auto" />
    </div>
  </div>
);

export default EditReportPage;
