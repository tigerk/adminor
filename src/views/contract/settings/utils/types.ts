import type { ContractTemplateListVo } from "@/types";

interface ContractTemplateQueryFormProps {
  templateName: string;
  contractType?: number;
  status: any;
  pageSize: number;
  currentPage: number;
}

interface FormProps {
  formInline: ContractTemplateListVo;
}

export type { ContractTemplateQueryFormProps, FormProps };
