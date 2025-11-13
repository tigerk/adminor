import type { ContractTemplateProps } from "@/types";

interface ContractTemplateQueryFormProps {
  templateName: string;
  contractType: number;
  status: number;
  pageSize: number;
  currentPage: number;
}

interface FormProps {
  formInline: ContractTemplateProps;
}

export type { ContractTemplateQueryFormProps, FormProps };
