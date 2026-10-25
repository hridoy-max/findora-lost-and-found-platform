import { cn } from '../utils/cn';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitClaim } from '../api/claims';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { toast } from 'sonner';
import { Package, ArrowLeft, Send } from 'lucide-react';

const claimSchema = z.object({
  item_id: z.string(),
  description: z.string().min(10, 'Please provide more detail to prove ownership (at least 10 characters)'),
});

const ClaimFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: { item_id: id, description: '' },
  });

  const mutation = useMutation({
    mutationFn: (data) => submitClaim(data.item_id, { ownership_proof: data.description }),
    onSuccess: () => {
      toast.success('Claim submitted successfully!');
      navigate('/my-claims');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to submit claim');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <main className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-sm font-semibold text-cobalt hover:opacity-70 transition-opacity px-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Back to item
        </Button>

        <div className="bg-surface border border-line rounded-3xl p-8 shadow-sm space-y-6">
          <header className="space-y-2">
            <div className="flex items-center gap-3 text-cobalt mb-2">
              <Package size={24} />
              <h1 className="text-2xl font-headings font-bold text-ink">Submit a Claim</h1>
            </div>
            <p className="text-ink/60">
              Tell us why this item belongs to you. Provide specific details that only the owner would know.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink/80">Proof of Ownership</label>
              <Textarea
                {...register('description')}
                placeholder="Describe any unique marks, contents, or the exact circumstances of the loss..."
                className={cn('min-h-[150px]', errors.description && 'border-danger')}
              />
              {errors.description && (
                <p className="text-xs text-danger">{errors.description.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-6 rounded-xl flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Submit Claim
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ClaimFormPage;
