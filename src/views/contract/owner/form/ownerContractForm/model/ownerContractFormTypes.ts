import type {
  OwnerBearTypeEnum,
  OwnerCompanyDto,
  OwnerContractDto,
  OwnerCooperationModeEnum,
  OwnerContractSubjectTypeEnum,
  OwnerCreateDto,
  OwnerFreeCalcModeEnum,
  OwnerFreeTypeEnum,
  OwnerIncomeBasisEnum,
  OwnerLeaseRuleDto,
  OwnerPersonalDto,
  OwnerRentFreeRuleDto,
  OwnerSettlementModeEnum,
  OwnerSettlementRuleDto,
  OwnerFeeModeEnum
} from "@/types/generated";

// ─── Primitive alias types ────────────────────────────────────────────────────

export type IdTypeValue = NonNullable<OwnerPersonalDto["idType"]>;
export type GenderValue = NonNullable<OwnerPersonalDto["gender"]>;
export type StatusValue = NonNullable<OwnerPersonalDto["status"]>;
export type OwnerTypeCode = NonNullable<OwnerCreateDto["ownerType"]>;
export type OwnerSignStatusCode = NonNullable<OwnerContractDto["signStatus"]>;
export type OwnerContractStatusValue = NonNullable<OwnerContractDto["status"]>;
export type ApprovalStatusValue = NonNullable<OwnerContractDto["approvalStatus"]>;
export type LeaseRentDueTypeCode = NonNullable<OwnerLeaseRuleDto["rentDueType"]>;
export type OwnerSignTypeValue = "NEW" | "RENEW";
export type OwnerContractMediumValue = "ELECTRONIC" | "PAPER";
export type OwnerPaymentFeeBearTypeValue = "PLATFORM_ALL" | "OWNER_ALL" | "BY_INCOME_SHARE";
export type OwnerSettlementTimingValue = "TENANT_PAYMENT_REALTIME" | "LEASE_START_GENERATE_BILL";
export type SubjectLeaseModeValue = 1 | 2;

// ─── House picker ─────────────────────────────────────────────────────────────

export type PickedRoom = {
  roomId?: string | number;
  houseId?: string | number;
  houseName?: string;
  area?: number | string;
  building?: string;
  unit?: string;
  doorNumber?: string;
  communityName?: string;
  communityAddress?: string;
  address?: string;
  certificateNo?: string;
};

// ─── Template params ──────────────────────────────────────────────────────────

export type ContractTemplateParamItem = {
  key: string;
  label: string;
};

// ─── Owner suggestions ────────────────────────────────────────────────────────

export type OwnerSuggestionItem = {
  value: string;
  contractId?: string;
  ownerId?: string;
  ownerPhone?: string;
};

// ─── Settlement item ──────────────────────────────────────────────────────────

export type OwnerSettlementItemForm = {
  id?: string | number;
  feeDirection?: "IN" | "OUT";
  feeType?: string;
  dictDataId?: string;
  feeName?: string;
  transferEnabled?: boolean;
  transferRatio?: number;
  sortOrder?: number;
  feeTypeCascade?: any[];
  remark?: string;
};

// ─── Owner personal form ──────────────────────────────────────────────────────

export type OwnerPersonalForm = Omit<OwnerPersonalDto, "gender" | "idType" | "payeeIdType" | "status"> & {
  gender?: GenderValue;
  idType?: IdTypeValue;
  payeeName?: string;
  payeePhone?: string;
  payeeIdType?: IdTypeValue;
  payeeIdNo?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  idCardFrontList?: string[];
  idCardBackList?: string[];
  idCardInHandList?: string[];
  otherImageList?: string[];
  status?: StatusValue;
};

// ─── Owner company form ───────────────────────────────────────────────────────

export type OwnerCompanyForm = Omit<OwnerCompanyDto, "legalPersonIdType" | "payeeIdType" | "status"> & {
  legalPersonIdType?: IdTypeValue;
  payeeName?: string;
  payeePhone?: string;
  payeeIdType?: IdTypeValue;
  payeeIdNo?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  businessLicenseUrls?: string[];
  status?: StatusValue;
};

// ─── Owner contract form ──────────────────────────────────────────────────────

export type OwnerContractFormDto = Omit<OwnerContractDto, "signStatus" | "status" | "approvalStatus"> & {
  signType?: OwnerSignTypeValue;
  contractMedium?: OwnerContractMediumValue;
  notifyOwner?: boolean;
  signStatus?: OwnerSignStatusCode;
  status?: OwnerContractStatusValue;
  approvalStatus?: ApprovalStatusValue;
};

// ─── Settlement rule form ─────────────────────────────────────────────────────

export type OwnerSettlementRuleForm = Omit<OwnerSettlementRuleDto, "settlementItemList" | "status"> & {
  hasGuaranteedRent?: boolean;
  managementFeeEnabled?: boolean;
  managementFeeMode?: OwnerFeeModeEnum;
  managementFeeValue?: number;
  paymentFeeBearType?: OwnerPaymentFeeBearTypeValue;
  settlementTiming?: OwnerSettlementTimingValue;
  rentFreeEnabled?: boolean;
  settlementItemList?: OwnerSettlementItemForm[];
  status?: StatusValue;
};

// ─── Rent free rule form ──────────────────────────────────────────────────────

export type OwnerRentFreeRuleForm = Omit<OwnerRentFreeRuleDto, "status"> & {
  enabled?: boolean;
  status?: StatusValue;
};

// ─── Lease rule form ──────────────────────────────────────────────────────────

export type OwnerLeaseRuleForm = Omit<OwnerLeaseRuleDto, "otherFeeList" | "rentDueType" | "status"> & {
  handoverDate?: string;
  usageType?: string;
  rentDueType?: LeaseRentDueTypeCode;
  otherFeeList?: OwnerLeaseFeeForm[];
  status?: StatusValue;
};

export type OwnerLeaseFreeRuleForm = {
  freeType?: OwnerFreeTypeEnum;
  startDate?: string;
  endDate?: string;
  calcMode?: OwnerFreeCalcModeEnum;
  freeAmount?: number;
  freeRatio?: number;
  status?: StatusValue;
  remark?: string;
};

// ─── Lease fee form ───────────────────────────────────────────────────────────

export type OwnerLeaseFeeForm = {
  dictDataId?: string;
  feeType?: string;
  feeName?: string;
  feeDirection?: "IN" | "OUT";
  paymentMethod?: number;
  priceMethod?: number;
  priceInput?: number;
  sortOrder?: number;
  remark?: string;
};

// ─── Contract subject form item ───────────────────────────────────────────────

export type OwnerContractSubjectFormDto = {
  id?: string | number;
  subjectType?: OwnerContractSubjectTypeEnum;
  subjectId?: string | number;
  subjectName?: string;
  remark?: string;
  settlementRule?: OwnerSettlementRuleForm;
  rentFreeRule?: OwnerRentFreeRuleForm;
};

export type ContractSubjectFormItem = OwnerContractSubjectFormDto & {
  subjectType: OwnerContractSubjectTypeEnum;
  subjectId: string;
  subjectName: string;
  settlementRule: OwnerSettlementRuleForm;
  rentFreeRule: OwnerRentFreeRuleForm;
};

// ─── Root form ────────────────────────────────────────────────────────────────

export type OwnerContractForm = {
  ownerType: OwnerTypeCode;
  ownerPersonal: OwnerPersonalForm;
  ownerCompany: OwnerCompanyForm;
  ownerContract: OwnerContractFormDto;
  contractSubjectList: ContractSubjectFormItem[];
  ownerLeaseRule: OwnerLeaseRuleForm;
  ownerLeaseFreeRuleList: OwnerLeaseFreeRuleForm[];
};

// ─── Label maps ───────────────────────────────────────────────────────────────

export const SIGN_TYPE_LABEL_MAP: Record<OwnerSignTypeValue, string> = {
  NEW: "新签",
  RENEW: "续签"
};

export const CONTRACT_MEDIUM_LABEL_MAP: Record<OwnerContractMediumValue, string> = {
  ELECTRONIC: "电子合同",
  PAPER: "纸质合同"
};

export const SIGN_STATUS_LABEL_MAP: Record<OwnerSignStatusCode, string> = {
  0: "待签字",
  1: "已签字"
};

export const INCOME_BASIS_LABEL_MAP: Record<OwnerIncomeBasisEnum, string> = {
  RECEIVED: "按租客实际支付金额",
  RECEIVABLE: "按账单应收金额"
};

export const BEAR_TYPE_LABEL_MAP: Record<OwnerBearTypeEnum, string> = {
  PLATFORM: "公司承担",
  OWNER: "业主承担",
  SHARED: "双方共同承担"
};

export const FREE_TYPE_LABEL_MAP: Record<OwnerFreeTypeEnum, string> = {
  BUILT_IN: "算在合同期内",
  OUTSIDE: "不算在合同期内"
};

export const FREE_CALC_MODE_LABEL_MAP: Record<OwnerFreeCalcModeEnum, string> = {
  BY_DAYS: "按天分摊",
  FIXED: "固定金额",
  RATIO: "按比例"
};

export const BEAR_TYPE_DESCRIPTION_MAP: Record<OwnerBearTypeEnum, string> = {
  PLATFORM: "免租造成的损失由公司承担，不冲减业主收益。",
  OWNER: "免租造成的损失由业主承担，会影响业主应收。",
  SHARED: "公司和业主共同承担免租损失，后续按约定比例分摊。"
};

export const FREE_CALC_MODE_DESCRIPTION_MAP: Record<OwnerFreeCalcModeEnum, string> = {
  BY_DAYS: "按免租天数折算，适合按天核算的场景。",
  FIXED: "直接按固定金额减免，适合合同中明确写死金额。",
  RATIO: "按比例减免，适合按租金比例分摊。"
};

export const PRORATE_TYPE_LABEL_MAP: Record<string, string> = {
  BY_DAYS: "按天折算",
  FULL_PERIOD: "整期计费"
};

export const SETTLEMENT_MODE_LABEL_MAP: Record<OwnerSettlementModeEnum, string> = {
  FIXED: "固定结算",
  SHARE_GROSS: "按毛收入分成",
  SHARE_NET: "按净收入分成",
  GUARANTEE_PLUS_SHARE: "保底 + 分成",
  AGENCY: "代收代付"
};

export const PAYMENT_FEE_BEAR_TYPE_LABEL_MAP: Record<OwnerPaymentFeeBearTypeValue, string> = {
  PLATFORM_ALL: "公司承担 100%",
  OWNER_ALL: "业主承担 100%",
  BY_INCOME_SHARE: "各自承担自己所得"
};

export const SETTLEMENT_TIMING_LABEL_MAP: Record<OwnerSettlementTimingValue, string> = {
  TENANT_PAYMENT_REALTIME: "租客支付实时分账",
  LEASE_START_GENERATE_BILL: "起租日直接给业主生成账单"
};

export const COOPERATION_MODE_LABEL_MAP: Record<string, string> = {
  LIGHT_MANAGED: "轻托管模式",
  MASTER_LEASE: "包租模式"
};

export const OWNER_TYPE_LABEL_MAP: Record<OwnerTypeCode, string> = {
  0: "个人业主",
  1: "企业业主"
};
