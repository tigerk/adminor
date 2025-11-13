// ==================== 3. src/types/models/contract.ts ====================
// 合同相关业务模型

/** 合同模板 */
export interface ContractTemplateProps {
  id?: string;
  companyId?: string;
  contractType?: number;
  templateName?: string;
  templateContent?: string;
  status?: number;
  deptIds?: string[];
  remark?: string;
}
