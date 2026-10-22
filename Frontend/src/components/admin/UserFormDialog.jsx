import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[a-zA-Z]/, 'Must contain at least one letter').regex(/[0-9]/, 'Must contain at least one digit').max(72),
  role: z.enum(['admin', 'user']),
});

const UserFormDialog = ({ isOpen, onClose, onSave, initialData = null }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {
      full_name: '',
      email: '',
      password: '',
      role: 'user',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData || {
        full_name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit User' : 'Create New User'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Full Name"
          error={errors.full_name?.message}
        >
          <Input {...register('full_name')} placeholder="John Doe" />
        </FormField>

        <FormField
          label="Email Address"
          error={errors.email?.message}
        >
          <Input {...register('email')} type="email" placeholder="john@example.com" />
        </FormField>

        {!initialData && (
          <FormField
            label="Password"
            error={errors.password?.message}
          >
            <Input {...register('password')} type="password" placeholder="********" />
          </FormField>
        )}

        <FormField label="Account Role">
          <div className="flex gap-3">
            {['user', 'admin'].map((role) => (
              <label key={role} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value={role}
                  {...register('role')}
                  className="w-4 h-4 text-cobalt focus:ring-cobalt"
                />
                <span className="text-sm capitalize text-ink/80 group-hover:text-ink">
                  {role}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormDialog;
