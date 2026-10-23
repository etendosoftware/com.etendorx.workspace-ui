import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import { createCategories } from "../../support/flows/records";
import { runAndWaitForResponse } from "../../support/wait";

/** Form sections, by group id: header `[aria-controls="section-content-<id>"]`, content `#section-content-<id>`. */
const SECTION = { notes: "notes_group", attachments: "attachments_group" };
const ADD_NOTE = "Add Note";
const NOTE_PLACEHOLDER = "Write your note here...";
const DELETE = "Delete";
const NOTES_REQUEST = /\/api\/erp\/notes/;
const ATTACHMENTS_REQUEST = /\/api\/erp\/attachments/;
const ATTACHMENT = {
  input: "Input__attachments_file",
  description: "TextField__attachments_description",
  submit: "IconButton__attachments_submit",
  tag: '[data-testid^="Box__attachment_tag_"]',
  remove: '[data-testid^="IconButton__delete_"]',
};
const FILE = { name: "frmd-e2e.txt", mimeType: "text/plain", buffer: Buffer.from("FRMd attachment") };

/** Expands a form section (Notes, Attachments) when it is collapsed, and returns its content. */
async function expandSection(page: Page, section: string): Promise<Locator> {
  const toggle = page.locator(`[aria-controls="section-content-${section}"]`);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  const content = page.locator(`#section-content-${section}`);
  await expect(content).toBeVisible();
  return content;
}

/**
 * Notes and attachments of a record (form sections): a note is added and deleted, a file is
 * attached with a description and removed. The record is a category the spec created.
 */
test.describe("Form - notes and attachments of a record @regression @form", () => {
  test("adds and deletes a note and an attachment", async ({ app, api, data, page }) => {
    const prefix = data.uniqueValue("FRMd");
    const [record] = await createCategories(api, prefix, 1);
    const note = `${prefix} note`;
    await app.sidebar.navigateTo("businessPartnerCategory");
    await app.grid.filter("Name", prefix);
    await app.grid.openRowForm(app.grid.rowWithCell(String(record.name)));

    const notes = await expandSection(page, SECTION.notes);
    await notes.getByText(ADD_NOTE, { exact: true }).click();
    await page.getByPlaceholder(NOTE_PLACEHOLDER).fill(note);
    await runAndWaitForResponse(page, NOTES_REQUEST, () =>
      page.getByRole("button", { name: ADD_NOTE, exact: true }).click()
    );
    const card = notes.getByText(note, { exact: true });
    await expect(card).toBeVisible();
    // The add-note modal stays open (cleared) after adding: it is closed by hand
    const addNoteModal = page.getByTestId("BasicModal_Modal").filter({ has: page.getByPlaceholder(NOTE_PLACEHOLDER) });
    await addNoteModal.getByRole("button", { name: "close", exact: true }).click();
    await expect(addNoteModal).toBeHidden();
    // The delete button (an icon button with no label) is only rendered while the note is hovered;
    // `has` takes a locator relative to each candidate, hence one built from the page
    const noteText = page.getByText(note, { exact: true });
    await notes.locator("div").filter({ has: noteText }).last().hover();
    await notes
      .locator("div")
      .filter({ has: noteText })
      .filter({ has: page.getByRole("button") })
      .last()
      .getByRole("button")
      .click();
    await runAndWaitForResponse(page, NOTES_REQUEST, () =>
      page.getByRole("button", { name: DELETE, exact: true }).click()
    );
    await expect(card).toBeHidden();

    await expandSection(page, SECTION.attachments);
    await page.getByTestId(ATTACHMENT.input).setInputFiles(FILE);
    await page.getByTestId(ATTACHMENT.description).locator("textarea, input").first().fill(prefix);
    await runAndWaitForResponse(page, ATTACHMENTS_REQUEST, () => page.getByTestId(ATTACHMENT.submit).click());
    const tag = page.locator(ATTACHMENT.tag).filter({ hasText: FILE.name });
    await expect(tag).toBeVisible();
    await tag.locator(ATTACHMENT.remove).click();
    await runAndWaitForResponse(page, ATTACHMENTS_REQUEST, () =>
      page.getByRole("button", { name: DELETE, exact: true }).click()
    );
    await expect(tag).toBeHidden();
  });
});
