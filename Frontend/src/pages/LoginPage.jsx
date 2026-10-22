import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getErrorMessage } from '../api/errors';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email, password });
      // Redirect is handled by GuestRoute in App.jsx
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <section className="w-full max-w-md bg-surface p-8 rounded-xl shadow-sm border border-line">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headings font-bold text-ink mb-2">Welcome Back</h1>
          <p className="text-ink/60">Sign in to manage your lost and found items</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 rounded-md bg-danger/10 text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full py-3">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-ink/60">Don't have an account? </span>
          <Link to="/register" className="text-cobalt font-medium hover:underline">Sign up</Link>
          <div className="mt-4">
            <Link to="/forgot-password" className="text-cobalt hover:underline">Forgot password?</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
