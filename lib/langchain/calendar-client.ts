// calendar-client.ts
// Client-safe calendar functions that don't depend on Node.js modules

// Function to format a study schedule into calendar events
export function formatStudyScheduleForCalendar(
  schedule: any,
  startDate: Date = new Date()
) {
  const events = [];
  let currentDate = new Date(startDate);
  
  // Set start date to next day
  currentDate.setDate(currentDate.getDate() + 1);
  
  // Determine start time based on preferred time of day
  const preferredTimeOfDay = schedule.preferredTimeOfDay || "any";
  
  if (preferredTimeOfDay === "morning") {
    currentDate.setHours(8, 0, 0, 0); // 8 AM
  } else if (preferredTimeOfDay === "afternoon") {
    currentDate.setHours(13, 0, 0, 0); // 1 PM
  } else if (preferredTimeOfDay === "evening") {
    currentDate.setHours(18, 0, 0, 0); // 6 PM
  } else {
    currentDate.setHours(9, 0, 0, 0); // Default to 9 AM
  }
  
  // Should we include breaks
  const includeBreaks = schedule.includeBreaks !== undefined ? schedule.includeBreaks : true;
  const schedulingStyle = schedule.schedulingStyle || "balanced";
  
  // For each subject in the schedule
  for (const subject of schedule.schedule) {
    // Skip weekends if not using weekend-focused style
    const skipWeekends = schedulingStyle !== "weekend-focused";
    
    for (let day = 0; day < subject.daysNeeded; day++) {
      // Skip weekends if needed
      if (skipWeekends) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
          // Decrement day counter to ensure we still schedule the required days
          day--;
          continue;
        }
      }
      
      // Create study event for this session
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate);
      endTime.setHours(endTime.getHours() + subject.hoursPerDay);
      
      // Add detailed information to the event
      const difficultyLabel = subject.difficulty ? `(${subject.difficulty} difficulty)` : '';
      const priorityLabel = subject.priority ? `(${subject.priority} priority)` : '';
      
      events.push({
        summary: `Study: ${subject.subject} ${difficultyLabel}`,
        description: `Study session for ${schedule.examName}:\n\n` +
          `Topics: ${subject.topics.join(", ")}\n` +
          `${priorityLabel}\n\n` +
          `Part of your ${schedulingStyle} study plan for ${schedule.examName}.`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      
      // Add break if needed
      if (includeBreaks && subject.hoursPerDay > 1) {
        const breakStartTime = new Date(endTime);
        const breakEndTime = new Date(endTime);
        breakEndTime.setMinutes(breakEndTime.getMinutes() + 30); // 30-minute break
        
        events.push({
          summary: "Break",
          description: `Rest period after studying ${subject.subject}`,
          startTime: breakStartTime.toISOString(),
          endTime: breakEndTime.toISOString(),
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return events;
}

// This function detects if a user message has a scheduling intent
export async function detectSchedulingIntent(message: string): Promise<boolean> {
  // List of keywords that might indicate scheduling intent
  const schedulingKeywords = [
    "schedule", "calendar", "plan", "timetable", "agenda", "itinerary",
    "studying", "study plan", "routine", "timetable", "prepare", "exam", 
    "test", "neet", "preparation", "organize", "set up", "reminder"
  ];

  const lowerMessage = message.toLowerCase();
  
  // Check if message contains scheduling keywords
  return schedulingKeywords.some(keyword => lowerMessage.includes(keyword));
}
