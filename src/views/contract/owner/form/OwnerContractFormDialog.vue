<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" label-width="100px" class="owner-contract-form mb-4">
    <SubjectSection
      :form="form"
      :master-lease-bill-locked="masterLeaseBillLocked"
      :configured-subject-count="configuredSubjectCount"
      :selected-subject-type="selectedSubjectType"
      :current-subject-type-label="currentSubjectTypeLabel"
      :current-subject-type-desc="currentSubjectTypeDesc"
      :current-subject-unit="currentSubjectUnit"
      :get-subject-type-short-label="getSubjectTypeShortLabel"
      @open-picker="openSubjectPickerStep"
      @clear-selection="clearSubjectSelection"
      @remove-subject="removeSubject"
    />

    <OwnerSection
      v-model:form="form"
      :master-lease-bill-locked="masterLeaseBillLocked"
      :owner-tag-options="ownerTagOptions"
      :query-owner-suggestions="queryOwnerSuggestions"
      :handle-owner-suggestion-select="handleOwnerSuggestionSelect"
      @fill-payee-from-owner="fillPayeeFromOwner"
      @fill-payee-from-contact="fillPayeeFromContact"
    />

    <ContractSection
      v-model:form="form"
      v-model:contract-date-range="contractDateRange"
      :master-lease-bill-locked="masterLeaseBillLocked"
      :master-lease-bill-lock-reason="masterLeaseBillLockReason"
      :contract-templates="contractTemplates"
      @apply-year-shortcut="applyYearShortcut"
    />

    <ClauseSection
      v-model:form="form"
      :master-lease-bill-locked="masterLeaseBillLocked"
      :master-lease-bill-lock-reason="masterLeaseBillLockReason"
      :other-fee-type-options="otherFeeTypeOptions"
      :settlement-fee-cascader-values="settlementFeeCascaderValues"
      :lease-fee-cascader-values="leaseFeeCascaderValues"
      @add-settlement-item="addSettlementItem"
      @settlement-fee-type-change="handleSettlementFeeTypeChange"
      @apply-rent-free-shortcut="applyRentFreeMonthShortcut"
      @add-lease-fee="addLeaseFee"
      @add-lease-free-rule="addLeaseFreeRule"
      @lease-fee-type-change="handleLeaseFeeTypeChange"
    />

    <HousePicker ref="housePickerRef" @confirm="handleHouseConfirm" />
    <FocusSubjectPicker ref="focusSubjectPickerRef" @confirm="handleFocusSubjectConfirm" />

    <el-dialog v-model="subjectTypeDialogVisible" title="选择签约类型" width="560px" append-to-body destroy-on-close>
      <div class="subject-picker-step">
        <div class="subject-picker-step__header">
          <div class="subject-picker-step__title">第一步：先确认本次合同按哪种类型签约</div>
          <div class="subject-picker-step__desc">确认后会自动打开对应的选择器。房源进入房源选择，集中式进入项目 / 楼栋选择。</div>
        </div>

        <div class="subject-type-grid">
          <button
            v-for="option in SUBJECT_TYPE_OPTIONS"
            :key="option.value"
            type="button"
            :class="['subject-type-card', { 'is-active': pendingLeaseMode === option.value }]"
            @click="pendingLeaseMode = option.value"
          >
            <div class="subject-type-card__title">{{ option.label }}</div>
            <div class="subject-type-card__desc">{{ option.desc }}</div>
          </button>
        </div>
      </div>

      <template #footer>
        <div class="subject-picker-step__footer mt-2">
          <el-button @click="subjectTypeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubjectTypeStepConfirm">下一步</el-button>
        </div>
      </template>
    </el-dialog>

  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from "vue";
  import FocusSubjectPicker from "@/shared/house/FocusSubjectPicker.vue";
  import HousePicker from "@/shared/house/HousePicker.vue";
  import { message } from "@/utils/message";
  import type { OwnerContractSubjectTypeEnum, OwnerDetailVo } from "@/types/generated";
  import { LeaseModeEnumMeta, OwnerContractSubjectTypeEnumMeta } from "@/types/generated/enum.meta";
  import ClauseSection from "./ownerContractForm/sections/ClauseSection.vue";
  import ContractSection from "./ownerContractForm/sections/ContractSection.vue";
  import OwnerSection from "./ownerContractForm/sections/OwnerSection.vue";
  import SubjectSection from "./ownerContractForm/sections/SubjectSection.vue";
  import { useOwnerContractForm } from "./ownerContractForm/composables/useOwnerContractForm";
  import { useSubjectPicker } from "./ownerContractForm/composables/useSubjectPicker";
  import { SUBJECT_TYPE_OPTIONS } from "./ownerContractForm/model/ownerContractFormOptions";
  import type { SubjectLeaseModeValue } from "./ownerContractForm/model/ownerContractFormTypes";

  defineOptions({ name: "OwnerContractFormDialog" });

  interface Props {
    formInline?: OwnerDetailVo | null;
    isEdit?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    formInline: null,
    isEdit: false
  });

  const {
    formRef,
    form,
    contractDateRange,
    contractTemplates,
    otherFeeTypeOptions,
    leaseFeeCascaderValues,
    settlementFeeCascaderValues,
    ownerTagOptions,
    configuredSubjectCount,
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
  } = useOwnerContractForm();

  const {
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
  } = useSubjectPicker(form);

  const housePickerRef = ref<InstanceType<typeof HousePicker>>();
  const focusSubjectPickerRef = ref<InstanceType<typeof FocusSubjectPicker>>();
  const subjectTypeDialogVisible = ref(false);
  const pendingLeaseMode = ref<SubjectLeaseModeValue>(LeaseModeEnumMeta.SCATTER.code as SubjectLeaseModeValue);
  const masterLeaseBillLocked = computed(() => props.isEdit && form.ownerContract.cooperationMode === "MASTER_LEASE" && Boolean(props.formInline?.masterLeaseBillLocked));
  const masterLeaseBillLockReason = computed(
    () => props.formInline?.masterLeaseBillLockReason || "该包租合同已发生付款或结算，账单条款已锁定；如需调整，请走合同变更。"
  );

  const currentLeaseMode = computed<SubjectLeaseModeValue>(() =>
    selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.HOUSE.value
      ? (LeaseModeEnumMeta.SCATTER.code as SubjectLeaseModeValue)
      : (LeaseModeEnumMeta.FOCUS.code as SubjectLeaseModeValue)
  );

  function getSubjectTypeByLeaseMode(leaseMode: SubjectLeaseModeValue): OwnerContractSubjectTypeEnum {
    return leaseMode === LeaseModeEnumMeta.FOCUS.code
      ? (OwnerContractSubjectTypeEnumMeta.FOCUS.value as OwnerContractSubjectTypeEnum)
      : (OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum);
  }

  function openSubjectPickerStep() {
    pendingLeaseMode.value = currentLeaseMode.value;
    subjectTypeDialogVisible.value = true;
  }

  async function handleSubjectTypeStepConfirm() {
    const nextSubjectType = getSubjectTypeByLeaseMode(pendingLeaseMode.value);
    await handleSubjectTypeChange(nextSubjectType);
    if (selectedSubjectType.value !== nextSubjectType) return;
    subjectTypeDialogVisible.value = false;
    openSubjectPicker();
  }

  function openSubjectPicker() {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) {
      focusSubjectPickerRef.value?.show({
        leaseMode: LeaseModeEnumMeta.FOCUS.code,
        selected: selectedSubjects.value.filter(
          item =>
            item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value ||
            item.subjectType === (OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value as OwnerContractSubjectTypeEnum)
        )
      });
      return;
    }
    housePickerRef.value?.show({
      leaseMode: LeaseModeEnumMeta.SCATTER.code,
      selected: selectedSubjects.value.map(item => ({ houseId: item.subjectId, houseName: item.subjectName })),
      excludeOwnerContractId: form.ownerContract.id
    });
  }

  watch(
    () => props.formInline,
    value => {
      mapDetailToForm(value);
      initFromSubjectList();
    },
    { immediate: true }
  );

  onMounted(async () => {
    await Promise.all([loadTemplates(), loadTemplateParams(), loadFeeTypeOptions(), loadOwnerTagOptions()]);
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  });

  defineExpose({ getRef: () => formRef.value, validateAndBuildPayload, form });
</script>

<style lang="scss">
  @use "./ownerContractForm/styles/ownerContractForm.scss";

  .subject-picker-step__header {
    margin-bottom: 16px;
  }

  .subject-picker-step__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .subject-picker-step__desc {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .subject-picker-step__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
