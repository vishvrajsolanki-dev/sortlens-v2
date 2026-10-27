import React, { useEffect, useState } from 'react';
import { getCoreClient } from '../core/adapter/createCoreClient';
import type { CoreClient } from '../core/adapter/types';
import { useAppStore } from '../state/appStore';
import { AppShell } from '../components/layout/AppShell';
import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/components.css';
import '../styles/shell.css';
import '../styles/arena.css';
import '../styles/analysis.css';
import '../styles/labs.css';

export const App: React.FC = () => {
  const [coreClient, setCoreClient] = useState<CoreClient | null>(null);
  const setRuntimeStatus = useAppStore((s) => s.setRuntimeStatus);

  useEffect(() => {
    let mounted = true;
    setRuntimeStatus('initializing');

    getCoreClient()
      .then((client) => {
        if (mounted) {
          setCoreClient(client);
          setRuntimeStatus('ready');
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setRuntimeStatus('error', msg);
        }
      });

    return () => {
      mounted = false;
    };
  }, [setRuntimeStatus]);

  return <AppShell client={coreClient} />;
};

export default App;
