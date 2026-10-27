import React, { useEffect, useState } from 'react';
import { announcer } from '../../state/announcer';

export const LiveAnnouncer: React.FC = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    return announcer.subscribe((msg) => {
      setMessage(msg);
    });
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sl-sr-only"
      data-testid="live-announcer"
    >
      {message}
    </div>
  );
};
