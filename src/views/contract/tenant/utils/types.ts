import type { ContractTemplateFormProps } from "@/types";

/** 租客查询表单 */
interface TenantQueryFormProps {
  tenantName: string;
  tenantPhone: string;
  pageSize: number;
  currentPage: number;
}

interface FormProps {
  formInline: ContractTemplateFormProps;
}

export type { TenantQueryFormProps, FormProps };
