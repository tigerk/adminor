// src/types/models/tenant.ts

import type { BookingListProps, ContractTemplateFormProps, OtherFeeProps, RoomListProps, TenantContractProps } from "@/types";

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

export interface TenantProps {
  id?: bigint; // 租客 ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: bigint; // 公司ID
  deptId?: string; // 部门ID
  roomIds: bigint[]; // 房间ID列表
  roomList?: RoomListProps[]; // 房间列表
  contractTemplateId: bigint; // 合同模板ID
  tenantId?: bigint; // 租客ID
  tenantType: number; // 租客类型：1=个人，2=企业
  tenantName: string;
  tenantPhone: string;
  rentPrice: number; // 租金价格
  depositMonths: number; // 押金月数
  paymentMonths: number; // 支付周期（月）
  firstBillDay: number; // 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
  leaseDate?: Date[]; // 合同周期：[开始时间, 结束时间]
  leaseStart: Date; // 租赁开始时间
  leaseEnd: Date; // 租赁结束时间
  checkDate?: Date[]; // 入住时间：[开始时间, 结束时间]
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
  booking?: BookingListProps;
  tenantPersonal: TenantPersonalProps;
  tenantCompany: TenantCompanyProps;
  tenantMateList: TenantMateProps[];
  tenant: TenantProps;
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
  id?: bigint; // 租客 ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: bigint; // 公司ID
  deptId?: string; // 部门ID
  deptName?: string; // 部门名称
  roomIds: string[]; // 房间ID列表
  contractTemplateId: bigint; // 合同模板ID
  tenantId?: bigint; // 租客ID
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
  salesmanId: bigint; // 业务人员ID
  salesmanName?: string; // 业务人员名称
  helperId?: bigint; // 协助人员ID
  signStatus?: number; // 签约状态：0=待签字、1=已签字
  checkOutStatus?: number; // 租户退租状态：0=未退租、1=正常退、2=换房退、3=违约退、4=作废
  status?: number; // 合同状态：0=未生效，1=生效中，2=已退租，3=已逾期，4=已作废
  tenantSource?: number;
  dealChannel?: number;
  remark?: string; // 合同备注
  createTime?: Date; // 创建时间
}

export interface TenantDetailProps {
  id?: bigint; // 租客 ID
  contractCode?: string; // 合同编号
  contractNature: number; // 合同性质：1=新签，2=续签，3=转租，4=换房
  companyId?: bigint; // 公司ID
  deptId?: string; // 部门ID
  deptName?: string; // 部门名称
  roomIds: bigint[]; // 房间ID列表
  contractTemplateId: bigint; // 合同模板ID
  tenantId?: bigint; // 租客ID
  tenantType: number; // 租客类型：1=个人，2=企业
  tenantName: string;
  tenantPhone: string;
  tenantPersonal?: TenantPersonalProps;
  tenantCompany?: TenantCompanyProps;
  tenantMateList?: TenantMateProps[];
  roomList: RoomListProps[];
  otherFees: OtherFeeProps[];
  tenantContract: TenantContractProps;
  tenantBillList?: TenantBillListProps[];
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
  salesmanId: bigint; // 业务人员ID
  salesmanName?: string; // 业务人员名称
  helperId?: bigint; // 协助人员ID
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

export interface TenantBillListProps {
  /**
   * {
   *                 "id": "2005552566663000065",
   *                 "companyId": "1995379998362611714",
   *                 "tenantId": "22",
   *                 "sortOrder": 1,
   *                 "billType": 1,
   *                 "rentPeriodStart": "2025-12-17 00:00:00",
   *                 "rentPeriodEnd": "2026-01-16 00:00:00",
   *                 "rentalAmount": 43453.00,
   *                 "depositAmount": 0.00,
   *                 "otherFeeAmount": 0.00,
   *                 "totalAmount": 43453.00,
   *                 "dueDate": "2025-12-02 00:00:00",
   *                 "payTime": null,
   *                 "payAmount": null,
   *                 "payStatus": 0,
   *                 "payChannel": null,
   *                 "remark": "第1期，共 1 月",
   *                 "otherFees": [],
   *                 "createBy": "1",
   *                 "createTime": "2025-12-29 16:12:48"
   *             },
   */
  id?: string; // 账单ID
  companyId?: string; // 公司ID
  tenantId?: string; // 租客ID
  sortOrder?: number; // 排序顺序
  billType?: number; // 账单类型：1=租金，2=押金，3=其他费用
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
