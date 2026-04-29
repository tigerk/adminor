import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, BizOperateLogVo } from "@/types";

export interface BizOperateLogQuery {
  bizType?: string;
  bizId?: string | number;
  sourceType?: string;
  sourceId?: string | number;
}

export const getBizOperateLogList = (data?: BizOperateLogQuery) => {
  return http.request<ApiResponse<BizOperateLogVo[]>>("post", baseUrlApi("biz/operate-log/list"), { data });
};
