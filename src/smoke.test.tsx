import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('smoke', () => {
  it('renders visible content', () => {
    render(<p>ok</p>);
    expect(screen.getByText('ok')).toBeVisible();
  });
});
