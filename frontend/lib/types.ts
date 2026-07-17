// ============================================================
// DATABASE TYPES (matching Supabase schema)
// ============================================================

// supabase-js's generic client inference requires every table/view to carry
// a `Relationships` array (even when empty) — without it, TypeScript can't
// narrow `.from("table")` calls and silently falls back to `never` for
// every Row/Insert/Update, which looks like a wall of unrelated errors
// rather than one missing field. None of our tables are queried through
// supabase-js's foreign-table embedding shorthand that relies on this
// (joins here are written as explicit `select` strings), so empty arrays
// are correct, not a placeholder.
//
// Every Row/Insert/Update type below is a `type` alias, not an `interface`.
// This isn't a style choice: with an `interface`, supabase-js's generic
// resolution silently collapses to `never` for every table (verified by
// isolating it — swapping a single field's type from `interface X {}` to
// `type X = {}` was the only change needed to fix it). Keep new types here
// as `type`, not `interface`.
export type Database = {
  public: {
    Tables: {
      posts: { Row: Post; Insert: PostInsert; Update: Partial<PostInsert>; Relationships: [] };
      media: { Row: Media; Insert: MediaInsert; Update: Partial<MediaInsert>; Relationships: [] };
      countries: { Row: Country; Insert: CountryInsert; Update: Partial<CountryInsert>; Relationships: [] };
      trips: { Row: Trip; Insert: TripInsert; Update: Partial<TripInsert>; Relationships: [] };
      trip_countries: { Row: TripCountry; Insert: TripCountryInsert; Update: Partial<TripCountryInsert>; Relationships: [] };
      content_blocks: { Row: ContentBlock; Insert: ContentBlockInsert; Update: Partial<ContentBlockInsert>; Relationships: [] };
      community_visitors: { Row: CommunityVisitor; Insert: CommunityVisitorInsert; Update: Partial<CommunityVisitorInsert>; Relationships: [] };
      community_boards: { Row: CommunityBoard; Insert: CommunityBoardInsert; Update: Partial<CommunityBoardInsert>; Relationships: [] };
      community_impulses: { Row: CommunityImpulse; Insert: CommunityImpulseInsert; Update: Partial<CommunityImpulseInsert>; Relationships: [] };
      community_replies: { Row: CommunityReply; Insert: CommunityReplyInsert; Update: Partial<CommunityReplyInsert>; Relationships: [] };
      community_reactions: { Row: CommunityReaction; Insert: CommunityReactionInsert; Update: Partial<CommunityReactionInsert>; Relationships: [] };
    };
    Views: {
      timeline: { Row: TimelineRow; Relationships: [] };
      posts_with_thumbnail: { Row: PostWithThumbnail; Relationships: [] };
      trips_with_countries: { Row: TripWithCountries; Relationships: [] };
      countries_with_stats: { Row: CountryWithStats; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ────────────────────────────────────────────────────────────
// POSTS
// ────────────────────────────────────────────────────────────

export type Post = {
  post_id: string;
  post_date: string;
  actual_date: string;
  created_at: string;
  updated_at: string;
  tumblr_timestamp: number | null;
  slug: string | null;
  original_url: string | null;
  short_url: string | null;
  state: string;
  note_count: number;
  title: string | null;
  summary: string | null;
  content_blocks: ContentBlockNPF[];
  layout_info: LayoutInfo | null;
  country_id: number | null;
  trip_id: number | null;
  city: string | null;
  region: string | null;
  location_name: string | null;
  coordinates: string | null;
  latitude: number | null;
  longitude: number | null;
  companions: string[] | null;
  travel_mode: string | null;
  tags: string[] | null;
  media_count: number;
  text_blocks_count: number;
  weather: string | null;
  mood: string | null;
  highlights: string[] | null;
  is_enriched: boolean | null;
  reactions: Record<string, string[]> | null;
  distance_km: number | null;
  duration_days: number | null;
  country_old: string | null;
};

// Only post_id/post_date/actual_date/title/content_blocks are always provided
// by app code (see app/admin/posts/actions.ts:savePost) — everything else
// either has a DB default or is nullable, so it's optional here too. Being
// stricter than that would reject the app's own real insert payloads.
export type PostInsert = {
  post_id: string;
  post_date: string;
  actual_date: string;
  title: string | null;
  content_blocks: ContentBlockNPF[];
} & Partial<Omit<Post, "post_id" | "post_date" | "actual_date" | "title" | "content_blocks" | "created_at" | "updated_at">>;

// ────────────────────────────────────────────────────────────
// MEDIA
// ────────────────────────────────────────────────────────────

export type Media = {
  media_id: number;
  post_id: string;
  block_index: number;
  display_order: number;
  media_type: "image" | "video" | "audio" | "link";
  mime_type: string | null;
  storage_path: string | null;
  local_path: string | null;
  original_url: string;
  tumblr_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  dominant_colors: Record<string, string> | null;
  exif_data: ExifData | null;
  camera_make: string | null;
  camera_model: string | null;
  lens: string | null;
  aperture: number | null;
  exposure_time: number | null;
  iso: number | null;
  focal_length: number | null;
  photo_taken_at: string | null;
  duration_seconds: number | null;
  provider: string | null;
  alt_text: string | null;
  caption: string | null;
  tags: string[] | null;
  created_at: string;
};

// Same rationale as PostInsert: only the fields app/admin/posts/actions.ts
// actually sets are required, the rest is nullable/has a DB default.
export type MediaInsert = {
  post_id: string;
  block_index: number;
  display_order: number;
  media_type: Media["media_type"];
} & Partial<Omit<Media, "media_id" | "post_id" | "block_index" | "display_order" | "media_type" | "created_at">>;

// ────────────────────────────────────────────────────────────
// COUNTRIES
// ────────────────────────────────────────────────────────────

export type Country = {
  country_id: number;
  name: string;
  name_de: string | null;
  iso_code: string | null;
  iso_code_3: string | null;
  continent: string | null;
  first_visited: string | null;
  last_visited: string | null;
  description: string | null;
  notes: string | null;
  capital: string | null;
  area: number | null;
  population: number | null;
  time_zone: string | null;
  happiness_index: number | null;
  languages_share: Record<string, string> | null;
  religions_share: Record<string, string> | null;
  gdp: number | null;
  minorities: string | null;
  gini: number | null;
  hdi: number | null;
  created_at: string;
  updated_at: string;
};

// app/admin/countries/actions.ts:saveCountry only ever sends name/iso_code/
// continent/description — the rest is nullable/DB-defaulted.
export type CountryInsert = {
  name: string;
  iso_code: string | null;
} & Partial<Omit<Country, "country_id" | "name" | "iso_code" | "created_at" | "updated_at">>;

export type CountryWithStats = Country & {
  total_posts: number;
  first_post_date: string | null;
  last_post_date: string | null;
  trips: string[] | null;
};

// ────────────────────────────────────────────────────────────
// TRIPS
// ────────────────────────────────────────────────────────────

export type Trip = {
  trip_id: number;
  trip_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  total_distance_km: number | null;
  companions: string[] | null;
  created_at: string;
  updated_at: string;
};

// app/admin/trips/actions.ts:saveTrip only requires trip_name; description/
// dates/distance/companions come from an optional Zod schema and may be
// undefined, not just null — Insert allows both since they're all optional.
export type TripInsert = {
  trip_name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_distance_km?: number | null;
  companions?: string[] | null;
};

export type TripWithCountries = Trip & {
  countries: string[] | null;
  country_codes: string[] | null;
  post_count: number;
  title_images: string[] | null;
};

// ────────────────────────────────────────────────────────────
// TRIP COUNTRIES
// ────────────────────────────────────────────────────────────

export type TripCountry = {
  trip_id: number;
  country_id: number;
  visit_order: number | null;
  entry_date: string | null;
  exit_date: string | null;
  days_spent: number | null;
};

export type TripCountryInsert = TripCountry;

// ────────────────────────────────────────────────────────────
// CONTENT BLOCKS
// ────────────────────────────────────────────────────────────

export type ContentBlock = {
  block_id: number;
  post_id: string;
  block_index: number;
  block_type: string;
  text_content: string | null;
  text_formatting: unknown;
  text_subtype: string | null;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  layout_row: number | null;
  layout_position: number | null;
  media_id: number | null;
  created_at: string;
};

// app/admin/posts/actions.ts:savePost only sets post_id/block_index/
// block_type/text_content/text_subtype/layout_row/layout_position/media_id —
// text_formatting/link_* are nullable and unused by the current editor.
export type ContentBlockInsert = {
  post_id: string;
  block_index: number;
  block_type: string;
} & Partial<Omit<ContentBlock, "block_id" | "post_id" | "block_index" | "block_type" | "created_at">>;

// ────────────────────────────────────────────────────────────
// VIEWS
// ────────────────────────────────────────────────────────────

export type TimelineRow = {
  post_id: string;
  post_date: string;
  actual_date: string;
  title: string | null;
  summary: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  companions: string[] | null;
  tags: string[] | null;
  trip_name: string | null;
  media_count: number;
};

export type PostWithThumbnail = Post & {
  thumbnail_path: string | null;
};

// ────────────────────────────────────────────────────────────
// NPF / TUMBLR TYPES
// ────────────────────────────────────────────────────────────

export type ContentBlockNPF = {
  type: "text" | "image" | "video" | "audio" | "link";
  text?: string;
  subtype?: string;
  media?: MediaNPF[];
  formatting?: unknown;
  colors?: Record<string, string>;
  exif?: ExifData;
  alt_text?: string;
  url?: string;
  title?: string;
  description?: string;
  provider?: string;
  duration?: number;
};

export type MediaNPF = {
  url: string;
  type?: string;
  width?: number;
  height?: number;
  has_original_dimensions?: boolean;
  media_key?: string;
};

export type LayoutInfo = {
  display?: Array<{
    blocks: number[];
    mode?: { type: string };
  }>;
};

export type ExifData = {
  CameraMake?: string;
  CameraModel?: string;
  Lens?: string;
  Aperture?: number;
  ExposureTime?: number;
  ISO?: number;
  FocalLength?: number;
  Time?: number;
  Altitude?: number;
  Latitude?: number;
  Longitude?: number;
};

// ────────────────────────────────────────────────────────────
// COMMUNITY FEATURES
// ────────────────────────────────────────────────────────────

export type CommunityVisitor = {
  visitor_id: string;
  display_name: string;
  recovery_code: string;
  visit_count: number;
  is_banned: boolean;
  last_active_at: string;
  created_at: string;
  avatar_id: string | null;
};

export type CommunityVisitorInsert = {
  visitor_id?: string;
  display_name: string;
  recovery_code: string;
  visit_count?: number;
  is_banned?: boolean;
  last_active_at?: string;
  created_at?: string;
  avatar_id?: string | null;
};

export type CommunityBoard = {
  board_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type CommunityBoardInsert = {
  board_id?: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export type CommunityImpulse = {
  impulse_id: string;
  board_id: string;
  visitor_id: string;
  content: string;
  post_id: string | null;
  country_id: number | null;
  created_at: string;
  updated_at: string | null;
};

export type CommunityImpulseInsert = {
  impulse_id?: string;
  board_id: string;
  visitor_id: string;
  content: string;
  post_id?: string | null;
  country_id?: number | null;
  created_at?: string;
  updated_at?: string | null;
};

export type CommunityReply = {
  reply_id: string;
  impulse_id: string;
  visitor_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
};

export type CommunityReplyInsert = {
  reply_id?: string;
  impulse_id: string;
  visitor_id: string;
  content: string;
  created_at?: string;
  updated_at?: string | null;
};

export type CommunityReaction = {
  reaction_id: string;
  impulse_id: string;
  visitor_id: string;
  reaction_type: "heart" | "sparkles" | "globe" | "funny" | "applause" | "rocket" | "camera";
  created_at: string;
};

export type CommunityReactionInsert = {
  reaction_id?: string;
  impulse_id: string;
  visitor_id: string;
  reaction_type: "heart" | "sparkles" | "globe" | "funny" | "applause" | "rocket" | "camera";
  created_at?: string;
};
