import { computed, reactive, ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import { getContractTemplateParams, getMyAvailableContractTemplates } from "@/api/contract/template";
import { getOwnerContractDetail, getOwnerContractList } from "@/api/contract/owner";
import { getDictDataByDictCode, getDictDataByParentCode } from "@/api/sys/dict";
import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
import { OwnerContractSubjectTypeEnumMeta } from "@/types/generated/enum.meta";
import type { ContractTemplateListVo, OwnerContractSubjectTypeEnum, OwnerCreateDto, OwnerDetailVo, OwnerListVo, OwnerUpdateDto } from "@/types/generated";
import { createOwnerContractRules } from "../model/ownerContractFormRules";
import type {
  ContractSubjectFormItem,
  ContractTemplateParamItem,
  OwnerContractForm,
  OwnerLeaseFeeForm,
  OwnerLeaseFreeRuleForm,
  OwnerRentFreeRuleForm,
  OwnerSettlementItemForm,
  OwnerSettlementRuleForm,
  OwnerSuggestionItem,
  PickedRoom
} from "../model/ownerContractFormTypes";

export type SubjectSelectionRow = {
  subjectType: OwnerContractSubjectTypeEnum;
  subjectId: string;
  subjectName: string;
  address?: string;
  focusId?: string;
  focusName?: string;
  floorTotal?: number;
  houseCountPerFloor?: number;
};

export const createSettlementItem = (): OwnerSettlementItemForm => ({
  feeDirection: "IN",
  feeType: "",
  dictDataId: undefined,
  feeName: "",
  transferEnabled: true,
  transferRatio: 100,
  sortOrder: 0,
  remark: ""
});

export const createLeaseFee = (): OwnerLeaseFeeForm => ({
  dictDataId: undefined,
  feeType: "",
  feeName: "",
  feeDirection: "IN",
  paymentMethod: PAYMENT_METHOD_OPTIONS[0]?.value,
  priceMethod: PRICE_METHOD_OPTIONS[0]?.value,
  priceInput: undefined,
  remark: ""
});

export const createDefaultSettlementRule = (): OwnerSettlementRuleForm => ({
  incomeBasis: "RECEIVED",
  settlementMode: "FIXED",
  guaranteedRentAmount: 0,
  hasGuaranteedRent: false,
  commissionMode: "RATIO",
  commissionValue: 0,
  serviceFeeMode: "FIXED",
  serviceFeeValue: 0,
  managementFeeEnabled: false,
  managementFeeMode: "RATIO",
  managementFeeValue: 0,
  bearTaxType: "PLATFORM",
  paymentFeeBearType: "PLATFORM_ALL",
  settlementTiming: "TENANT_PAYMENT_REALTIME",
  rentFreeEnabled: false,
  settlementItemList: [],
  status: 1
});

export const createDefaultRentFreeRule = (): OwnerRentFreeRuleForm => ({
  enabled: false,
  freeType: "BUILT_IN",
  bearType: "PLATFORM",
  ownerRatio: 0,
  platformRatio: 1,
  calcMode: "BY_DAYS",
  status: 1
});

export const createDefaultLeaseFreeRule = (): OwnerLeaseFreeRuleForm => ({
  freeType: "BUILT_IN",
  calcMode: "BY_DAYS",
  freeAmount: 0,
  freeRatio: 0,
  status: 1
});

function buildMasterLeasePayWay(depositMonths?: number, paymentMonths?: number) {
  const deposit = Math.max(0, Number(depositMonths || 0));
  const payment = Math.max(0, Number(paymentMonths || 0));
  if (!deposit && !payment) return "";
  return `押${deposit}付${payment}`;
}

export function cloneSettlementRule(rule?: OwnerSettlementRuleForm): OwnerSettlementRuleForm {
  return {
    ...createDefaultSettlementRule(),
    ...(rule || {}),
    settlementItemList: ((rule?.settlementItemList || []) as OwnerSettlementItemForm[]).map(item => ({
      ...createSettlementItem(),
      ...item,
      dictDataId: item.dictDataId
    }))
  };
}

export function cloneRentFreeRule(rule?: OwnerRentFreeRuleForm): OwnerRentFreeRuleForm {
  return { ...createDefaultRentFreeRule(), ...(rule || {}) };
}

export const createSubjectRule = (subjectType: OwnerContractSubjectTypeEnum, subjectId: string, subjectName: string, base?: ContractSubjectFormItem): ContractSubjectFormItem => ({
  subjectType,
  subjectId,
  subjectName,
  remark: "",
  settlementRule: cloneSettlementRule(base?.settlementRule),
  rentFreeRule: cloneRentFreeRule(base?.rentFreeRule)
});

export const createDefaultForm = (): OwnerContractForm => ({
  ownerType: 0,
  ownerPersonal: {
    name: "",
    phone: "",
    idType: 0,
    idNo: "",
    gender: 1,
    idCardFrontList: [],
    idCardBackList: [],
    idCardInHandList: [],
    otherImageList: [],
    tags: [],
    payeeName: "",
    payeePhone: "",
    payeeIdType: 0,
    payeeIdNo: "",
    bankAccountName: "",
    bankAccountNo: "",
    bankName: "",
    status: 1
  },
  ownerCompany: {
    name: "",
    contactPhone: "",
    uscc: "",
    contactName: "",
    legalPerson: "",
    legalPersonIdType: 0,
    legalPersonIdNo: "",
    registeredAddress: "",
    tags: [],
    businessLicenseUrls: [],
    payeeName: "",
    payeePhone: "",
    payeeIdType: 0,
    payeeIdNo: "",
    bankAccountName: "",
    bankAccountNo: "",
    bankName: "",
    status: 1
  },
  ownerContract: {
    cooperationMode: "LIGHT_MANAGED",
    contractTemplateId: undefined,
    contractMedium: "PAPER",
    signType: "NEW",
    notifyOwner: false,
    signStatus: 0,
    status: 1,
    approvalStatus: 2,
    contractStart: "",
    contractEnd: "",
    remark: ""
  },
  contractSubjectList: [],
  ownerLeaseRule: {
    rentAmount: 0,
    depositAmount: 0,
    depositMonths: 1,
    paymentMonths: 1,
    payWay: "",
    rentDueType: 2,
    rentDueDay: 4,
    rentDueOffsetDays: 0,
    firstPayDate: "",
    handoverDate: "",
    usageType: "",
    billingStart: "",
    billingEnd: "",
    prorateType: "BY_DAYS",
    otherFeeList: [],
    status: 1
  },
  ownerLeaseFreeRuleList: []
});

export function useOwnerContractForm() {
  const formRef = ref<FormInstance>();
  const form = reactive<OwnerContractForm>(createDefaultForm());
  const contractDateRange = ref<string[]>([]);
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const templateParams = ref<ContractTemplateParamItem[]>([]);
  const templateParamsLoading = ref(false);
  const otherFeeTypeOptions = ref<any[]>([]);
  const leaseFeeCascaderValues = ref<Record<number, any[]>>({});
  const settlementFeeCascaderValues = ref<Record<string, any[]>>({});
  const ownerTagOptions = ref<{ label: string; value: string }[]>([]);
  const rules = createOwnerContractRules(() => form);

  const sharedContractSubject = computed(() => form.contractSubjectList[0]);
  const configuredSubjectCount = computed(() => form.contractSubjectList.filter(item => isConfigured(item)).length);
  const currentPayeeForm = computed(() => (form.ownerType === 0 ? form.ownerPersonal : form.ownerCompany));

  function isConfigured(item: ContractSubjectFormItem) {
    if (form.ownerContract.cooperationMode === "MASTER_LEASE") return true;
    const source = sharedContractSubject.value || item;
    return Boolean(
      Number(source.settlementRule?.guaranteedRentAmount || 0) > 0 ||
      Number(source.settlementRule?.commissionValue || 0) > 0 ||
      source.settlementRule?.settlementItemList?.length ||
      source.rentFreeRule?.enabled ||
      source.settlementRule?.hasGuaranteedRent ||
      source.settlementRule?.managementFeeEnabled
    );
  }

  async function loadTemplates() {
    const resp = await getMyAvailableContractTemplates({ contractType: 2 });
    contractTemplates.value = (resp.data || []) as ContractTemplateListVo[];
  }

  async function loadTemplateParams() {
    templateParamsLoading.value = true;
    try {
      const resp = await getContractTemplateParams({ contractType: 2 });
      templateParams.value = (resp.data || []).map((item: { key?: string; value?: string }) => ({
        key: item.key || "",
        label: item.value || item.key || ""
      }));
    } finally {
      templateParamsLoading.value = false;
    }
  }

  async function loadFeeTypeOptions() {
    const res = await getDictDataByParentCode({ dictCode: "fee_type" });
    otherFeeTypeOptions.value = (res.data || []).map((dict: any) => ({
      label: dict.dictName,
      value: dict.dictCode,
      children: (dict.dictDataList || []).map((item: any) => ({ label: item.name, value: item.id }))
    }));
  }

  async function loadOwnerTagOptions() {
    const res = await getDictDataByDictCode({ dictCode: "owner_tag" });
    ownerTagOptions.value = (res.data || []).map((item: any) => ({
      label: item.name || item.dictName || "",
      value: item.dictCode || item.code || item.value || ""
    }));
  }

  function resetForm() {
    Object.assign(form, createDefaultForm());
    contractDateRange.value = [];
  }

  function normalizeNumberValue(value: unknown) {
    if (value === null || value === undefined || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  function mapDetailToForm(detail?: OwnerDetailVo | null) {
    resetForm();
    if (!detail) return;
    const raw = detail as any;
    form.ownerType = detail.ownerType ?? 0;
    form.ownerPersonal = { ...createDefaultForm().ownerPersonal, ...(raw.ownerPersonal || {}) };
    form.ownerCompany = { ...createDefaultForm().ownerCompany, ...(raw.ownerCompany || {}) };
    form.ownerContract = { ...createDefaultForm().ownerContract, ...(raw.ownerContract || {}) };
    contractDateRange.value = [raw.ownerContract?.contractStart || "", raw.ownerContract?.contractEnd || ""].filter(Boolean);
    form.contractSubjectList = (raw.contractSubjectList || []).map((item: any) => ({
      ...item,
      id: item.id,
      subjectType: item.subjectType || (OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum),
      subjectId: String(item.subjectId || ""),
      subjectName: item.subjectName || "",
      remark: item.remark || "",
      settlementRule: cloneSettlementRule(item.settlementRule),
      rentFreeRule: cloneRentFreeRule(item.rentFreeRule)
    }));
    form.ownerLeaseRule = {
      ...createDefaultForm().ownerLeaseRule,
      ...(raw.ownerLeaseRule || {}),
      otherFeeList: ((raw.ownerLeaseRule?.otherFeeList || []) as OwnerLeaseFeeForm[]).map(item => ({
        ...createLeaseFee(),
        ...item,
        paymentMethod: normalizeNumberValue(item.paymentMethod),
        priceMethod: normalizeNumberValue(item.priceMethod)
      }))
    };
    form.ownerLeaseFreeRuleList = (raw.ownerLeaseFreeRuleList || []).map((item: any) => ({
      ...createDefaultLeaseFreeRule(),
      ...item
    }));
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  }

  function queryOwnerSuggestions(queryString: string, cb: (items: OwnerSuggestionItem[]) => void) {
    const keyword = queryString.trim();
    if (!keyword) {
      cb([]);
      return;
    }
    void getOwnerContractList({ currentPage: 1, pageSize: 10, ownerType: form.ownerType, ownerName: keyword } as any)
      .then(resp => {
        const list = (resp.data?.list || []) as OwnerListVo[];
        const dedupMap = new Map<string, OwnerSuggestionItem>();
        list.forEach(item => {
          const key = String(item.ownerId || item.contractId || "");
          if (!key || dedupMap.has(key)) return;
          dedupMap.set(key, {
            value: item.ownerName || "",
            ownerId: item.ownerId,
            contractId: item.contractId,
            ownerPhone: item.ownerPhone || ""
          });
        });
        cb(Array.from(dedupMap.values()));
      })
      .catch(() => cb([]));
  }

  async function handleOwnerSuggestionSelect(item: OwnerSuggestionItem) {
    if (!item.contractId) return;
    const resp = await getOwnerContractDetail({ contractId: item.contractId });
    const detail = resp.data;
    if (!detail) return;
    if (form.ownerType === 0 && detail.ownerPersonal) {
      form.ownerPersonal = { ...form.ownerPersonal, ...(detail.ownerPersonal as any) };
    }
    if (form.ownerType === 1 && detail.ownerCompany) {
      form.ownerCompany = { ...form.ownerCompany, ...(detail.ownerCompany as any) };
    }
  }

  function fillPayeeFromOwner() {
    if (form.ownerType === 0) {
      form.ownerPersonal.payeeName = form.ownerPersonal.name;
      form.ownerPersonal.payeePhone = form.ownerPersonal.phone;
      form.ownerPersonal.payeeIdType = form.ownerPersonal.idType;
      form.ownerPersonal.payeeIdNo = form.ownerPersonal.idNo;
      form.ownerPersonal.bankAccountName = form.ownerPersonal.name;
      return;
    }
    form.ownerCompany.payeeName = form.ownerCompany.name || form.ownerCompany.legalPerson;
    form.ownerCompany.payeePhone = form.ownerCompany.contactPhone;
    form.ownerCompany.payeeIdType = form.ownerCompany.legalPersonIdType;
    form.ownerCompany.payeeIdNo = form.ownerCompany.legalPersonIdNo;
    form.ownerCompany.bankAccountName = form.ownerCompany.name;
  }

  function fillPayeeFromContact() {
    if (form.ownerType !== 1) return;
    form.ownerCompany.payeeName = form.ownerCompany.contactName || form.ownerCompany.legalPerson;
    form.ownerCompany.payeePhone = form.ownerCompany.contactPhone;
    form.ownerCompany.payeeIdType = form.ownerCompany.legalPersonIdType;
    form.ownerCompany.payeeIdNo = form.ownerCompany.legalPersonIdNo;
    form.ownerCompany.bankAccountName = form.ownerCompany.contactName || form.ownerCompany.name;
  }

  function addLeaseFreeRule() {
    form.ownerLeaseFreeRuleList.push(createDefaultLeaseFreeRule());
  }

  function addLeaseFee() {
    if (!form.ownerLeaseRule.otherFeeList) form.ownerLeaseRule.otherFeeList = [];
    form.ownerLeaseRule.otherFeeList.push(createLeaseFee());
  }

  function handleLeaseFeeTypeChange(value: any, index: number) {
    const target = form.ownerLeaseRule.otherFeeList?.[index];
    if (!target || !Array.isArray(value) || value.length < 2) return;
    const parent = otherFeeTypeOptions.value.find((item: any) => item.value === value[0]);
    const child = parent?.children?.find((item: any) => item.value === value[1]);
    if (!child) return;
    target.dictDataId = String(child.value);
    target.feeType = String(parent?.value || "");
    target.feeName = child.label;
  }

  function syncLeaseFeeCascaderValues() {
    const values: Record<number, any[]> = {};
    (form.ownerLeaseRule.otherFeeList || []).forEach((fee, index) => {
      const targetDictDataId = fee.dictDataId ?? fee.feeType;
      if (!targetDictDataId || !otherFeeTypeOptions.value.length) return;
      for (const parent of otherFeeTypeOptions.value) {
        const child = parent.children?.find((item: any) => String(item.value) === String(targetDictDataId));
        if (child) {
          values[index] = [parent.value, child.value];
          break;
        }
      }
    });
    leaseFeeCascaderValues.value = values;
  }

  function syncSettlementFeeCascaderValues() {
    const values: Record<string, any[]> = {};
    ((sharedContractSubject.value?.settlementRule.settlementItemList || []) as OwnerSettlementItemForm[]).forEach((item, index) => {
      const targetDictDataId = item.dictDataId ?? item.feeType;
      if (!targetDictDataId || !otherFeeTypeOptions.value.length) return;
      for (const parent of otherFeeTypeOptions.value) {
        const child = parent.children?.find((option: any) => String(option.value) === String(targetDictDataId));
        if (child) {
          values[`shared-${index}`] = [parent.value, child.value];
          break;
        }
      }
    });
    settlementFeeCascaderValues.value = values;
  }

  function addSettlementItem(house: ContractSubjectFormItem) {
    if (!house.settlementRule.settlementItemList) house.settlementRule.settlementItemList = [];
    house.settlementRule.settlementItemList.push(createSettlementItem());
  }

  function handleSettlementFeeTypeChange(value: any, house: ContractSubjectFormItem, index: number) {
    const target = house.settlementRule.settlementItemList?.[index];
    if (!target || !Array.isArray(value) || value.length < 2) return;
    const parent = otherFeeTypeOptions.value.find((item: any) => item.value === value[0]);
    const child = parent?.children?.find((item: any) => item.value === value[1]);
    if (!child) return;
    target.dictDataId = String(child.value);
    target.feeType = String(parent?.value || "");
    target.feeName = child.label;
    target.transferEnabled = true;
  }

  function formatDateValue(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function applyYearShortcut(years: number) {
    const start = contractDateRange.value[0] || new Date().toISOString().slice(0, 10);
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return;
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    endDate.setDate(endDate.getDate() - 1);
    contractDateRange.value = [formatDateValue(startDate), formatDateValue(endDate)];
  }

  function applyRentFreeMonthShortcut(rule: OwnerRentFreeRuleForm, months: number) {
    const base = rule.startDate ? new Date(rule.startDate) : new Date();
    if (Number.isNaN(base.getTime())) return;
    if (!rule.startDate) rule.startDate = formatDateValue(base);
    const end = new Date(base);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);
    rule.endDate = formatDateValue(end);
  }

  function normalizeLightManagedRule(rule: OwnerSettlementRuleForm): OwnerSettlementRuleForm {
    const next = { ...rule };
    next.commissionMode = "RATIO";
    next.managementFeeMode = "RATIO";
    next.serviceFeeMode = "FIXED";
    next.serviceFeeValue = 0;
    switch (next.settlementMode) {
      case "FIXED":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVED";
        next.commissionValue = 0;
        break;
      case "GUARANTEE_PLUS_SHARE":
        next.hasGuaranteedRent = true;
        if (!next.incomeBasis) next.incomeBasis = "RECEIVED";
        break;
      case "SHARE_GROSS":
        next.settlementMode = "SHARE_NET";
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "SHARE_NET":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "AGENCY":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      default:
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVED";
        break;
    }
    next.rentFreeEnabled = Boolean(next.rentFreeEnabled);
    return next;
  }

  function buildSubmitPayload(): OwnerCreateDto | OwnerUpdateDto {
    const ownerContract = {
      ...form.ownerContract,
      status: form.ownerContract.signStatus === 1 ? 2 : 1,
      contractStart: contractDateRange.value[0],
      contractEnd: contractDateRange.value[1]
    };
    const sharedSettlementRule = sharedContractSubject.value?.settlementRule ? normalizeLightManagedRule(sharedContractSubject.value.settlementRule) : undefined;
    const sharedRentFreeRule = sharedContractSubject.value?.rentFreeRule ? { ...sharedContractSubject.value.rentFreeRule } : undefined;
    const payload: any = {
      ownerType: form.ownerType,
      ownerContract,
      contractSubjectList: form.contractSubjectList.map(item => ({
        id: item.id,
        subjectType: item.subjectType,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        remark: item.remark,
        settlementRule:
          form.ownerContract.cooperationMode === "LIGHT_MANAGED"
            ? {
                ...(sharedSettlementRule || {}),
                guaranteedRentAmount: sharedSettlementRule?.settlementMode === "FIXED" || sharedSettlementRule?.hasGuaranteedRent ? sharedSettlementRule?.guaranteedRentAmount : 0,
                managementFeeValue: sharedSettlementRule?.managementFeeEnabled ? sharedSettlementRule?.managementFeeValue : 0,
                rentFreeEnabled: Boolean(sharedRentFreeRule?.enabled),
                settlementItemList: ((sharedSettlementRule?.settlementItemList || []) as OwnerSettlementItemForm[]).map(si => ({
                  feeDirection: si.feeDirection,
                  feeType: si.feeType,
                  dictDataId: si.dictDataId,
                  feeName: si.feeName,
                  transferEnabled: si.transferEnabled,
                  transferRatio: si.transferRatio,
                  sortOrder: si.sortOrder,
                  remark: si.remark
                }))
              }
            : undefined,
        rentFreeRule:
          form.ownerContract.cooperationMode === "LIGHT_MANAGED"
            ? {
                ...(sharedRentFreeRule || {}),
                startDate: sharedRentFreeRule?.enabled ? sharedRentFreeRule.startDate : undefined,
                endDate: sharedRentFreeRule?.enabled ? sharedRentFreeRule.endDate : undefined
              }
            : undefined
      }))
    };

    if (form.ownerType === 0) payload.ownerPersonal = { ...form.ownerPersonal };
    else payload.ownerCompany = { ...form.ownerCompany };

    if (form.ownerContract.cooperationMode === "MASTER_LEASE") {
      payload.ownerLeaseRule = {
        ...form.ownerLeaseRule,
        payWay: buildMasterLeasePayWay(form.ownerLeaseRule.depositMonths, form.ownerLeaseRule.paymentMonths),
        otherFeeList: form.ownerLeaseRule.otherFeeList || [],
        billingStart: contractDateRange.value[0],
        billingEnd: contractDateRange.value[1]
      };
      payload.ownerLeaseFreeRuleList = form.ownerLeaseFreeRuleList.map(item => ({
        ...item,
        calcMode: "BY_DAYS",
        freeAmount: 0,
        freeRatio: 0
      }));
    } else {
      payload.ownerLeaseFreeRuleList = [];
    }
    return payload as OwnerCreateDto | OwnerUpdateDto;
  }

  async function validateAndBuildPayload() {
    if (!formRef.value) return null;
    await formRef.value.validate();
    if (contractDateRange.value.length !== 2) throw new Error("请选择合同周期");
    return buildSubmitPayload();
  }

  watch([() => form.ownerLeaseRule.otherFeeList, otherFeeTypeOptions], () => syncLeaseFeeCascaderValues(), { deep: true });
  watch([() => form.contractSubjectList, otherFeeTypeOptions], () => syncSettlementFeeCascaderValues(), { deep: true });

  return {
    formRef,
    form,
    contractDateRange,
    contractTemplates,
    templateParams,
    templateParamsLoading,
    otherFeeTypeOptions,
    leaseFeeCascaderValues,
    settlementFeeCascaderValues,
    ownerTagOptions,
    sharedContractSubject,
    configuredSubjectCount,
    currentPayeeForm,
    rules,
    loadTemplates,
    loadTemplateParams,
    loadFeeTypeOptions,
    loadOwnerTagOptions,
    mapDetailToForm,
    queryOwnerSuggestions,
    handleOwnerSuggestionSelect,
    fillPayeeFromOwner,
    fillPayeeFromContact,
    addLeaseFreeRule,
    addLeaseFee,
    handleLeaseFeeTypeChange,
    syncLeaseFeeCascaderValues,
    syncSettlementFeeCascaderValues,
    addSettlementItem,
    handleSettlementFeeTypeChange,
    applyYearShortcut,
    applyRentFreeMonthShortcut,
    validateAndBuildPayload
  };
}
