import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  description: z.string().max(500, 'Description must be under 500 characters').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

const CategoryFormDialog = ({ isOpen, onClose, onSave, initialData = null }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData || {
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Category' : 'Create Category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Category Name"
          error={errors.name?.message}
        >
          <Input {...register('name')} placeholder="e.g. Electronics" />
        </FormField>

        <FormField
          label="Description"
          error={errors.description?.message}
        >
          <textarea
            {...register('description')}
            className="w-full p-3 rounded-md border border-line bg-paper text-ink text-sm focus:ring-2 focus:ring-cobalt focus:border-cobalt outline-none transition-all min-h-[100px]"
            placeholder="Describe what items belong in this category..."
          />
        </FormField>

        <FormField label="Status">
          <div className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              {...register('is_active')}
              className="w-4 h-4 text-cobalt focus:ring-cobalt rounded"
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm text-ink/80 group-hover:text-ink cursor-pointer">
              Active Category
            </label>
          </div>
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormDialog;
