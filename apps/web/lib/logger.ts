type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getEnvLogLevel(): LogLevel {
  const env = (
    process.env.NEXT_PUBLIC_LOG_LEVEL ||
    process.env.LOG_LEVEL ||
    ""
  ).toLowerCase();
  if (env === "debug" || env === "info" || env === "warn" || env === "error")
    return env;
  // default: production => info, development => debug
  const nodeEnv = (
    process.env.NODE_ENV ||
    process.env.NEXT_PUBLIC_NODE_ENV ||
    "development"
  ).toLowerCase();
  return nodeEnv === "production" ? "info" : "debug";
}

const CURRENT_LEVEL = getEnvLogLevel();

function shouldLog(level: LogLevel) {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[CURRENT_LEVEL];
}

function timestamp() {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, msg: any, meta?: any) {
  if (typeof msg === "string") {
    return `${timestamp()} [${level.toUpperCase()}] ${msg}${meta ? " " + JSON.stringify(meta) : ""}`;
  }
  // for non-strings, include a concise JSON
  try {
    return `${timestamp()} [${level.toUpperCase()}] ${JSON.stringify(msg)}${meta ? " " + JSON.stringify(meta) : ""}`;
  } catch (err) {
    return `${timestamp()} [${level.toUpperCase()}] (unserializable message)`;
  }
}

async function sendRemote(_payload: any) {
  // noop by default. Consumers can override `logger.remote` to forward logs to a remote collector.
  return;
}

export const logger = {
  level: CURRENT_LEVEL,
  remote: sendRemote,
  debug(msg: any, meta?: any) {
    if (!shouldLog("debug")) return;
    const text = formatMessage("debug", msg, meta);
    // prefer console.debug when available
    // eslint-disable-next-line no-console
    console.debug(text);
    // fire-and-forget remote
    void this.remote({ level: "debug", message: msg, meta, ts: Date.now() });
  },
  info(msg: any, meta?: any) {
    if (!shouldLog("info")) return;
    const text = formatMessage("info", msg, meta);
    // eslint-disable-next-line no-console
    console.info(text);
    void this.remote({ level: "info", message: msg, meta, ts: Date.now() });
  },
  warn(msg: any, meta?: any) {
    if (!shouldLog("warn")) return;
    const text = formatMessage("warn", msg, meta);
    // eslint-disable-next-line no-console
    console.warn(text);
    void this.remote({ level: "warn", message: msg, meta, ts: Date.now() });
  },
  error(msg: any, meta?: any) {
    if (!shouldLog("error")) return;
    const text = formatMessage("error", msg, meta);
    // eslint-disable-next-line no-console
    console.error(text);
    void this.remote({ level: "error", message: msg, meta, ts: Date.now() });
  },
};

export type Logger = typeof logger;

export default logger;
