import { useEffect } from 'react';
import { useAppStore, type NavigationSection } from '../state/appStore';

export interface PlaybackDelegate {
  togglePlay?: () => void;
  stepForward?: () => void;
  stepBackward?: () => void;
  restart?: () => void;
}

let activeDelegate: PlaybackDelegate | null = null;

/**
 * Registers an active playback delegate (e.g. SortingArena, SearchLab, VivaDemo).
 * Returns an unregister cleanup function.
 */
export function registerPlaybackDelegate(delegate: PlaybackDelegate): () => void {
  activeDelegate = delegate;
  return () => {
    if (activeDelegate === delegate) {
      activeDelegate = null;
    }
  };
}

export interface UseKeyboardShortcutsOptions {
  onToggleShortcutsModal?: () => void;
  onToggleHistoryModal?: () => void;
  onCloseModals?: () => void;
  isAnyModalOpen?: boolean;
}

/**
 * Checks whether the keyboard event originated inside an editable text element.
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

const SECTION_NUM_MAP: Record<string, NavigationSection> = {
  '1': 'arena',
  '2': 'analysis',
  '3': 'search',
  '4': 'scaling',
  '5': 'viva',
};

/**
 * Global keyboard shortcuts listener with strict suppression in input elements.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onToggleShortcutsModal, onToggleHistoryModal, onCloseModals, isAnyModalOpen = false } = options;
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Always allow Escape to close open modals or dismiss focused inputs
      if (event.key === 'Escape') {
        if (isAnyModalOpen && onCloseModals) {
          event.preventDefault();
          onCloseModals();
          return;
        }
        if (isEditableElement(event.target)) {
          (event.target as HTMLElement).blur();
          return;
        }
      }

      // Suppress all other shortcuts if typing inside an editable field
      if (isEditableElement(event.target)) {
        return;
      }

      // Do not trigger global navigation/playback when a modal is open (except Escape handled above)
      if (isAnyModalOpen) {
        return;
      }

      // Help Dialog Shortcut: '?' (Shift + / or ?)
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        onToggleShortcutsModal?.();
        return;
      }

      // History Shortcut: 'h' or 'H'
      if ((event.key === 'h' || event.key === 'H') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onToggleHistoryModal?.();
        return;
      }

      // Section Jump Shortcuts: '1' through '5'
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        Object.prototype.hasOwnProperty.call(SECTION_NUM_MAP, event.key)
      ) {
        const targetSection = SECTION_NUM_MAP[event.key];
        if (targetSection) {
          event.preventDefault();
          setActiveSection(targetSection);
          return;
        }
      }

      // Playback Shortcuts: Space, Arrows, Home
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        activeDelegate?.togglePlay?.();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        activeDelegate?.stepForward?.();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        activeDelegate?.stepBackward?.();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        activeDelegate?.restart?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleShortcutsModal, onToggleHistoryModal, onCloseModals, isAnyModalOpen, setActiveSection]);
}
