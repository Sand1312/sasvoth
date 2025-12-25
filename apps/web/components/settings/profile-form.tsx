"use client";

import { useRef, useState, ChangeEvent, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/lib/schemas/profile";
import { Input } from "@sasvoth/ui/input";
import { Button } from "@sasvoth/ui/button";
import { cn } from "@sasvoth/ui/lib/utils";
import { userApi } from "@/api";
import { useIPFS } from "@/hooks/useIPFS";
import { useAuth } from "@/hooks";

function getInitials(value?: string | null) {
  if (!value) return "??";
  const cleaned = value.trim();
  if (!cleaned) return "??";
  const words = cleaned.split(/\s+/).slice(0, 2);
  return words
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .padEnd(2, "_");
}

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user, setUser } = useAuth();
  const { uploadFile } = useIPFS();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar ?? null,
  );
  const [pendingAvatar, setPendingAvatar] = useState<{
    preview: string;
    file: File;
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      dateOfBirth: "",
    },
  });

  // Reset form when user data loads/changes
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.name ?? user.username ?? user.email ?? "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
      setAvatarPreview(user.avatar ?? null);
    }
  }, [user, reset]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPendingAvatar({ preview: reader.result, file });
      }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAvatarCancel = () => {
    setPendingAvatar(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAvatarSave = () => {
    if (!pendingAvatar) return;
    setIsConfirmOpen(true);
  };

  const confirmAvatarSave = async () => {
    if (!pendingAvatar || !user?.id) {
      setIsConfirmOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await uploadFile(pendingAvatar.file);
      const avatarUrl = result.url;
      await userApi.updateProfile(user.id, { avatar: avatarUrl });

      setAvatarPreview(avatarUrl);
      setPendingAvatar(null);
      setIsConfirmOpen(false);
      setMessage({ type: "success", text: "Avatar updated successfully!" });

      // Update user in context
      setUser({ ...user, avatar: avatarUrl });

      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to save avatar",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Update name via PATCH /users/:id
      const updatedUser = await userApi.update(user.id, {
        name: data.displayName,
      });

      // Update dateOfBirth via profile endpoint if provided
      if (data.dateOfBirth) {
        await userApi.updateProfile(user.id, { dateOfBirth: data.dateOfBirth });
      }

      setMessage({ type: "success", text: "Profile saved successfully!" });
      setUser({
        ...user,
        name: data.displayName,
        dateOfBirth: data.dateOfBirth,
      });
      onSuccess?.();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to save profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentAvatarSrc = pendingAvatar?.preview ?? avatarPreview;

  return (
    <>
      <section className="rounded-3xl border border-gray-200/80 bg-white/70 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
          Profile
        </p>

        {/* Avatar Section */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-transparent focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10"
              aria-label="Edit avatar"
            >
              {currentAvatarSrc ? (
                <img
                  src={currentAvatarSrc}
                  alt="Avatar preview"
                  className="h-full w-full object-cover transition-all group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-500 transition-all group-hover:bg-gray-200">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-semibold uppercase tracking-[0.5em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                Edit
              </div>
            </button>
            {pendingAvatar && (
              <button
                type="button"
                onClick={handleAvatarCancel}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-semibold text-gray-800 shadow-md"
                aria-label="Cancel avatar change"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>
          {pendingAvatar && (
            <Button
              type="button"
              className="mt-6 w-full max-w-[180px]"
              onClick={handleAvatarSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save avatar"}
            </Button>
          )}
        </div>

        {/* Profile Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="displayName"
              className="text-sm font-medium text-gray-700"
            >
              Display name
            </label>
            <Controller
              control={control}
              name="displayName"
              render={({ field }) => (
                <Input
                  id="displayName"
                  className="mt-1"
                  placeholder="Enter your preferred name"
                  disabled={isSaving}
                  {...field}
                />
              )}
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="text-sm font-medium text-gray-700"
            >
              Date of Birth
            </label>
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="mt-1"
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isSaving}
                  {...field}
                  value={field.value || ""}
                />
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="px-6" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>

          {message && (
            <p
              className={cn(
                "text-sm",
                message.type === "error" ? "text-red-600" : "text-emerald-600",
              )}
            >
              {message.text}
            </p>
          )}
        </form>
      </section>

      {/* Avatar Confirm Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Save new avatar?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;ll update your profile image for SaSvoth once you confirm.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={confirmAvatarSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
