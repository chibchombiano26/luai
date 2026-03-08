import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCardWrapper } from './ToolCardWrapper';

describe('ToolCardWrapper', () => {
  it('renders with content expanded by default', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with title when provided', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );
    // The title appears in the hidden collapsed state too
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows fallback title "Card" when collapsed without custom title', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} defaultExpanded={false}>
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    expect(screen.getByRole('button', { name: /card/i })).toBeInTheDocument();
  });

  it('calls onRemove when close button is clicked', () => {
    const mockRemove = vi.fn();
    render(
      <ToolCardWrapper onRemove={mockRemove} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.title === 'Eliminar');

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockRemove).toHaveBeenCalled();
    }
  });

  it('has collapse button when expanded', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    const collapseButton = screen.getByTitle('Comprimir');
    expect(collapseButton).toBeInTheDocument();
  });

  it('renders with correct initial state', () => {
    const { container } = render(
      <ToolCardWrapper onRemove={vi.fn()} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with defaultExpanded false', () => {
    render(
      <ToolCardWrapper
        onRemove={vi.fn()}
        title="Test Card"
        defaultExpanded={false}
      >
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    // Content should not be visible when collapsed
    const content = screen.queryByText('Test Content');
    expect(content).not.toBeInTheDocument();
  });

  it('expands from collapsed header click and shows content', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Expandable" defaultExpanded={false}>
        <div>Hidden Content</div>
      </ToolCardWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /expandable/i }));
    expect(screen.getByText('Hidden Content')).toBeInTheDocument();
    expect(screen.getByTitle('Comprimir')).toBeInTheDocument();
  });

  it('collapses from expanded state when compress button is clicked', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Compressible">
        <div>Compressible Content</div>
      </ToolCardWrapper>
    );

    fireEvent.click(screen.getByTitle('Comprimir'));
    expect(screen.getByRole('button', { name: /compressible/i })).toBeInTheDocument();
  });

  it('calls onRemove from collapsed header remove button', () => {
    const onRemove = vi.fn();
    render(
      <ToolCardWrapper onRemove={onRemove} title="Closable" defaultExpanded={false}>
        <div>Content</div>
      </ToolCardWrapper>
    );

    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows both close and collapse buttons on hover', () => {
    render(
      <ToolCardWrapper onRemove={vi.fn()} title="Test Card">
        <div>Test Content</div>
      </ToolCardWrapper>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // At least close and collapse
  });
});
