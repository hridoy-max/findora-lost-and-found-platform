
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function Welcome() {
  return <h1>Welcome to Findora</h1>;
}

describe('Welcome component', () => {
  it('renders the welcome message', () => {
    render(<Welcome />);

    expect(
      screen.getByRole('heading', { name: 'Welcome to Findora' })
    ).toBeInTheDocument();
  });
});
