import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase'; // Import Supabase client
import { Session, User } from '@supabase/supabase-js'; // Import Supabase types

// User interface can now directly use Supabase User type or be omitted if Session.user is sufficient
// interface User { ... } // Supabase User type will be used directly from Session

interface AuthContextType {
  user: User | null;
  session: Session | null; // Add session to the context
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    setLoading(true);
    const getSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false); // Set loading to false once auth state is determined
        
        // Optional: show toasts for specific events
        // if (event === 'SIGNED_IN') toast.success('Successfully signed in!');
        // if (event === 'SIGNED_UP') toast.success('Successfully signed up! Check your email for verification.');
        // if (event === 'SIGNED_OUT') toast.success('Successfully signed out!');
      }
    );

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      // User will be set by onAuthStateChange, but a toast here can be good UX
      // Supabase often requires email verification for signUp
      toast.success('Sign up successful! Check your email for verification.');
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      // User and session will be set by onAuthStateChange
      toast.success('Successfully signed in!');
    }
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      // User and session will be cleared by onAuthStateChange
      toast.success('Successfully signed out!');
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}