import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse } from "@/types/common";
import type { SysMessageProps, SysNoticeProps, SysTodoProps } from "@/types";

type RecentNoticeResponse = {
  messages: SysMessageProps[];
  notices: SysNoticeProps[];
  todos: SysTodoProps[];
  unreadMessageCount?: number;
  unreadNoticeCount?: number;
  pendingTodoCount?: number;
};

export const getRecentNotice = (data: { days: number }) => {
  return http.request<ApiResponse<RecentNoticeResponse>>("post", baseUrlApi("sys/notice/recent"), { data });
};

export const getMessagePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysMessageProps>>>("post", baseUrlApi("sys/notice/message/page"), { data });
};

export const getNoticePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysNoticeProps>>>("post", baseUrlApi("sys/notice/notice/page"), { data });
};

export const getMyNoticePage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysNoticeProps>>>("post", baseUrlApi("sys/notice/notice/my/page"), { data });
};

export const getTodoPage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysTodoProps>>>("post", baseUrlApi("sys/notice/todo/page"), { data });
};

export const saveNotice = (data: { id?: number; title: string; content: string; noticeType: number; targetScope?: number; remark?: string; roleIds?: number[] }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/create"), { data });
};

export const getNoticeDetail = (data: { id: number }) => {
  return http.request<ApiResponse<{ notice: SysNoticeProps; roleIds: number[] }>>("post", baseUrlApi("sys/notice/detail"), { data });
};

export const deleteNotice = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/delete"), { data });
};

export const markMessageRead = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/message/read"), { data });
};

export const markNoticeRead = (data: { id: number }) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/notice/notice/read"), { data });
};
