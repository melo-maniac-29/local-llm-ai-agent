# LangChain Agentic Integration for Calendar Scheduling

This document explains how the LangChain agent has been integrated into the chat interface to provide calendar scheduling features.

## Overview

We've implemented an agentic chat experience using LangChain that can:
1. Detect scheduling intents in user messages
2. Generate study schedules based on user requirements
3. Allow users to add these schedules to their Google Calendar

## Implementation Components

### 1. LangChain Agent

Located at `lib/langchain/agent.ts`, the agent uses:
- OpenAI functions-style interface (but works with local LLM through LM Studio)
- Tools for calendar integration and schedule creation
- A system prompt that guides the model to handle scheduling requests

### 2. Google Calendar Integration

Located at:
- `lib/langchain/calendar.ts` - Core calendar functionality
- `app/api/auth/google/` - Authentication endpoints
- `app/api/calendar/events/` - Calendar event management
- `convex/calendar.ts` - Token storage in database

### 3. API Endpoints

We added several API routes:
- `/api/llm` and `/api/llm/stream` - Updated to use LangChain for scheduling
- `/api/auth/google` - For initiating Google OAuth
- `/api/auth/google/callback` - OAuth callback handler
- `/api/calendar/events` - For adding events to Google Calendar

### 4. UI Components

The chat UI has been enhanced with:
- Calendar connection prompts
- Schedule visualization
- Google Calendar integration buttons

## How It Works

1. User sends a message about scheduling or preparation
2. The system detects this is a scheduling request
3. LangChain agent processes the request and generates a study schedule
4. User is presented with options to add the schedule to Google Calendar
5. If user accepts, they authenticate with Google (if not already)
6. Schedule is added to their Google Calendar

## Configuration

Set up Google Calendar API credentials as described in `docs/CALENDAR_SETUP.md`.

## Next Steps

Future improvements could include:
- More advanced scheduling capabilities
- Additional calendar providers
- Schedule templates and customization
- Integration with task management systems
