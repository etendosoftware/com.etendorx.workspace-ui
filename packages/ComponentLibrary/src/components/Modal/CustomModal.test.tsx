/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, screen, fireEvent } from "@testing-library/react";
import CustomModal from "./CustomModal";

const TEXTS = {
  loading: "Loading...",
  iframeTitle: "Process",
  noData: "No data",
  closeButton: "Close",
};

describe("CustomModal", () => {
  describe("visibility", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <CustomModal
          isOpen={false}
          title="Test"
          iframeLoading={false}
          url="http://example.com"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders the modal when isOpen is true", () => {
      render(
        <CustomModal
          isOpen={true}
          title="My Process"
          iframeLoading={false}
          url="http://example.com"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );
      expect(screen.getByText("My Process")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });
  });

  describe("GET mode (no formParams)", () => {
    it("renders an iframe with src when formParams is not provided", () => {
      render(
        <CustomModal
          isOpen={true}
          title="GET Modal"
          iframeLoading={false}
          url="http://example.com/page.html"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const iframe = document.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toBe("http://example.com/page.html");
    });

    it("renders an iframe with src when formParams is null", () => {
      render(
        <CustomModal
          isOpen={true}
          title="GET Modal"
          iframeLoading={false}
          url="http://example.com/page.html"
          formParams={null}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const iframe = document.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toBe("http://example.com/page.html");
    });

    it("does not render a form in GET mode", () => {
      render(
        <CustomModal
          isOpen={true}
          title="GET Modal"
          iframeLoading={false}
          url="http://example.com"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      expect(document.querySelector("form")).toBeNull();
    });
  });

  describe("POST mode (with formParams)", () => {
    beforeEach(() => {
      // jsdom does not implement form.submit(); mock it to avoid "Not implemented" errors
      jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("renders a hidden form with the POST action URL", () => {
      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ inpKey: "R1", token: "tok123" }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const form = document.querySelector("form");
      expect(form).not.toBeNull();
      expect(form?.getAttribute("action")).toBe("http://example.com/process.html");
      expect(form?.getAttribute("method")).toBe("POST");
    });

    it("renders a hidden input for each formParam entry", () => {
      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ inpKey: "R1", token: "tok123", Command: "BUTTONX" }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
      const map: Record<string, string> = {};
      inputs.forEach((i) => { map[i.name] = i.value; });

      expect(map["inpKey"]).toBe("R1");
      expect(map["token"]).toBe("tok123");
      expect(map["Command"]).toBe("BUTTONX");
    });

    it("renders an iframe without src in POST mode (form submit loads it)", () => {
      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ inpKey: "R1" }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const iframe = document.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toBeNull();
    });

    it("links the form target to the iframe name so POST response loads inside the iframe", () => {
      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ inpKey: "R1" }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const form = document.querySelector("form");
      const iframe = document.querySelector("iframe");
      expect(form?.getAttribute("target")).toBe(iframe?.getAttribute("name"));
      expect(form?.getAttribute("target")).not.toBe("");
    });

    it("calls form.submit() after mount when formParams is set", () => {
      const submitSpy = jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});

      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ inpKey: "R1" }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    it("does not call form.submit() when formParams is null", () => {
      const submitSpy = jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});

      render(
        <CustomModal
          isOpen={true}
          title="GET Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={null}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      expect(submitSpy).not.toHaveBeenCalled();
    });

    it("preserves param values containing special characters in the DOM input property", () => {
      render(
        <CustomModal
          isOpen={true}
          title="POST Modal"
          iframeLoading={false}
          url="http://example.com/process.html"
          formParams={{ name: '<script>alert("xss")</script>' }}
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );

      const input = document.querySelector<HTMLInputElement>('input[name="name"]');
      // React sets .value as a DOM property — raw string is preserved for POST
      expect(input?.value).toBe('<script>alert("xss")</script>');
      // React escapes double-quotes as &quot; in the serialized attribute, preventing injection
      expect(document.body.innerHTML).toContain("&quot;xss&quot;");
    });
  });

  describe("loading overlay", () => {
    it("shows loading indicator when iframeLoading is true", () => {
      render(
        <CustomModal
          isOpen={true}
          title="Loading Modal"
          iframeLoading={true}
          url="http://example.com"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("hides loading indicator when iframeLoading is false", () => {
      render(
        <CustomModal
          isOpen={true}
          title="Ready Modal"
          iframeLoading={false}
          url="http://example.com"
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("calls handleClose when the close button is clicked", () => {
      const handleClose = jest.fn();
      render(
        <CustomModal
          isOpen={true}
          title="Modal"
          iframeLoading={false}
          url="http://example.com"
          handleClose={handleClose}
          texts={TEXTS}
        />
      );

      fireEvent.click(screen.getByTestId("close-button"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("no-data state", () => {
    it("shows noData message when not loading and url is empty", () => {
      render(
        <CustomModal
          isOpen={true}
          title="Empty Modal"
          iframeLoading={false}
          url=""
          handleClose={jest.fn()}
          texts={TEXTS}
        />
      );
      expect(screen.getByText("No data")).toBeInTheDocument();
    });
  });
});
