import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatHeader } from "./ChatHeader";
import type { ChatSession } from "@/lib/chatHistory";

const clerkState = vi.hoisted(() => ({
  isLoaded: false,
  isSignedIn: false,
  user: null as null | { publicMetadata?: Record<string, unknown> },
}));

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="clerk-user-button" />,
  useUser: () => clerkState,
}));

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: "session-1",
    title: "Cotizacion Mazda 3",
    locale: "es",
    messages: [{ id: "m1", role: "user", content: "hola", timestamp: Date.now() }],
    toolMessages: [],
    updatedAt: Date.now(),
    ...overrides,
  };
}

function renderHeader(overrides: Partial<React.ComponentProps<typeof ChatHeader>> = {}) {
  const props: React.ComponentProps<typeof ChatHeader> = {
    clerkEnabled: false,
    locale: "es",
    changeLocale: vi.fn(),
    sessions: [makeSession()],
    activeSessionId: "session-1",
    switchConversation: vi.fn(),
    deleteConversation: vi.fn(),
    startNewConversation: vi.fn(),
    hasOverrides: false,
    accentTheme: "blue",
    setAccentTheme: vi.fn(),
    theme: "light",
    toggleTheme: vi.fn(),
    themeMounted: true,
    showNewChatButton: true,
    ...overrides,
  };

  return {
    ...render(<ChatHeader {...props} />),
    props,
  };
}

describe("ChatHeader", () => {
  const originalClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    clerkState.isLoaded = false;
    clerkState.isSignedIn = false;
    clerkState.user = null;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey;
  });

  it("renders host mode without Clerk and shows overrides plus local admin link", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader({ hasOverrides: true });

    expect(screen.getByText("⚙️ Hay overrides activos en el payload.")).toBeInTheDocument();
    expect(screen.getByText("LuAI")).toBeInTheDocument();
    expect(screen.queryByTestId("clerk-user-button")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("link", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cambiar a oscuro" }));
    expect(props.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("renders Clerk brand and admin controls based on auth state", async () => {
    const user = userEvent.setup();
    clerkState.isLoaded = true;
    clerkState.isSignedIn = true;
    clerkState.user = {
      publicMetadata: {
        role: "admin",
      },
    };

    renderHeader({
      clerkEnabled: true,
      locale: "en",
      theme: "dark",
    });

    expect(screen.getByTestId("clerk-user-button")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });

  it("hides admin link for non-admin Clerk users when signed out", async () => {
    const user = userEvent.setup();
    clerkState.isLoaded = true;
    clerkState.isSignedIn = false;

    renderHeader({ clerkEnabled: true, locale: "en" });

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it(
    "opens history, switches conversations, deletes existing sessions and handles empty state",
    async () => {
    const user = userEvent.setup();
    const emptySession = makeSession({
      id: "fresh",
      title: "Fresh",
      messages: [],
      toolMessages: [],
    });
    const { props, rerender } = renderHeader({
      sessions: [makeSession(), emptySession],
      activeSessionId: "session-1",
    });

    await user.click(screen.getByRole("button", { name: "Historial" }));
    const historyMenu = screen.getByRole("menu", { name: "historial menu" });
    await user.click(within(historyMenu).getByRole("button", { name: "Nuevo" }));
    expect(props.startNewConversation).toHaveBeenCalledTimes(1);

    rerender(
      <ChatHeader
        {...props}
        sessions={[makeSession(), emptySession]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Historial" }));
    await user.click(screen.getByText("Cotizacion Mazda 3"));
    expect(props.switchConversation).toHaveBeenCalledWith("session-1");

    await user.click(screen.getByRole("button", { name: "Historial" }));
    await user.click(screen.getByLabelText("Eliminar conversacion Cotizacion Mazda 3"));
    expect(props.deleteConversation).toHaveBeenCalledWith("session-1");
    expect(screen.queryByLabelText("Eliminar conversacion Fresh")).not.toBeInTheDocument();

    rerender(
      <ChatHeader
        {...props}
        sessions={[]}
      />
    );

    if (screen.queryByRole("menu", { name: "historial menu" })) {
      await user.click(screen.getByRole("button", { name: "Historial" }));
    }
    await user.click(screen.getByRole("button", { name: "Historial" }));
    expect(screen.getByText("Aun no hay conversaciones")).toBeInTheDocument();
    },
    15000
  );

  it("changes locale, palette and honors hidden toggles", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader({
      themeMounted: false,
      showNewChatButton: false,
    });

    expect(screen.queryByRole("button", { name: "Cambiar a oscuro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(props.changeLocale).toHaveBeenCalledWith("en");

    await user.click(screen.getByRole("button", { name: "Paleta" }));
    await user.click(screen.getByRole("button", { name: "Paleta Azul" }));
    expect(props.setAccentTheme).toHaveBeenCalledWith("blue");
  });
});
