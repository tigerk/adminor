import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  ApiResponse,
  PaginationResponse,
  LeaseBillCollectDto,
  LeaseBillListVo,
  LeaseBillUpdateDto,
  LeaseBillVoidDto,
  LeaseContractVo,
  LeaseDetailVo,
  LeaseListVo,
  LeaseQueryDto,
  LeaseBillCreateDto,
  TenantInfoUpdateDto,
  BizOperateLogVo,
  LeaseAttachmentUpdateDto
} from "@/types";

export interface TenantProfileSearchDto {
  keyword?: string;
  tenantType?: number;
  limit?: number;
}

export interface TenantProfileSearchItem {
  profileId?: string;
  templateId?: string;
  sourceTenantId?: string;
  tenantType?: number;
  tenantName?: string;
  tenantPhone?: string;
  updateAt?: string;
  tenantPersonal?: {
    id?: string;
    companyId?: number;
    name?: string;
    gender?: number;
    idType?: number;
    idNo?: string;
    phone?: string;
    tags?: string[];
    remark?: string;
    idCardFrontList?: string[];
    idCardBackList?: string[];
    idCardInHandList?: string[];
    otherImageList?: string[];
  };
  tenantCompany?: {
    id?: string;
    companyName?: string;
    uscc?: string;
    legalPerson?: string;
    legalPersonIdType?: number;
    legalPersonIdNo?: string;
    contactName?: string;
    contactPhone?: string;
    registeredAddress?: string;
    tags?: string[];
    remark?: string;
    businessLicenseList?: string[];
    otherImageList?: string[];
  };
}

/** 获取租客统计 */
export const getTenantTotal = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/total"), { data });
};

/** 获取租客列表 */
export const getTenantList = (data?: LeaseQueryDto) => {
  return http.request<ApiResponse<PaginationResponse<LeaseListVo>>>("post", baseUrlApi("contract/lease/list"), { data });
};

/** 创建租客 */
export const createTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/create"), { data });
};

/** 租客续约 */
export const renewLease = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/renew"), { data });
};

/** 更新租客 */
export const updateTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/update"), { data });
};

/** 仅更新租客信息 */
export const updateTenantInfo = (data?: TenantInfoUpdateDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/tenant/info/update"), { data });
};

/** 更新租约资料附件 */
export const updateLeaseAttachments = (data?: LeaseAttachmentUpdateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/lease/attachments/update"), { data });
};

/** 获取租约操作记录 */
export const getLeaseOperateLogList = (leaseId: string) => {
  return http.request<ApiResponse<BizOperateLogVo[]>>("post", baseUrlApi("contract/lease/operate-log/list"), { data: { leaseId } });
};

/** 删除租客 */
export const deleteTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/delete"), { data });
};

/** 更新租客状态 */
export const updateTenantStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/status/update"), { data });
};

/** 获取租客详情 */
export const getLeaseDetail = (data?: object) => {
  return http.request<ApiResponse<LeaseDetailVo>>("post", baseUrlApi("contract/lease/detail"), { data });
};

/** 搜索历史租客资料 */
export const searchTenantProfiles = (data?: TenantProfileSearchDto) => {
  return http.request<ApiResponse<TenantProfileSearchItem[]>>("post", baseUrlApi("contract/lease/tenant/profile/search"), { data });
};

/** 获取租客账单列表 */
export const getLeaseBillList = (data?: object) => {
  return http.request<ApiResponse<LeaseBillListVo[]>>("post", baseUrlApi("contract/lease/bill/list"), { data });
};

/** 获取租客历史账单列表 */
export const getHistoryLeaseBillList = (data?: object) => {
  return http.request<ApiResponse<LeaseBillListVo[]>>("post", baseUrlApi("contract/lease/bill/history/list"), { data });
};

/** 获取租客账单详情 */
export const getLeaseBillDetail = (data?: { billId: string }) => {
  return http.request<ApiResponse<LeaseBillListVo>>("post", baseUrlApi("contract/lease/bill/detail"), { data });
};

/** 新增租客账单 */
export const createLeaseBill = (data?: LeaseBillCreateDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/bill/create"), { data });
};

/** 更新租客账单 */
export const updateLeaseBill = (data?: LeaseBillUpdateDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/bill/update"), { data });
};

/** 租客账单收款 */
export const collectLeaseBill = (data?: LeaseBillCollectDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/bill/collect"), { data });
};

/** 作废租客账单 */
export const voidLeaseBill = (data?: LeaseBillVoidDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/bill/void"), { data });
};

/** 生成租客合同 */
export const generateLeaseContract = (data?: object) => {
  return http.request<ApiResponse<LeaseContractVo>>("post", baseUrlApi("contract/lease/contract/generate"), { data });
};

/** 下载租客合同 */
export const downloadLeaseContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/lease/contract/download"), { data }, { responseType: "blob" });
};

/** 更新租客合同签署状态 */
export const updateLeaseContractSignStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/contract/sign/status/update"), { data });
};

/** 删除租客合同 */
export const deleteLeaseContract = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/contract/delete"), { data });
};

/** 作废租客 */
export const cancelTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/lease/cancel"), { data });
};

/** 租客合同预览 */
export const previewLeaseContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/lease/contract/preview"), { data }, { responseType: "blob" });
};
