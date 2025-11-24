const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const parseDate = (value?: string | number | Date | null) => {
  if (!value) {
    return null;
  }
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (value?: string) => {
  const parsed = parseDate(value);
  return parsed ? dateFormatter.format(parsed) : "—";
};
