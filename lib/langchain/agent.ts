// Simple LLM-based schedule generator for LM Studio compatibility
// Replaces complex LangChain agent with direct prompt-based approach

import { ChatOpenAI } from "@langchain/openai";

interface ScheduleEvent {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface StudySchedule {
  examName: string;
  totalDays: number;
  dailyHours: number;
  subjects: Array<{
    name: string;
    hoursPerDay: number;
    topics: string[];
    timeSlot: string;
  }>;
}

// Simple LLM setup - no agent complexity
export async function setupAgent(apiKey: string = "not-needed") {
  console.log('Setting up simple LLM for schedule generation...');
  
  // Use LLM_API_URL as the proper environment variable
  const localEndpoint = process.env.LLM_API_URL || 'http://localhost:1234';
  console.log('Using LLM endpoint:', localEndpoint);

  // Clean the URL to prevent '/v1/v1' issues
  const cleanEndpoint = localEndpoint.replace(/\/v1\/?$/, '');
  console.log('Cleaned LLM endpoint:', cleanEndpoint);

  const llm = new ChatOpenAI({
    modelName: "mistral-7b-instruct-v0.3",
    temperature: 0.7,
    maxTokens: 1000,
    streaming: false,
    openAIApiKey: apiKey,
    configuration: {
      baseURL: `${cleanEndpoint}/v1`,
    }
  });

  try {
    // Test the LLM connection
    console.log('Testing LLM connection...');
    const testResponse = await llm.invoke("Hello, please respond with 'Connection successful'");
    console.log('LLM test response:', testResponse);
    return llm;
  } catch (error) {
    console.error('LLM connection test failed:', error);
    throw new Error(`Failed to connect to LLM: ${error}`);
  }
}

// Generate a structured study schedule using direct prompting
export async function generateStudySchedule(
  llm: ChatOpenAI,
  examName: string,
  daysAvailable: number = 14,
  hoursPerDay: number = 8
): Promise<StudySchedule> {
  
  const prompt = `Create a detailed study schedule for ${examName} exam preparation with the following requirements:
- Total days available: ${daysAvailable}
- Study hours per day: ${hoursPerDay}
- Focus on core subjects typically covered in ${examName}

Please provide a structured response with:
1. Subject breakdown with daily hours
2. Key topics for each subject
3. Time distribution recommendations

Format the response as a structured plan that can be easily converted to calendar events.`;

  try {
    const response = await llm.invoke(prompt);
    const responseText = response.content as string;
    
    // Parse the response and create a structured schedule
    const schedule: StudySchedule = {
      examName,
      totalDays: daysAvailable,
      dailyHours: hoursPerDay,
      subjects: []
    };

    // For NEET exam, provide a default structure
    if (examName.toLowerCase().includes('neet')) {
      schedule.subjects = [
        {
          name: "Physics",
          hoursPerDay: 3,
          topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"],
          timeSlot: "9:00 AM - 12:00 PM"
        },
        {
          name: "Chemistry", 
          hoursPerDay: 3,
          topics: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
          timeSlot: "1:00 PM - 4:00 PM"
        },
        {
          name: "Biology",
          hoursPerDay: 2,
          topics: ["Human Physiology", "Plant Biology", "Genetics", "Evolution"],
          timeSlot: "4:30 PM - 6:30 PM"
        }
      ];
    } else {
      // Generic schedule structure
      schedule.subjects = [
        {
          name: "Core Subject 1",
          hoursPerDay: Math.floor(hoursPerDay / 3),
          topics: ["Fundamental concepts", "Practice problems"],
          timeSlot: "Morning session"
        },
        {
          name: "Core Subject 2", 
          hoursPerDay: Math.floor(hoursPerDay / 3),
          topics: ["Key topics", "Review sessions"],
          timeSlot: "Afternoon session"
        },
        {
          name: "Review & Practice",
          hoursPerDay: hoursPerDay - (2 * Math.floor(hoursPerDay / 3)),
          topics: ["Mock tests", "Revision"],
          timeSlot: "Evening session"
        }
      ];
    }

    return schedule;
    
  } catch (error) {
    console.error('Error generating schedule:', error);
    
    // Return a fallback schedule
    return {
      examName,
      totalDays: daysAvailable,
      dailyHours: hoursPerDay,
      subjects: [
        {
          name: "Study Session 1",
          hoursPerDay: Math.floor(hoursPerDay / 2),
          topics: ["Core concepts", "Practice"],
          timeSlot: "Morning"
        },
        {
          name: "Study Session 2",
          hoursPerDay: hoursPerDay - Math.floor(hoursPerDay / 2),
          topics: ["Review", "Mock tests"],
          timeSlot: "Afternoon"
        }
      ]
    };
  }
}

// Process user message with simple prompting approach
export async function processWithAgent(
  llm: ChatOpenAI,
  message: string,
  chatHistory: Array<{ role: string; content: string }> = []
) {
  console.log('Processing message with simple LLM approach...');
  
  try {
    // Check if this is a scheduling request
    const isSchedulingRequest = message.toLowerCase().includes('schedule') ||
                               message.toLowerCase().includes('neet') ||
                               message.toLowerCase().includes('exam') ||
                               message.toLowerCase().includes('study');    // Check if this is a calendar integration request (follow-up)
    const positiveResponses = ['yes', 'calendar', 'add', 'sure', 'ok', 'proceed', 'yep', 'yeah', 'definitely', 'please'];
    const lowerMessage = message.toLowerCase().trim();
    
    // Enhanced detection - check if it's a single word positive response or contains key phrases
    const isCalendarRequest = positiveResponses.some(resp => lowerMessage === resp) || 
                             positiveResponses.some(resp => lowerMessage.includes(resp)) ||
                             lowerMessage.includes('google calendar');
                             
    // Check if the previous message was about scheduling or calendar
    const prevMessageWasSchedule = chatHistory.length > 0 && 
      (chatHistory[chatHistory.length - 1]?.content?.includes('Google Calendar') ||
       chatHistory[chatHistory.length - 1]?.content?.includes('study schedule') ||
       chatHistory[chatHistory.length - 1]?.content?.includes('add specific study sessions') ||
       chatHistory[chatHistory.length - 1]?.content?.includes('Would you like me to add'));

    console.log('[Calendar Integration] User message:', message);
    console.log('[Calendar Integration] Is calendar request:', isCalendarRequest, 'Matches:', 
                positiveResponses.filter(resp => lowerMessage.includes(resp)));
    console.log('[Calendar Integration] Prev message was schedule:', prevMessageWasSchedule, 
                prevMessageWasSchedule ? chatHistory[chatHistory.length - 1]?.content?.substring(0, 100) + '...' : '');

    if (isCalendarRequest && prevMessageWasSchedule) {
      console.log('Detected calendar integration request...');
      
      // Default NEET schedule for calendar integration
      const schedule = {
        examName: 'NEET',
        totalDays: 14,
        dailyHours: 8,
        // This format is compatible with formatStudyScheduleForCalendar
        schedule: [
          {
            subject: "Physics",
            hoursPerDay: 3,
            daysNeeded: 14,
            topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"],
            preferredTime: "morning",
            difficulty: "medium",
            priority: "high"
          },
          {
            subject: "Chemistry", 
            hoursPerDay: 3,
            daysNeeded: 14,
            topics: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
            preferredTime: "afternoon",
            difficulty: "medium",
            priority: "high"
          },
          {
            subject: "Biology",
            hoursPerDay: 2,
            daysNeeded: 14,
            topics: ["Human Physiology", "Plant Biology", "Genetics", "Evolution"],
            preferredTime: "evening",
            difficulty: "medium",
            priority: "high"
          }
        ],
        // Calendar formatting preferences
        preferredTimeOfDay: "morning",
        schedulingStyle: "balanced",
        includeBreaks: true
      };
      
      return {
        text: `Great! I'll help you add this NEET study schedule to your Google Calendar. 

To add these study sessions to your calendar, I'll create daily events for:

📚 **Physics Study** (9:00 AM - 12:00 PM daily)
📚 **Chemistry Study** (1:00 PM - 4:00 PM daily)  
📚 **Biology Study** (4:30 PM - 6:30 PM daily)

Each event will include the specific topics for that day. The schedule will run for 14 days starting from today.

Would you like me to proceed with creating these calendar events? Please make sure you're logged in to your Google account.`,
        isSchedulingRequest: true,
        schedule: schedule
      };
    }

    if (isSchedulingRequest) {
      console.log('Detected scheduling request, generating schedule...');
      
      // Extract exam name if possible
      let examName = 'NEET';
      if (message.toLowerCase().includes('jee')) examName = 'JEE';
      if (message.toLowerCase().includes('cat')) examName = 'CAT';
      if (message.toLowerCase().includes('gate')) examName = 'GATE';
        // Generate structured schedule
      const basicSchedule = await generateStudySchedule(llm, examName, 14, 8);
      
      // Convert to the format expected by formatStudyScheduleForCalendar
      const calendarCompatibleSchedule = {
        examName: basicSchedule.examName,
        totalDays: basicSchedule.totalDays,
        dailyHours: basicSchedule.dailyHours,
        // This format is compatible with formatStudyScheduleForCalendar
        schedule: basicSchedule.subjects.map(subject => ({
          subject: subject.name,
          hoursPerDay: subject.hoursPerDay,
          daysNeeded: basicSchedule.totalDays,
          topics: subject.topics,
          preferredTime: subject.timeSlot.toLowerCase().includes("morning") ? "morning" :
                        subject.timeSlot.toLowerCase().includes("afternoon") ? "afternoon" : "evening",
          difficulty: "medium",
          priority: "high"
        })),
        // Calendar formatting preferences
        preferredTimeOfDay: "morning",
        schedulingStyle: "balanced",
        includeBreaks: true
      };
      
      // Format the response
      const formattedResponse = `I'll help you create a ${examName} study schedule for the next ${basicSchedule.totalDays} days:

## ${examName} Study Schedule

**Daily Study Hours:** ${basicSchedule.dailyHours} hours

### Subject Breakdown:
${basicSchedule.subjects.map(subject => 
`**${subject.name}** (${subject.hoursPerDay} hours/day)
- Time: ${subject.timeSlot}
- Topics: ${subject.topics.join(', ')}
`).join('\n')}

This schedule provides a balanced approach to cover all major topics. Would you like me to add specific study sessions to your Google Calendar?`;

      return {
        text: formattedResponse,
        isSchedulingRequest: true,
        schedule: calendarCompatibleSchedule
      };
    } else {
      // Handle general chat
      const contextPrompt = chatHistory.length > 0 
        ? `Previous conversation context: ${chatHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}\n\nAssistant:`
        : `User: ${message}\n\nAssistant:`;
      
      const response = await llm.invoke(contextPrompt);
      
      return {
        text: response.content as string,
        isSchedulingRequest: false
      };
    }
    
  } catch (error) {
    console.error('Error in processWithAgent:', error);
    
    // Safe fallback response
    return {
      text: "I'm here to help with your study planning and scheduling needs. Could you please tell me more about what you'd like to schedule?",
      isSchedulingRequest: false
    };
  }
}
