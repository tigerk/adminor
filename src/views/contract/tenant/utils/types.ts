import type { ContractTemplateFormProps, TenantMateProps } from "@/types";

/** 租客查询表单 */
interface TenantQueryFormProps {
  tenantName: string;
  tenantPhone: string;
  pageSize: number;
  currentPage: number;
}

interface TenantCreateFormProps {
  formInline: ContractTemplateFormProps;
}

export type { TenantQueryFormProps, TenantCreateFormProps };
