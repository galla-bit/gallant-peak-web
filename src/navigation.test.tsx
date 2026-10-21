// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {HashRouter, MemoryRouter} from 'react-router-dom';
import App from './App';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('Page navigation', () => {
  it('moves focus to the new content and resets scroll after following a route', () => {
    render(<MemoryRouter><App/></MemoryRouter>);
    const link = screen.getByRole('link', {name: 'Custom'});
    link.focus();
    vi.mocked(window.scrollTo).mockClear();
    fireEvent.click(link);
    expect(screen.getByRole('heading', {level: 1}).textContent).toBe('YOUR IDEA.MADE REAL.');
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it.each(['/', '/shop', '/custom', '/tcg-hunt', '/story', '/contact', '/admin'])(
    'provides a focusable main-content target on %s', (path) => {
      render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>);
      const main = screen.getByRole('main');
      expect(main.id).toBe('main-content');
      expect(main.tabIndex).toBe(-1);
    },
  );

  it('skips the header without replacing the hash route', () => {
    window.history.replaceState(null, '', '/#/custom');
    render(<HashRouter><App/></HashRouter>);
    const skip = screen.getByRole('link', {name: 'Skip to content'});
    expect(screen.getAllByRole('link')[0]).toBe(skip);
    skip.focus();
    fireEvent.click(skip);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(window.location.hash).toBe('#/custom');
    expect(screen.getByText('$95')).toBeTruthy();
  });
});
