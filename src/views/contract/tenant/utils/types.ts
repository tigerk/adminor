import type { ContractTemplateProps } from "@/types";

/** 租客查询表单 */
interface TenantQueryFormProps {
  tenantName: string;
  tenantPhone: string;
  pageSize: number;
  currentPage: number;
}

interface FormProps {
  formInline: ContractTemplateProps;
}

export type { TenantQueryFormProps, FormProps };
