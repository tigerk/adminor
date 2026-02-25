import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

import type { ApiResponse } from "@/types";
import type { HouseDetailVo, HouseIdDto } from "@/types/generated";

type GetHouseDetailResponse = ApiResponse<HouseDetailVo>;

/**
 * 获取房源详情页
 */
export const getHouseDetail = (data?: HouseIdDto) => {
  return http.request<GetHouseDetailResponse>("post", baseUrlApi("house/detail"), { data });
};
