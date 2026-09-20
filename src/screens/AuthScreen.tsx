import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Dumbbell, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, name || 'Athlete');
    setLoading(false);
    if (error) setError(error);
    else navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 glow-blue"
            style={{ background: 'linear-gradient(135deg, #1E6BFF, #2FA8FF)' }}>
            <Dumbbell className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-extrabold text-4xl tracking-[0.4em] text-ink">COACH</h1>
          <p className="text-dim text-sm mt-1">AI camera trainer</p>
        </div>

        <div className="card p-5 animate-slide-up">
          <div className="flex gap-1 mb-4 p-1 bg-surface-2 rounded-lg">
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-display font-semibold uppercase tracking-widest transition-all ${
                  mode === m ? 'bg-blue text-white shadow-sm' : 'text-dim'
                }`}>
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'signup' && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim/50" />
                <input type="text" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-dim/40 focus:border-blue/40 focus:outline-none focus:ring-2 focus:ring-blue/10" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim/50" />
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-dim/40 focus:border-blue/40 focus:outline-none focus:ring-2 focus:ring-blue/10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim/50" />
              <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-dim/40 focus:border-blue/40 focus:outline-none focus:ring-2 focus:ring-blue/10" />
            </div>
            {error && <p className="text-red text-xs bg-red/10 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-3">
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-surface-3">
            <button onClick={() => { continueAsGuest(); navigate('/home'); }} className="btn-ghost w-full text-xs py-2.5">
              Continue as guest
            </button>
            <p className="text-[10px] text-dim/50 text-center mt-2">Guest reps won't be saved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
