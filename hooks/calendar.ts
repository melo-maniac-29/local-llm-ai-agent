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
  
  console.log('[Calendar Hook DEBUG] Hook state:', {
    hasUser: !!user,
    isLoading,
    isConnected,
    hasAuthUrl: !!authUrl,
    error
  });

  // Get tokens from Convex
  const calendarTokens = useQuery(
    api.calendar.getCalendarTokens, 
    user ? { userId: user.id } : "skip"
  );
  
  // Save tokens mutation
  const saveTokens = useMutation(api.calendar.saveCalendarTokens);
  
  // Check if calendar is connected
  useEffect(() => {
    if (calendarTokens && calendarTokens.accessToken) {
      setIsConnected(true);
      // Reset auth URL when connected
      setAuthUrl('');
    } else {
      setIsConnected(false);
    }
    console.log('[Calendar Hook DEBUG] Token state:', {
      hasTokens: !!calendarTokens,
      hasAccessToken: calendarTokens?.accessToken,
      expiryDate: calendarTokens?.expiryDate,
    });
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
    console.log('[Calendar Hook DEBUG] addToCalendar called:', {
      eventsCount: events.length,
      hasUser: !!user,
      hasTokens: !!calendarTokens,
      isConnected
    });
    
    if (!user || !calendarTokens) {
      console.error('[Calendar Hook] Not connected to Google Calendar:', 
                   { hasUser: !!user, hasTokens: !!calendarTokens });
      setError('Not connected to Google Calendar');
      return { success: false, error: 'Not connected to Google Calendar' };
    }
    
    console.log('[Calendar Hook] User and tokens available, proceeding with calendar add');
    console.log('[Calendar Hook] Access token exists:', !!calendarTokens.accessToken);
    console.log('[Calendar Hook] Token expiry:', new Date(calendarTokens.expiryDate).toLocaleString());
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Calendar Hook] Sending request to /api/calendar/events');
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
      
      console.log('[Calendar Hook] Response status:', response.status);
      const data = await response.json();
      console.log('[Calendar Hook] API response data:', data);
      
      if (!response.ok) {
        console.error('[Calendar Hook] API returned error:', data.error);
        throw new Error(data.error || 'Failed to add events to calendar');
      }
      
      console.log('[Calendar Hook] Events successfully added to calendar');
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add events to calendar';
      console.error('[Calendar Hook] Error adding events to calendar:', errorMsg);
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
