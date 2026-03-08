import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeClient } from './HomeClient';

const clerkState = vi.hoisted(() => ({
  isLoaded: false,
  isSignedIn: false,
}));

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: () => clerkState,
}));

vi.mock('@/components/chat/Chat', () => ({
  Chat: ({ clerkEnabled }: { clerkEnabled?: boolean }) => (
    <div data-testid="mock-chat">{String(Boolean(clerkEnabled))}</div>
  ),
}));

describe('HomeClient', () => {
  beforeEach(() => {
    clerkState.isLoaded = false;
    clerkState.isSignedIn = false;
  });

  it('renders the chat directly when Clerk auth is disabled', () => {
    render(<HomeClient clerkEnabled={false} />);

    expect(screen.getByTestId('mock-chat')).toHaveTextContent('false');
  });

  it('renders the dedicated sign-in screen when Clerk is enabled and signed out', () => {
    render(<HomeClient clerkEnabled />);

    expect(screen.getByRole('button', { name: 'Ingresar a LuAI' })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
  });

  it('switches the access screen copy between Spanish and English', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled />);

    expect(screen.getByRole('button', { name: 'Ingresar a LuAI' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'Sign in to LuAI' })).toBeInTheDocument();
  });

  it('renders the chat once the Clerk user is signed in', () => {
    clerkState.isLoaded = true;
    clerkState.isSignedIn = true;

    render(<HomeClient clerkEnabled />);

    expect(screen.getByTestId('mock-chat')).toHaveTextContent('true');
  });
});
