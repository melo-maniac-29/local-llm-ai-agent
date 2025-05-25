// API for adding events to Google Calendar

import { NextRequest, NextResponse } from 'next/server';
import { addToGoogleCalendar } from '@/lib/langchain/calendar-server'; // This is fine in API routes

export async function POST(req: NextRequest) {
  try {
    console.log('[Calendar API DEBUG] Request received:', new Date().toISOString());
    console.log('[Calendar API DEBUG] Request body:', await req.clone().text());
    
    // Get the request body
    const { events, tokens } = await req.json();
    
    console.log('[Calendar API DEBUG] Parsed request:', {
      eventsCount: events?.length,
      hasTokens: !!tokens,
      tokenDetails: {
        hasAccessToken: !!tokens?.access_token,
        hasRefreshToken: !!tokens?.refresh_token,
        expiryDate: tokens?.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A'
      }
    });
    
    console.log('[Calendar API] Received request to add events to Google Calendar');
    
    // Validation
    if (!events || !Array.isArray(events) || !tokens) {
      console.error('[Calendar API] Invalid request data:', { 
        hasEvents: !!events, 
        isArray: Array.isArray(events),
        hasTokens: !!tokens 
      });
      return NextResponse.json(
        { error: "Invalid request. Must provide events array and tokens." },
        { status: 400 }
      );
    }
    
    // Get client credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('[Calendar API] Missing environment variables:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      return NextResponse.json(
        { error: "Google client credentials not configured" },
        { status: 500 }
      );
    }
    
    console.log('[Calendar API] Calling Google Calendar API to add', events.length, 'events');
    // Sample of events for debugging (first event only)
    if (events.length > 0) {
      const sampleEvent = {...events[0]};
      console.log('[Calendar API] Sample event:', sampleEvent);
    }
    
    // Add events to Google Calendar
    const results = await addToGoogleCalendar(tokens, clientId, clientSecret, events);
    console.log('[Calendar API] Calendar API results:', results);
    
    // Return the results
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('[Calendar API] Error adding events to calendar:', error);
    return NextResponse.json(
      { error: `Failed to add events: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
