// src/types/models/tenant.ts

import type { BookingListProps, ContractTemplateFormProps, OtherFeeProps, RoomListProps, LeaseContractProps } from "@/types";

/** 租客信息 */
export interface TenantPersonalProps {
  id?: number;
  companyId?: number;
  name: string;
  gender?: number;
  idType: number;
  idNo: string;
  phone: string;
  tags?: string[];
  remark?: string;
  idCardFrontList?: string[];
  idCardBackList?: string[];
  idCardInHandList?: string[];
  otherImageList?: string[];
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
  businessLicenseUrls?: string[]; // 营业执照附件
  tags?: any; // 租客标签 (JSON 格式)
  remark?: string; // 租客备注
  status?: number; // 租客状态：0=停用，1=启用
}

export interface LeaseProps {
  id?: string;
  tenantId?: string; // 续签时传入
  parentLeaseId?: string; // 续签时传入上一份租约ID
  contractTemplateId: string;
  contractNature: number;
  companyId?: string;
  deptId?: string;
  roomIds: string[];
  roomList?: RoomListProps[];
  rentPrice: number;
  depositMonths: number;
  paymentMonths: number;
  firstBillDay: number;
  leaseDate?: Date[];
  leaseStart: Date;
  leaseEnd: Date;
  checkDate?: Date[];
  checkInTime?: Date;
  checkOutTime?: Date;
  originalLeaseStart?: Date;
  originalLeaseEnd?: Date;
  leaseDurationDays?: number;
  rentDueType: number;
  rentDueDay?: number;
  rentDueOffsetDays?: number;
  salesmanId: string;
  helperId?: string;
  signStatus?: number;
  checkOutStatus?: number;
  status?: number;
  approvalStatus?: number;
  tenantSource?: number;
  dealChannel?: number;
  remark?: string;
}

export interface TenantProps {
  id?: string; // 租客 ID
  companyId?: string; // 公司ID
  tenantType: number; // 租客类型：1=个人，2=企业
  tenantTypeId?: string;
  tenantName: string;
  tenantPhone: string;
  status?: number;
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
  booking?: BookingListProps;
  tenantPersonal: TenantPersonalProps;
  tenantCompany: TenantCompanyProps;
  tenantMateList: TenantMateProps[];
  lease: LeaseProps;
  otherFees: OtherFeeProps[];
  isEdit?: boolean; // 是否为编辑模式
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

export interface TenantRowProps {
  leaseId?: string; // 租约 ID
  tenantId?: string; // 租客 ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: string; // 公司ID
  deptId?: string; // 部门ID
  deptName?: string; // 部门名称
  roomIds: string[]; // 房间ID列表
  contractTemplateId: string; // 合同模板ID
  tenantType: number; // 租客类型：1=个人，2=企业
  tenantName: string;
  tenantPhone: string;
  tenantPersonal?: TenantPersonalProps;
  tenantCompany?: TenantCompanyProps;
  tenantMateList?: TenantMateProps[];
  roomList: RoomListProps[];
  otherFees: OtherFeeProps[];
  contractTemplate: ContractTemplateFormProps;
  rentPrice: number; // 租金价格
  depositMonths: number; // 押金月数
  paymentMonths: number; // 支付周期（月）
  firstBillDay: number; // 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
  leaseDate: Date[]; // 合同周期：[开始时间, 结束时间]
  leaseStart: Date; // 租赁开始时间
  leaseEnd: Date; // 租赁结束时间
  checkDate: Date[]; // 入住时间：[开始时间, 结束时间]
  checkInTime?: Date; // 实际入住时间
  checkOutTime?: Date; // 实际搬离时间
  originalLeaseStart?: Date; // 初始录入租赁开始时间
  originalLeaseEnd?: Date; // 初始录入租赁结束时间
  leaseDurationDays?: number; // 累计租房天数
  rentDueType: number; // 收租类型：1=提前，2=固定，3=延后
  rentDueDay?: number; // 固定收租日（1-31，0=当月最后一天）
  rentDueOffsetDays?: number; // 收租偏移天数（提前/延后）
  salesmanId: string; // 业务人员ID
  salesmanName?: string; // 业务人员名称
  helperId?: string; // 协助人员ID
  signStatus?: number; // 签约状态：0=待签字、1=已签字
  checkOutStatus?: number; // 租户退租状态：0=未退租、1=正常退、2=换房退、3=违约退、4=作废
  status?: number; // 合同状态：0=未生效，1=生效中，2=已退租，3=已逾期，4=已作废
  tenantSource?: number;
  dealChannel?: number;
  remark?: string; // 合同备注
  createTime?: Date; // 创建时间
}

export interface TenantDetailProps {
  leaseId?: string; // 租约 ID
  tenantId?: string; // 租客 ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: string; // 公司ID
  deptId?: string; // 部门ID
  deptName?: string; // 部门名称
  roomIds: string[]; // 房间ID列表
  contractTemplateId: string; // 合同模板ID
  tenantType: number; // 租客类型：1=个人，2=企业
  tenantName: string;
  tenantPhone: string;
  tenantPersonal?: TenantPersonalProps;
  tenantCompany?: TenantCompanyProps;
  tenantMateList?: TenantMateProps[];
  roomList: RoomListProps[];
  otherFees: OtherFeeProps[];
  leaseContract: LeaseContractProps;
  leaseBillList?: LeaseBillListProps[];
  leaseInvalidBillList?: LeaseBillListProps[];
  rentPrice: number; // 租金价格
  depositMonths: number; // 押金月数
  paymentMonths: number; // 支付周期（月）
  firstBillDay: number; // 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
  leaseDate: Date[]; // 合同周期：[开始时间, 结束时间]
  leaseStart: Date; // 租赁开始时间
  leaseEnd: Date; // 租赁结束时间
  checkDate: Date[]; // 入住时间：[开始时间, 结束时间]
  checkInTime?: Date; // 实际入住时间
  checkOutTime?: Date; // 实际搬离时间
  originalLeaseStart?: Date; // 初始录入租赁开始时间
  originalLeaseEnd?: Date; // 初始录入租赁结束时间
  leaseDurationDays?: number; // 累计租房天数
  rentDueType: number; // 收租类型：1=提前，2=固定，3=延后
  rentDueDay?: number; // 固定收租日（1-31，0=当月最后一天）
  rentDueOffsetDays?: number; // 收租偏移天数（提前/延后）
  salesmanId: string; // 业务人员ID
  salesmanName?: string; // 业务人员名称
  helperId?: string; // 协助人员ID
  signStatus?: number; // 签约状态：0=待签字、1=已签字
  checkOutStatus?: number; // 租户退租状态：0=未退租、1=正常退、2=换房退、3=违约退、4=作废
  status?: number; // 合同状态：0=未生效，1=生效中，2=已退租，3=已逾期，4=已作废
  tenantSource?: number;
  tenantSourceName?: string;
  dealChannel?: number;
  dealChannelName?: string;
  remark?: string; // 合同备注
  createTime?: Date; // 创建时间
}

export interface LeaseBillListProps {
  id?: string; // 账单ID
  companyId?: string; // 公司ID
  tenantId?: string; // 租客ID
  leaseId?: string; // 租约ID
  sortOrder?: number; // 排序顺序
  billType?: number; // 账单类型：1=租金，2=押金，3=其他费用，4=退租结算，5=押金结转入，6=押金结转出
  carryOverFromBillId?: string;
  carryOverToBillId?: string;
  rentPeriodStart: Date;
  rentPeriodEnd: Date;
  rentalAmount?: number; // 租金金额
  depositAmount?: number; // 押金金额
  otherFeeAmount?: number; // 其他费用金额
  totalAmount?: number; // 总金额
  dueDate?: Date; // 到期日
  payTime?: Date; // 支付时间
  payAmount?: number; // 支付金额
  payStatus?: number; // 支付状态：0=未支付，1=已支付
  payChannel?: number; // 支付渠道：1=支付宝，2=微信
  remark?: string; // 备注
  otherFees: OtherFeeProps[]; // 其他费用列表
}
