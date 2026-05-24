import type { CardContent, CardType } from "./cards";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface BookWithCount extends Book {
  card_count: number;
}

export interface Card {
  id: string;
  user_id: string;
  book_id: string;
  card_type: CardType;
  front_image_url: string | null;
  back_image_url: string | null;
  content: CardContent;
  raw_ocr_text: string | null;
  tags: string[];
  is_edited: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CardWithBook extends Card {
  books: { id: string; title: string } | null;
}
