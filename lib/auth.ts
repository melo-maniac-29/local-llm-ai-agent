// Simple authentication service

// Mock user database
const users = [
  {
    id: '1',
    email: 'test@example.com',
    // In a real app, this would be hashed
    password: 'password123',
    name: 'Test User'
  }
];

type LoginResult = 
  | { success: true; user: { id: string; email: string; name: string } }
  | { success: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Don't include password in the returned user object
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    success: true,
    user: userWithoutPassword
  };
}

export function getCurrentUser() {
  // In a real app, this would check session/token validity
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: { id: string; email: string; name: string } | null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

export function logout() {
  setCurrentUser(null);
}
