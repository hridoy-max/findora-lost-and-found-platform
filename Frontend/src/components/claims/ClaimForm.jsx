import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

const claimSchema = z.object({
  ownership_proof: z.string()
    .min(10, 'Proof must be at least 10 characters long')
    .max(2000, 'Proof cannot exceed 2000 characters'),
});

const ClaimForm = ({
  onSubmit,
  isSubmitting = false,
  className = ""
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      ownership_proof: '',
    },
  });

  const proofValue = watch('ownership_proof') || '';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
            Ownership Proof
          </label>
          <span className={cn(
            "text-xs font-medium transition-colors",
            proofValue.length > 2000 ? "text-danger" : "text-line-400"
          )}>
            {proofValue.length} / 2000
          </span>
        </div>

        <textarea
          {...register('ownership_proof')}
          rows={8}
          className={cn(
            "w-full px-4 py-3 rounded-2xl border bg-surface text-ink focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none transition-all resize-none",
            errors.ownership_proof ? "border-danger" : "border-line"
          )}
          placeholder="Describe why this item belongs to you. Include specific details that only the owner would know..."
        />

        {errors.ownership_proof && (
          <p className="text-xs text-danger flex items-center mt-1">
            <AlertCircle className="w-3 h-3 mr-1" /> {errors.ownership_proof.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="px-8"
          isLoading={isSubmitting}
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      </div>
    </form>
  );
};

export default ClaimForm;
