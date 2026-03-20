import { render, screen } from "@testing-library/react";
import MessageList from "../MessageList";

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("../../ContextPreview", () => ({
  __esModule: true,
  default: ({ contextItems }: { contextItems: any[] }) => (
    <div data-testid="context-preview">context:{contextItems.length}</div>
  ),
}));

const mockLabels = {
  ETCOP_Welcome_Message: "Welcome to Copilot!",
};

const makeMessage = (overrides = {}) => ({
  message_id: "msg-1",
  sender: "user",
  role: "user",
  text: "Hello",
  timestamp: "12:00",
  ...overrides,
});

describe("MessageList", () => {
  it("shows welcome message when messages array is empty", () => {
    render(<MessageList messages={[]} labels={mockLabels} />);
    expect(screen.getByText("Welcome to Copilot!")).toBeInTheDocument();
  });

  it("renders user messages", () => {
    const messages = [makeMessage({ text: "Hello world", sender: "user", role: "user" })];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders bot messages", () => {
    const messages = [makeMessage({ text: "Bot response", sender: "bot", role: "assistant" })];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("Bot response")).toBeInTheDocument();
  });

  it("filters out tool messages from the message list area", () => {
    const messages = [
      makeMessage({ text: "Visible", sender: "user", role: "user" }),
      makeMessage({ message_id: "tool-1", text: "Tool progress text", sender: "bot", role: "tool" }),
    ];
    render(<MessageList messages={messages} labels={mockLabels} />);
    // Visible message appears as a regular message bubble
    expect(screen.getByText("Visible")).toBeInTheDocument();
    // Tool text shown in the loading area but not as a regular message bubble
    // The component shows it in the loading section when last message is tool type
    expect(screen.getByText("Tool progress text")).toBeInTheDocument();
  });

  it("filters out node messages from regular message bubbles", () => {
    const messages = [
      makeMessage({ text: "User msg", sender: "user", role: "user" }),
      makeMessage({ message_id: "node-1", text: "Node running", sender: "bot", role: "node" }),
    ];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("User msg")).toBeInTheDocument();
    // Node message text appears in loading area
    expect(screen.getByText("Node running")).toBeInTheDocument();
  });

  it("shows loading area when isLoading is true", () => {
    const messages = [makeMessage()];
    render(<MessageList messages={messages} labels={mockLabels} isLoading />);
    // Loading indicator is rendered - check for the spinner div
    const { container } = render(<MessageList messages={messages} labels={mockLabels} isLoading />);
    expect(container.querySelector(".spinner-gradient")).toBeTruthy();
  });

  it("shows tool message text in loading area when last message is tool type", () => {
    const messages = [
      makeMessage({ text: "User message", sender: "user", role: "user" }),
      makeMessage({ message_id: "tool-2", text: "Processing...", sender: "bot", role: "tool" }),
    ];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("renders message timestamp", () => {
    const messages = [makeMessage({ timestamp: "14:30" })];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("14:30")).toBeInTheDocument();
  });

  it("uses translations for welcome message when provided", () => {
    render(<MessageList messages={[]} labels={mockLabels} translations={{ welcomeMessage: "Hola!" }} />);
    expect(screen.getByText("Hola!")).toBeInTheDocument();
  });

  it("renders multiple messages", () => {
    const messages = [
      makeMessage({ message_id: "1", text: "First", sender: "user", role: "user" }),
      makeMessage({ message_id: "2", text: "Second", sender: "bot", role: "assistant" }),
    ];
    render(<MessageList messages={messages} labels={mockLabels} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
