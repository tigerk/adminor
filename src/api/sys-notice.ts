import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse } from "@/types/common";
import type { SysMessage, SysNotice, SysTodo } from "@/types";

type RecentNoticeResponse = {
  messages: SysMessage[];
  notices: SysNotice[];
  todos: SysTodo[];
  unreadMessageCount?: number;
  unreadNoticeCount?: number;
  pendingTodoCount?: number;
};

export const getRecentNotice = (data: any) => {
  return http.request<ApiResponse<RecentNoticeResponse>>("post", baseUrlApi("sys/notice/recent"), { data });
};

export const getMyMessagePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysMessage>>>("post", baseUrlApi("sys/notice/message/my/page"), { data });
};

export const getMessageAdminPage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysMessage>>>("post", baseUrlApi("sys/notice/message/admin/page"), { data });
};

export const getNoticePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysNotice>>>("post", baseUrlApi("sys/notice/notice/admin/page"), { data });
};

export const getMyNoticePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysNotice>>>("post", baseUrlApi("sys/notice/notice/my/page"), { data });
};

export const getTodoMyPage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysTodo>>>("post", baseUrlApi("sys/notice/todo/my/page"), { data });
};

export const getTodoAdminPage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysTodo>>>("post", baseUrlApi("sys/notice/todo/admin/page"), { data });
};

export const saveNotice = (data: { id?: number; title: string; content: string; noticeType: number; targetScope?: number; remark?: string; roleIds?: number[] }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/create"), { data });
};

export const getNoticeDetail = (data: { id: number }) => {
  return http.request<ApiResponse<{ notice: SysNotice; roleIds: number[] }>>("post", baseUrlApi("sys/notice/detail"), { data });
};

export const deleteNotice = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/delete"), { data });
};

export const markMessageRead = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/message/read"), { data });
};

export const markMessageReadBatch = (data: { ids: number[] }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/message/read/batch"), { data });
};

export const markNoticeRead = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/notice/read"), { data });
};

export const markNoticeReadBatch = (data: { ids: number[] }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/notice/read/batch"), { data });
};

export const sendMessage = (data: { receiverId: number; title: string; content: string; msgType: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/message/send"), { data });
};

export const deleteMessage = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/message/delete"), { data });
};

export const markTodoRead = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/todo/read"), { data });
};

export const markTodoReadBatch = (data: { ids: number[] }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/todo/read/batch"), { data });
};

export const handleTodo = (data: { id: number; handleRemark: string }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/todo/handle"), { data });
};

export const deleteTodo = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/todo/delete"), { data });
};
