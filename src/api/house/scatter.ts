import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, ScatterCreateFormProps, ScatterHouseDetailProps } from "@/types";

export const createEntireHouse = (data?: ScatterCreateFormProps) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const createShareHouse = (data?: ScatterCreateFormProps) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/create"), { data });
};

export const getEntireHouseById = (data?: object) => {
  return http.request<ApiResponse<ScatterHouseDetailProps>>("post", baseUrlApi("scatter/house/get"), { data });
};

export const getShareHouseById = (data?: object) => {
  return http.request<ApiResponse<ScatterHouseDetailProps>>("post", baseUrlApi("scatter/house/get"), { data });
};
