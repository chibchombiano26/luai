import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PayloadAdmin } from './PayloadAdmin';

describe('PayloadAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens modal and loads current overrides from localStorage', async () => {
    localStorage.setItem(
      'luai_payload_overrides',
      JSON.stringify({ VehicleYear: 2022 })
    );

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));

    expect(
      await screen.findByRole('heading', { name: /admin - configure payload/i })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/"VehicleYear": 2022/i)).toBeInTheDocument();
  });

  it('saves valid JSON overrides', async () => {
    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    await screen.findByRole('heading', { name: /admin - configure payload/i });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '{"VehiclePrice":12345}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(localStorage.getItem('luai_payload_overrides')).toBe(
        JSON.stringify({ VehiclePrice: 12345 })
      );
      expect(screen.getByText(/configuration saved/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid JSON', async () => {
    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    await screen.findByRole('heading', { name: /admin - configure payload/i });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '{bad-json' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid json\. check the format/i)).toBeInTheDocument();
    });
  });

  it('clears overrides', async () => {
    localStorage.setItem(
      'luai_payload_overrides',
      JSON.stringify({ VehicleYear: 2020 })
    );

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    await screen.findByRole('heading', { name: /admin - configure payload/i });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() => {
      expect(localStorage.getItem('luai_payload_overrides')).toBeNull();
      expect(screen.getByDisplayValue('{}')).toBeInTheDocument();
      expect(screen.getByText(/configuration cleared/i)).toBeInTheDocument();
    });
  });

  it('closes modal when user clicks close button', async () => {
    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    await screen.findByRole('heading', { name: /admin - configure payload/i });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /admin - configure payload/i })
      ).not.toBeInTheDocument();
    });
  });

  it('closes modal when user clicks header X button', async () => {
    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));

    const heading = await screen.findByRole('heading', { name: /admin - configure payload/i });
    const closeButton = heading.parentElement?.querySelector('button');
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /admin - configure payload/i })
      ).not.toBeInTheDocument();
    });
  });

  it('shows load error when reading localStorage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage-read-failed');
    });

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));

    expect(await screen.findByText(/failed to load configuration/i)).toBeInTheDocument();
  });

  it('shows clear error when removing localStorage fails', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage-remove-failed');
    });

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    await screen.findByRole('heading', { name: /admin - configure payload/i });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(await screen.findByText(/failed to clear configuration/i)).toBeInTheDocument();
  });

  it('hides success banner after timeout on save', () => {
    vi.useFakeTimers();

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    expect(screen.getByRole('heading', { name: /admin - configure payload/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '{"VehicleYear":2024}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/configuration saved/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/configuration saved/i)).not.toBeInTheDocument();
  });

  it('hides success banner after timeout on clear', () => {
    vi.useFakeTimers();
    localStorage.setItem('luai_payload_overrides', JSON.stringify({ VehicleYear: 2020 }));

    render(<PayloadAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /admin - override payload/i }));
    expect(screen.getByRole('heading', { name: /admin - configure payload/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByText(/configuration cleared/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/configuration cleared/i)).not.toBeInTheDocument();
  });
});
