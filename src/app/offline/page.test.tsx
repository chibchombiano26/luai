import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflinePage from './page';

describe('OfflinePage', () => {
  it('renders offline messaging', () => {
    render(<OfflinePage />);

    expect(screen.getByRole('heading', { name: /sin conexion/i })).toBeInTheDocument();
    expect(screen.getByText(/necesitas internet para usar el chat/i)).toBeInTheDocument();
  });
});
