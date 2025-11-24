"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { cn } from "@sasvoth/ui/lib/utils";
import { useAuth } from "@/hooks";

type IdeaSummary = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  logoLabel: string;
  accent: string;
};

const fallbackIdeas: IdeaSummary[] = [
  {
    id: "studio-compass",
    name: "Studio Compass",
    description:
      "Guided toolset for new civic studios to sketch, test, and share ideas inside the SaSvoth network.",
    updatedAt: "2024-06-09T12:15:00.000Z",
    logoLabel: "SC",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    id: "common-grounds",
    name: "Common Grounds",
    description:
      "Micro-grants platform that pairs neighborhood councils with rapid prototyping budgets for shared spaces.",
    updatedAt: "2024-06-11T09:42:00.000Z",
    logoLabel: "CG",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "signal-garden",
    name: "Signal Garden",
    description:
      "Data stories and live dashboards for showcasing participation metrics across SaSvoth campaigns.",
    updatedAt: "2024-06-05T17:05:00.000Z",
    logoLabel: "SG",
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "field-notes",
    name: "Field Notes",
    description:
      "Traveling residency that documents local rituals and builds cross-border cultural exchanges.",
    updatedAt: "2024-05-29T22:10:00.000Z",
    logoLabel: "FN",
    accent: "bg-blue-100 text-blue-700",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatUpdatedAt(value: string) {
  try {
    return dateFormatter.format(new Date(value));
  } catch (err) {
    return value;
  }
}

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

function IdeaLogo({ label, accent }: { label: string; accent: string }) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold uppercase",
        accent
      )}
    >
      {label}
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<{
    preview: string;
    file: File;
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [ideas] = useState<IdeaSummary[]>(fallbackIdeas);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "name">("date");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user?.name ?? user?.username ?? user?.email ?? "");
    setAvatarPreview(user?.avatarUrl ?? null);
    setPendingAvatar(null);
    setIsConfirmOpen(false);
  }, [user]);

  const visibleIdeas = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = ideas.filter((idea) => {
      if (!normalized) return true;
      return (
        idea.name.toLowerCase().includes(normalized) ||
        idea.description.toLowerCase().includes(normalized)
      );
    });

    return filtered.sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [ideas, searchTerm, sortKey]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPendingAvatar({
          preview: reader.result,
          file,
        });
      }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("Profile saved. Your changes will reflect across SaSvoth shortly.");
    setTimeout(() => setProfileMessage(null), 4000);
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

  const confirmAvatarSave = () => {
    if (!pendingAvatar) {
      setIsConfirmOpen(false);
      return;
    }
    setAvatarPreview(pendingAvatar.preview);
    setPendingAvatar(null);
    setIsConfirmOpen(false);
  };

  const currentAvatarSrc = pendingAvatar?.preview ?? avatarPreview;

  const toggleSortKey = () => {
    setSortKey((prev) => (prev === "date" ? "name" : "date"));
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.next.trim() === "" || passwordForm.confirm.trim() === "") {
      setPasswordMessage({
        tone: "error",
        text: "Please enter and confirm your new password.",
      });
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({
        tone: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    setPasswordMessage({
      tone: "success",
      text: "Password updated. We'll ask you to use it next time you sign in.",
    });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  const ideaListView = (
    <div className="space-y-3">
      {visibleIdeas.map((idea) => (
        <div
          key={idea.id}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/70 px-5 py-4 shadow-sm"
        >
          <IdeaLogo label={idea.logoLabel} accent={idea.accent} />
          <div className="min-w-[220px] flex-1">
            <p className="text-base font-semibold text-gray-900">{idea.name}</p>
            <p className="text-sm text-gray-500">{idea.description}</p>
          </div>
          <div className="ml-auto flex flex-col items-start text-xs font-medium text-gray-500">
            <span className="uppercase tracking-[0.3em] text-gray-400">Updated</span>
            <span className="text-sm text-gray-900">{formatUpdatedAt(idea.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const ideaGridView = (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleIdeas.map((idea) => (
        <div
          key={idea.id}
          className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white/70 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <IdeaLogo label={idea.logoLabel} accent={idea.accent} />
            <div>
              <p className="text-base font-semibold text-gray-900">{idea.name}</p>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                Updated {formatUpdatedAt(idea.updatedAt)}
              </p>
            </div>
          </div>
          <p className="mt-4 flex-1 text-sm text-gray-600">{idea.description}</p>
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm">
              Edit idea
            </Button>
            <Button size="sm" className="px-4">
              Open
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center text-gray-500">
        Loading your settings…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Sign in required</h1>
        <p className="mt-3 text-base text-gray-600">
          You need to be signed in to access settings.
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-gray-400">
          Controls
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-3 max-w-2xl text-base text-gray-600">
          Update your profile, refresh your password, and keep track of the ideas
          you&apos;re actively refining with the SaSvoth community.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        <section className="rounded-3xl border border-gray-200/80 bg-white/70 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
            Profile
          </p>
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
                    {getInitials(displayName)}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-semibold uppercase tracking-[0.5em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Edit
                </div>
              </button>
              {pendingAvatar ? (
                <button
                  type="button"
                  onClick={handleAvatarCancel}
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-semibold text-gray-800 shadow-md"
                  aria-label="Cancel avatar change"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              ) : null}
            </div>
            {pendingAvatar ? (
              <Button type="button" className="mt-6 w-full max-w-[180px]" onClick={handleAvatarSave}>
                Save avatar
              </Button>
            ) : null}
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleProfileSubmit}>
            <div>
              <label
                htmlFor="displayName"
                className="text-sm font-medium text-gray-700"
              >
                Display name
              </label>
              <Input
                id="displayName"
                className="mt-1"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter your preferred name"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-6">
                Save profile
              </Button>
            </div>
            {profileMessage ? (
              <p className="text-sm text-emerald-600">{profileMessage}</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-3xl border border-gray-200/80 bg-white/70 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
            Security
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Update password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set a fresh password to keep your studio, grants, and votes protected.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Current password
              </label>
              <Input
                id="currentPassword"
                className="mt-1"
                type="password"
                value={passwordForm.current}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, current: event.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New password
                </label>
                <Input
                  id="newPassword"
                  className="mt-1"
                  type="password"
                  value={passwordForm.next}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, next: event.target.value }))
                  }
                  placeholder="Choose something strong"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <Input
                  id="confirmPassword"
                  className="mt-1"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                  }
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            {passwordMessage ? (
              <p
                className={cn(
                  "text-sm",
                  passwordMessage.tone === "error"
                    ? "text-rose-600"
                    : "text-emerald-600"
                )}
              >
                {passwordMessage.text}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" className="px-6">
                Update password
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-10 rounded-3xl border border-gray-200/80 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-gray-400">
              Ideas
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Your ideas</h2>
            <p className="mt-1 text-sm text-gray-600">
              Switch between list or grid view to review drafts and recent updates.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <div className="w-full sm:w-64">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search ideas"
                  aria-label="Search ideas"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-4"
                onClick={toggleSortKey}
              >
                Sort: {sortKey === "date" ? "Date updated" : "Name"}
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className={cn(
                  "rounded-full px-4",
                  viewMode === "list" ? "shadow-sm" : "text-gray-600"
                )}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className={cn(
                  "rounded-full px-4",
                  viewMode === "grid" ? "shadow-sm" : "text-gray-600"
                )}
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
              >
                Grid
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {visibleIdeas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
              You haven&apos;t drafted any ideas yet. Start something new from a poll or
              admin dashboard to see it here.
            </p>
          ) : viewMode === "list" ? (
            ideaListView
          ) : (
            ideaGridView
          )}
        </div>
      </section>
    </main>
      {isConfirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-900">Save new avatar?</h3>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;ll update your profile image for SaSvoth once you confirm.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAvatarSave}>Confirm</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
