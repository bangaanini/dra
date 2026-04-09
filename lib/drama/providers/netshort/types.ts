export interface NetshortLanguageResponse {
  data: Array<{
    code: string;
    name: string;
    full?: string;
  }>;
}

export interface NetshortListResponse {
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      episode_count?: number;
      is_finished?: boolean;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface NetshortDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    episode_count?: number;
    is_finished?: boolean;
    thumb_url?: string;
    tags?: string[];
    video_list?: Array<{
      episode: number;
      episode_id: string;
      cover?: string;
      isLocked?: boolean;
    }>;
  };
}

export interface NetshortStreamResponse {
  data: {
    drama_id?: string;
    episode?: number;
    episode_id?: string;
    videos?: Array<{
      quality?: string;
      url: string;
    }>;
    subtitles?: Array<{
      language?: string;
      url?: string;
      type?: string;
    }>;
  };
}
