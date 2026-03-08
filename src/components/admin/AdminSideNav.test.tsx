import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';

vi.mock('@/lib/platform/generated-flow-pack-ui', () => ({
  GENERATED_FLOW_PACK_UI_MODULES: {
    demo: {
      adminPages: [
        {
          id: 'demo-module',
          slug: 'demo-module',
          navLabelByLocale: { es: 'Módulo Demo', en: 'Demo Module' },
          titleByLocale: { es: 'Módulo Demo', en: 'Demo Module' },
          Component: () => null,
        },
      ],
    },
  },
}));

import { AdminSideNav } from './AdminSideNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('AdminSideNav', () => {
  it('renders localized labels and highlights the configuration route', () => {
    vi.mocked(usePathname).mockReturnValue('/admin');

    render(<AdminSideNav locale="es" />);

    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Proveedores AI')).toBeInTheDocument();
    expect(screen.getByText('Base de Datos')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /configuración/i }).className).toContain('bg-blue-50');
  });

  it('marks ai providers route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/ai-providers');

    render(<AdminSideNav locale="en" />);

    expect(screen.getByRole('link', { name: /ai providers/i }).className).toContain('bg-blue-50');
    expect(screen.getByRole('link', { name: /users/i }).className).not.toContain('bg-blue-50');
  });

  it('marks database route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/database-provider');

    render(<AdminSideNav locale="en" />);

    expect(screen.getByRole('link', { name: /database/i }).className).toContain('bg-blue-50');
  });

  it('marks nested user routes as active', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/users/123');

    render(<AdminSideNav locale="en" />);

    expect(screen.getByRole('link', { name: /users/i }).className).toContain('bg-blue-50');
    expect(screen.getByRole('link', { name: /configuration/i }).className).not.toContain('bg-blue-50');
  });

  it('renders links as inactive when pathname is missing', () => {
    vi.mocked(usePathname).mockReturnValue(null);

    render(<AdminSideNav locale="en" />);

    expect(screen.getByRole('link', { name: /configuration/i }).className).toContain('hover:bg-zinc-100');
    expect(screen.getByRole('link', { name: /ai providers/i }).className).toContain('hover:bg-zinc-100');
    expect(screen.getByRole('link', { name: /database/i }).className).toContain('hover:bg-zinc-100');
    expect(screen.getByRole('link', { name: /users/i }).className).toContain('hover:bg-zinc-100');
  });

  it('renders injected admin module links from flow-pack UI modules', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/modules/demo-module');

    render(<AdminSideNav locale="en" />);

    expect(screen.getByRole('link', { name: /demo module/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /demo module/i }).className).toContain('bg-blue-50');
  });
});
