'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@sasvoth/ui/dialog';
import { Button } from '@sasvoth/ui/button';
import { Input } from '@sasvoth/ui/input';
import { userApi } from '@/api';

interface DateOfBirthDialogProps {
  userId: string;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}

export function DateOfBirthDialog({
  userId,
  isOpen,
  onOpenChange,
  onSuccess,
}: DateOfBirthDialogProps) {
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    // Validate age (must be at least 13 years old)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 13) {
      setError('You must be at least 13 years old to use this service');
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.updateProfile(userId, { dateOfBirth });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please enter your date of birth to continue. This helps us provide
            age-appropriate content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="dob-dialog-input"
              className="block text-sm font-medium text-gray-700"
            >
              Date of Birth
            </label>
            <Input
              id="dob-dialog-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1"
              max={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !dateOfBirth}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
