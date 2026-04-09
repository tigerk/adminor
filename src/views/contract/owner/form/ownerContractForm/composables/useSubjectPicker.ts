import { computed, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { OwnerContractSubjectTypeEnumMeta } from "@/types/generated/enum.meta";
import type { OwnerContractSubjectTypeEnum } from "@/types/generated";
import type { ContractSubjectFormItem, OwnerContractForm, PickedRoom } from "../model/ownerContractFormTypes";
import type { SubjectSelectionRow } from "./useOwnerContractForm";
import { cloneRentFreeRule, cloneSettlementRule, createSubjectRule } from "./useOwnerContractForm";

export function useSubjectPicker(form: OwnerContractForm) {
  const selectedSubjects = ref<SubjectSelectionRow[]>([]);
  const selectedSubjectType = ref<OwnerContractSubjectTypeEnum>(OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum);

  const currentSubjectTypeLabel = computed(() => {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) return "集中式";
    return "房源";
  });
  const currentSubjectTypeDesc = computed(() => {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) {
      return "集中式下既可以直接选择整项目，也可以进入项目后勾选多个楼栋。";
    }
    return "适合分散式场景，逐套选择房源后纳入合同。";
  });
  const currentSubjectUnit = computed(() => (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value ? "项" : "套"));

  function getSubjectTypeShortLabel(subjectType?: OwnerContractSubjectTypeEnum) {
    if (subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value) return "项目";
    if (subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value) return "楼栋";
    return "房源";
  }

  function syncContractSubjects(rows: SubjectSelectionRow[]) {
    selectedSubjects.value = rows || [];
    const subjectMap = new Map<string, ContractSubjectFormItem>();
    const sharedRule = form.contractSubjectList[0];
    for (const row of rows || []) {
      const subjectId = String(row.subjectId || "");
      if (!subjectId) continue;
      const key = `${row.subjectType}-${subjectId}`;
      const existing = form.contractSubjectList.find(item => item.subjectType === row.subjectType && item.subjectId === subjectId);
      subjectMap.set(key, existing || createSubjectRule(row.subjectType, subjectId, row.subjectName || "", sharedRule));
    }
    form.contractSubjectList = Array.from(subjectMap.values());
    if (form.ownerContract.cooperationMode === "LIGHT_MANAGED" && form.contractSubjectList.length > 1) {
      const shared = form.contractSubjectList[0];
      form.contractSubjectList = form.contractSubjectList.map(item => ({
        ...item,
        settlementRule: cloneSettlementRule(shared.settlementRule),
        rentFreeRule: cloneRentFreeRule(shared.rentFreeRule)
      }));
    }
  }

  function handleHouseConfirm(rows: PickedRoom[]) {
    syncContractSubjects(
      (rows || []).map(row => ({
        subjectType: OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum,
        subjectId: String(row.houseId || ""),
        subjectName: row.houseName || "",
        address: row.address || ""
      }))
    );
  }

  function handleFocusSubjectConfirm(rows: SubjectSelectionRow[]) {
    syncContractSubjects(rows || []);
  }

  function removeSubject(subjectType?: OwnerContractSubjectTypeEnum, subjectId?: string | number) {
    const currentId = String(subjectId || "");
    form.contractSubjectList = form.contractSubjectList.filter(item => !(item.subjectType === subjectType && String(item.subjectId || "") === currentId));
    selectedSubjects.value = selectedSubjects.value.filter(item => !(item.subjectType === subjectType && item.subjectId === currentId));
  }

  function clearSubjectSelection() {
    form.contractSubjectList = [];
    selectedSubjects.value = [];
  }

  async function handleSubjectTypeChange(nextType: OwnerContractSubjectTypeEnum) {
    if (selectedSubjectType.value === nextType) return;
    if (!form.contractSubjectList.length) {
      selectedSubjectType.value = nextType;
      return;
    }
    try {
      await ElMessageBox.confirm("切换合同房源类型后，当前已选内容会被清空。是否继续？", "切换合同房源类型", {
        type: "warning",
        confirmButtonText: "继续切换",
        cancelButtonText: "取消"
      });
      clearSubjectSelection();
      selectedSubjectType.value = nextType;
    } catch {
      return;
    }
  }

  function initFromSubjectList() {
    selectedSubjectType.value =
      form.contractSubjectList[0]?.subjectType === OwnerContractSubjectTypeEnumMeta.HOUSE.value
        ? (OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum)
        : (OwnerContractSubjectTypeEnumMeta.FOCUS.value as OwnerContractSubjectTypeEnum);
    selectedSubjects.value = form.contractSubjectList.map(item => ({
      subjectType: item.subjectType,
      subjectId: String(item.subjectId || ""),
      subjectName: item.subjectName || ""
    }));
  }

  return {
    selectedSubjects,
    selectedSubjectType,
    currentSubjectTypeLabel,
    currentSubjectTypeDesc,
    currentSubjectUnit,
    getSubjectTypeShortLabel,
    handleHouseConfirm,
    handleFocusSubjectConfirm,
    removeSubject,
    clearSubjectSelection,
    handleSubjectTypeChange,
    initFromSubjectList
  };
}
