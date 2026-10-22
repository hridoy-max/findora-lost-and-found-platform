import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getErrorMessage } from '../api/errors';
import { cn } from '../utils/cn';

const RuleItem = ({ label, met }) => (
  <div className={cn('text-xs flex items-center gap-2', met ? 'text-found' : 'text-ink/40')}>
    <span className={cn('w-3 h-3 rounded-full border', met ? 'bg-found border-found' : 'border-line')}></span>
    {label}
  </div>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Compute rules derived from state to avoid useEffect setState loop
  const rules = {
    length: formData.password.length >= 8,
    letter: /[a-zA-Z]/.test(formData.password),
    digit: /\d/.test(formData.password),
    bytes: new TextEncoder().encode(formData.password).length <= 72,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rules.length || !rules.letter || !rules.digit || !rules.bytes) return;
    setError(null);
    setIsLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-sm border border-line">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headings font-bold text-ink mb-2">Create Account</h1>
          <p className="text-ink/60">Join the community to help others find their belongings</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <Input label="Phone (Optional)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-paper border border-line mb-2">
            <RuleItem label="8+ characters" met={rules.length} />
            <RuleItem label="At least one letter" met={rules.letter} />
            <RuleItem label="At least one digit" met={rules.digit} />
            <RuleItem label="Max 72 bytes" met={rules.bytes} />
          </div>
          {error && <div className="p-3 rounded-md bg-danger/10 text-danger text-sm font-medium">{error}</div>}
          <Button type="submit" isLoading={isLoading} className="w-full py-3" disabled={!rules.length || !rules.letter || !rules.digit || !rules.bytes}>Create Account</Button>
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-ink/60">Already have an account? </span>
          <Link to="/login" className="text-cobalt font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
