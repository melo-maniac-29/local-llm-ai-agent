// Utility functions for managing message state in chat

/**
 * Creates a stable reference of messages to avoid stale state
 */
export function createMessageSnapshot(messages: any[]): any[] {
  return JSON.parse(JSON.stringify(messages));
}

/**
 * Ensures user messages are preserved when merging message arrays
 */
export function mergeMessages(existingMessages: any[], newMessages: any[]): any[] {
  // Create maps for faster lookups
  const existingMap = new Map(existingMessages.map(msg => [msg.id, msg]));
  const result = [...existingMessages];
  
  // Add all new messages that aren't in the existing messages
  newMessages.forEach(newMsg => {
    if (!existingMap.has(newMsg.id)) {
      result.push(newMsg);
    }
  });
  
  return result;
}

/**
 * Helper functions for fixing issues with chat state management
 */

/**
 * Creates a deep copy of messages array to avoid reference issues
 */
export function cloneMessages(messages: any[]) {
  return JSON.parse(JSON.stringify(messages));
}

/**
 * Ensures message objects have consistent structure
 */
export function normalizeMessage(message: any) {
  return {
    ...message,
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: message.timestamp instanceof Date ? 
      message.timestamp : 
      new Date(message.timestamp || Date.now())
  };
}

/**
 * Formats the messages for saving to the database
 */
export function prepareMessagesForSaving(messages: any[]): any[] {
  return messages
    .filter(msg => msg.id !== 'typing-indicator')
    .map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? 
        msg.timestamp.toISOString() : 
        msg.timestamp
    }));
}

/**
 * Logs the current state of messages for debugging
 */
export function logMessageState(messages: any[]) {
  console.log(
    "Current messages:",
    messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content.substring(0, 20) + (m.content.length > 20 ? '...' : '')
    }))
  );
}
