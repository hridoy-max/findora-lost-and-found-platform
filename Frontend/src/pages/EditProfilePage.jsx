import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.updateProfile(formData);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="p-2 rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold text-ink">Edit Profile</h1>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-6 md:p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-cobalt" />
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-cobalt" />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-cobalt" />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="px-8"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfilePage;
