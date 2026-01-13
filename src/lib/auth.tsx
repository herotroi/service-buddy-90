import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Função para refresh da sessão - NÃO atualiza estado para evitar re-render
  // O onAuthStateChange já cuida de atualizar o estado quando necessário
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('[Auth] Error refreshing session:', error);
        } else {
          console.log('[Auth] Session refreshed silently');
          // NÃO atualizar setSession/setUser aqui para evitar re-render
          // O onAuthStateChange com TOKEN_REFRESHED já lida com isso internamente
        }
      }
    } catch (error) {
      console.error('[Auth] Error in refreshSession:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific events
        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed automatically');
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Se tem sessão, faz refresh imediato para garantir token válido
      if (session) {
        refreshSession();
      }
    });

    // Refresh session every 5 minutes to keep it alive
    const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000);

    // Also refresh when the window regains focus (user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Tab became visible, refreshing session...');
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh when coming back online
    const handleOnline = () => {
      console.log('[Auth] Back online, refreshing session...');
      refreshSession();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
