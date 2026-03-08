import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ slug: 'demo-module' })),
  usePathname: vi.fn(() => '/admin/modules/demo-module'),
}));

vi.mock('@/lib/platform/generated-flow-pack-ui', () => ({
  GENERATED_FLOW_PACK_UI_MODULES: {
    demo: {
      adminPages: [
        {
          id: 'demo-module',
          slug: 'demo-module',
          navLabelByLocale: { es: 'Módulo Demo', en: 'Demo Module' },
          titleByLocale: { es: 'Módulo Demo', en: 'Demo Module' },
          subtitleByLocale: { es: 'Subtítulo demo', en: 'Demo subtitle' },
          Component: ({ locale }: { locale: 'es' | 'en' }) => <div>{`module-${locale}`}</div>,
        },
      ],
    },
  },
}));

vi.mock('@/components/admin/useAdminLocale', () => ({
  useAdminLocale: () => ({
    locale: 'es',
    changeLocale: vi.fn(),
  }),
}));

import AdminPackModulePage from './page';

describe('AdminPackModulePage', () => {
  it('renders injected admin module content by slug', () => {
    render(<AdminPackModulePage />);

    expect(screen.getByRole('heading', { name: /módulo demo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /módulo demo/i })).toBeInTheDocument();
    expect(screen.getByText(/subtítulo demo/i)).toBeInTheDocument();
    expect(screen.getByText('module-es')).toBeInTheDocument();
  });
});
