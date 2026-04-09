export interface DramawaveLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface DramawaveListResponse {
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      episode_count?: string;
      watch_value?: string;
      follow_count?: string;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface DramawaveDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    episode_count?: number;
    thumb_url?: string;
    tags?: string[];
    hot_score?: string;
    performers?: Array<{ name: string }>;
    original_language?: string;
    episodeList?: Array<{
      episode_id: string;
      index: number;
      episode_price?: number;
    }>;
  };
}

export interface DramawaveStreamResponse {
  data: {
    id?: string;
    name?: string;
    cover?: string;
    video_url?: string;
    m3u8_url?: string;
    external_audio_h264_m3u8?: string;
    external_audio_h265_m3u8?: string;
    subtitle_list?: Array<{
      language?: string;
      type?: string;
      subtitle?: string;
      display_name?: string;
    }>;
    original_audio_language?: string;
  };
}
