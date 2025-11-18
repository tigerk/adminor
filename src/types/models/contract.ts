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

export interface TenantContractProps {
  id: bigint; // 合同ID
  tenantId: bigint; // 租客ID
  companyId: bigint; // 公司ID
  houseId: bigint; // 房源ID
  roomId: bigint; // 房间ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  rentalPrice: number; // 租金价格
  depositMonth: number; // 押金月数
  paymentCycleMonth: number; // 支付周期（月）
  leaseStart: Date; // 租赁开始时间
  leaseEnd: Date; // 租赁结束时间
  checkInTime?: Date; // 实际入住时间
  checkOutTime?: Date; // 实际搬离时间
  originalLeaseStart?: Date; // 初始录入租赁开始时间
  originalLeaseEnd?: Date; // 初始录入租赁结束时间
  leaseDurationDays?: number; // 累计租房天数
  rentDueType?: number; // 收租类型：1=提前，2=固定，3=延后
  rentDueDay?: number; // 固定收租日（1-31，0=当月最后一天）
  rentDueOffsetDays?: number; // 收租偏移天数（提前/延后）
  salesmanId: bigint; // 业务人员ID
  helperId?: bigint; // 协助人员ID
  signStatus?: number; // 签约状态：0=待签字、1=已签字
  checkOutStatus?: number; // 租户退租状态：0=未退租、1=正常退、2=换房退、3=违约退、4=作废
  status?: number; // 合同状态：0=未生效，1=生效中，2=已退租，3=已逾期，4=已作废
  remark?: string; // 合同备注
}
