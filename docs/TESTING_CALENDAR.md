# Testing Google Calendar Integration

This document provides steps for testing the Google Calendar integration with actual API keys.

## Prerequisites

1. Google Cloud Project with Calendar API enabled
2. OAuth 2.0 credentials configured
3. Application running in development mode

## Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Replace the placeholder values with your actual Google API credentials:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```
3. Restart the application after updating environment variables

## Step 2: Testing Study Schedule Creation

1. Open the chat interface
2. Send a message related to scheduling, such as:
   - "Help me make a study schedule for NEET exam"
   - "I need to prepare for my biology midterm next month"
   - "Create a study plan for chemistry with 3 hours per day"

3. Provide more details when prompted by the AI:
   - Specific subjects
   - Days available for preparation
   - Hours available per day
   - Preferences for study time
   - Difficulty levels for subjects

## Step 3: Testing Calendar Integration

### First-Time Connection

1. When presented with a study schedule and the option to add to calendar:
   - Click "Connect Google Calendar"
2. Complete the Google OAuth consent flow
   - This will redirect back to the application
3. Verify that the application shows a successful connection message
4. The calendar connection should now be established

### Adding Events to Calendar

1. Create a new study schedule or use a previously generated one
2. Click "Add to Calendar"
3. Confirm that the application shows a success message
4. Open your Google Calendar and verify that the events have been added:
   - Study sessions should appear with the correct subjects
   - Events should have appropriate descriptions
   - Time slots should match the scheduled times

## Step 4: Error Testing

Test the application's handling of various error scenarios:

1. **Invalid credentials**: Temporarily replace your valid credentials with invalid ones
2. **Network issues**: Disconnect your network when connecting to Google
3. **Token expiration**: Test whether token refresh works properly

## Step 5: Automated Testing

We've created a basic automated test script to verify the integration:

1. Install the test dependencies if needed:
   ```bash
   npm install --save-dev ts-node dotenv
   ```

2. Run the calendar integration test:
   ```bash
   npm run test:calendar
   ```

3. The test verifies:
   - All required environment variables are present
   - Google Auth URL can be generated successfully
   - Basic calendar operations work correctly

## Troubleshooting

If you encounter issues during testing:

1. Check the browser console for client-side errors
2. Review server logs for API errors
3. Verify that the Google API credentials have the correct redirect URLs
4. Ensure the Calendar API is enabled in your Google Cloud project
5. Check the Google API dashboard for quota limits or API restrictions

## Recording Test Results

When reporting test results, include:

1. The test case description
2. Expected outcome
3. Actual outcome
4. Any error messages encountered
5. Screenshots, if applicable
