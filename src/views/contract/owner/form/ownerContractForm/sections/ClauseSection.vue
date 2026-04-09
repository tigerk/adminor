<template>
  <el-card v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'" shadow="never" class="form-card">
    <template #header>
      <div class="card-header">
        <div class="header-inline">
          <span class="card-title">轻托管条款配置</span>
          <span class="card-desc card-desc--inline">所有已选房源统一使用同一套分账规则、管理费、免租与费用科目配置。</span>
        </div>
        <span class="card-tip">统一配置后自动应用到全部房源</span>
      </div>
    </template>

    <LightManagedClause
      v-model:shared-contract-subject="sharedContractSubjectModel"
      :other-fee-type-options="otherFeeTypeOptions"
      :settlement-fee-cascader-values="settlementFeeCascaderValues"
      @add-settlement-item="emit('addSettlementItem', $event)"
      @settlement-fee-type-change="(value, house, index) => emit('settlementFeeTypeChange', value, house, index)"
      @apply-rent-free-shortcut="(rule, months) => emit('applyRentFreeShortcut', rule, months)"
    />
  </el-card>

  <el-card v-else shadow="never" class="form-card">
    <template #header>
      <div class="card-header">
        <div class="header-inline">
          <span class="card-title">包租条款</span>
          <span class="card-desc card-desc--inline">包租按合同统一配置总月租金、押付方式、交房日期和其他费用科目。</span>
        </div>
      </div>
    </template>

    <MasterLeaseClause
      v-model:form="form"
      :master-lease-bill-locked="masterLeaseBillLocked"
      :master-lease-bill-lock-reason="masterLeaseBillLockReason"
      :other-fee-type-options="otherFeeTypeOptions"
      :lease-fee-cascader-values="leaseFeeCascaderValues"
      @add-lease-fee="emit('addLeaseFee')"
      @add-lease-free-rule="emit('addLeaseFreeRule')"
      @lease-fee-type-change="(value, index) => emit('leaseFeeTypeChange', value, index)"
    />
  </el-card>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import LightManagedClause from "./LightManagedClause.vue";
  import MasterLeaseClause from "./MasterLeaseClause.vue";
  import type { ContractSubjectFormItem, OwnerContractForm, OwnerRentFreeRuleForm } from "../model/ownerContractFormTypes";

  const form = defineModel<OwnerContractForm>("form", { required: true });

  defineProps<{
    masterLeaseBillLocked: boolean;
    masterLeaseBillLockReason: string;
    otherFeeTypeOptions: any[];
    settlementFeeCascaderValues: Record<string, any[]>;
    leaseFeeCascaderValues: Record<number, any[]>;
  }>();

  const emit = defineEmits<{
    addSettlementItem: [house: ContractSubjectFormItem];
    settlementFeeTypeChange: [value: any, house: ContractSubjectFormItem, index: number];
    applyRentFreeShortcut: [rule: OwnerRentFreeRuleForm, months: number];
    addLeaseFee: [];
    addLeaseFreeRule: [];
    leaseFeeTypeChange: [value: any, index: number];
  }>();

  const sharedContractSubjectModel = computed<ContractSubjectFormItem | undefined>({
    get: () => form.value.contractSubjectList[0],
    set: value => {
      if (!value || !form.value.contractSubjectList.length) return;
      form.value.contractSubjectList[0] = value;
    }
  });
</script>
