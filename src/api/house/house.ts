import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

import type { ApiResponse } from "@/types";
import type { HouseDetailVo, HouseIdDto, HouseListVo, HouseQueryDto, PageVoHouseListVo } from "@/types/generated";

type GetHouseDetailResponse = ApiResponse<HouseDetailVo>;
type GetHouseListResponse = ApiResponse<PageVoHouseListVo>;

export const getHouseList = (data?: HouseQueryDto) => {
  return http.request<GetHouseListResponse>("post", baseUrlApi("house/list"), { data });
};

/**
 * 获取房源详情页
 */
export const getHouseDetail = (data?: HouseIdDto) => {
  return http.request<GetHouseDetailResponse>("post", baseUrlApi("house/detail"), { data });
};
