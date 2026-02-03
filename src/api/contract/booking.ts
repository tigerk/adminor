import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, BookingCancelProps, BookingCreateProps, BookingListProps, BookingQueryParams, BookingTotalProps, PaginationResponse } from "@/types";

/** 获取预定统计 */
export const getBookingTotal = (data?: BookingQueryParams) => {
  return http.request<ApiResponse<BookingTotalProps>>("post", baseUrlApi("contract/booking/total"), { data });
};

/** 获取预定列表 */
export const getBookingList = (data?: BookingQueryParams) => {
  return http.request<ApiResponse<PaginationResponse<BookingListProps>>>("post", baseUrlApi("contract/booking/list"), { data });
};

/** 创建预定 */
export const createBooking = (data?: BookingCreateProps) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/booking/create"), { data });
};

/** 获取租客详情 */
export const getBookingDetail = (data?: object) => {
  return http.request<ApiResponse<BookingListProps>>("post", baseUrlApi("contract/booking/get"), { data });
};

/** 生成预定合同 */
export const generateBookingContract = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/booking/contract/generate"), { data });
};

/** 下载预定合同 */
export const downloadBookingContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/booking/contract/download"), { data }, { responseType: "blob" });
};

/** 作废预定 */
export const cancelBooking = (data?: BookingCancelProps) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("contract/booking/cancel"), { data });
};
