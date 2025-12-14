import type { TenantsCreateFormProps } from "@/types";

/** 租客查询表单 */
interface TenantQueryFormProps {
  tenantName: string;
  tenantPhone: string;
  pageSize: number;
  currentPage: number;
}

interface TenantCreateFormProps {
  formInline: TenantsCreateFormProps;
}

export type { TenantQueryFormProps, TenantCreateFormProps };
