import { render, screen } from "@testing-library/react";
import Home from "./page";
import { beforeEach, describe, expect, it, vi } from "vitest";

const homeClientMock = vi.hoisted(() =>
  vi.fn(({ clerkEnabled }: { clerkEnabled: boolean }) => (
    <div data-testid="mock-home-client">{String(clerkEnabled)}</div>
  ))
);

const isClerkAuthEnabledMock = vi.hoisted(() => vi.fn(() => true));
const ensureCurrentClerkUserAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/home/HomeClient", () => ({
  HomeClient: homeClientMock,
}));

vi.mock("@/lib/auth", () => ({
  isClerkAuthEnabled: isClerkAuthEnabledMock,
}));

vi.mock("@/lib/access/clerk-user", () => ({
  ensureCurrentClerkUserAccess: ensureCurrentClerkUserAccessMock,
}));

describe("Home Page", () => {
  beforeEach(() => {
    homeClientMock.mockClear();
    isClerkAuthEnabledMock.mockReset();
    isClerkAuthEnabledMock.mockReturnValue(true);
    ensureCurrentClerkUserAccessMock.mockReset();
    ensureCurrentClerkUserAccessMock.mockResolvedValue(null);
  });

  it("renders the main structure and chat", async () => {
    render(await Home());

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByTestId("mock-home-client")).toBeInTheDocument();
  });

  it("passes the Clerk auth state to the home client", async () => {
    isClerkAuthEnabledMock.mockReturnValue(false);
    render(await Home());

    expect(homeClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ clerkEnabled: false }),
      undefined
    );
    expect(screen.getByTestId("mock-home-client")).toHaveTextContent("false");
  });

  it("provisions Clerk access when auth is enabled", async () => {
    render(await Home());

    expect(ensureCurrentClerkUserAccessMock).toHaveBeenCalledTimes(1);
  });

  it("uses the expected app shell styles", async () => {
    render(await Home());

    expect(screen.getByRole("main")).toHaveClass("min-h-[100dvh]");
    expect(screen.getByRole("main")).toHaveClass("bg-white");
    expect(screen.getByRole("main")).toHaveClass("dark:bg-black");
  });
});
