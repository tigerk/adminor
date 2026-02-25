import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, ScatterCreateDto, HouseDetailVo } from "@/types";

export const createEntireHouse = (data?: ScatterCreateDto) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const createShareHouse = (data?: ScatterCreateDto) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const getEntireHouseDetailById = (data?: object) => {
  return http.request<ApiResponse<HouseDetailVo>>("post", baseUrlApi("scatter/house/detail"), { data });
};

export const getShareHouseDetailById = (data?: object) => {
  return http.request<ApiResponse<HouseDetailVo>>("post", baseUrlApi("scatter/house/detail"), { data });
};
