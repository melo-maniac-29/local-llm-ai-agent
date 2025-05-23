import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Define proper user type
type User = {
  id: string;
  email: string;
} | null;

// Store user in localStorage for persistence across page refreshes
const getStoredUser = (): User => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      return null;
    }
  }
  return null;
};

let currentUser: User = getStoredUser();

const updateCurrentUser = (user: User): void => {
  currentUser = user;
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
};

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const createUser = useMutation(api.users.create);

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await createUser({ email, password });
      if (result) {
        updateCurrentUser({ id: result.userId, email });
      }
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
      if (result) {
        updateCurrentUser({ id: result.userId, email });
      }
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
      updateCurrentUser(null);
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  return { signOut };
}

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef(user);
  
  // Update reference when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // Compare users safely
  const areUsersEqual = useCallback((a: User, b: User) => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.id === b.id && a.email === b.email;
  }, []);

  // Handle storage changes
  const handleStorageChange = useCallback(() => {
    const storedUser = getStoredUser();
    if (!areUsersEqual(storedUser, userRef.current)) {
      setUser(storedUser);
    }
  }, [areUsersEqual]);
  
  useEffect(() => {
    // Only set the user state on the client side
    setUser(getStoredUser());
    setIsLoading(false);

    // Fix potential null reference errors
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      const checkUserInterval = setInterval(() => {
        if (!areUsersEqual(currentUser, userRef.current)) {
          setUser(currentUser);
        }
      }, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(checkUserInterval);
      };
    }
    return undefined;
  }, [handleStorageChange, areUsersEqual]);

  return { user, isLoading };
}
