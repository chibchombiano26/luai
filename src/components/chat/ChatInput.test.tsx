import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";

vi.mock("./SlashCommandMenu", () => ({
  SlashCommandMenu: () => <div data-testid="slash-command-menu" />,
}));

type SpeechRecognitionHandlers = {
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];

  lang = "";
  interimResults = false;
  continuous = false;
  onresult: SpeechRecognitionHandlers["onresult"] = null;
  onerror: SpeechRecognitionHandlers["onerror"] = null;
  onend: SpeechRecognitionHandlers["onend"] = null;
  start = vi.fn();
  stop = vi.fn();

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
}

function renderChatInput(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props: React.ComponentProps<typeof ChatInput> = {
    input: "",
    setInput: vi.fn(),
    isLoading: false,
    chatLocked: false,
    lockedMessage: undefined,
    authAction: undefined,
    onCancelRequest: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onKeyDown: vi.fn(),
    isInputComposing: false,
    onInputCompositionStart: vi.fn(),
    onInputCompositionEnd: vi.fn(),
    pendingAutoSubmit: null,
    onCancelAutoSubmit: vi.fn(),
    locale: "es",
    onSelectCommand: vi.fn(),
    onVoiceInputReady: vi.fn(),
    enabledCommandIds: ["weather_forecast"],
    ...overrides,
  };

  return {
    ...render(<ChatInput {...props} />),
    props,
  };
}

describe("ChatInput", () => {
  const originalSpeechRecognition = window.SpeechRecognition;
  const originalWebkitSpeechRecognition = (window as Window & {
    webkitSpeechRecognition?: typeof FakeSpeechRecognition;
  }).webkitSpeechRecognition;

  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    window.SpeechRecognition = FakeSpeechRecognition as never;
    (window as Window & { webkitSpeechRecognition?: typeof FakeSpeechRecognition }).webkitSpeechRecognition =
      undefined;
  });

  afterEach(() => {
    window.SpeechRecognition = originalSpeechRecognition;
    (window as Window & { webkitSpeechRecognition?: typeof FakeSpeechRecognition }).webkitSpeechRecognition =
      originalWebkitSpeechRecognition;
  });

  it("shows auto-submit banner, cancel button and stop-request button", async () => {
    const user = userEvent.setup();
    const { props } = renderChatInput({
      isLoading: true,
      pendingAutoSubmit: { text: "hola", secondsLeft: 1 },
    });

    expect(screen.queryByTestId("auto-submit-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("stop-request-button")).toBeInTheDocument();
    expect(screen.getByTestId("stop-request-button")).toHaveClass("bg-zinc-100", "text-zinc-700");

    renderChatInput({
      pendingAutoSubmit: { text: "hola", secondsLeft: 1 },
      onCancelAutoSubmit: props.onCancelAutoSubmit,
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onCancelAutoSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows no voice button when voice recognition is unsupported", () => {
    window.SpeechRecognition = undefined as never;

    renderChatInput();

    expect(screen.queryByTestId("voice-input-button")).not.toBeInTheDocument();
  });

  it("starts voice recognition, appends transcript and auto-submits on end", async () => {
    const user = userEvent.setup();
    const { props } = renderChatInput({
      input: "base",
    });

    await user.click(screen.getByTestId("voice-input-button"));

    const recognition = FakeSpeechRecognition.instances[0];
    expect(recognition.start).toHaveBeenCalledOnce();
    expect(screen.getByTestId("voice-listening-indicator")).toBeInTheDocument();

    recognition.onresult?.({
      results: [
        [{ transcript: "hola" }],
        [{ transcript: "mundo" }],
      ],
    });

    expect(props.setInput).toHaveBeenLastCalledWith("base hola mundo");

    recognition.onend?.();
    expect(props.onVoiceInputReady).toHaveBeenCalledWith("base hola mundo");
  });

  it("shows an error when speech recognition start throws", async () => {
    const user = userEvent.setup();
    renderChatInput();

    const recognition = FakeSpeechRecognition.instances[0];
    recognition.start.mockImplementationOnce(() => {
      throw new Error("permission denied");
    });

    await user.click(screen.getByTestId("voice-input-button"));
    expect(screen.getByTestId("voice-input-error")).toBeInTheDocument();
  });

  it("shows an error when recognition emits an error", async () => {
    const user = userEvent.setup();
    renderChatInput();

    const recognition = FakeSpeechRecognition.instances[0];

    await user.click(screen.getByTestId("voice-input-button"));
    recognition.onerror?.({ error: "network" });
    await waitFor(() => {
      expect(screen.getByTestId("voice-input-error")).toBeInTheDocument();
    });
  });

  it("stops active listening before submit and suppresses auto-submit on end", async () => {
    const user = userEvent.setup();
    const { props } = renderChatInput();

    await user.click(screen.getByTestId("voice-input-button"));
    const recognition = FakeSpeechRecognition.instances[0];

    recognition.onresult?.({
      results: [[{ transcript: "texto" }]],
    });

    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(submitButton).not.toBeNull();

    await user.click(submitButton!);
    expect(recognition.stop).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    recognition.onend?.();
    expect(props.onVoiceInputReady).not.toHaveBeenCalled();
  });

  it("wires textarea and composition handlers", () => {
    const { props } = renderChatInput({
      input: "hello",
    });

    const textarea = screen.getByPlaceholderText("Escribe tu mensaje aquí...");
    fireEvent.change(textarea, { target: { value: "nuevo" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    fireEvent.compositionStart(textarea);
    fireEvent.compositionEnd(textarea);

    expect(props.setInput).toHaveBeenCalledWith("nuevo");
    expect(props.onKeyDown).toHaveBeenCalled();
    expect(props.onInputCompositionStart).toHaveBeenCalled();
    expect(props.onInputCompositionEnd).toHaveBeenCalled();
    expect(screen.getByTestId("slash-command-menu")).toBeInTheDocument();
  });

});
