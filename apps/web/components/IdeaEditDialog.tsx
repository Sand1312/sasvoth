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
import { ideasApi } from '@/api';

export type IdeaData = {
  id: string;
  title: string;
  description: string;
  ageLimit?: number;
  imgSrc?: string;
};

interface IdeaEditDialogProps {
  idea: IdeaData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function IdeaEditDialog({
  idea,
  isOpen,
  onOpenChange,
  onSuccess,
}: IdeaEditDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [ageLimit, setAgeLimit] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when idea changes
  React.useEffect(() => {
    if (idea) {
      setTitle(idea.title || '');
      setDescription(idea.description || '');
      setAgeLimit(idea.ageLimit || 0);
    }
  }, [idea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!idea?.id) {
      setError('No idea selected');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await ideasApi.update(idea.id, {
        title: title.trim(),
        description: description.trim(),
        ageLimit,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Edit Idea</DialogTitle>
          <DialogDescription className="text-gray-600">
            Update your idea details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label
              htmlFor="idea-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter idea title"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="idea-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
              rows={4}
              placeholder="Describe your idea..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="idea-age-limit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Age Limit
            </label>
            <Input
              id="idea-age-limit"
              type="number"
              min={0}
              max={120}
              value={ageLimit}
              onChange={(e) => setAgeLimit(Number(e.target.value) || 0)}
              placeholder="0 = All ages"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Set to 0 for no age restriction
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
