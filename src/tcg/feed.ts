import {parseTcgPublicSnapshot} from './contract';
import type {TcgPublicSnapshot} from './types';

export type TcgFeedResult =
  | {status: 'ready'; snapshot: TcgPublicSnapshot; rejectedItems: number}
  | {status: 'unconfigured'}
  | {status: 'unavailable'; reason: string};

export async function loadTcgFeed(options: {endpoint?: string; fetcher?: typeof fetch; nowMs: number; maxAgeMs: number}): Promise<TcgFeedResult> {
  if (!options.endpoint) return {status: 'unconfigured'};
  let endpoint: URL;
  try { endpoint = new URL(options.endpoint); } catch { return {status:'unavailable', reason:'invalid-endpoint'}; }
  if (endpoint.protocol !== 'https:') return {status:'unavailable', reason:'invalid-endpoint'};

  try {
    const response = await (options.fetcher ?? fetch)(endpoint.toString(), {headers:{accept:'application/json'}});
    if (!response.ok) return {status:'unavailable', reason:`http-${response.status}`};
    const value = await response.json();
    const parsed = parseTcgPublicSnapshot(value, options.nowMs, options.maxAgeMs);
    if (!parsed.snapshot) return {status:'unavailable', reason:parsed.reason ?? 'invalid-snapshot'};
    return {status:'ready', snapshot:parsed.snapshot, rejectedItems:parsed.rejectedItems};
  } catch {
    return {status:'unavailable', reason:'request-failed'};
  }
}
