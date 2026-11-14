// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import App from '../App';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  // Even a configured legacy stock feed must never be requested by this page.
  vi.stubEnv('VITE_TCG_PUBLIC_FEED_URL', 'https://legacy.example/stock.json');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.localStorage.removeItem('gd_customer_tier');
  window.localStorage.removeItem('gd_customer_session');
});

function sessionResponse(body: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
    status, headers: {'Content-Type': 'application/json'},
  }));
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
function renderPage() {
  render(<MemoryRouter initialEntries={['/tcg-hunt']}><App/></MemoryRouter>);
}
function expectSessionOnly(fetcher: ReturnType<typeof sessionResponse>) {
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('/api/customer/v1/session', {
    credentials: 'include', cache: 'no-store', headers: {Accept: 'application/json'},
  });
}

describe('TCG Hunt page', () => {
  it('shows membership loading without fetching or displaying stock', () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetcher);
    renderPage();
    expect(screen.getByText('Checking membership…')).toBeTruthy();
    expect(screen.queryByRole('list', {name: 'Products'})).toBeNull();
    expectSessionOnly(fetcher);
  });

  it('requires signup for Radar while keeping the public directory accessible', async () => {
    const fetcher = sessionResponse({authenticated: false, tier: 'premium'});
    renderPage();
    expect(await screen.findByText(/Register or sign in to unlock the delayed Free Radar/)).toBeTruthy();
    expect(screen.getByRole('heading', {level:1}).textContent).toBe('FIND THE DROP.NOT THE MARKUP.');
    expect(screen.getByText(/Retailers remain the sellers/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Verified Stores'}));
    expect(screen.getByRole('region', {name: 'Verified Stores'})).toBeTruthy();
    expect(screen.getByText(/No verified store cards have been published/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Products'}));
    expect(screen.getByText(/Register or sign in/)).toBeTruthy();
    expectSessionOnly(fetcher);
  });

  it.each(['free', 'premium'])('recognises server-confirmed %s without connecting Radar', async tier => {
    const fetcher = sessionResponse({authenticated: true, tier});
    renderPage();
    expect(await screen.findByText(new RegExp(`${tier} membership recognised`, 'i'))).toBeTruthy();
    expect(screen.getByText(/Radar is temporarily unavailable/)).toBeTruthy();
    expect(screen.queryByRole('list', {name: 'Products'})).toBeNull();
    expectSessionOnly(fetcher);
  });

  it.each([401, 503])('fails closed on session HTTP %s', async status => {
    const fetcher = sessionResponse({authenticated: true, tier: 'premium'}, status);
    renderPage();
    expect(await screen.findByText(/Register or sign in/)).toBeTruthy();
    expect(screen.queryByText(/Premium membership recognised/)).toBeNull();
    expectSessionOnly(fetcher);
  });

  it('fails closed when the session request rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('session unavailable'));
    vi.stubGlobal('fetch', fetcher);
    renderPage();
    expect(await screen.findByText(/Register or sign in/)).toBeTruthy();
    expectSessionOnly(fetcher);
  });

  it('describes Radar signup in page metadata', async () => {
    sessionResponse({authenticated: false});
    renderPage();
    await waitFor(() => expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toMatch(/register or sign in/i));
  });

  it.each([
    {body: {authenticated: false}, status: 200, expected: /Register or sign in/},
    {body: {authenticated: true, tier: 'free'}, status: 200, expected: /Free membership recognised/},
    {body: {authenticated: true, tier: 'premium'}, status: 503, expected: /Register or sign in/},
  ])('ignores browser Premium overrides with session HTTP $status / $body.authenticated', async ({body, status, expected}) => {
    window.localStorage.setItem('gd_customer_tier', 'premium');
    window.localStorage.setItem('gd_customer_session', JSON.stringify({authenticated: true, tier: 'premium'}));
    const fetcher = vi.fn(async (path: RequestInfo | URL) => new Response(JSON.stringify(
      String(path) === '/api/customer/v1/session' ? body : {
        schema_version: 2, items: [{product: 'Protected synthetic product', retailers: [{
          name: 'Protected synthetic retailer', url: 'https://private.example.invalid/item',
        }]}],
      }), {status: String(path) === '/api/customer/v1/session' ? status : 200,
        headers: {'Content-Type': 'application/json'}}));
    vi.stubGlobal('fetch', fetcher);
    render(<MemoryRouter initialEntries={['/tcg-hunt?tier=premium&member=true&account_id=other']}><App/></MemoryRouter>);
    expect(await screen.findByText(expected)).toBeTruthy();
    expect(screen.queryByText(/Protected synthetic/)).toBeNull();
    expect(screen.queryByRole('list', {name: 'Products'})).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('/api/customer/v1/session');
  });
});
