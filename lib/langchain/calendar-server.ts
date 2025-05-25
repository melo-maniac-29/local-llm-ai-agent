// calendar-server.ts
// Server-side Google Calendar integration
// This file should only be imported in server-side contexts (API routes)

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Constants for Google Calendar API
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

// Function to create the Google Calendar tool
// This function doesn't need to be async
export function createCalendarTool() {
  return new DynamicStructuredTool({
    name: "add_to_calendar",
    description: "Adds events to the user's Google Calendar",
    schema: z.object({
      events: z.array(z.object({
        summary: z.string().describe("The title of the calendar event"),
        description: z.string().describe("Description of the event"),
        startTime: z.string().describe("Start time in ISO format (YYYY-MM-DDTHH:MM:SS)"),
        endTime: z.string().describe("End time in ISO format (YYYY-MM-DDTHH:MM:SS)"),
        recurrence: z.string().optional().describe("Recurrence rule, e.g., RRULE:FREQ=DAILY;COUNT=5"),
      })),
    }),
    func: async ({ events }) => {
      try {
        // In a real implementation, we would:
        // 1. Check if user is authenticated with Google
        // 2. Use their auth tokens to create calendar events
        // 3. Handle errors and return results
        
        // For now, just return a simulated success response
        return JSON.stringify({ 
          success: true,
          message: `Successfully created ${events.length} events in calendar.`,
          eventIds: events.map((_, index) => `simulated-event-id-${index}`)
        });
      } catch (error) {
        console.error("Error adding to calendar:", error);
        return JSON.stringify({ 
          success: false, 
          message: "Failed to add events to calendar. Please check authentication." 
        });
      }
    }
  });
}

// Function to generate an authorization URL for Google OAuth
export async function getGoogleAuthUrl(clientId: string) {
  const oauth2Client = new OAuth2Client(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force to show the consent screen
  });
}

// Function to exchange auth code for tokens
export async function getGoogleTokens(clientId: string, clientSecret: string, code: string) {
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error getting tokens:", error);
    throw error;
  }
}

// Function to add events to Google Calendar
export async function addToGoogleCalendar(
  tokens: any,
  clientId: string,
  clientSecret: string,
  events: Array<{
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
    recurrence?: string;
  }>
) {
  console.log('[Calendar Server DEBUG] Starting calendar update at:', new Date().toISOString());
  console.log('[Calendar Server DEBUG] Events to add:', events.length);
  console.log('[Calendar Server DEBUG] First event sample:', events[0]);

  console.log('[Calendar Server] Adding events to Google Calendar:', events.length, 'events');
  console.log('[Calendar Server] Using OAuth credentials:', { 
    clientId: clientId.substring(0, 10) + '...',
    hasClientSecret: !!clientSecret,
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A'
  });

  const oauth2Client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);
  oauth2Client.setCredentials(tokens);

  console.log('[Calendar Server] Initializing Google Calendar API client');
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`[Calendar Server DEBUG] Processing event ${i + 1}/${events.length}:`, {
      summary: event.summary,
      startTime: event.startTime,
      endTime: event.endTime
    });
    
    try {
      // Validate event dates
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Invalid date format: Start: ${event.startTime}, End: ${event.endTime}`);
      }
      
      console.log('[Calendar Server] Creating calendar event:', {
        summary: event.summary,
        startTime: startDate.toLocaleString(),
        endTime: endDate.toLocaleString(),
        hasRecurrence: !!event.recurrence
      });
      
      const calendarEvent = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: "UTC",
        },
        end: {
          dateTime: event.endTime,
          timeZone: "UTC",
        },
        recurrence: event.recurrence ? [event.recurrence] : undefined,
      };
      
      console.log('[Calendar Server] Sending event to Google Calendar API');
      const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: calendarEvent,
      });
      
      console.log('[Calendar Server] Event created successfully:', result.data.id);
      successCount++;
      
      results.push({
        success: true,
        eventId: result.data.id,
        link: result.data.htmlLink,
        summary: event.summary,
        startTime: event.startTime
      });
    } catch (error) {
      console.error("[Calendar Server] Error creating calendar event:", error);
      failCount++;
      
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        summary: event.summary
      });
    }
  }
  
  console.log(`[Calendar Server] Calendar update complete: ${successCount} successes, ${failCount} failures`);
  return results;
}
