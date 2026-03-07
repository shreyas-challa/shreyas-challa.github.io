import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './database';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-8 border rounded-lg text-center">
          <h1 className="text-2xl font-bold">Logged in</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
            <Button variant="outline" onClick={() => navigate('/create')}>Create Post</Button>
            <Button variant="destructive" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 border rounded-lg">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
