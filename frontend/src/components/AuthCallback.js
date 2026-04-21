import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { exchangeSession } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

    if (sessionId) {
      exchangeSession(sessionId)
        .then(() => {
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          navigate('/auth', { replace: true });
        });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [exchangeSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#666] font-medium">Autenticando...</p>
      </div>
    </div>
  );
}
