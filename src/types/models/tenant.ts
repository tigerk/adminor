import type { LeaseDto, TenantCreateDto } from "@/types";

export interface LeaseProps extends LeaseDto {
  leaseDate: string[];
  checkDate: string[];
}

/** 租客创建表单 */
export interface TenantsCreateFormProps extends TenantCreateDto {
  lease: LeaseProps;
  isEdit?: boolean; // 是否为编辑模式
}
