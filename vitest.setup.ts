import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { queryClient } from "@/lib/query/query-client";

// Mock matchMedia if needed for some components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Avoid jsdom "Not implemented: Window's scrollTo() method" noise.
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Prevent jsdom navigation warnings when tests click regular anchor links.
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const anchor = target.closest("a");
  if (anchor) {
    event.preventDefault();
  }
});

afterEach(() => {
  queryClient.clear();
});
