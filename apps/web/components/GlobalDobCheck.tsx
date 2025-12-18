'use client';

import { useAuth } from '@/hooks';
import { DateOfBirthDialog } from './auth/DateOfBirthDialog';

/**
 * Global component that checks if authenticated user has DOB set.
 * Shows the DOB dialog if missing.
 * Place this inside AuthProvider in the app layout.
 */
export function GlobalDobCheck() {
  const { user, isLoading } = useAuth();

  // Don't show during loading or if no user
  if (isLoading || !user) {
    return null;
  }

  // Show dialog if user is authenticated but has no DOB
  const showDialog = !!user && !user.dateOfBirth;

  return (
    <DateOfBirthDialog
      userId={user?.id || ''}
      isOpen={showDialog}
      onSuccess={() => {
        // Refresh the page to reload user data
        window.location.reload();
      }}
    />
  );
}
