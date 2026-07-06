import { sanitizeMessageHtml } from "../sanitizeHtml";

describe("sanitizeMessageHtml", () => {
  it("keeps formatting tags", () => {
    expect(sanitizeMessageHtml("a <b>bold</b> and <br> break")).toBe("a <b>bold</b> and <br> break");
  });

  it("keeps the class attribute on allowed tags", () => {
    expect(sanitizeMessageHtml('<span class="x">y</span>')).toBe('<span class="x">y</span>');
  });

  it("strips <script> entirely", () => {
    const out = sanitizeMessageHtml("hi<script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("hi");
  });

  it("removes <a> tags but preserves their text", () => {
    const out = sanitizeMessageHtml('<a href="javascript:alert(1)" onclick="x()">click</a>');
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href");
    expect(out).not.toContain("onclick");
    expect(out).toContain("click");
  });

  it("drops event handlers and style on allowed tags", () => {
    const out = sanitizeMessageHtml('<span onclick="x()" style="color:red" class="ok">t</span>');
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("style");
    expect(out).toContain('class="ok"');
    expect(out).toContain("t");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeMessageHtml("")).toBe("");
  });

  it("leaves plain text untouched", () => {
    expect(sanitizeMessageHtml("Just plain text")).toBe("Just plain text");
  });
});
