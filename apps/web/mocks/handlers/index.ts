import { authHandlers } from "./auth";
import { v1Handlers } from "./v1";

export const handlers = [...authHandlers, ...v1Handlers];
