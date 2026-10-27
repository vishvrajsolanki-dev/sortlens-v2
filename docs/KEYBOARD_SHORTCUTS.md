# SortLens Rebuild — Keyboard Shortcuts & Interaction Reference

## 1. Overview

SortLens provides a global keyboard shortcut subsystem designed for high-efficiency algorithm experimentation, academic lecture demonstration, and accessibility compliance.

Shortcuts are managed by `useKeyboardShortcuts` (`src/hooks/useKeyboardShortcuts.ts`) with active playback delegates registered by interactive lab modules (`SortingArena`, `SearchLab`, `VivaBar`).

---

## 2. Keymap Reference

### 2.1 Playback Controls
| Key | Action | Scope / Context |
| :--- | :--- | :--- |
| <kbd>Space</kbd> | Toggle Play / Pause | Race Arena, Search Lab, Viva Demo Mode |
| <kbd>→</kbd> | Step forward one frame / event | Race Arena, Search Lab, Viva Demo Mode |
| <kbd>←</kbd> | Step backward one frame / event | Race Arena, Search Lab, Viva Demo Mode |
| <kbd>Home</kbd> | Restart execution to step 0 | Race Arena, Search Lab, Viva Demo Mode |

### 2.2 Application Module Navigation
| Key | Action | Target View |
| :--- | :--- | :--- |
| <kbd>1</kbd> | Jump to Race Arena | 5-Algorithm Synchronized Arena (`arena`) |
| <kbd>2</kbd> | Jump to Shape & Cost Analyzer | Dataset Inversion & Cost Model (`analysis`) |
| <kbd>3</kbd> | Jump to Search Lab | Linear vs Binary Search Workbench (`search`) |
| <kbd>4</kbd> | Jump to Scaling Lab | Empirical Asymptotic Scaling Lab (`scaling`) |
| <kbd>5</kbd> | Jump to Viva Demo Mode | Automated 10-Stage Viva Tour (`viva`) |

### 2.3 Modals & Dialogs
| Key | Action | Behavior |
| :--- | :--- | :--- |
| <kbd>?</kbd> or <kbd>Shift + /</kbd> | Toggle Shortcuts Modal | Displays interactive shortcut reference dialog |
| <kbd>H</kbd> | Toggle Telemetry History | Opens the 200-run history inspection modal |
| <kbd>Esc</kbd> | Dismiss Active Modal | Closes shortcuts, history, or blurs active text inputs |

---

## 3. Strict Input Suppression Invariant

To guarantee that text input fields remain completely uninhibited, shortcuts are automatically suppressed whenever the keyboard event target is an interactive form element:
* `<input>` (e.g. array size, custom array string, search target)
* `<textarea>`
* `<select>`
* Any DOM element with `isContentEditable === true`

The only shortcut honored within an editable element is <kbd>Esc</kbd>, which calls `.blur()` to relinquish focus back to the workspace.

---

## 4. Playback Delegate Pattern

Interactive modules register their playback capabilities using the singleton delegate registry:
```typescript
const unregister = registerPlaybackDelegate({
  togglePlay: () => coordinator.togglePlay(),
  stepForward: () => coordinator.stepForward(),
  stepBackward: () => coordinator.stepBackward(),
  restart: () => coordinator.restart(),
});
```
When a module unmounts or switches, the delegate is cleanly unregistered, eliminating memory leaks or dangling event handles.
