import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { UserProfile } from '../data';
import { queryClient } from '../lib';
import { useAppStore } from '../store';

export function Welcome() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { isAuthenticated, login } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credential: string) => {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) throw new Error('Login failed');
      return (await res.json()) as { user: UserProfile; token: string };
    },
    onSuccess: (data) => {
      setError('');
      login(data.user, data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate('/home');
    },
    onError: () => {
      setError('Login failed. Please try again.');
    },
  });

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (loginMutation.isPending) return;
    if (!credentialResponse.credential) return;
    loginMutation.mutate(credentialResponse.credential);
  };

  return (
    <div className="min-h-screen bg-[#F5F1ED] flex flex-col items-center justify-between p-8 py-12">
      {/* Logo */}
      <div className="w-full text-right">
        <div className="inline-block px-4 py-2 bg-white rounded-full text-xs">v1.0</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        {/* Brand */}
        <h1 className="text-4xl mb-8 text-center">
          <span className="font-semibold">Chroma</span>
          <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
            Walk
          </span>
        </h1>

        {/* Illustration */}
        <div className="bg-[#E8DFD8] rounded-3xl p-12 mb-8 w-full max-w-sm">
          {/* Simple person illustration */}
          <div className="flex flex-col items-center gap-8">
            {/* Head */}
            <div className="w-24 h-24 rounded-full bg-[#C89F7B]" />

            {/* Body with arms */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-[#C89F7B]" />
              {/* Left arm */}
              <div className="absolute -left-12 top-1/3 w-16 h-6 bg-[#C89F7B] rounded-full -rotate-45" />
              {/* Right arm */}
              <div className="absolute -right-12 top-1/3 w-16 h-6 bg-[#C89F7B] rounded-full rotate-45" />
            </div>

            {/* Color dots */}
            <div className="flex gap-3 mt-4">
              <div className="w-5 h-5 rounded-full bg-[#FF8A65]" />
              <div className="w-5 h-5 rounded-full bg-[#FFD54F]" />
              <div className="w-5 h-5 rounded-full bg-[#4DB6AC]" />
              <div className="w-5 h-5 rounded-full bg-[#9575CD]" />
              <div className="w-5 h-5 rounded-full bg-[#8BA888]" />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mb-12 px-4">
          <p className="text-2xl mb-2">
            It's ok to{' '}
            <span
              className="italic"
              style={{ fontFamily: 'var(--font-brand-serif)', color: '#C89F7B' }}
            >
              explore
            </span>{' '}
            your
          </p>
          <p className="text-2xl">world in color</p>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 text-center mb-8 px-4">
          Walk, discover, and capture
          <br />
          the colors of your world
        </p>
      </div>

      {/* Google Login */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div
          className={loginMutation.isPending ? 'pointer-events-none opacity-50' : ''}
          aria-busy={loginMutation.isPending}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Login failed. Please try again.')}
            size="large"
            width="300"
            text="continue_with"
            shape="pill"
          />
        </div>
        {loginMutation.isPending && <p className="text-gray-500 text-sm">Signing in…</p>}
        {error && !loginMutation.isPending && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
