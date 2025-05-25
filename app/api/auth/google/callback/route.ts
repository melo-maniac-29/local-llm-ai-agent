// Google OAuth callback handler

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/langchain/calendar-server'; // This is fine in API routes
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(req: NextRequest) {
  try {
    // Get the authorization code from the URL query parameters
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const userId = searchParams.get('state'); // User ID is passed in the state parameter
    
    // Check if we have a code and user ID
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/chat?calendar_error=true&reason=no_code', req.url));
    }
    
    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/chat?calendar_error=true&reason=no_user', req.url));
    }
    
    // Get client credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!clientId || !clientSecret) {
      console.error('[API] Google client credentials not configured');
      return NextResponse.redirect(new URL('/dashboard/chat?calendar_error=true&reason=no_credentials', req.url));
    }
    
    if (!convexUrl) {
      console.error('[API] Convex URL not configured');
      return NextResponse.redirect(new URL('/dashboard/chat?calendar_error=true&reason=no_convex', req.url));
    }
    
    // Exchange code for tokens
    const tokens = await getGoogleTokens(clientId, clientSecret, code);    // Store tokens in Convex
    // Create a direct Convex client (we can't use hooks in API routes)
    const convex = new ConvexHttpClient(convexUrl);
    
    console.log('[API] Saving tokens to Convex:', {
      userId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });
    
    try {
      await convex.mutation(api.calendar.saveCalendarTokens, {
        userId: userId as any, // Cast to any since we know this is a valid Convex ID
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || undefined, // Use undefined instead of empty string
        expiryDate: tokens.expiry_date || (Date.now() + 3600000), // Default 1 hour from now
      });
      
      console.log('[API] Successfully saved tokens to Convex');
    } catch (error) {
      console.error('[API] Failed to save tokens to Convex:', error);
      throw error;
    }
    
    console.log('[API] Successfully saved Google Calendar tokens for user:', userId);
    
    // Redirect back to the chat with success parameter
    return NextResponse.redirect(new URL('/dashboard/chat?calendar_connected=true', req.url));
    
  } catch (error) {
    console.error('[API] Error in Google auth callback:', error);
    return NextResponse.redirect(new URL('/dashboard/chat?calendar_error=true', req.url));
  }
}
