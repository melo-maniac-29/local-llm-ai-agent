// API for adding events to Google Calendar

import { NextRequest, NextResponse } from 'next/server';
import { addToGoogleCalendar } from '@/lib/langchain/calendar-server'; // This is fine in API routes

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const { events, tokens } = await req.json();
    
    // Validation
    if (!events || !Array.isArray(events) || !tokens) {
      return NextResponse.json(
        { error: "Invalid request. Must provide events array and tokens." },
        { status: 400 }
      );
    }
    
    // Get client credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google client credentials not configured" },
        { status: 500 }
      );
    }
    
    // Add events to Google Calendar
    const results = await addToGoogleCalendar(tokens, clientId, clientSecret, events);
    
    // Return the results
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('[API] Error adding events to calendar:', error);
    return NextResponse.json(
      { error: `Failed to add events: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
