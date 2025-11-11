import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, EntireFormItemProps, ShareFormItemProps } from "@/types";

export const createEntireHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const createShareHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const getEntireHouseById = (data?: object) => {
  return http.request<ApiResponse<EntireFormItemProps>>("get", baseUrlApi("scatter/get"), { params: data });
};

export const getShareHouseById = (data?: object) => {
  return http.request<ApiResponse<ShareFormItemProps>>("get", baseUrlApi("scatter/get"), { params: data });
};
