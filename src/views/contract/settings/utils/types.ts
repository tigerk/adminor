import type { ContractTemplateFormProps } from "@/types";

interface ContractTemplateQueryFormProps {
  templateName: string;
  contractType?: number;
  status: any;
  pageSize: number;
  currentPage: number;
}

interface FormProps {
  formInline: ContractTemplateFormProps;
}

export type { ContractTemplateQueryFormProps, FormProps };
