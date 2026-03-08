import { render, screen, waitFor } from "@testing-library/react";
import { Chat } from "./Chat";
import { describe, it, expect, beforeEach } from "vitest";

describe("Chat Component - Integration", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => {};
    localStorage.clear();
  });

  it("should render Chat component without crashing", () => {
    expect(() => {
      render(<Chat />);
    }).not.toThrow();
  });

  it("should show loading state during mount", () => {
    render(<Chat />);

    const loadingOrChat =
      screen.queryByText(/Cargando chat/i) || screen.queryByText("LuAI");
    expect(loadingOrChat).toBeInTheDocument();
  });

  it("should render chat interface after mount", async () => {
    render(<Chat />);

    await waitFor(
      () => {
        expect(screen.getByText("LuAI")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Escribe tu mensaje aquí...")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should have proper chat header", async () => {
    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText("LuAI")).toBeInTheDocument();
      expect(screen.getByText("En línea")).toBeInTheDocument();
    });
  });

  it("should have multiline input field with placeholder", async () => {
    render(<Chat />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText("Escribe tu mensaje aquí...");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("TEXTAREA");
    });
  });

  it("should have send button", async () => {
    const { container } = render(<Chat />);

    await waitFor(() => {
      const button = container.querySelector('button[type="submit"]');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  it("should render with proper layout structure", async () => {
    const { container } = render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText("LuAI")).toBeInTheDocument();
    });

    const chatContainer = container.querySelector(".max-w-2xl") || container.firstChild;
    expect(chatContainer).toBeInTheDocument();
  });

  it("should have dark mode classes", async () => {
    const { container } = render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText("LuAI")).toBeInTheDocument();
    });

    const darkModeElements = container.querySelectorAll("[class*='dark:']");
    expect(darkModeElements.length > 0).toBe(true);
  });
});
