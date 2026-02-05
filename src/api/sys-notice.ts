import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse } from "@/types/common";
import type { SysMessageProps, SysNoticeProps, SysTodoProps } from "@/types";

type RecentNoticeResponse = {
  messages: SysMessageProps[];
  notices: SysNoticeProps[];
  todos: SysTodoProps[];
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

export const getTodoPage = (data: { currentPage: number; pageSize: number; keyword?: string }) => {
  return http.request<ApiResponse<PaginationResponse<SysTodoProps>>>("post", baseUrlApi("sys/notice/todo/page"), { data });
};
