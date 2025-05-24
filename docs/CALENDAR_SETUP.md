# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the Orbital AI application.

## Prerequisites

1. A Google Cloud Project
2. Google Calendar API enabled
3. OAuth 2.0 credentials

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note the Project ID for later use

## Step 2: Enable Google Calendar API

1. In your Google Cloud Project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Give your OAuth client a name (e.g., "Orbital AI Calendar Integration")
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for local development)
   - Add your production URLs as needed
6. Click "Create"
7. Note the Client ID and Client Secret

## Step 4: Configure the Application

1. Copy `.env.example` to `.env.local`
2. Fill in the Google API credentials:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
3. Restart the application

## Testing the Integration

1. Make a scheduling request in the chat (e.g., "Create a study schedule for NEET exam")
2. Click "Add to Google Calendar" when prompted
3. Complete the OAuth consent flow
4. Verify that the events were added to your calendar
