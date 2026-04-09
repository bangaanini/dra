export interface FlickreelsLanguageResponse {
  data: Array<{
    id?: string;
    code: string;
    name: string;
  }>;
}

export interface FlickreelsHomeResponse {
  total?: number;
  next_page?: number;
  data: Array<{
    id: string;
    title: string;
    cover?: string;
    cover_thumb?: string;
    total_episodes?: number;
    likes?: string;
    tags?: string[];
  }>;
}

export interface FlickreelsSearchResponse {
  keyword?: string;
  total?: number;
  data: Array<{
    id: string;
    title: string;
    cover?: string;
    total_episodes?: number;
    introduce?: string;
    tags?: string[];
  }>;
}

export interface FlickreelsPopularResponse {
  data: Array<{
    name: string;
    rank_type?: number;
    playlets?: Array<{
      id: string;
      title: string;
      cover?: string;
      total_episodes?: number;
      likes?: string;
      tags?: string[];
      introduce?: string;
    }>;
  }>;
}

export interface FlickreelsDetailResponse {
  data: {
    playlet_id: string;
    title: string;
    introduce?: string;
    cover?: string;
    upload_num?: string;
    tags?: string[];
    episode_list?: Array<{
      chapter_id: string;
      chapter_num: number;
      chapter_name?: string;
    }>;
  };
}

export interface FlickreelsStreamResponse {
  data: {
    playlet_id?: string;
    title?: string;
    cover?: string;
    total_eps?: number;
    list?: Array<{
      chapter_num: number;
      chapter_id: string;
      play_url: string;
    }>;
  };
}
