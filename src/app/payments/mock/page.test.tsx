import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MockPaymentPage from './page';

describe('MockPaymentPage', () => {
  it('defaults to basic plan when query param is missing', async () => {
    const ui = await MockPaymentPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText(/plan basico/i)).toBeInTheDocument();
  });

  it('renders ultra plan when query param is ultra', async () => {
    const ui = await MockPaymentPage({ searchParams: Promise.resolve({ plan: 'ultra' }) });
    render(ui);

    expect(screen.getByText(/plan ultra/i)).toBeInTheDocument();
  });
});
