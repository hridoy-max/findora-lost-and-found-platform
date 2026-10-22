import React from 'react';

const ForgotPasswordPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-ink mb-4">Forgot Password</h1>
      <p className="text-line-600 mb-8">Enter your email to receive a password reset link.</p>
      <div className="space-y-4">
        <div className="h-12 w-full bg-surface border border-line rounded-xl" />
        <div className="h-12 w-full bg-cobalt-600 rounded-xl" />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
