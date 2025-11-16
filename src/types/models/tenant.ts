// src/types/models/tenant.ts

import { ContractTemplateFormProps } from "@/types";

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
  status?: number;
  createTime?: string;
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
  contract: ContractTemplateFormProps;
}

/** 租客统计 */
export interface TenantStatisticsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}
