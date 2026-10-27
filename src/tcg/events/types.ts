export interface PublicProvenance {
  source_type: 'official' | 'organiser';
  source_url: string;
  observed_at: string;
}

export interface EventIdentity extends PublicProvenance {
  id: string;
  game: string;
  organiser_id: string;
  organiser: string;
  timezone: string;
  eligible: true;
  city?: string;
  region?: string;
}

export interface TcgEvent extends EventIdentity {
  name: string;
  starts_at: string;
  event_url: string;
  format?: string;
  entry_fee?: string;
  registration_status?: string;
}

export interface TcgWinnerResult extends EventIdentity {
  event_id: string;
  event_name: string;
  event_at: string;
  winner: string;
  verified: true;
  deck_archetype?: string;
}

export interface TcgEventsSnapshot {
  schema_version: 1;
  generated_at: string;
  // null denotes an unavailable domain; [] denotes a valid empty projection.
  events: TcgEvent[] | null;
  winners: TcgWinnerResult[] | null;
}
