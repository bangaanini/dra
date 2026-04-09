export interface MeloshortLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface MeloshortListResponse {
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

export interface MeloshortDetailResponse {
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

export interface MeloshortStreamResponse {
  data: {
    episode_id: string;
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
