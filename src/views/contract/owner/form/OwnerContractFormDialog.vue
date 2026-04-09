<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" label-width="100px" class="owner-contract-form mb-4">
    <SubjectSection
      :form="form"
      :configured-subject-count="configuredSubjectCount"
      :selected-subject-type="selectedSubjectType"
      :current-subject-type-label="currentSubjectTypeLabel"
      :current-subject-type-desc="currentSubjectTypeDesc"
      :current-subject-unit="currentSubjectUnit"
      :get-subject-type-short-label="getSubjectTypeShortLabel"
      @open-picker="openSubjectPicker"
      @subject-type-change="handleSubjectTypeChange"
      @clear-selection="clearSubjectSelection"
      @remove-subject="removeSubject"
    />

    <OwnerSection
      v-model:form="form"
      :owner-tag-options="ownerTagOptions"
      :query-owner-suggestions="queryOwnerSuggestions"
      :handle-owner-suggestion-select="handleOwnerSuggestionSelect"
      @fill-payee-from-owner="fillPayeeFromOwner"
      @fill-payee-from-contact="fillPayeeFromContact"
    />

    <ContractSection v-model:form="form" v-model:contract-date-range="contractDateRange" :contract-templates="contractTemplates" @apply-year-shortcut="applyYearShortcut" />

    <ClauseSection
      v-model:form="form"
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

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close append-to-body>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from "vue";
  import { previewOwnerContract } from "@/api/contract/owner";
  import FocusSubjectPicker from "@/shared/house/FocusSubjectPicker.vue";
  import HousePicker from "@/shared/house/HousePicker.vue";
  import { message } from "@/utils/message";
  import type { OwnerContractIdDto, OwnerContractSubjectTypeEnum, OwnerDetailVo } from "@/types/generated";
  import { OwnerContractSubjectTypeEnumMeta } from "@/types/generated/enum.meta";
  import ClauseSection from "./ownerContractForm/sections/ClauseSection.vue";
  import ContractSection from "./ownerContractForm/sections/ContractSection.vue";
  import OwnerSection from "./ownerContractForm/sections/OwnerSection.vue";
  import SubjectSection from "./ownerContractForm/sections/SubjectSection.vue";
  import { useOwnerContractForm } from "./ownerContractForm/composables/useOwnerContractForm";
  import { useSubjectPicker } from "./ownerContractForm/composables/useSubjectPicker";

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
  const previewVisible = ref(false);
  const pdfUrl = ref("");

  function openSubjectPicker() {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) {
      focusSubjectPickerRef.value?.show({
        selected: selectedSubjects.value.filter(
          item =>
            item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value ||
            item.subjectType === (OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value as OwnerContractSubjectTypeEnum)
        )
      });
      return;
    }
    housePickerRef.value?.show({
      selected: selectedSubjects.value.map(item => ({ houseId: item.subjectId, houseName: item.subjectName })),
      excludeOwnerContractId: form.ownerContract.id
    });
  }

  async function handlePreview(contractId?: string | number) {
    if (!contractId) {
      message("合同未保存，暂不支持预览", { type: "warning" });
      return;
    }
    const resp = await previewOwnerContract({ contractId } as OwnerContractIdDto);
    const blob = new Blob([resp], { type: "application/pdf" });
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = URL.createObjectURL(blob);
    previewVisible.value = true;
  }

  watch(
    () => props.formInline,
    value => {
      mapDetailToForm(value);
      initFromSubjectList();
    },
    { immediate: true }
  );

  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });

  onMounted(async () => {
    await Promise.all([loadTemplates(), loadTemplateParams(), loadFeeTypeOptions(), loadOwnerTagOptions()]);
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  });

  defineExpose({ getRef: () => formRef.value, validateAndBuildPayload, form, handlePreview });
</script>

<style lang="scss">
  @use "./ownerContractForm/styles/ownerContractForm.scss";
</style>
