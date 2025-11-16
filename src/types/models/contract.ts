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

export interface TenantProps {
  id?: string;
  companyId?: string;
  name?: string;
  gender?: string;
  idType?: number;
  idNo?: string;
  phone?: string;
  tenantType?: number;
  tenantSource?: number;
  dealChannel?: number;
  tags?: string[];
  remark?: string;
}

export interface TenantsContractProps {
  id?: string;
  companyId?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tenantAddress?: string;
  tenantRemark?: string;
}

export interface TenantsCreateFormProps {
  tenant: TenantProps;
  contract: ContractTemplateProps;
}
