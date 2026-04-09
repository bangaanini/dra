export interface ReelshortLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface ReelshortListResponse {
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      episode_count?: number;
      watch_value?: string;
      is_new_book?: string;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface ReelshortDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    episode_count?: number;
    watch_value?: string;
    thumb_url?: string;
    tags?: string[];
    video_list?: Array<{
      index: number;
      chapterId: string;
      title?: string;
      isLocked?: boolean;
      serialNumber?: number;
    }>;
  };
}

export interface ReelshortStreamResponse {
  data: {
    isLocked?: boolean;
    videoList?: Array<{
      playUrl: string;
      encode?: string;
      dpi?: number;
      bitrate?: string;
    }>;
  };
}
