import React from 'react';

const ProfilePage = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-ink mb-8">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="bg-surface border border-line rounded-2xl p-6 h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 bg-line-100 rounded-full" />
          <div className="h-4 w-32 bg-line-100 rounded" />
        </section>
        <section className="md:col-span-2 bg-surface border border-line rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-line-100 rounded" />
            <div className="h-10 w-full bg-line-50 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-line-100 rounded" />
            <div className="h-10 w-full bg-line-50 rounded-xl" />
          </div>
          <div className="h-12 w-32 bg-cobalt-600 rounded-xl" />
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
