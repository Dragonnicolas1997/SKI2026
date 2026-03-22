export type Tab = "grid" | "leaderboard" | "gallery" | "profile";

export interface Challenge {
  index: number;
  text: string;
  completed: boolean;
  proof_type?: string;
  photo_url?: string;
  proof_text?: string;
  completion_id?: number;
}

export interface GrilleData {
  player_id: number;
  pseudo: string;
  grid_index: number;
  challenges: Challenge[];
  completed_count: number;
  has_bingo: boolean;
  bingo_lines: number[][];
}

export interface PlayerScore {
  player_id: number;
  pseudo: string;
  score: number;
  has_bingo: boolean;
}

export interface GalleryPhoto {
  id: string;
  photo_type: "defi" | "free";
  completion_id: number;
  player_id: number;
  player_pseudo: string;
  challenge_text: string | null;
  caption: string | null;
  photo_url: string;
  created_at: string;
  likes_count: number;
  liked_by_me: boolean;
}
