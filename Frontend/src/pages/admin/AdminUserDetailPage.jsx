
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getAdminUserById } from '../../api/admin';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Mail, User, Calendar, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => getAdminUserById(id),
  });

  if (isLoading) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton width={120} height={32} />
        </div>
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-sm max-w-2xl space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <Skeleton width={200} height={32} />
              <Skeleton width={150} height={16} />
            </div>
            <Skeleton width={60} height={24} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={20} />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={20} />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={20} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError) return <ErrorState message="Could not load user details" onRetry={refetch} />;
  if (!data) return <ErrorState message="User not found" />;

  return (
    <main className="p-6 space-y-6">
      <section className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft size={18} className="mr-2" />
          Back to Users
        </Button>
      </section>

      <section className="bg-surface border border-line rounded-2xl p-8 shadow-sm max-w-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-2">{data.full_name || 'Unnamed User'}</h1>
            <p className="text-line-600 flex items-center gap-2">
              <Mail size={16} /> {data.email}
            </p>
          </div>
          <Badge variant={data.role === 'admin' ? 'cobalt' : 'gray'}>
            {data.role}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-line-500 flex items-center gap-2">
              <User size={14} /> Full Name
            </label>
            <p className="text-ink font-medium">{data.full_name || 'Not provided'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-line-500 flex items-center gap-2">
              <Shield size={14} /> Account Role
            </label>
            <p className="text-ink font-medium capitalize">{data.role}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-line-500 flex items-center gap-2">
              <Calendar size={14} /> Joined
            </label>
            <p className="text-ink font-medium">{data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminUserDetailPage;
