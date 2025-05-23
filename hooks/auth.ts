import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Simple state-based auth management
let currentUser: any = null;

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const createUser = useMutation(api.users.create);

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await createUser({ email, password });
      currentUser = { id: result.userId, email };
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return { signUp, isLoading };
}

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const loginUser = useMutation(api.users.login);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await loginUser({ email, password });
      currentUser = { id: result.userId, email };
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return { signIn, isLoading };
}

export function useSignOut() {
  const logout = useMutation(api.users.logout);

  const signOut = async () => {
    try {
      await logout();
      currentUser = null;
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { signOut };
}

export function useUser() {
  const [user, setUser] = useState(currentUser);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user exists and update state
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}
