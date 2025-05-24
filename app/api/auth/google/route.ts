// Google OAuth API route for authentication

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/langchain/calendar-server'; // This is fine in API routes

export async function GET(req: NextRequest) {
  try {
    // Get client ID from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('[API] Google Client ID not configured in environment variables');
      return NextResponse.json(
        { error: "Google Client ID not configured" },
        { status: 500 }
      );
    }
    
    // Generate authentication URL
    const authUrl = getGoogleAuthUrl(clientId);
    console.log('[API] Generated Google Auth URL');
    
    // Return the authentication URL to the client
    return NextResponse.json({ authUrl });
    
  } catch (error) {
    console.error('[API] Error in Google auth route:', error);
    return NextResponse.json(
      { error: `Failed to generate auth URL: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
