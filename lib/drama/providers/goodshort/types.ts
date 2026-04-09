export interface GoodshortLanguageResponse {
  data: Array<{
    code: string;
    name: string;
  }>;
}

export interface GoodshortListResponse {
  data: Array<{
    books: Array<{
      drama_id: string;
      drama_name: string;
      description?: string;
      episode_count?: string;
      watch_value?: string;
      thumb_url?: string;
      tags?: string[];
    }>;
  }>;
}

export interface GoodshortDetailResponse {
  data: {
    drama_id: string;
    drama_name: string;
    description?: string;
    thumb_url?: string;
    episode_count?: string;
    watch_value?: string;
    tags?: string[];
    chapter_list?: Array<{
      id: number;
      index: number;
      chapterName?: string;
    }>;
  };
}

export interface GoodshortStreamResponse {
  data: {
    bookId: string;
    total?: number;
    downloadList?: Array<{
      id: number;
      index: number;
      chapterName?: string;
      image?: string;
      price?: number;
      multiVideos?: Array<{
        type?: string;
        filePath: string;
      }>;
    }>;
  };
}
