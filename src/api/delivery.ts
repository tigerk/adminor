import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiListResponse, ApiResponse, DeliveryCreateDto, DeliveryQueryDto, DeliveryUpdateDto } from "@/types";

/** 获取交割单列表 */
export const getDeliveryList = (data?: DeliveryQueryDto) => {
  return http.request<ApiListResponse>("post", baseUrlApi("delivery/list"), { data });
};

/** 创建交割单 */
export const createDelivery = (data?: DeliveryCreateDto) => {
  return http.request<ApiResponse<void>>("post", baseUrlApi("delivery/create"), { data });
};

export const updateDelivery = (data?: DeliveryUpdateDto) => {
  return http.request<ApiResponse<void>>("post", baseUrlApi("delivery/update"), { data });
};
