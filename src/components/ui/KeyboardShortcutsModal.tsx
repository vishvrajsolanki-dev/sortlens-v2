import React, { useEffect, useRef } from 'react';
import { IconButton } from './IconButton';
import { Button } from './Button';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  category: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Playback Controls (Arena, Search & Viva)',
    items: [
      { keys: ['Space'], description: 'Play / Pause algorithm execution' },
      { keys: ['→'], description: 'Step forward one event / frame' },
      { keys: ['←'], description: 'Step backward one event / frame' },
      { keys: ['Home'], description: 'Restart execution from frame 0' },
    ],
  },
  {
    category: 'Module Navigation',
    items: [
      { keys: ['1'], description: 'Jump to 5-Lane Race Arena' },
      { keys: ['2'], description: 'Jump to Shape Analysis & Cost-Model' },
      { keys: ['3'], description: 'Jump to Interactive Search Lab' },
      { keys: ['4'], description: 'Jump to Empirical Scaling Lab' },
      { keys: ['5'], description: 'Jump to Scripted Viva Demonstration' },
    ],
  },
  {
    category: 'Data & Dialogs',
    items: [
      { keys: ['H'], description: 'Open Completed Run Telemetry History' },
      { keys: ['?'], description: 'Toggle this Keyboard Shortcuts guide' },
      { keys: ['Esc'], description: 'Dismiss open modal or blur active input' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="sl-modal-backdrop"
      onClick={onClose}
      data-testid="shortcuts-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        className="sl-modal-container"
        onClick={(e) => e.stopPropagation()}
        data-testid="shortcuts-modal-container"
      >
        <div className="sl-modal-header">
          <h2 id="shortcuts-dialog-title" className="sl-modal-title">
            <span>⌨️</span> Keyboard Shortcuts
          </h2>
          <IconButton
            ref={closeButtonRef}
            ariaLabel="Close shortcuts dialog"
            onClick={onClose}
            size="sm"
          >
            ✕
          </IconButton>
        </div>

        <div className="sl-modal-body">
          <p className="sl-text-xs sl-text-muted" style={{ marginBottom: '16px' }}>
            SortLens provides global keyboard shortcuts for fast, accessible algorithm experimentation.
            Shortcuts are automatically suppressed while typing in input boxes.
          </p>

          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="sl-shortcuts-section">
              <h3 className="sl-shortcuts-heading">{group.category}</h3>
              <div className="sl-shortcuts-list">
                {group.items.map((item, idx) => (
                  <div key={idx} className="sl-shortcuts-row">
                    <span className="sl-shortcuts-desc">{item.description}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {item.keys.map((k) => (
                        <kbd key={k} className="sl-kbd">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sl-modal-footer">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close (Esc)
          </Button>
        </div>
      </div>
    </div>
  );
};
