'use server';

import { loginSchema, ActionState } from '@/lib/schemas/auth';
import { cookies } from 'next/headers';
import { after } from 'next/server'; // Next.js 16 Specific

export async function loginAction(
  prevState: ActionState, 
  formData: FormData
): Promise<ActionState> {
  // 1. Extract & Validate
  const rawData = Object.fromEntries(formData);
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = validated.data;

  // 2. Simulate Authentication Logic
  // TODOs: Replace this with real DB call
  const isAuthenticated = identifier === "admin" && password === "password";

  if (!isAuthenticated) {
    return {
      success: false,
      message: "Invalid credentials. Try 'admin' / 'password'",
      timestamp: Date.now(),
    };
  }

  // 3. Set Session (HttpOnly)
  // Using 'auth_token' which is recognized by middleware
  (await cookies()).set('auth_token', 'mock-jwt-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400,
    path: '/',
  });

  // 4. Next.js 16: Background Task (Non-blocking)
  // This runs AFTER the response is sent to the client
  after(() => {
    console.log(`[Analytics] User ${identifier} logged in at ${new Date().toISOString()}`);
    // Example: await sendEmailNotification(identifier);
  });

  // 5. Return success (Client handles redirect via useAuth or callbackUrl)
  return {
    success: true,
    message: "Login successful",
    timestamp: Date.now(),
  };
}
