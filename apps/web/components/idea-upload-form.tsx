"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { cn } from "@sasvoth/ui/lib/utils";

type LayoutItemBase = {
  id: string;
  title: string;
};

type TextLayoutItem = LayoutItemBase & {
  type: "text";
  content: string;
};

type StackFrame = {
  id: string;
  label: string;
};

type StackLayoutItem = LayoutItemBase & {
  type: "stack";
  frames: StackFrame[];
};

type LayoutItem = TextLayoutItem | StackLayoutItem;

const steps = [
  { id: 1, label: "Brand assets" },
  { id: 2, label: "Story layout" },
];

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export function IdeaUploadForm({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const [step, setStep] = React.useState(1);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoCrop, setLogoCrop] = React.useState(100);
  const [ageLimit, setAgeLimit] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mainHero, setMainHero] = React.useState<File | null>(null);
  const [mainHeroPreview, setMainHeroPreview] = React.useState<string | null>(
    null
  );
  const [layoutItems, setLayoutItems] = React.useState<LayoutItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const descriptionWords = React.useMemo(() => {
    if (!description.trim()) return 0;
    return description.trim().split(/\s+/).length;
  }, [description]);

  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const nextUrl = URL.createObjectURL(logoFile);
    setLogoPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [logoFile]);

  React.useEffect(() => {
    if (!mainHero) {
      setMainHeroPreview(null);
      return;
    }
    const nextUrl = URL.createObjectURL(mainHero);
    setMainHeroPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [mainHero]);

  const canAdvanceFromStepOne =
    Boolean(logoPreview) &&
    Boolean(ageLimit.trim()) &&
    descriptionWords > 0 &&
    descriptionWords < 200;

  const layoutHasContent = layoutItems.length > 0;

  const layoutIsValid = layoutItems.every((item) => {
    if (item.type === "text") {
      return Boolean(item.title.trim()) && Boolean(item.content.trim());
    }
    return (
      Boolean(item.title.trim()) &&
      item.frames.length > 0 &&
      item.frames.every((frame) => frame.label.trim().length > 0)
    );
  });

  const canSaveDraft =
    Boolean(mainHeroPreview) && layoutHasContent && layoutIsValid;

  function handleStepChange(next: number) {
    setStep(next);
  }

  function handleAddTextBlock() {
    setLayoutItems((prev) => [
      ...prev,
      {
        id: createId(),
        type: "text",
        title: `Editorial block ${prev.length + 1}`,
        content: "",
      },
    ]);
  }

  function handleAddStackBlock() {
    setLayoutItems((prev) => [
      ...prev,
      {
        id: createId(),
        type: "stack",
        title: `Image stack ${prev.length + 1}`,
        frames: [
          { id: createId(), label: "Frame 01" },
          { id: createId(), label: "Frame 02" },
        ],
      },
    ]);
  }

  function handleItemTitleChange(id: string, value: string) {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: value,
            }
          : item
      )
    );
  }

  function handleTextContentChange(id: string, value: string) {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, content: value }
          : item
      )
    );
  }

  function handleAddFrame(itemId: string) {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === "stack"
          ? {
              ...item,
              frames: [
                ...item.frames,
                {
                  id: createId(),
                  label: `Frame ${String(item.frames.length + 1).padStart(
                    2,
                    "0"
                  )}`,
                },
              ],
            }
          : item
      )
    );
  }

  function handleFrameLabelChange(
    itemId: string,
    frameId: string,
    value: string
  ) {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === "stack"
          ? {
              ...item,
              frames: item.frames.map((frame) =>
                frame.id === frameId ? { ...frame, label: value } : frame
              ),
            }
          : item
      )
    );
  }

  function handleFrameRemove(itemId: string, frameId: string) {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === "stack"
          ? {
              ...item,
              frames: item.frames.filter((frame) => frame.id !== frameId),
            }
          : item
      )
    );
  }

  function handleLayoutMove(index: number, delta: number) {
    setLayoutItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function handleLayoutRemove(id: string) {
    setLayoutItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handlePreviewOpen() {
    if (!canSaveDraft) return;
    setIsPreviewOpen(true);
  }

  function handlePreviewClose() {
    setIsPreviewOpen(false);
  }

  function handleFinalSubmit() {
    if (!canSaveDraft) return;
    const payload = {
      logo: logoFile?.name ?? "",
      ageLimit,
      description: description.trim(),
      hero: mainHero?.name ?? "",
      layout: layoutItems.map((item) =>
        item.type === "text"
          ? {
              type: "text",
              title: item.title,
              content: item.content,
            }
          : {
              type: "stack",
              title: item.title,
              frames: item.frames.map((frame) => frame.label),
            }
      ),
    };
    console.table(payload);
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-black/10 bg-white p-6 text-black shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)] sm:p-10",
        className
      )}
    >
      <div className="flex flex-col gap-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Idea intake
          </p>
          <div className="flex items-center gap-4">
            {steps.map((item, index) => (
              <React.Fragment key={item.id}>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border text-sm font-semibold",
                      step >= item.id
                        ? "border-black bg-black text-white"
                        : "border-black/40 bg-white text-black/70"
                    )}
                  >
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    {item.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="h-px flex-1 rounded-full bg-black/10" />
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium uppercase tracking-[0.2em]">
                  Logo upload
                </label>
                <p className="text-sm text-black/60">
                  Drop any high-res brand mark. The system crops it through a
                  24px circular viewport so that only the center pixels survive.
                </p>
              </div>
              <label className="flex flex-col gap-3 rounded-2xl border border-dashed border-black/30 bg-black/[0.02] p-5 text-sm uppercase tracking-[0.2em] text-black/70 transition hover:bg-black/[0.04]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setLogoFile(file);
                  }}
                />
                Drop or browse
                <span className="text-[11px] font-normal tracking-normal text-black/50">
                  SVG / PNG / JPG
                </span>
              </label>

              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white text-xs font-semibold uppercase tracking-[0.25em] text-black/30">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        sizes="112px"
                        className="object-cover"
                        style={{ transform: `scale(${logoCrop / 100})` }}
                        unoptimized
                      />
                    ) : (
                      "Circle"
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">
                    Round window
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex size-6 items-center justify-center overflow-hidden rounded-full border border-black/30 bg-white text-[9px] font-semibold text-black/40">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Mini preview"
                          fill
                          sizes="24px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        "24"
                      )}
                    </div>
                    <span className="text-[11px] text-black/50">24px mark</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold uppercase tracking-[0.25em] text-black">
                    Zoom & fit
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={150}
                    value={logoCrop}
                    onChange={(event) =>
                      setLogoCrop(Number(event.target.value))
                    }
                    className="mt-2 w-full accent-black"
                  />
                  <p className="text-xs text-black/50">
                    Move the slider until the circular viewport feels balanced.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-black">
                  Age limit
                </span>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  inputMode="numeric"
                  placeholder="18"
                  value={ageLimit}
                  onChange={(event) => setAgeLimit(event.target.value)}
                  className="border-black/30 text-black placeholder:text-black/30 focus-visible:border-black focus-visible:ring-black/50"
                />
                <span className="text-xs text-black/50">
                  Mention the lowest age this story should reach.
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-black">
                  Short description
                </span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Capture the angle in less than 200 words."
                  className="w-full rounded-2xl border border-black/20 bg-white px-3 py-2 text-sm leading-relaxed text-black placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/30"
                />
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
                  <span
                    className={cn(
                      "font-semibold",
                      descriptionWords >= 200 ? "text-black" : "text-black/50"
                    )}
                  >
                    {descriptionWords} / 200 words
                  </span>
                  <span className="text-black/40">Newsroom voice only</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium uppercase tracking-[0.2em]">
                  Main picture
                </label>
                <p className="text-sm text-black/60">
                  This becomes the hero asset of the news layout. Keep it calm,
                  wide, and monochrome friendly.
                </p>
              </div>
              <label className="flex flex-col gap-3 rounded-2xl border border-dashed border-black/30 bg-black/[0.02] p-5 text-sm uppercase tracking-[0.2em] text-black/70 transition hover:bg-black/[0.04]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setMainHero(file);
                  }}
                />
                Upload hero frame
                <span className="text-[11px] font-normal tracking-normal text-black/50">
                  Recommended 1200 × 800
                </span>
              </label>
              {mainHeroPreview && (
                <div className="flex flex-col gap-2 rounded-2xl border border-black/15 bg-black/[0.02] p-4">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-black/10 bg-white">
                    <Image
                      src={mainHeroPreview}
                      alt="Hero preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover grayscale"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-black/60">
                    Preview is locked to grayscale to maintain the black / white
                    tone from the reference layout.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                  Layout items
                </p>
                <p className="text-sm text-black/60">
                  Insert either a text column or a stacked set of supporting
                  frames. Drag order with the controls to stage the story.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  onClick={handleAddTextBlock}
                  className="border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-black/5"
                >
                  + Text block
                </Button>
                <Button
                  type="button"
                  onClick={handleAddStackBlock}
                  className="border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-black/5"
                >
                  + Image stack
                </Button>
              </div>

              <div className="space-y-4">
                {layoutItems.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/20 bg-black/[0.02] p-6 text-center text-sm text-black/50">
                    No layout items yet. Start with a text block describing the
                    story or a stack to mimic the reference carousel.
                  </div>
                )}

                {layoutItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/15 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-[0.25em]">
                        {index + 1}.{" "}
                        {item.type === "text" ? "Text block" : "Image stack"}
                      </div>
                      <div className="flex items-center gap-2">
                        <IconButton
                          label="Move up"
                          disabled={index === 0}
                          onClick={() => handleLayoutMove(index, -1)}
                        >
                          <ChevronIcon direction="up" />
                        </IconButton>
                        <IconButton
                          label="Move down"
                          disabled={index === layoutItems.length - 1}
                          onClick={() => handleLayoutMove(index, 1)}
                        >
                          <ChevronIcon direction="down" />
                        </IconButton>
                        <button
                          type="button"
                          onClick={() => handleLayoutRemove(item.id)}
                          className="rounded-full border border-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-black/5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/60">
                          Title
                        </span>
                        <Input
                          value={item.title}
                          onChange={(event) =>
                            handleItemTitleChange(item.id, event.target.value)
                          }
                          className="border-black/30 text-black placeholder:text-black/30 focus-visible:border-black focus-visible:ring-black/50"
                        />
                      </label>

                      {item.type === "text" ? (
                        <div className="md:col-span-2 space-y-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/60">
                            Copy
                          </span>
                          <textarea
                            rows={4}
                            value={item.content}
                            onChange={(event) =>
                              handleTextContentChange(
                                item.id,
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-black/20 bg-white px-3 py-2 text-sm leading-relaxed text-black placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/30"
                            placeholder="Write like a news brief. Short, factual sentences."
                          />
                        </div>
                      ) : (
                        <div className="md:col-span-2 space-y-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/60">
                              Frames
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddFrame(item.id)}
                              className="text-xs font-semibold uppercase tracking-[0.25em] text-black hover:underline"
                            >
                              + Frame
                            </button>
                          </div>
                          <div className="space-y-2">
                            {item.frames.map((frame) => (
                              <div
                                key={frame.id}
                                className="flex items-center gap-3 rounded-xl border border-black/15 bg-white px-3 py-2"
                              >
                                <div className="h-12 w-16 rounded-lg border border-black/10 bg-black/5 text-center text-[11px] uppercase tracking-[0.2em] text-black/50 flex items-center justify-center">
                                  Img
                                </div>
                                <Input
                                  value={frame.label}
                                  onChange={(event) =>
                                    handleFrameLabelChange(
                                      item.id,
                                      frame.id,
                                      event.target.value
                                    )
                                  }
                                  className="border-black/20 text-sm text-black placeholder:text-black/30 focus-visible:border-black focus-visible:ring-black/50"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFrameRemove(item.id, frame.id)
                                  }
                                  className="text-xs uppercase tracking-[0.2em] text-black/60 hover:text-black"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            onClick={() => handleStepChange(Math.max(1, step - 1))}
            disabled={step === 1}
            variant="outline"
            className="border-black/30 text-black hover:bg-black/5 disabled:opacity-50"
          >
            Back
          </Button>

          {step === 1 ? (
            <Button
              type="button"
              onClick={() => handleStepChange(2)}
              className="bg-black px-8 py-2 text-white hover:bg-black/80 disabled:opacity-40"
              disabled={!canAdvanceFromStepOne}
            >
              Continue to layout
            </Button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="border-black/30 text-black hover:bg-black/5 disabled:opacity-40"
                onClick={handlePreviewOpen}
                disabled={!canSaveDraft}
              >
                Preview page
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-black px-8 py-2 text-white hover:bg-black/80 disabled:opacity-40"
                disabled={!canSaveDraft}
              >
                Save idea draft
              </Button>
            </div>
          )}
        </footer>
      </div>

      {isPreviewOpen && (
        <PreviewModal
          onClose={handlePreviewClose}
          onRemoveItem={handleLayoutRemove}
          heroPreview={mainHeroPreview}
          items={layoutItems}
        />
      )}
    </section>
  );
}

function PreviewModal({
  onClose,
  onRemoveItem,
  heroPreview,
  items,
}: {
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  heroPreview: string | null;
  items: LayoutItem[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-black/20 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm font-semibold uppercase tracking-[0.25em] text-black hover:underline"
        >
          Close
        </button>
        <div className="space-y-4 pr-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
              Live preview
            </p>
            <h3 className="text-2xl font-semibold">News page layout</h3>
            <p className="text-sm text-black/60">
              Hero image leads, followed by the ordered blocks. Remove items
              inline with the × buttons to keep only what matters.
            </p>
          </header>

          <div className="space-y-6 rounded-3xl border border-black/15 bg-black/[0.01] p-6">
            {heroPreview ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-black/10 bg-white">
                <Image
                  src={heroPreview}
                  alt="Hero preview"
                  fill
                  sizes="(max-width: 900px) 100vw, 900px"
                  className="object-cover grayscale"
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-[3/2] w-full rounded-2xl border border-black/20 bg-white text-center text-sm text-black/40 flex items-center justify-center">
                Hero placeholder
              </div>
            )}

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white p-4 text-center text-sm text-black/40">
                No layout blocks yet.
              </div>
            )}

            {items.map((item, index) => (
              <div
                key={item.id}
                className="relative space-y-3 rounded-2xl border border-black/15 bg-white p-5"
              >
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute right-5 top-5 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:text-black/60"
                >
                  ×
                </button>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-black/60">
                  {index + 1}.{" "}
                  {item.type === "text" ? "Editorial column" : "Image stack"}
                </div>
                <h4 className="text-lg font-semibold">{item.title}</h4>
                {item.type === "text" ? (
                  <p className="text-sm leading-relaxed text-black/80">
                    {item.content}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {item.frames.map((frame) => (
                      <div
                        key={frame.id}
                        className="flex h-24 w-32 flex-col items-center justify-center rounded-xl border border-black/15 bg-black/5 text-xs font-semibold uppercase tracking-[0.25em] text-black/60"
                      >
                        {frame.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/30 p-1 text-black/70 transition hover:bg-black/5 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-black"
    >
      {direction === "up" ? (
        <path d="M6 15l6-6 6 6" />
      ) : (
        <path d="M6 9l6 6 6-6" />
      )}
    </svg>
  );
}
