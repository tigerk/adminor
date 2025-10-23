import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse } from "@/types";

export const createEntireHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/entire/create"), { data });
};

export const createShareHouse = (data?: object) => {
  return http.request<ApiResponse<any>>("post", baseUrlApi("scatter/entire/create"), { data });
};
