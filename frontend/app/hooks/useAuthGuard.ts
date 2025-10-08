import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../lib/store';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (_hasHydrated) {
      if (!user) {
        navigate('/login');
      } else {
        setIsReady(true);
      }
    }
  }, [_hasHydrated, user, navigate]);

  return { isReady, user };
};

