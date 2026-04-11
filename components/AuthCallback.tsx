import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

const AuthCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = '/';
      } else {
        window.location.href = '/auth';
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default AuthCallback;