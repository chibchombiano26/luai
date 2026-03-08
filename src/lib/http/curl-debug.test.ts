import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachOutboundDebugMeta,
  buildCurlCommand,
  isDetailedHttpDebugEnabled,
  isCurlDebugEnabled,
  logCurlError,
  logHttpErrorDetails,
  logHttpRequestDetails,
  logHttpResponseDetails,
  logCurlRequest,
  logCurlResponse,
} from "./curl-debug";

describe("curl-debug", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.DEBUG_OUTBOUND_CURLS;
    delete process.env.DEBUG_OUTBOUND_HTTP_DETAILS;
    delete process.env.OUTBOUND_HTTP_DEBUG_MAX_BODY_CHARS;
    process.env = { ...process.env, NODE_ENV: "test" };
  });

  it("enables curl debug with opt-in env var regardless of NODE_ENV", () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";
    expect(isCurlDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_CURLS = "false";
    expect(isCurlDebugEnabled()).toBe(false);

    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";
    expect(isCurlDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_CURLS = "1";
    expect(isCurlDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_CURLS = "yes";
    expect(isCurlDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_CURLS = "on";
    expect(isCurlDebugEnabled()).toBe(true);
  });

  it("enables detailed outbound debug with dedicated env var", () => {
    expect(isDetailedHttpDebugEnabled()).toBe(false);

    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    expect(isDetailedHttpDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "1";
    expect(isDetailedHttpDebugEnabled()).toBe(true);

    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "off";
    expect(isDetailedHttpDebugEnabled()).toBe(false);
  });

  it("builds curl command with merged URL, insecure flag, normalized headers and serialized body", () => {
    const command = buildCurlCommand({
      method: "post",
      url: "/quotes",
      baseURL: "https://api.example.com/",
      headers: {
        Authorization: "Bearer token",
        "X-Multi": ["a", "b"],
      },
      data: { quote: 1 },
      httpsAgent: { options: { rejectUnauthorized: false } },
    });

    expect(command).toContain("curl -k -X POST 'https://api.example.com/quotes'");
    expect(command).toContain("-H 'Authorization: [REDACTED]'");
    expect(command).toContain("-H 'X-Multi: a; b'");
    expect(command).toContain("--data-raw '{\"quote\":1}'");
  });

  it("supports headers.toJSON, URLSearchParams and fallback URL normalization", () => {
    const body = new URLSearchParams({
      page: "1",
      q: "sedan",
    });

    const command = buildCurlCommand({
      method: "get",
      url: "/search",
      baseURL: "::::",
      headers: {
        toJSON: () => ({
          "X-Trace": "abc",
          "X-Null": null,
        }),
      } as unknown as Record<string, string>,
      data: body,
    });

    expect(command).toContain("curl -X GET '::::/search'");
    expect(command).toContain("-H 'X-Trace: abc'");
    expect(command).not.toContain("X-Null");
    expect(command).toContain("--data-raw '{\"page\":\"1\",\"q\":\"sedan\"}'");
  });

  it("serializes Buffer and safely quotes apostrophes in body", () => {
    const command = buildCurlCommand({
      method: "post",
      url: "https://api.example.com/raw",
      data: Buffer.from("O'Hara"),
    });

    expect(command).toContain("curl -X POST 'https://api.example.com/raw'");
    expect(command).toContain("--data-raw '[REDACTED]'");
  });

  it("redacts opaque string payloads in curl logs", () => {
    const command = buildCurlCommand({
      method: "post",
      url: "https://api.example.com/text",
      data: "raw-text-body",
    });

    expect(command).toContain("--data-raw '[REDACTED]'");
    expect(command).not.toContain("raw-text-body");
  });

  it("sanitizes non-serializable objects without leaking raw values", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    const command = buildCurlCommand({
      url: "https://api.example.com/circular",
      data: circular,
    });

    expect(command).toContain("--data-raw '{\"self\":\"[Circular]\"}'");
    expect(command).not.toContain("[object Object]");
  });

  it("uses relative URL when baseURL is missing and serializes primitive body values", () => {
    const command = buildCurlCommand({
      method: "post",
      url: "/relative-endpoint",
      data: 42,
    });

    expect(command).toContain("curl -X POST '/relative-endpoint'");
    expect(command).toContain("--data-raw '42'");
  });

  it("supports empty request URL and omits body when payload is nullish", () => {
    const command = buildCurlCommand({
      method: "get",
      data: null,
    });

    expect(command).toContain("curl -X GET ''");
    expect(command).not.toContain("--data-raw");
  });

  it("omits body when payload is explicitly undefined", () => {
    const command = buildCurlCommand({
      method: "post",
      url: "https://api.example.com/no-body",
      data: undefined,
    });

    expect(command).toContain("curl -X POST 'https://api.example.com/no-body'");
    expect(command).not.toContain("--data-raw");
  });

  it("logs request and response only when debug mode is enabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logCurlRequest("provider-a", {
      method: "get",
      url: "https://api.example.com/health",
    });
    logCurlResponse("provider-a", {
      status: 200,
      config: {
        method: "post",
        url: "/quote",
        baseURL: "https://api.example.com",
      },
    } as never);
    expect(logSpy).not.toHaveBeenCalled();

    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";

    logCurlRequest("provider-a", {
      method: "get",
      url: "https://api.example.com/health",
    });
    logCurlResponse("provider-a", {
      status: 201,
      config: {
        method: "post",
        url: "/quote",
        baseURL: "https://api.example.com",
      },
    } as never);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[CURL DEBUG][provider-a] curl -X GET 'https://api.example.com/health'")
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[CURL DEBUG][provider-a] Response 201 POST https://api.example.com/quote")
    );
  });

  it("uses GET fallback when response method is missing", () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logCurlResponse("provider", {
      status: 204,
      config: {
        url: "/health",
        baseURL: "https://api.example.com",
      },
    } as never);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[CURL DEBUG][provider] Response 204 GET https://api.example.com/health")
    );
  });

  it("logs error details and request command when axios-style config is present", () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logCurlError("provider", {
      message: "upstream failed",
      config: {
        method: "post",
        url: "/submit",
        baseURL: "https://api.example.com",
      },
    });

    expect(logSpy).toHaveBeenCalledWith(
      "[CURL DEBUG][provider] Request failed: upstream failed"
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("curl -X POST 'https://api.example.com/submit'")
    );
  });

  it("ignores errors without config", () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.DEBUG_OUTBOUND_CURLS = "true";

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logCurlError("provider", new Error("boom"));
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("returns early for errors when debug mode is disabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env = { ...process.env, NODE_ENV: "test" };
    process.env.DEBUG_OUTBOUND_CURLS = "false";

    logCurlError("provider", {
      message: "should not log",
      config: {
        method: "post",
        url: "/submit",
        baseURL: "https://api.example.com",
      },
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("logs detailed request and response with sensitive values redacted", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    process.env.OUTBOUND_HTTP_DEBUG_MAX_BODY_CHARS = "40";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const requestConfig = {
      method: "post",
      url: "/quote",
      baseURL: "https://api.example.com",
      headers: {
        Authorization: "Bearer test-token",
        "X-API-Key": "private-key",
        "X-Trace": "trace-id",
      },
      params: {
        token: "sensitive-param-token",
        channel: "web",
      },
      data: {
        password: "super-secret",
        nested: {
          apiKey: "inner-secret",
          keep: "ok",
        },
      },
    };

    const meta = attachOutboundDebugMeta(requestConfig);

    logHttpRequestDetails("langflow-api", requestConfig);
    logHttpResponseDetails("langflow-api", {
      status: 200,
      headers: {
        "set-cookie": "session-id=abc123",
      },
      data: {
        quotationNumber: "A-1",
        token: "response-token",
      },
      config: requestConfig,
    } as never);

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain(`requestId=${meta.requestId}`);
    expect(output).toContain("\"Authorization\":\"[REDACTED]\"");
    expect(output).toContain("\"X-API-Key\":\"[REDACTED]\"");
    expect(output).toContain("\"password\":\"[REDACTED]\"");
    expect(output).toContain("\"apiKey\":\"[REDACTED]\"");
    expect(output).toContain("\"token\":\"[REDACTED]\"");
    expect(output).toContain("\"set-cookie\":\"[REDACTED]\"");
    expect(output).toContain("\"keep\":\"ok\"");
  });

  it("logs detailed axios errors with status and redacted payload fields", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const requestConfig = {
      method: "post",
      url: "/submit",
      baseURL: "https://api.example.com",
      data: {
        password: "secret",
      },
    };

    const meta = attachOutboundDebugMeta(requestConfig);

    logHttpErrorDetails("langflow-api", {
      message: "Request failed with status code 502",
      code: "ERR_BAD_RESPONSE",
      config: requestConfig,
      response: {
        status: 502,
        headers: {
          "x-api-key": "abc123",
        },
        data: {
          error: "Bad gateway",
          token: "response-token",
        },
      },
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain(`requestId=${meta.requestId}`);
    expect(output).toContain("status=502");
    expect(output).toContain("code=ERR_BAD_RESPONSE");
    expect(output).toContain("\"x-api-key\":\"[REDACTED]\"");
    expect(output).toContain("\"token\":\"[REDACTED]\"");
    expect(output).toContain("\"error\":\"Bad gateway\"");
  });

  it("logs detailed error fallback when axios error has no config", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpErrorDetails("langflow-api", {
      message: "config missing",
    });

    expect(logSpy).toHaveBeenCalledWith(
      "[HTTP DEBUG][langflow-api] Request failed without Axios config message=config missing"
    );
  });

  it("logs unknown error fallback when axios error has no config and no message", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpErrorDetails("langflow-api", {});

    expect(logSpy).toHaveBeenCalledWith(
      "[HTTP DEBUG][langflow-api] Request failed without Axios config message=Unknown error"
    );
  });

  it("falls back to String(value) when JSON stringify fails in detailed logs", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const stringifySpy = vi.spyOn(JSON, "stringify").mockImplementation(() => {
      throw new Error("forced stringify error");
    });

    logHttpRequestDetails("langflow-api", {
      method: "post",
      url: "https://api.example.com/quote",
      data: { ok: true },
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain("[object Object]");
    stringifySpy.mockRestore();
  });

  it("sanitizes complex request payload types and truncates long strings", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    process.env.OUTBOUND_HTTP_DEBUG_MAX_BODY_CHARS = "invalid";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const deepPayload = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: "too-deep",
              },
            },
          },
        },
      },
    };

    logHttpRequestDetails("langflow-api", {
      method: undefined,
      url: "/quote",
      baseURL: "https://api.example.com",
      timeout: undefined,
      headers: {
        "   ": "blank-header-key",
      },
      data: {
        longText: "x".repeat(3000),
        fn: () => "ok",
        amount: 123n,
        raw: Buffer.from("raw-buffer"),
        issuedAt: new Date("2026-01-01T00:00:00.000Z"),
        list: [1, 2, 3],
        deepPayload,
        circular,
      },
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain("\"fn\":\"[Function]\"");
    expect(output).toContain("\"amount\":\"123\"");
    expect(output).toContain("\"raw\":\"raw-buffer\"");
    expect(output).toContain("\"issuedAt\":\"2026-01-01T00:00:00.000Z\"");
    expect(output).toContain("\"level5\":\"[MaxDepth]\"");
    expect(output).toContain("\"self\":\"[Circular]\"");
    expect(output).toContain("...[truncated]");
  });

  it("logs timeout value and sanitizes uncommon scalar types", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpRequestDetails("langflow-api", {
      method: "post",
      url: "/quote",
      baseURL: "https://api.example.com",
      timeout: 1234,
      data: {
        symbolValue: Symbol("x"),
      },
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain("timeoutMs=1234");
    expect(output).toContain('"symbolValue":"Symbol(x)"');
  });

  it("sanitizes deeply nested arrays with max depth guard", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpRequestDetails("langflow-api", {
      method: "post",
      url: "https://api.example.com/array-depth",
      data: [[[[[[[1]]]]]]],
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain("[MaxDepth]");
  });

  it("no-ops detailed request/response/error logs when detailed debug is disabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpRequestDetails("langflow-api", {
      method: "post",
      url: "https://api.example.com/quote",
    });
    logHttpResponseDetails("langflow-api", {
      status: 200,
      config: {
        method: "get",
        url: "https://api.example.com/quote",
      },
      headers: {},
      data: {},
    } as never);
    logHttpErrorDetails("langflow-api", {
      message: "boom",
      config: {
        method: "post",
        url: "https://api.example.com/quote",
      },
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("logs response/error with unknown request metadata when config has no debug meta", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logHttpResponseDetails("langflow-api", {
      status: 204,
      config: {
        method: undefined,
        url: "/health",
        baseURL: "https://api.example.com",
      },
      headers: {},
      data: null,
    } as never);

    logHttpErrorDetails("langflow-api", {
      message: undefined,
      code: "ECONNRESET",
      config: {
        method: undefined,
        url: "/submit",
        baseURL: "https://api.example.com",
      },
    });

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).toContain("requestId=unknown");
    expect(output).toContain("method=GET");
    expect(output).toContain("message=Unknown error");
    expect(output).toContain("code=ECONNRESET");
  });

  it("omits duration when request metadata has future startedAt timestamp", () => {
    process.env.DEBUG_OUTBOUND_HTTP_DETAILS = "true";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const originalNow = Date.now;
    const config = {
      method: "post",
      url: "/quote",
      baseURL: "https://api.example.com",
    } as const;

    Date.now = vi.fn()
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(900) as unknown as typeof Date.now;
    attachOutboundDebugMeta(config as never);

    logHttpResponseDetails("langflow-api", {
      status: 200,
      config: config as never,
      headers: {},
      data: {},
    } as never);

    const output = logSpy.mock.calls.map(([entry]) => String(entry)).join("\n");
    expect(output).not.toContain("durationMs=");
    Date.now = originalNow;
  });
});
