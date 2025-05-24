// Test script to validate Google Calendar integration

import { 
  getGoogleAuthUrl, 
  getGoogleTokens, 
  formatStudyScheduleForCalendar,
  detectSchedulingIntent
} from '../lib/langchain/calendar';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test Google Auth URL generation
 */
async function testAuthUrlGeneration() {
  try {
    // Get Google client ID from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not set in environment');
    }
    
    console.log('Using Google Client ID:', clientId.substring(0, 10) + '...');
    
    // Generate auth URL
    const authUrl = getGoogleAuthUrl(clientId);
    console.log('✅ Auth URL successfully generated:');
    console.log(authUrl);
    
    return true;
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    return false;
  }
}

/**
 * Validate environment variables
 */
function validateEnv() {
  const requiredVars = [
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI'
  ];
  
  const missing = requiredVars.filter(name => !process.env[name]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

/**
 * Test schedule generation and formatting
 */
async function testScheduleFormatting() {
  try {
    // Mock schedule data
    const mockSchedule = {
      examName: "NEET Exam",
      totalDays: 30,
      dailyHours: 6,
      preferredTimeOfDay: "morning",
      schedulingStyle: "balanced",
      includeBreaks: true,
      schedule: [
        {
          subject: "Biology",
          difficulty: "hard",
          priority: "high",
          daysNeeded: 12,
          hoursPerDay: 3,
          topics: ["Human Physiology", "Cell Biology", "Genetics"]
        },
        {
          subject: "Chemistry",
          difficulty: "medium",
          priority: "medium",
          daysNeeded: 10,
          hoursPerDay: 2,
          topics: ["Organic Chemistry", "Physical Chemistry", "Inorganic Chemistry"]
        },
        {
          subject: "Physics",
          difficulty: "medium",
          priority: "high",
          daysNeeded: 8,
          hoursPerDay: 2,
          topics: ["Mechanics", "Thermodynamics", "Optics"]
        }
      ]
    };

    // Format the schedule for calendar
    const events = formatStudyScheduleForCalendar(mockSchedule);
    
    if (!events || events.length === 0) {
      throw new Error('No events were generated');
    }
    
    console.log(`✅ Successfully formatted schedule into ${events.length} calendar events`);
    console.log(`   Sample event:`, events[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Error in schedule formatting:', error);
    return false;
  }
}

/**
 * Test intent detection
 */
async function testIntentDetection() {
  try {
    const testCases = [
      { message: "Create a study schedule for NEET", expected: true },
      { message: "Help me prepare for my physics exam", expected: true },
      { message: "What's the weather like today?", expected: false },
      { message: "Tell me about quantum physics", expected: false },
      { message: "I need to organize my calendar for next week", expected: true }
    ];
    
    let passCount = 0;
    
    for (const test of testCases) {
      const result = await detectSchedulingIntent(test.message);
      const passed = result === test.expected;
      
      if (passed) {
        passCount++;
      }
      
      console.log(`${passed ? '✅' : '❌'} "${test.message}" -> ${result} (expected: ${test.expected})`);
    }
    
    console.log(`\n✅ ${passCount}/${testCases.length} intent detection tests passed`);
    return passCount === testCases.length;
  } catch (error) {
    console.error('❌ Error in intent detection tests:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Google Calendar integration tests...');
  
  // Test 1: Environment variables
  console.log('\n📋 Test 1: Validating environment variables');
  if (!validateEnv()) {
    console.error('❌ Environment validation failed. Fix the issues before continuing.');
    process.exit(1);
  }
  
  // Test 2: Auth URL generation
  console.log('\n📋 Test 2: Testing auth URL generation');
  if (!await testAuthUrlGeneration()) {
    console.error('❌ Auth URL generation failed.');
    process.exit(1);
  }
  
  // Test 3: Schedule formatting
  console.log('\n📋 Test 3: Testing schedule formatting');
  if (!await testScheduleFormatting()) {
    console.error('❌ Schedule formatting test failed.');
    process.exit(1);
  }
  
  // Test 4: Intent detection
  console.log('\n📋 Test 4: Testing scheduling intent detection');
  if (!await testIntentDetection()) {
    console.error('❌ Intent detection test failed.');
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed successfully');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
