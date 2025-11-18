// src/types/models/tenant.ts

import type { ContractTemplateFormProps } from "@/types";

/** 租客信息 */
export interface TenantProps {
  id?: number;
  companyId?: number;
  name: string;
  gender?: number;
  idType: number;
  idNo: string;
  phone: string;
  tenantType?: number;
  tenantSource?: number;
  dealChannel?: number;
  tags?: string[];
  remark?: string;
  idCardFrontList: string[];
  idCardBackList: string[];
  idCardInHandList: string[];
  otherImageList: string[];
}

/** 租客查询表单 */
export interface TenantQueryFormProps {
  name?: string;
  phone?: string;
  idNo?: string;
  tenantType?: number;
  status?: number;
  pageSize: number;
  currentPage: number;
}

/** 租客创建表单 */
export interface TenantsCreateFormProps {
  tenant: TenantProps;
  tenantMateList: TenantMateProps[];
  contract: TenantContractProps;
}

/** 租客统计 */
export interface TenantStatisticsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

/** 租客同住人信息 */
export interface TenantMateProps {
  id?: number;
  tenantId?: number;
  name: string;
  gender?: number;
  idType: number;
  idNo: string;
  phone: string;
  tags?: string[];
  remark?: string;
  status?: number;
  idCardFrontList: string[];
  idCardBackList: string[];
  idCardInHandList: string[];
  otherImageList: string[];
}
