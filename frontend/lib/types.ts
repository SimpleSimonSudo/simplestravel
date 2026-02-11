// ============================================================
// DATABASE TYPES (matching Supabase schema)
// ============================================================

export interface Database {
  public: {
    Tables: {
      posts: { Row: Post; Insert: PostInsert; Update: Partial<PostInsert> };
      media: { Row: Media; Insert: MediaInsert; Update: Partial<MediaInsert> };
      countries: { Row: Country; Insert: CountryInsert; Update: Partial<CountryInsert> };
      trips: { Row: Trip; Insert: TripInsert; Update: Partial<TripInsert> };
      trip_countries: { Row: TripCountry; Insert: TripCountryInsert; Update: Partial<TripCountryInsert> };
      content_blocks: { Row: ContentBlock; Insert: ContentBlockInsert; Update: Partial<ContentBlockInsert> };
    };
    Views: {
      timeline: { Row: TimelineRow };
      posts_with_thumbnail: { Row: PostWithThumbnail };
      trips_with_countries: { Row: TripWithCountries };
      countries_with_stats: { Row: CountryWithStats };
    };
  };
}

// ────────────────────────────────────────────────────────────
// POSTS
// ────────────────────────────────────────────────────────────

export interface Post {
  post_id: string;
  post_date: string;
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
}

export type PostInsert = Omit<Post, "created_at" | "updated_at">;

// ────────────────────────────────────────────────────────────
// MEDIA
// ────────────────────────────────────────────────────────────

export interface Media {
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
  created_at: string;
}

export type MediaInsert = Omit<Media, "media_id" | "created_at">;

// ────────────────────────────────────────────────────────────
// COUNTRIES
// ────────────────────────────────────────────────────────────

export interface Country {
  country_id: number;
  name: string;
  name_de: string | null;
  iso_code: string | null;
  iso_code_3: string | null;
  continent: string | null;
  region: string | null;
  post_count: number;
  first_visited: string | null;
  last_visited: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CountryInsert = Omit<Country, "country_id" | "created_at" | "updated_at">;

export interface CountryWithStats extends Country {
  total_posts: number;
  first_post_date: string | null;
  last_post_date: string | null;
  trips: string[] | null;
}

// ────────────────────────────────────────────────────────────
// TRIPS
// ────────────────────────────────────────────────────────────

export interface Trip {
  trip_id: number;
  trip_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  total_distance_km: number | null;
  companions: string[] | null;
  created_at: string;
  updated_at: string;
}

export type TripInsert = Omit<Trip, "trip_id" | "created_at" | "updated_at">;

export interface TripWithCountries extends Trip {
  countries: string[] | null;
  country_codes: string[] | null;
  post_count: number;
}

// ────────────────────────────────────────────────────────────
// TRIP COUNTRIES
// ────────────────────────────────────────────────────────────

export interface TripCountry {
  trip_id: number;
  country_id: number;
  visit_order: number | null;
  entry_date: string | null;
  exit_date: string | null;
  days_spent: number | null;
}

export type TripCountryInsert = TripCountry;

// ────────────────────────────────────────────────────────────
// CONTENT BLOCKS
// ────────────────────────────────────────────────────────────

export interface ContentBlock {
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
}

export type ContentBlockInsert = Omit<ContentBlock, "block_id" | "created_at">;

// ────────────────────────────────────────────────────────────
// VIEWS
// ────────────────────────────────────────────────────────────

export interface TimelineRow {
  post_id: string;
  post_date: string;
  title: string | null;
  summary: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  companions: string[] | null;
  tags: string[] | null;
  trip_name: string | null;
  media_count: number;
}

export interface PostWithThumbnail extends Post {
  thumbnail_path: string | null;
}

// ────────────────────────────────────────────────────────────
// NPF / TUMBLR TYPES
// ────────────────────────────────────────────────────────────

export interface ContentBlockNPF {
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
}

export interface MediaNPF {
  url: string;
  type?: string;
  width?: number;
  height?: number;
  has_original_dimensions?: boolean;
  media_key?: string;
}

export interface LayoutInfo {
  display?: Array<{
    blocks: number[];
    mode?: { type: string };
  }>;
}

export interface ExifData {
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
}
