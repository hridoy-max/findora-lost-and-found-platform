

import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../utils/cn';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">User not found</h1>
        <p className="text-line-600">Please log in again to view your profile.</p>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-ink mb-8">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="bg-surface border border-line rounded-2xl p-6 h-auto flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-24 h-24 rounded-full bg-cobalt-100 flex items-center justify-center text-cobalt text-3xl font-bold border-2 border-cobalt/20">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{user.full_name}</h2>
            <p className="text-sm text-line-500">{user.role === 'admin' ? 'Administrator' : 'Community Member'}</p>
          </div>
        </section>

        <section className="md:col-span-2 bg-surface border border-line rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-paper border border-line">
              <User className="w-5 h-5 text-cobalt" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-line-500 uppercase tracking-wider">Full Name</span>
                <span className="text-ink font-medium">{user.full_name || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-paper border border-line">
              <Mail className="w-5 h-5 text-cobalt" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-line-500 uppercase tracking-wider">Email Address</span>
                <span className="text-ink font-medium">{user.email || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-paper border border-line">
              <Phone className="w-5 h-5 text-cobalt" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-line-500 uppercase tracking-wider">Phone Number</span>
                <span className="text-ink font-medium">{user.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-3 bg-cobalt text-surface rounded-xl font-medium hover:bg-cobalt/90 transition-colors shadow-sm">
              Edit Profile Details
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
