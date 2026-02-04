import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

import type { ApiResponse, CheckoutDetailProps, CheckoutFormProps, CheckoutInitDataProps, CheckoutQueryProps } from "@/types";

/** 获取退租初始化数据 */
export const getCheckoutInitData = (tenantId: string) => {
  return http.request<ApiResponse<CheckoutInitDataProps>>("post", baseUrlApi("tenant/checkout/init"), {
    data: { tenantId }
  });
};

/** 保存退租单 */
export const saveCheckout = (data: CheckoutFormProps) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("tenant/checkout/save"), { data });
};

/** 提交退租审批 */
export const submitCheckout = (checkoutId: string) => {
  return http.request<ApiResponse<void>>("post", baseUrlApi("tenant/checkout/submit"), {
    data: { tenantId: checkoutId }
  });
};

/** 取消退租单 */
export const cancelCheckout = (checkoutId: string) => {
  return http.request<ApiResponse<void>>("post", baseUrlApi("tenant/checkout/cancel"), {
    data: { tenantId: checkoutId }
  });
};

/** 获取退租单详情 */
export const getCheckoutDetail = (checkoutId: string) => {
  return http.request<ApiResponse<CheckoutDetailProps>>("post", baseUrlApi("tenant/checkout/detail"), {
    data: { tenantId: checkoutId }
  });
};

/** 根据租客ID获取退租单 */
export const getCheckoutByTenantId = (tenantId: string) => {
  return http.request<ApiResponse<CheckoutDetailProps>>("post", baseUrlApi("tenant/checkout/getByTenant"), {
    data: { tenantId }
  });
};

/** 查询退租单列表 */
export const queryCheckoutList = (query: CheckoutQueryProps) => {
  return http.request<ApiResponse<{ list: CheckoutDetailProps[]; total: number }>>("post", baseUrlApi("tenant/checkout/list"), { data: query });
};
