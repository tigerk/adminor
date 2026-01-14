import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, ScatterHouseProps } from "@/types";

export const createEntireHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const createShareHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const getEntireHouseById = (data?: object) => {
  return http.request<ApiResponse<ScatterHouseProps>>("post", baseUrlApi("scatter/get"), { data });
};

export const getShareHouseById = (data?: object) => {
  return http.request<ApiResponse<ScatterHouseProps>>("post", baseUrlApi("scatter/get"), { data });
};
