import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock Next.js font imports
vi.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans",
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
  }),
}));

// Mock the CSS import
vi.mock("./globals.css", () => ({}));

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
}));

// Import after mocking
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  describe("Metadata", () => {
    it("uses the generated web manifest route", () => {
      expect(metadata.manifest).toBe("/manifest.webmanifest");
    });
  });

  describe("Children Rendering", () => {
    it("renders simple children", () => {
      render(
        <RootLayout>
          <p>Child Content</p>
        </RootLayout>
      );

      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("renders complex children structure", () => {
      render(
        <RootLayout>
          <div>
            <section>
              <h1>Heading</h1>
              <p>Paragraph</p>
            </section>
          </div>
        </RootLayout>
      );

      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <RootLayout>
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </RootLayout>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.getByText("Content 3")).toBeInTheDocument();
    });

    it("supports content children of any type", () => {
      const content = <h1>Main Content</h1>;

      render(
        <RootLayout>
          {content}
        </RootLayout>
      );

      expect(screen.getByText("Main Content")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("maintains semantic document structure", () => {
      render(
        <RootLayout>
          <main>
            <h1>Main</h1>
          </main>
        </RootLayout>
      );

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("Layout Component", () => {
    it("is a server component that accepts children", () => {
      expect(() => {
        render(
          <RootLayout>
            <div>Test</div>
          </RootLayout>
        );
      }).not.toThrow();
    });

    it("renders without errors with various content", () => {
      render(
        <RootLayout>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </RootLayout>
      );

      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("handles empty children gracefully", () => {
      expect(() => {
        render(<RootLayout>{null}</RootLayout>);
      }).not.toThrow();
    });

    it("works with React fragments", () => {
      render(
        <RootLayout>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </RootLayout>
      );

      expect(screen.getByText("Fragment Child 1")).toBeInTheDocument();
      expect(screen.getByText("Fragment Child 2")).toBeInTheDocument();
    });
  });

  describe("TypeScript Props", () => {
    it("accepts Readonly children prop correctly", () => {
      const content = <p>Readonly children test</p>;

      render(
        <RootLayout>
          {content}
        </RootLayout>
      );

      expect(screen.getByText("Readonly children test")).toBeInTheDocument();
    });
  });
});
