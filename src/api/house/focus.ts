import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { FocusCreateDto } from "@/views/house/components/FocusCreate/utils/types";
import type { ApiListResponse, ApiResponse, PaginationResponse } from "@/types/common";

type ResultList = {
  code: number;
  message: string;
  data?: Array<any>;
};

export const createFocusHouse = (data?: object) => {
  return http.request<ApiListResponse>("post", baseUrlApi("focus/create"), { data });
};

export const getFocusHouseOptions = (data?: object) => {
  return http.request<ResultList>("get", baseUrlApi("focus/options"), { params: data });
};

export const getFocusById = (data?: object) => {
  return http.request<ApiResponse<FocusCreateDto>>("get", baseUrlApi("focus/get"), { params: data });
};

export const checkFocusCodeExist = (data?: object) => {
  return http.request<ApiResponse<boolean>>("get", baseUrlApi("focus/code/check"), { params: data });
};

/** 获取集中式项目列表 */
export const getFocusList = (data?: object) => {
  return http.request<ApiResponse<PaginationResponse>>("post", baseUrlApi("focus/list"), { data });
};
