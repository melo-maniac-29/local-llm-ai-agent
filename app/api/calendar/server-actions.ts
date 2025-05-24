"use server";

// This file contains all the server actions needed for calendar operations
import { 
  getGoogleAuthUrl as getGoogleAuthUrlInternal, 
  getGoogleTokens as getGoogleTokensInternal,
  addToGoogleCalendar as addToGoogleCalendarInternal 
} from '@/lib/langchain/calendar-server';

// Re-export with proper async
export async function getGoogleAuthUrl(clientId: string) {
  return getGoogleAuthUrlInternal(clientId);
}

export async function getGoogleTokens(clientId: string, clientSecret: string, code: string) {
  return getGoogleTokensInternal(clientId, clientSecret, code);
}

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
  return addToGoogleCalendarInternal(tokens, clientId, clientSecret, events);
}
