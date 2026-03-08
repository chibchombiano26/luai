import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DynamicFlowCard } from './DynamicFlowCard';

describe('DynamicFlowCard', () => {
  it('renders fallback summary in Spanish when message is missing', () => {
    render(
      <DynamicFlowCard
        title="Resumen"
        locale="es"
      />
    );

    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Sin resumen disponible.')).toBeInTheDocument();
  });

  it('renders description, message, and details', () => {
    render(
      <DynamicFlowCard
        title="Weather"
        description="Forecast details"
        message="Cloudy today"
        locale="en"
        details={[
          { label: 'Temp', value: '19 C' },
          { label: 'Wind', value: '11 km/h' },
        ]}
      />
    );

    expect(screen.getByText('Forecast details')).toBeInTheDocument();
    expect(screen.getByText('Cloudy today')).toBeInTheDocument();
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('11 km/h')).toBeInTheDocument();
  });

  it('renders English fallback summary when no details are provided', () => {
    render(
      <DynamicFlowCard
        title="Weather"
        locale="en"
      />
    );

    expect(screen.getByText('No summary available.')).toBeInTheDocument();
  });
});
