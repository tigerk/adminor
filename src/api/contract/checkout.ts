import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

import type { ApiResponse, LeaseCheckoutVo, LeaseCheckoutDto, LeaseCheckoutInitVo, LeaseCheckoutQueryDto } from "@/types";

/** 获取退租初始化数据（合同信息+未付账单+预填费用） */
export const getCheckoutInitData = (leaseId?: string) => {
  return http.request<ApiResponse<LeaseCheckoutInitVo>>("post", baseUrlApi("lease/checkout/init"), { data: { leaseId } });
};

/** 保存退租单（退租并结账） */
export const saveCheckout = (data: LeaseCheckoutDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("lease/checkout/save"), { data });
};

/** 取消退租单 */
export const cancelCheckout = (checkoutId: string) => {
  return http.request<ApiResponse<void>>("post", baseUrlApi("lease/checkout/cancel"), { data: { checkoutId } });
};

/** 获取退租单详情 */
export const getCheckoutDetail = (checkoutId: string) => {
  return http.request<ApiResponse<LeaseCheckoutVo>>("post", baseUrlApi("lease/checkout/detail"), { data: { checkoutId } });
};

/** 根据租客ID获取退租单 */
export const getCheckoutByLeaseId = (leaseId?: string) => {
  return http.request<ApiResponse<LeaseCheckoutVo>>("post", baseUrlApi("lease/checkout/getByLease"), { data: { leaseId } });
};

/** 查询退租单列表 */
export const queryCheckoutList = (query: LeaseCheckoutQueryDto) => {
  return http.request<ApiResponse<{ list: LeaseCheckoutVo[]; total: number }>>("post", baseUrlApi("lease/checkout/list"), { data: query });
};
