export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  slug: string;
  emoji: string;
  event_date: string | null;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  title: string;
  url: string | null;
  price: number | null;
  image_url: string | null;
  note: string | null;
  is_deleted: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  reservation: ItemReservation | null;
  contributions: ItemContribution[];
  is_reserved: boolean;
  total_contributed: number;
  contributors_count: number;
}

export interface ItemReservation {
  id: string;
  item_id: string;
  guest_name: string | null;
  guest_token: string | null;
  guest_email: string | null;
  is_mine: boolean;
  created_at: string;
}

export interface ItemContribution {
  id: string;
  item_id: string;
  guest_name: string | null;
  amount: number;
  is_mine: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PublicWishlist extends Wishlist {
  owner_name: string;
  owner_avatar_url: string | null;
  items_data: PaginatedResponse<WishlistItem>;
  is_owner: boolean;
}
