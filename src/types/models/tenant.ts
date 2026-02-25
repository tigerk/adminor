import type { TenantCreateDto } from "@/types";

/** 租客创建表单 */
export interface TenantsCreateFormProps extends TenantCreateDto {
  isEdit?: boolean; // 是否为编辑模式
}
