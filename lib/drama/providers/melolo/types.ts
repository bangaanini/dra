export interface MeloloLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface MeloloListResponse {
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      create_time?: string;
      episode_count?: string;
      watch_value?: string;
      is_new_book?: string;
      language?: string;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface MeloloDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    episode_count?: number;
    tags?: string[];
    video_list?: Array<{
      episode: number;
      video_id: string;
      duration?: number;
      cover?: string;
    }>;
  };
}

export interface MeloloStreamResponse {
  data: {
    video_id: string;
    poster?: string;
    qualities?: Array<{
      label?: string;
      codec?: string;
      bitrate?: number;
      url: string;
    }>;
  };
}
