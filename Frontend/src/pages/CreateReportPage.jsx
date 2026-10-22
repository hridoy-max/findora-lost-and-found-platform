import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { createItem } from '../api/items';
import ItemForm from '../components/forms/ItemForm';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { toast } from 'sonner';

const CreateReportPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories for the form
  const {
    data: categoryData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // Mutation to create the item
  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      toast.success('Report submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate(`/items/${newItem.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    },
  });

  const handleFormSubmit = (data) => {
    mutation.mutate(data);
  };

  if (categoriesLoading) return <ReportPageSkeleton />;
  if (categoriesError) return <ErrorState message="Could not load categories" onRetry={refetchCategories} />;

  const categories = categoryData?.data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Report an Item</h1>
        <p className="text-line-600">
          Fill out the details below to help the community find what was lost or return what was found.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-6 md:p-10 shadow-sm">
        <ItemForm
          onSubmit={handleFormSubmit}
          isSubmitting={mutation.isPending}
          categories={categories}
        />
      </div>
    </div>
  );
};

const ReportPageSkeleton = () => (
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

export default CreateReportPage;
