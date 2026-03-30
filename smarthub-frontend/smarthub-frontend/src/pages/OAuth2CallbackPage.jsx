import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Handles the OAuth2 callback after Google login.
 * Extracts the JWT token from the URL query parameter,
 * stores it, fetches the user profile, and redirects
 * to the appropriate dashboard.
 */
export default function OAuth2CallbackPage() {
  const [error, setError] = useState('');
  const { loginWithToken, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Authentication failed. No token received.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    const handleCallback = async () => {
      try {
        const userData = await loginWithToken(token);
        if (userData) {
          navigate(getDashboardPath(userData.role), { replace: true });
        } else {
          setError('Failed to fetch user profile.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      } catch {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-ice">
      <div className="text-center animate-fade-in">
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-danger font-medium">{error}</p>
            <p className="text-muted text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-ink font-medium">Completing sign in...</p>
            <p className="text-muted text-sm">You&apos;ll be redirected in a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
