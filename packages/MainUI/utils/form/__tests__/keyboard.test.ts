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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  DROPDOWN_PORTAL_ATTRIBUTE,
  TREE_TRIGGER_ACTIONS,
  getSelectorPopupShortcutId,
  getTreeTriggerAction,
  handleFieldLinkOutShortcut,
  isSelectorPopupShortcut,
} from "@/utils/form/keyboard";
import { KEYBOARD_SHORTCUTS_PREFERENCE, SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

const ENTER = "Enter";

describe("form keyboard predicates", () => {
  beforeEach(() => installLocalStorageMock());

  describe("isSelectorPopupShortcut", () => {
    it("recognizes Ctrl+Enter and Cmd+Enter", () => {
      expect(isSelectorPopupShortcut({ key: ENTER, ctrlKey: true } as KeyboardEvent)).toBe(true);
      expect(isSelectorPopupShortcut({ key: ENTER, metaKey: true } as KeyboardEvent)).toBe(true);
    });

    it("rejects Enter alone and Ctrl+Alt+Enter (the link out)", () => {
      expect(isSelectorPopupShortcut({ key: ENTER } as KeyboardEvent)).toBe(false);
      expect(isSelectorPopupShortcut({ key: ENTER, ctrlKey: true, altKey: true } as KeyboardEvent)).toBe(false);
    });

    it("follows the keyboard shortcut preference", () => {
      savePreferences({
        [KEYBOARD_SHORTCUTS_PREFERENCE]: JSON.stringify([
          { id: SHORTCUT_IDS.TREE_ITEM_SHOW_POPUP, keyComb: { alt: true, key: "Enter" } },
        ]),
      });

      expect(
        isSelectorPopupShortcut({ key: ENTER, altKey: true } as KeyboardEvent, SHORTCUT_IDS.TREE_ITEM_SHOW_POPUP)
      ).toBe(true);
      expect(isSelectorPopupShortcut({ key: ENTER, ctrlKey: true } as KeyboardEvent)).toBe(false);
    });
  });

  describe("getSelectorPopupShortcutId", () => {
    it.each([
      [FIELD_REFERENCE_CODES.TREE_REFERENCE.id, SHORTCUT_IDS.TREE_ITEM_SHOW_POPUP],
      [FIELD_REFERENCE_CODES.SELECTOR_AS_LINK.id, SHORTCUT_IDS.SELECTOR_LINK_SHOW_POPUP],
      [FIELD_REFERENCE_CODES.SELECTOR.id, SHORTCUT_IDS.SELECTOR_SHOW_POPUP],
      [undefined, SHORTCUT_IDS.SELECTOR_SHOW_POPUP],
    ])("maps reference %s to %s", (referenceId, shortcutId) => {
      expect(getSelectorPopupShortcutId(referenceId)).toBe(shortcutId);
    });
  });

  describe("getTreeTriggerAction", () => {
    const ALT_DOWN = { key: "ArrowDown", altKey: true } as KeyboardEvent;
    const DOWN = { key: "ArrowDown" } as KeyboardEvent;

    it("opens the tree with Alt+Down", () => {
      expect(getTreeTriggerAction(ALT_DOWN, false)).toBe(TREE_TRIGGER_ACTIONS.SHOW_TREE);
    });

    it("moves into the open tree with Down", () => {
      expect(getTreeTriggerAction(DOWN, true)).toBe(TREE_TRIGGER_ACTIONS.MOVE_TO_TREE);
    });

    it("ignores Down while the tree is closed and other keys", () => {
      expect(getTreeTriggerAction(DOWN, false)).toBeNull();
      expect(getTreeTriggerAction({ key: ENTER } as KeyboardEvent, true)).toBeNull();
    });
  });

  describe("handleFieldLinkOutShortcut", () => {
    const CTRL_ALT_ENTER = { key: ENTER, ctrlKey: true, altKey: true };

    const buildField = (withLink: boolean) => {
      const field = document.createElement("div");
      field.innerHTML = withLink
        ? '<label role="button">Business Partner</label><input />'
        : "<label>Name</label><input />";
      const label = field.querySelector("label") as HTMLLabelElement;
      const click = jest.fn();
      label.addEventListener("click", click);
      return { field, input: field.querySelector("input") as HTMLInputElement, click };
    };

    const keyDownOn = (field: HTMLElement, target: Element, keys: object) => {
      const event = {
        ...keys,
        currentTarget: field,
        target,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };
      return { event, handled: handleFieldLinkOutShortcut(event as unknown as React.KeyboardEvent<HTMLElement>) };
    };

    it("follows the link of the field label with Ctrl+Alt+Enter", () => {
      const { field, input, click } = buildField(true);

      const { event, handled } = keyDownOn(field, input, CTRL_ALT_ENTER);

      expect(handled).toBe(true);
      expect(click).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("does nothing for a field without a navigable label", () => {
      const { field, input } = buildField(false);

      expect(keyDownOn(field, input, CTRL_ALT_ENTER).handled).toBe(false);
    });

    it("ignores other keys and key presses from an open dropdown", () => {
      const { field, input, click } = buildField(true);
      const portal = document.createElement("div");
      portal.setAttribute(DROPDOWN_PORTAL_ATTRIBUTE, "dropdown");
      const option = document.createElement("li");
      portal.appendChild(option);

      expect(keyDownOn(field, input, { key: ENTER, ctrlKey: true }).handled).toBe(false);
      expect(keyDownOn(field, option, CTRL_ALT_ENTER).handled).toBe(false);
      expect(click).not.toHaveBeenCalled();
    });
  });
});
