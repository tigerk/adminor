import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type Result = {
  success: boolean;
  data?: Array<any>;
};

/** 卡片列表 */
export const getRegionList = (data?: object) => {
  return http.request<Result>("get", baseUrlApi("region/list/three"), { params: data });
};

export const getRegionCityList = (data?: object) => {
  return http.request<Result>("get", baseUrlApi("region/list/city"), { params: data });
};

export const getRegionPoiTips = (data?: object) => {
  return http.request<Result>("get", baseUrlApi("region/poi/tips"), { params: data });
};
