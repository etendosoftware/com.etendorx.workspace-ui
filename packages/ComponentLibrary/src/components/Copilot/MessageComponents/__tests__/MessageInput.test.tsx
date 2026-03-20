import { render, screen, fireEvent } from "@testing-library/react";
import MessageInput from "../MessageInput";

jest.mock("../../ContextPreview", () => ({
  __esModule: true,
  default: ({ contextItems }: { contextItems?: any[] }) => <div data-testid="context-preview" />,
}));

const defaultProps = {
  onSendMessage: jest.fn(),
  placeholder: "Type a message...",
};

describe("MessageInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the textarea", () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    render(<MessageInput {...defaultProps} placeholder="Ask something..." />);
    expect(screen.getByPlaceholderText("Ask something...")).toBeInTheDocument();
  });

  it("renders context preview", () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId("context-preview")).toBeInTheDocument();
  });

  it("allows typing in textarea", () => {
    render(<MessageInput {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello test" } });
    expect(textarea).toHaveValue("Hello test");
  });

  it("disables textarea when disabled prop is true", () => {
    render(<MessageInput {...defaultProps} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("calls onSendMessage when Enter is pressed without Shift", () => {
    const onSendMessage = jest.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSendMessage).toHaveBeenCalledWith("Hello");
  });

  it("does not call onSendMessage when Shift+Enter is pressed", () => {
    const onSendMessage = jest.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("does not call onSendMessage when message is empty", () => {
    const onSendMessage = jest.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("clears message after sending", () => {
    render(<MessageInput {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Send me" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(textarea).toHaveValue("");
  });

  it("uses externalMessage when provided", () => {
    render(<MessageInput {...defaultProps} message="External value" />);
    expect(screen.getByRole("textbox")).toHaveValue("External value");
  });

  it("renders attached files when files are provided", () => {
    const files = [new File(["content"], "test.txt", { type: "text/plain" })];
    render(<MessageInput {...defaultProps} files={files} />);
    expect(screen.getByText("test.txt")).toBeInTheDocument();
  });

  it("calls onRemoveFile when file remove button is clicked", () => {
    const onRemoveFile = jest.fn();
    const files = [new File(["content"], "test.txt", { type: "text/plain" })];
    render(<MessageInput {...defaultProps} files={files} onRemoveFile={onRemoveFile} />);
    const removeBtn = screen.getByLabelText("Remove test.txt");
    fireEvent.click(removeBtn);
    expect(onRemoveFile).toHaveBeenCalledWith(0);
  });

  it("calls onMessageChange when provided", () => {
    const onMessageChange = jest.fn();
    render(<MessageInput {...defaultProps} message="" onMessageChange={onMessageChange} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Changed" } });
    expect(onMessageChange).toHaveBeenCalledWith("Changed");
  });
});
