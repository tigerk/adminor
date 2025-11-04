import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import { ApiListResponse, ApiResponse } from "@/types";

/** 卡片列表 */
export const getRegionList = (data?: object) => {
  return http.request<ApiListResponse>("get", baseUrlApi("region/list/three"), { params: data });
};

export const getRegionCityList = (data?: object) => {
  return http.request<ApiListResponse>("get", baseUrlApi("region/list/city"), { params: data });
};

export const getRegionPoiTips = (data?: object) => {
  return http.request<ApiListResponse>("get", baseUrlApi("region/poi/tips"), { params: data });
};

export const getCityByLocation = (data?: object) => {
  return http.request<ApiResponse>("get", baseUrlApi("region/getCityByLocation"), { params: data });
};
