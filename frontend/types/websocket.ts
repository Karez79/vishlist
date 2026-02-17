export type WsMessageType =
  | "item_reserved"
  | "item_unreserved"
  | "contribution_added"
  | "contribution_removed"
  | "item_added"
  | "item_updated"
  | "item_deleted"
  | "wishlist_deleted";

export interface WsMessage {
  type: WsMessageType;
  item_id?: string;
}
