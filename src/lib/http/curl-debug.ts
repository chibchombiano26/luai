import { randomUUID } from "crypto";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const CURL_DEBUG_ENV_KEY = "DEBUG_OUTBOUND_CURLS";
const OUTBOUND_HTTP_DETAILS_ENV_KEY = "DEBUG_OUTBOUND_HTTP_DETAILS";
const OUTBOUND_HTTP_MAX_BODY_CHARS_ENV_KEY = "OUTBOUND_HTTP_DEBUG_MAX_BODY_CHARS";
const DEFAULT_OUTBOUND_HTTP_MAX_BODY_CHARS = 2000;
const REDACTED_VALUE = "[REDACTED]";
const TRUNCATED_SUFFIX = "...[truncated]";
const OUTBOUND_DEBUG_META_KEY = "__outboundDebugMeta";

/** Correlation metadata attached to outbound HTTP requests for debug logging. */
export type OutboundDebugMeta = {
  requestId: string;
  startedAtMs: number;
  attempt: number;
};

type AxiosConfigWithDebugMeta = AxiosRequestConfig & {
  [OUTBOUND_DEBUG_META_KEY]?: OutboundDebugMeta;
};

function isTruthyEnvValue(rawValue: string | undefined): boolean {
  if (!rawValue) return false;
  const normalized = rawValue.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function shouldIncludeInsecureFlag(config: AxiosRequestConfig): boolean {
  const httpsAgent = config.httpsAgent as
    | {
        options?: { rejectUnauthorized?: boolean };
      }
    | undefined;

  return httpsAgent?.options?.rejectUnauthorized === false;
}

function normalizeHeaders(
  headers: AxiosRequestConfig["headers"]
): Record<string, string> {
  if (!headers) return {};

  const rawHeaders =
    typeof (headers as { toJSON?: () => unknown }).toJSON === "function"
      ? ((headers as { toJSON: () => unknown }).toJSON() as Record<string, unknown>)
      : (headers as Record<string, unknown>);

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      normalized[key] = value.join("; ");
      continue;
    }
    normalized[key] = String(value);
  }

  return normalized;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized === "authorization" ||
    normalized === "cookie" ||
    normalized === "set-cookie" ||
    normalized.includes("api-key") ||
    normalized.includes("apikey") ||
    normalized.includes("token") ||
    normalized.includes("secret") ||
    normalized.includes("password")
  );
}

function resolveMaxBodyChars(): number {
  const rawValue = process.env[OUTBOUND_HTTP_MAX_BODY_CHARS_ENV_KEY];
  if (!rawValue) return DEFAULT_OUTBOUND_HTTP_MAX_BODY_CHARS;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OUTBOUND_HTTP_MAX_BODY_CHARS;
  }

  return Math.round(parsed);
}

function truncateText(value: string): string {
  const maxChars = resolveMaxBodyChars();
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}${TRUNCATED_SUFFIX}`;
}

function sanitizeValue(
  value: unknown,
  keyHint: string | null,
  seen: WeakSet<object>,
  depth: number
): unknown {
  if (keyHint && isSensitiveKey(keyHint)) {
    return REDACTED_VALUE;
  }

  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncateText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return String(value);
  if (typeof value === "function") return "[Function]";

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return truncateText(value.toString("utf8"));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth > 5) return "[MaxDepth]";
    return value.map((entry) => sanitizeValue(entry, null, seen, depth + 1));
  }

  if (typeof value === "object") {
    if (depth > 5) return "[MaxDepth]";
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(nestedValue, key, seen, depth + 1);
    }

    return sanitized;
  }

  return String(value);
}

function sanitizeHeadersForLog(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    sanitized[key] = isSensitiveKey(key) ? REDACTED_VALUE : truncateText(value);
  }
  return sanitized;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function serializeSanitizedCurlBody(data: unknown): string | null {
  if (data === undefined || data === null) return null;

  if (typeof data === "number" || typeof data === "boolean" || typeof data === "bigint") {
    return String(data);
  }

  if (typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams) {
    const grouped: Record<string, string | string[]> = {};
    for (const [key, value] of data.entries()) {
      const current = grouped[key];
      if (current === undefined) {
        grouped[key] = value;
      } else if (Array.isArray(current)) {
        current.push(value);
      } else {
        grouped[key] = [current, value];
      }
    }

    return safeJsonStringify(sanitizeValue(grouped, null, new WeakSet<object>(), 0));
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return safeJsonStringify(sanitizeValue(parsed, null, new WeakSet<object>(), 0));
    } catch {
      return REDACTED_VALUE;
    }
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return REDACTED_VALUE;
  }

  if (typeof data === "object") {
    return safeJsonStringify(sanitizeValue(data, null, new WeakSet<object>(), 0));
  }

  return REDACTED_VALUE;
}

function resolveRequestUrl(config: AxiosRequestConfig): string {
  const rawUrl = config.url ?? "";
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const baseUrl = config.baseURL;
  if (!baseUrl) return rawUrl;

  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const normalizedPath = rawUrl.replace(/^\/+/, "");
    return `${normalizedBase}/${normalizedPath}`;
  }
}

export function isCurlDebugEnabled(): boolean {
  return isTruthyEnvValue(process.env[CURL_DEBUG_ENV_KEY]);
}

export function isDetailedHttpDebugEnabled(): boolean {
  return isTruthyEnvValue(process.env[OUTBOUND_HTTP_DETAILS_ENV_KEY]);
}

export function buildCurlCommand(config: AxiosRequestConfig): string {
  const method = (config.method ?? "get").toUpperCase();
  const url = resolveRequestUrl(config);
  const headers = sanitizeHeadersForLog(normalizeHeaders(config.headers));
  const body = serializeSanitizedCurlBody(config.data);

  const parts: string[] = ["curl"];

  if (shouldIncludeInsecureFlag(config)) {
    parts.push("-k");
  }

  parts.push("-X", method, shellQuote(url));

  for (const [key, value] of Object.entries(headers)) {
    parts.push("-H", shellQuote(`${key}: ${value}`));
  }

  if (body !== null && body !== "") {
    parts.push("--data-raw", shellQuote(body));
  }

  return parts.join(" ");
}

export function attachOutboundDebugMeta(config: AxiosRequestConfig): OutboundDebugMeta {
  const configWithMeta = config as AxiosConfigWithDebugMeta;
  const previousMeta = configWithMeta[OUTBOUND_DEBUG_META_KEY];

  const nextMeta: OutboundDebugMeta = {
    requestId: previousMeta?.requestId ?? randomUUID().slice(0, 8),
    startedAtMs: Date.now(),
    attempt: (previousMeta?.attempt ?? 0) + 1,
  };

  configWithMeta[OUTBOUND_DEBUG_META_KEY] = nextMeta;
  return nextMeta;
}

function getOutboundDebugMeta(config: AxiosRequestConfig | undefined): OutboundDebugMeta | null {
  if (!config) return null;
  const configWithMeta = config as AxiosConfigWithDebugMeta;
  return configWithMeta[OUTBOUND_DEBUG_META_KEY] ?? null;
}

function computeElapsedMs(meta: OutboundDebugMeta | null): number | null {
  if (!meta) return null;
  const elapsed = Date.now() - meta.startedAtMs;
  return elapsed >= 0 ? elapsed : null;
}

export function logHttpRequestDetails(source: string, config: AxiosRequestConfig): void {
  if (!isDetailedHttpDebugEnabled()) return;

  const meta = getOutboundDebugMeta(config) ?? attachOutboundDebugMeta(config);
  const method = (config.method ?? "get").toUpperCase();
  const url = resolveRequestUrl(config);
  const timeoutMs = typeof config.timeout === "number" ? config.timeout : null;
  const headers = sanitizeHeadersForLog(normalizeHeaders(config.headers));
  const params = sanitizeValue(config.params, null, new WeakSet<object>(), 0);
  const body = sanitizeValue(config.data, null, new WeakSet<object>(), 0);

  const baseMessage = [
    `[HTTP DEBUG][${source}] Request requestId=${meta.requestId}`,
    `attempt=${meta.attempt}`,
    `method=${method}`,
    `url=${url}`,
  ];
  if (timeoutMs !== null) baseMessage.push(`timeoutMs=${timeoutMs}`);

  console.log(baseMessage.join(" "));
  console.log(
    `[HTTP DEBUG][${source}] Request payload requestId=${meta.requestId} ${safeJsonStringify({
      headers,
      params,
      body,
    })}`
  );
}

export function logHttpResponseDetails(source: string, response: AxiosResponse): void {
  if (!isDetailedHttpDebugEnabled()) return;

  const meta = getOutboundDebugMeta(response.config);
  const requestId = meta?.requestId ?? "unknown";
  const elapsedMs = computeElapsedMs(meta);
  const method = (response.config.method ?? "get").toUpperCase();
  const url = resolveRequestUrl(response.config);
  const headers = sanitizeHeadersForLog(normalizeHeaders(response.headers));
  const body = sanitizeValue(response.data, null, new WeakSet<object>(), 0);

  const summary = [
    `[HTTP DEBUG][${source}] Response requestId=${requestId}`,
    `status=${response.status}`,
    `method=${method}`,
    `url=${url}`,
  ];
  if (elapsedMs !== null) summary.push(`durationMs=${elapsedMs}`);

  console.log(summary.join(" "));
  console.log(
    `[HTTP DEBUG][${source}] Response payload requestId=${requestId} ${safeJsonStringify({
      headers,
      body,
    })}`
  );
}

export function logHttpErrorDetails(source: string, error: AxiosError | unknown): void {
  if (!isDetailedHttpDebugEnabled()) return;

  const axiosError = error as AxiosError;
  const config = axiosError.config;

  if (!config) {
    console.log(
      `[HTTP DEBUG][${source}] Request failed without Axios config message=${axiosError.message ?? "Unknown error"}`
    );
    return;
  }

  const meta = getOutboundDebugMeta(config);
  const requestId = meta?.requestId ?? "unknown";
  const elapsedMs = computeElapsedMs(meta);
  const method = (config.method ?? "get").toUpperCase();
  const url = resolveRequestUrl(config);
  const responseStatus = axiosError.response?.status;
  const responseHeaders = sanitizeHeadersForLog(
    normalizeHeaders(axiosError.response?.headers as AxiosRequestConfig["headers"])
  );
  const responseBody = sanitizeValue(axiosError.response?.data, null, new WeakSet<object>(), 0);

  const summary = [
    `[HTTP DEBUG][${source}] Error requestId=${requestId}`,
    `method=${method}`,
    `url=${url}`,
    `message=${axiosError.message ?? "Unknown error"}`,
  ];
  if (axiosError.code) summary.push(`code=${axiosError.code}`);
  if (typeof responseStatus === "number") summary.push(`status=${responseStatus}`);
  if (elapsedMs !== null) summary.push(`durationMs=${elapsedMs}`);

  console.log(summary.join(" "));
  console.log(
    `[HTTP DEBUG][${source}] Error payload requestId=${requestId} ${safeJsonStringify({
      responseHeaders,
      responseBody,
    })}`
  );
}

export function logCurlRequest(source: string, config: AxiosRequestConfig): void {
  if (!isCurlDebugEnabled()) return;
  const command = buildCurlCommand(config);
  console.log(`[CURL DEBUG][${source}] ${command}`);
}

export function logCurlResponse(source: string, response: AxiosResponse): void {
  if (!isCurlDebugEnabled()) return;
  console.log(
    `[CURL DEBUG][${source}] Response ${response.status} ${response.config.method?.toUpperCase() ?? "GET"} ${resolveRequestUrl(
      response.config
    )}`
  );
}

export function logCurlError(source: string, error: AxiosError | unknown): void {
  if (!isCurlDebugEnabled()) return;

  const axiosError = error as AxiosError;
  if (axiosError.config) {
    console.log(
      `[CURL DEBUG][${source}] Request failed: ${axiosError.message}`
    );
    logCurlRequest(source, axiosError.config);
  }
}
