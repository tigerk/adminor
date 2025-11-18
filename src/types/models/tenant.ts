// src/types/models/tenant.ts

import type { ContractTemplateFormProps, OtherFeeProps } from "@/types";

/** 租客信息 */
export interface TenantProps {
  id?: number;
  companyId?: number;
  name: string;
  gender?: number;
  idType: number;
  idNo: string;
  phone: string;
  tags?: string[];
  remark?: string;
  idCardFrontList: string[];
  idCardBackList: string[];
  idCardInHandList: string[];
  otherImageList: string[];
}

export interface TenantCompanyProps {
  id?: number; // 企业租客ID
  companyName: string; // 企业名称
  uscc: string; // 统一社会信用代码
  legalPerson: string; // 法定代表人
  legalPersonIdType?: number; // 法人证件类型
  legalPersonIdNo?: string; // 法人证件号码
  contactName: string; // 联系人姓名
  contactPhone: string; // 联系电话
  registeredAddress?: string; // 注册地址
  businessLicenseUrl?: string; // 营业执照附件
  tags?: any; // 租客标签 (JSON 格式)
  remark?: string; // 租客备注
  status?: number; // 租客状态：0=停用，1=启用
}

export interface TenantContractProps {
  id?: bigint; // 合同ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: bigint; // 公司ID
  deptId?: string; // 部门ID
  tenantId?: bigint; // 租客ID
  tenantType: number; // 租客类型：1=个人，2=企业
  rentalPrice: number; // 租金价格
  depositMonths: number; // 押金月数
  paymentMonths: number; // 支付周期（月）
  firstBillDay: number; // 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
  leaseStart: Date; // 租赁开始时间
  leaseEnd: Date; // 租赁结束时间
  checkInTime?: Date; // 实际入住时间
  checkOutTime?: Date; // 实际搬离时间
  originalLeaseStart?: Date; // 初始录入租赁开始时间
  originalLeaseEnd?: Date; // 初始录入租赁结束时间
  leaseDurationDays?: number; // 累计租房天数
  rentDueType: number; // 收租类型：1=提前，2=固定，3=延后
  rentDueDay?: number; // 固定收租日（1-31，0=当月最后一天）
  rentDueOffsetDays?: number; // 收租偏移天数（提前/延后）
  salesmanId: bigint; // 业务人员ID
  helperId?: bigint; // 协助人员ID
  signStatus?: number; // 签约状态：0=待签字、1=已签字
  checkOutStatus?: number; // 租户退租状态：0=未退租、1=正常退、2=换房退、3=违约退、4=作废
  status?: number; // 合同状态：0=未生效，1=生效中，2=已退租，3=已逾期，4=已作废
  tenantSource?: number;
  dealChannel?: number;
  remark?: string; // 合同备注
}

/** 租客查询表单 */
export interface TenantQueryFormProps {
  name?: string;
  phone?: string;
  idNo?: string;
  tenantType?: number;
  status?: number;
  pageSize: number;
  currentPage: number;
}

/** 租客创建表单 */
export interface TenantsCreateFormProps {
  tenant: TenantProps;
  tenantCompany: TenantCompanyProps;
  tenantMateList: TenantMateProps[];
  contract: TenantContractProps;
  otherFees: OtherFeeProps[];
}

/** 租客同住人信息 */
export interface TenantMateProps {
  id?: number;
  tenantId?: number;
  name: string;
  gender?: number;
  idType: number;
  idNo: string;
  phone: string;
  tags?: string[];
  remark?: string;
  status?: number;
  idCardFrontList: string[];
  idCardBackList: string[];
  idCardInHandList: string[];
  otherImageList: string[];
}
