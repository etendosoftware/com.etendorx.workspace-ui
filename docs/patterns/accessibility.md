# Accessibility: keyboard and screen readers

Every screen, component and process must be usable with the keyboard alone and announce itself to a screen reader.
This page is the contract for whoever writes UI, human or agent. The shared pieces below already do most of the
work: use them instead of rebuilding the behaviour.

## Rules

1. **Everything interactive has an accessible name.** A button with only an icon needs `aria-label` (or the
   `tooltip` of `IconButton`, which it takes as its name). An image next to a text is decorative: `alt=""`. Never
   put a made-up text such as "icon" in an `alt`. Names are translated: add the key to
   `packages/ComponentLibrary/src/locales/en.ts` **and** `es.ts`.
2. **Use the right element or role.** A control is a `<button>` or `<a href>`, not a `div` with `onClick`. If a
   `div` must act as one, it needs `role`, `tabIndex={0}` and Enter and Space handlers. A state attribute (such
   as `aria-expanded`, `aria-pressed`) goes on the element that has that role, never on a wrapper.
3. **The keyboard reaches it and sees it.** Do not remove it from the tab order (`tabIndex={-1}`) for something
   that has no other way to be used. The focus is always visible: see "Focus ring".
4. **Keys act where the focus is.** A shortcut that takes Enter or the arrow keys must not take them from a
   button or a menu outside its region: use `useKeyboardShortcuts(shortcuts, enabled, { scopeRef })`.
5. **Dialogs, popups and menus manage the focus**: it goes in when they open, stays inside (dialogs), Escape
   closes them and the focus goes back to what opened them. Use the components below.

## Building blocks

| Need | Use | Where |
|---|---|---|
| Dropdown menu | `Menu` | `ComponentLibrary/src/components/Menu`: takes the focus, Arrow/Home/End move, Tab closes, Escape closes and returns the focus |
| Modal dialog | `Modal` (`ariaLabelledBy` or `ariaLabel`) | `MainUI/components/Modal.tsx`: `role="dialog"`, `aria-modal`, Tab trapped, focus returned |
| Any other popup or panel | `useFocusScope(ref, active, { trap })` | `ComponentLibrary/src/hooks/useFocusScope.ts` |
| Icon-only button | `IconButton` with `tooltip` or `ariaLabel` | the tooltip also shows on keyboard focus and Escape hides it |
| Opening something from a menu item | `setFocusReturnTarget(menuElement, button)` | so the focus can go back to the button after the item is gone (`Menu` does it) |
| Shortcuts that take Enter or arrows | `useKeyboardShortcuts` with `scopeRef` | `MainUI/hooks/useKeyboardShortcuts.ts` |

An element cannot take the focus while it is `visibility: hidden`, and the content of a popup that fades in still
is when it opens: `useFocusScope` tries again on the next frames, so do not add a `setTimeout` to focus it.

## Focus ring

One style for everything the keyboard reaches: `global.css` draws a 2px ring in `--ui-focus-ring` (defined for the
light and the dark theme) on `:focus-visible`. The rule is outside any cascade layer on purpose, so it wins over the
`outline-none` utilities. Do not add `outline-none` or `focus:outline-none` to hide it. A component can still add
its own extra cue (a background, a border), but the ring is always there.

## Tests

- **Unit**: query by role and name (`getByRole("button", { name })`), not by test id: if the role or the name is
  missing the test fails, as it would for a screen reader. Check what you built: name, `aria-*` state, Enter and
  Escape.
- **E2E**: `playwright-tests/e2e/smoke/13_Accessibility/A11YaMainScreensTest.spec.ts` runs axe-core on the login,
  the home, a window with grid and form, and a process window, for the rules in `ENFORCED_RULES`
  (`e2e/support/a11y.ts`). A new violation fails it. A violation that cannot be fixed yet goes in `KNOWN` with the
  task that fixes it; when it is fixed the test fails until the entry is removed, so the list only shrinks. When
  you add a main screen, add it to that spec.
- **By hand**: before closing a UI task, use the screen with the keyboard only (Tab, Shift+Tab, Enter, Space,
  arrows, Escape) and look at the accessibility tree of the browser. If a screen reader (NVDA, VoiceOver) was not
  used, say so: "not verified".

## Checklist for a pull request

- [ ] Every new icon-only control has a translated name; no `alt="icon"`.
- [ ] Controls are `button`/`a`, or have role, `tabIndex` and Enter/Space handlers.
- [ ] State attributes are on the element with the role.
- [ ] New dialogs/popups/menus use `Modal`, `Menu` or `useFocusScope`.
- [ ] No `outline-none` without the ring; no key handler on `document` without a `scopeRef`.
- [ ] Unit test by role and name; the e2e accessibility spec still passes.

## Known gaps

Tracked in the `KNOWN` list of the e2e spec and in the tasks of the keyboard and screen reader group (ETP-6304 to
ETP-6308): the grid role and its keyboard model, the form and child tabs, processes, and the menu, top bar and page
structure (landmarks, headings, colour contrast are not checked yet).
