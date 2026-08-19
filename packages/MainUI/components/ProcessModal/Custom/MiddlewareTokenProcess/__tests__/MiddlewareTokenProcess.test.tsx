import { fireEvent, render, screen } from "@testing-library/react";
import { MiddlewareTokenProcess } from "../MiddlewareTokenProcess";
import type { MiddlewareTokenSchema } from "../types";
import type { CustomProcessComponentProps } from "../../types";

jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => (props: never) => <svg {...props} />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/hard-drive.svg", () => (props: never) => <svg {...props} />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/calendar.svg", () => (props: never) => <svg {...props} />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/mail.svg", () => (props: never) => <svg {...props} />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/key.svg", () => (props: never) => <svg {...props} />);

// Translations echo their key, so assertions read against the locale paths themselves.
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: unknown) => unknown) => selector({ user: { id: "100" } }),
}));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));

const SCHEMA: MiddlewareTokenSchema = {
  type: "middlewareTokenProcess",
  accountId: "c45c4946-714a-4e2d-8e30-5944fe2e3533",
  redirectUri: "http://localhost:8080/etendo/saveTokenMiddleware",
  startEndpoint: "https://sso.etendo.cloud/oauth-integrations/start",
  providers: {
    google: {
      name: "google",
      scopes: [
        {
          name: "Google Drive - Edit Access Level",
          scope: "https://www.googleapis.com/auth/drive.file",
          description: "Allows you to upload and manage files.",
        },
        {
          name: "Google Drive - Read Only Access Level",
          scope: "https://www.googleapis.com/auth/drive.readonly",
          description: "Allows read-only access.",
        },
      ],
    },
  },
};

const renderComponent = (schema: MiddlewareTokenSchema, onClose = jest.fn()) => {
  const props: CustomProcessComponentProps = {
    schema,
    payscriptPlugin: null,
    onProcessCode: undefined,
    processId: "3B85498FECA646F19AD0E5D416C36776",
    onClose,
  };
  render(<MiddlewareTokenProcess {...props} />);
  return onClose;
};

describe("MiddlewareTokenProcess", () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, "open").mockReturnValue({} as Window);
    Object.defineProperty(window, "screen", { value: { width: 1920, height: 1080 }, configurable: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders one card per provider with a button per scope", () => {
    renderComponent(SCHEMA);

    expect(screen.getByText("processModal.middlewareToken.title")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google Drive - Edit Access Level" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google Drive - Read Only Access Level" })).toBeInTheDocument();
  });

  it("exposes the scope description as the button tooltip, as classic does", () => {
    renderComponent(SCHEMA);

    expect(screen.getByRole("button", { name: "Google Drive - Edit Access Level" })).toHaveAttribute(
      "title",
      "Allows you to upload and manage files."
    );
  });

  it("opens the hand-off popup with the classic window name and geometry, then closes", () => {
    const onClose = renderComponent(SCHEMA);

    fireEvent.click(screen.getByRole("button", { name: "Google Drive - Edit Access Level" }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target, features] = openSpy.mock.calls[0];
    expect(target).toBe("Authentication Popup");
    expect(features).toBe("width=960,height=540,left=480,top=270");

    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("provider")).toBe("google");
    expect(parsed.searchParams.get("account_id")).toBe(SCHEMA.accountId);
    expect(parsed.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/drive.file");
    expect(parsed.searchParams.get("redirect_uri")).toBe(SCHEMA.redirectUri);

    // The session user must reach the state payload; an empty id was the original blocker.
    const state = JSON.parse(atob(parsed.searchParams.get("state") as string));
    expect(state.userId).toBe("100");

    expect(onClose).toHaveBeenCalled();
  });

  it("offers a clickable link and stays open when the browser blocks the popup", () => {
    openSpy.mockReturnValue(null);
    const onClose = renderComponent(SCHEMA);

    fireEvent.click(screen.getByRole("button", { name: "Google Drive - Edit Access Level" }));

    const link = screen.getByRole("link", { name: "process.openLink" });
    expect(link).toHaveAttribute("href", expect.stringContaining("oauth-integrations/start"));
    // Classic dead-ends in an alert here; the dialog must not close on the user.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("translates the error code the schema carries when the onLoad could not build the catalogue", () => {
    renderComponent({ ...SCHEMA, providers: {}, errorCode: "noEndpoint", errorMessage: "diagnostic" });

    expect(screen.getByText("processModal.middlewareToken.errorTitle")).toBeInTheDocument();
    expect(screen.getByText("processModal.middlewareToken.errors.noEndpoint")).toBeInTheDocument();
    // The English diagnostic is for logs, never for the user.
    expect(screen.queryByText("diagnostic")).not.toBeInTheDocument();
  });

  it("degrades an unknown error code to the generic reason rather than showing the raw code", () => {
    renderComponent({ ...SCHEMA, providers: {}, errorCode: "somethingNew" });

    expect(screen.getByText("processModal.middlewareToken.errors.unreachable")).toBeInTheDocument();
    expect(screen.queryByText("somethingNew")).not.toBeInTheDocument();
  });

  it("reports an empty catalogue instead of rendering a blank dialog", () => {
    renderComponent({ ...SCHEMA, providers: {} });

    expect(screen.getByText("processModal.middlewareToken.noProviders")).toBeInTheDocument();
  });

  it("closes without opening anything when the user cancels", () => {
    const onClose = renderComponent(SCHEMA);

    fireEvent.click(screen.getByRole("button", { name: "processModal.middlewareToken.cancel" }));

    expect(openSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
