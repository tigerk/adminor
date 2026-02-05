export interface ListItem {
  id?: number;
  avatar: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  isRead?: boolean;
  priority?: number;
  todoStatus?: number;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
}
