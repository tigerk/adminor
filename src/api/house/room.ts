import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse, RoomGridProps, RoomListQueryProps, RoomTotal } from "@/types";

export type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

export type ResultRoomGridProps = {
  code: number;
  message: string;
  data?: RoomGridProps;
};

export const getRoomList = (data?: RoomListQueryProps) => {
  return http.request<ApiResponse<PaginationResponse>>("post", baseUrlApi("room/list"), { data });
};

/**
 * 获取房间网格数据
 * @param data
 */
export const getRoomGrid = (data?: object) => {
  return http.request<ResultRoomGridProps>("post", baseUrlApi("room/grid"), { data });
};

export const getRoomTotal = (data?: object) => {
  return http.request<RoomTotal>("post", baseUrlApi("room/total"), { data });
};

/**
 * 锁定房间
 * @param data
 */
export const lockRoom = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/lock"), { data });
};

export const unlockRoom = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/unlock"), { data });
};

export const closeRoom = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/close"), { data });
};

export const openRoom = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/open"), { data });
};
