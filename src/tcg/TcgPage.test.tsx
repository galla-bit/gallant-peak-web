// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import App from '../App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TCG Hunt page', () => {
  it('presents TCG Hunt as retailer discovery and fails closed when no public feed is configured', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<MemoryRouter initialEntries={['/tcg-hunt']}><App/></MemoryRouter>);

    expect(screen.getByRole('heading', {level:1}).textContent).toBe('FIND THE DROP.NOT THE MARKUP.');
    expect(screen.getByText(/Retailers remain the sellers/i)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/not connected/i);
    expect(screen.getByRole('status').textContent).toMatch(/at least 15 minutes/i);
    expect(screen.queryByText(/^DELAYED PUBLIC STOCK INTELLIGENCE$/i)).toBeNull();
  });
});
