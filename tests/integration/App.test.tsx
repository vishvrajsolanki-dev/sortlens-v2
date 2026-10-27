import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/app/App';

describe('App Diagnostic Interface', () => {
  it('renders brand heading and status badge', async () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /sortlens rebuild/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/core ready/i);
    });
  });

  it('runs live shape analysis on click and displays telemetry', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/core ready/i);
    });

    const analyzeBtn = screen.getByRole('button', { name: /run shape analysis/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/live shape analysis telemetry/i)).toBeInTheDocument();
      expect(screen.getByText(/model rationale:/i)).toBeInTheDocument();
    });
  });

  it('executes live sort in WASM and displays verified sorted output', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/core ready/i);
    });

    const sortBtn = screen.getByRole('button', { name: /execute sort in wasm/i });
    fireEvent.click(sortBtn);

    await waitFor(() => {
      expect(screen.getByText(/wasm execution output/i)).toBeInTheDocument();
      expect(screen.getByText(/verified sorted result:/i)).toBeInTheDocument();
      // Default array sorted: [1, 2, 3, 5, 7, 10, 12, 15, 18, 20]
      expect(screen.getByText(/\[1, 2, 3, 5, 7, 10, 12, 15, 18, 20\]/)).toBeInTheDocument();
    });
  });
});
