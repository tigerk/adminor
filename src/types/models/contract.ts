// ==================== 3. src/types/models/contract.ts ====================
// 合同相关业务模型

/** 合同模板 */
export interface ContractTemplateFormProps {
  id?: string;
  companyId?: string;
  contractType?: number;
  templateName?: string;
  templateContent?: string;
  status?: number;
  deptIds?: string[];
  remark?: string;
}

/** 租客合同 */
export interface TenantContractProps {
  id?: string;
  tenantId?: string;
  contractTemplateId?: bigint;
  contractTemplateName?: string;
  contractContent?: string;
  signStatus?: number;
  remark?: string;
}
