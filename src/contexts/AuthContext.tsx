import React, { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => void;
  signUp: (email: string, password: string) => void;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);

  const signUp = async (email: string, password: string) => {
    // Simple mock authentication
    setUser({ email });
    toast.success('Successfully signed up!');
  };

  const signIn = async (email: string, password: string) => {
    // Simple mock authentication
    setUser({ email });
    toast.success('Successfully signed in!');
  };

  const signOut = async () => {
    setUser(null);
    toast.success('Successfully signed out!');
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
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