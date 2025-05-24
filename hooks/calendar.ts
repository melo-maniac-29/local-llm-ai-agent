// Hook for managing Google Calendar integration

import { useState, useCallback, useEffect } from 'react';
import { useUser } from './auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useGoogleCalendar() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Get tokens from Convex
  const calendarTokens = useQuery(
    api.calendar.getCalendarTokens, 
    user ? { userId: user.id } : "skip"
  );
  
  // Save tokens mutation
  const saveTokens = useMutation(api.calendar.saveCalendarTokens);
  
  // Check if calendar is connected
  useEffect(() => {
    if (calendarTokens) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [calendarTokens]);
  
  // Get Google auth URL
  const getAuthUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAuthUrl(data.authUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get auth URL');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Add events to calendar
  const addToCalendar = useCallback(async (events: any[]) => {
    if (!user || !calendarTokens) {
      setError('Not connected to Google Calendar');
      return { success: false, error: 'Not connected to Google Calendar' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          tokens: {
            access_token: calendarTokens.accessToken,
            refresh_token: calendarTokens.refreshToken,
            expiry_date: calendarTokens.expiryDate,
          },
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add events to calendar');
      }
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add events to calendar';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user, calendarTokens]);
  
  return {
    isLoading,
    isConnected,
    authUrl,
    error,
    getAuthUrl,
    addToCalendar,
  };
}
