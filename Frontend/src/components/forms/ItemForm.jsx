import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Image,
  Upload,
  X,
  AlertCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

// Validation Schema
const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  item_type: z.enum(['lost', 'found'], {
    errorMap: () => ({ message: 'Please select if the item is lost or found' })
  }),
  category_id: z.string().uuid('Invalid category selected'),
  location: z.string().min(1, 'Location is required').max(255),
  event_date: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    return date <= new Date();
  }, { message: 'Event date cannot be in the future' }),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

/**
 * @typedef {import('react-hook-form').UseFormReturn} UseFormReturn
 */

const ItemForm = ({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  categories = [],
  className = ""
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData || {
      item_type: 'lost',
      title: '',
      description: '',
      location: '',
      event_date: '',
      category_id: '',
      image_url: '',
    },
  });

  const itemType = watch('item_type');
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-8", className)}
    >
      {/* 1. Item Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
          Item Type
        </label>
        <div className="flex p-1 bg-surface border border-line rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setValue('item_type', 'lost')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              itemType === 'lost'
                ? "bg-lost-100 text-lost-700 shadow-sm"
                : "text-line-500 hover:text-ink"
            )}
          >
            Lost
          </button>
          <button
            type="button"
            onClick={() => setValue('item_type', 'found')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              itemType === 'found'
                ? "bg-found-100 text-found-700 shadow-sm"
                : "text-line-500 hover:text-ink"
            )}
          >
            Found
          </button>
        </div>
        {errors.item_type && (
          <p className="text-xs text-danger flex items-center mt-1">
            <AlertCircle className="w-3 h-3 mr-1" /> {errors.item_type.message}
          </p>
        )}
      </div>

      {/* 2. Core Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
            Title
          </label>
          <Input
            {...register('title')}
            placeholder="e.g. Blue leather wallet"
            className={errors.title ? "border-danger" : ""}
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
            Location
          </label>
          <Input
            {...register('location')}
            placeholder="e.g. Central Park, NY"
            className={errors.location ? "border-danger" : ""}
          />
          {errors.location && (
            <p className="text-xs text-danger mt-1">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className={cn(
            "w-full px-4 py-3 rounded-xl border bg-surface text-ink focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none transition-all",
            errors.description ? "border-danger" : "border-line"
          )}
          placeholder="Provide as much detail as possible to help identify the item..."
        />
        {errors.description && (
          <p className="text-xs text-danger mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
            Event Date
          </label>
          <div className="relative">
            <Input
              type="date"
              {...register('event_date')}
              className={errors.event_date ? "border-danger" : ""}
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line-400" />
          </div>
          {errors.event_date && (
            <p className="text-xs text-danger mt-1">{errors.event_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
            Category
          </label>
          <select
            {...register('category_id')}
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-surface text-ink focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 outline-none transition-all",
              errors.category_id ? "border-danger" : "border-line"
            )}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-danger mt-1">{errors.category_id.message}</p>
          )}
        </div>
      </div>

      {/* 3. Image Upload */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-ink uppercase tracking-wider block">
          Item Image (Optional)
        </label>
        <div className="relative group">
          {imagePreview ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-line bg-surface">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-3 right-3 p-2 bg-white/90 text-danger rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-line bg-surface hover:bg-line-50 cursor-pointer transition-all group-hover:border-cobalt-300"
            >
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="p-3 bg-cobalt-50 text-cobalt-600 rounded-full group-hover:bg-cobalt-100 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-ink">Click to upload image</p>
                  <p className="text-xs text-line-500">PNG, JPG or JPEG (max. 5MB)</p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          size="lg"
          className="px-8"
          isLoading={isSubmitting}
        >
          Submit Report
        </Button>
      </div>
    </form>
  );
};

export default ItemForm;
