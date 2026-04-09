export interface FreereelsLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface FreereelsListResponse {
  page?: number;
  has_more?: boolean;
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      episode_count?: number;
      watch_value?: string;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface FreereelsDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    episode_count?: number;
    watch_value?: string;
    thumb_url?: string;
    tags?: string[];
    free?: boolean;
    episode_list?: Array<{
      episode: number;
      episode_id: string;
      name?: string;
      unlock?: boolean;
    }>;
  };
}

export interface FreereelsStreamResponse {
  data: {
    episode_id?: string;
    name?: string;
    cover?: string;
    video_url?: string;
    m3u8_url?: string;
    h264_m3u8?: string;
    h265_m3u8?: string;
    subtitles?: Array<{
      language?: string;
      type?: string;
      url?: string;
      display_name?: string;
    }>;
  };
}
