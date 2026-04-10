<template>
  <div>
    <el-alert
      v-if="masterLeaseBillLocked"
      :title="masterLeaseBillLockReason"
      type="warning"
      :closable="false"
      class="mb-4"
    />
    <el-row :gutter="20">
      <el-col :span="4">
        <el-form-item label="总月租金">
          <el-input-number v-model="form.ownerLeaseRule.rentAmount" :min="0" :precision="2" class="w-full" :disabled="masterLeaseBillLocked" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="总押金">
          <el-input-number v-model="form.ownerLeaseRule.depositAmount" :min="0" :precision="2" class="w-full" :disabled="masterLeaseBillLocked" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="押金月数">
          <el-input-number v-model="form.ownerLeaseRule.depositMonths" :min="0" class="w-full" :disabled="masterLeaseBillLocked" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="付款月数">
          <el-input-number v-model="form.ownerLeaseRule.paymentMonths" :min="1" class="w-full" :disabled="masterLeaseBillLocked" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="交房日期">
          <el-date-picker v-model="form.ownerLeaseRule.handoverDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="承租用途">
          <el-input v-model="form.ownerLeaseRule.usageType" placeholder="请输入承租用途" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="4">
        <el-form-item label="付款方式">
          <el-input :model-value="paymentMethodText" readonly disabled />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="付款设置">
          <el-input v-model.number="rentDueValue" type="number" class="w-full payment-setting-input" :disabled="masterLeaseBillLocked">
            <template #prepend>
              <el-select v-model="form.ownerLeaseRule.rentDueType" style="width: 92px" :disabled="masterLeaseBillLocked">
                <el-option v-for="item in PAYMENT_DUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
            <template #append>{{ rentDueUnitText }}</template>
          </el-input>
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="折算方式">
          <el-select v-model="form.ownerLeaseRule.prorateType" class="w-full" :disabled="masterLeaseBillLocked">
            <el-option v-for="item in PRORATE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <div class="sub-panel">
      <div class="sub-panel__header">
        <div>
          <div class="sub-panel__title">其他费用</div>
          <div class="sub-panel__desc">参考退租费用，支持前置选择收 / 支和金额方式。</div>
        </div>
        <el-button type="primary" plain :disabled="masterLeaseBillLocked" @click="emit('addLeaseFee')">添加费用</el-button>
      </div>
      <div class="fee-table-wrapper">
        <table class="fee-table fee-table--master-lease">
          <thead>
            <tr>
              <th style="width: 96px">收支</th>
              <th style="width: 240px">费用类型</th>
              <th style="width: 170px">付款方式</th>
              <th style="width: 360px">金额</th>
              <th style="width: 76px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!form.ownerLeaseRule.otherFeeList?.length" class="empty-row">
              <td colspan="5"><div class="empty-state">暂无其他费用，点击右上角"添加费用"新增。</div></td>
            </tr>
            <tr v-for="(fee, index) in form.ownerLeaseRule.otherFeeList" :key="index">
              <td>
                <el-radio-group v-model="fee.feeDirection" class="direction-radio-group" size="small" :disabled="masterLeaseBillLocked">
                  <el-radio-button label="IN">收</el-radio-button>
                  <el-radio-button label="OUT">支</el-radio-button>
                </el-radio-group>
              </td>
              <td>
                <el-cascader
                  v-model="localLeaseFeeCascaderValues[index]"
                  :options="otherFeeTypeOptions"
                  :props="{ emitPath: true, checkStrictly: false }"
                  clearable
                  filterable
                  class="w-full"
                  :disabled="masterLeaseBillLocked"
                  @change="value => emit('leaseFeeTypeChange', value, index)"
                />
              </td>
              <td>
                <el-select v-model="fee.paymentMethod" class="w-full" :disabled="masterLeaseBillLocked">
                  <el-option v-for="item in PAYMENT_METHOD_OPTIONS_REF" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td>
                <el-input v-model.number="fee.priceInput" type="number" class="w-full" placeholder="请输入" :disabled="masterLeaseBillLocked">
                  <template #prepend>
                    <el-select v-model="fee.priceMethod" style="width: 140px" :disabled="masterLeaseBillLocked">
                      <el-option v-for="item in PRICE_METHOD_OPTIONS_REF" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                  <template #append>{{ fee.priceMethod === 1 ? "元" : "%" }}</template>
                </el-input>
              </td>
              <td class="text-center">
                <el-button link type="danger" :disabled="masterLeaseBillLocked" @click="form.ownerLeaseRule.otherFeeList?.splice(index, 1)">删除</el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-panel">
      <div class="sub-panel__header">
        <div>
          <div class="sub-panel__title">包租免租规则</div>
          <div class="sub-panel__desc">仅配置免租期，系统会按账期内命中的免租天数自动冲减租金。</div>
        </div>
        <el-button type="primary" plain :disabled="masterLeaseBillLocked" @click="emit('addLeaseFreeRule')">新增规则</el-button>
      </div>
      <div class="fee-table-wrapper">
        <table class="fee-table fee-table--master-lease lease-free-table">
          <thead>
            <tr>
              <th style="width: 220px">类型</th>
              <th style="width: 220px">开始日期</th>
              <th style="width: 220px">结束日期</th>
              <th style="width: 76px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!form.ownerLeaseFreeRuleList.length" class="empty-row">
              <td colspan="4"><div class="empty-state">暂无免租规则，点击右上角"新增规则"添加。</div></td>
            </tr>
            <tr v-for="(row, index) in form.ownerLeaseFreeRuleList" :key="index">
              <td>
                <el-select v-model="row.freeType" class="w-full" :disabled="masterLeaseBillLocked">
                  <el-option v-for="item in FREE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td><el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" :disabled="masterLeaseBillLocked" /></td>
              <td><el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" :disabled="masterLeaseBillLocked" /></td>
              <td class="text-center">
                <el-button link type="danger" :disabled="masterLeaseBillLocked" @click="form.ownerLeaseFreeRuleList.splice(index, 1)">删除</el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, toRefs, watch } from "vue";
  import {
    FREE_TYPE_OPTIONS,
    PAYMENT_METHOD_OPTIONS_REF,
    PRICE_METHOD_OPTIONS_REF,
    PRORATE_TYPE_OPTIONS,
    RENT_DUE_TYPE_OPTIONS
  } from "../model/ownerContractFormOptions";
  import type { OwnerContractForm } from "../model/ownerContractFormTypes";

  const props = defineProps<{
    masterLeaseBillLocked: boolean;
    masterLeaseBillLockReason: string;
    otherFeeTypeOptions: any[];
    leaseFeeCascaderValues: Record<number, any[]>;
  }>();
  const { otherFeeTypeOptions, leaseFeeCascaderValues, masterLeaseBillLocked, masterLeaseBillLockReason } = toRefs(props);

  const form = defineModel<OwnerContractForm>("form", { required: true });
  const localLeaseFeeCascaderValues = reactive<Record<number, any[]>>({});
  const paymentMethodText = computed(() => {
    const depositMonths = Math.max(0, Number(form.value.ownerLeaseRule.depositMonths || 0));
    const paymentMonths = Math.max(0, Number(form.value.ownerLeaseRule.paymentMonths || 0));
    if (!depositMonths && !paymentMonths) return "-";
    return `押${depositMonths}付${paymentMonths}`;
  });
  const PAYMENT_DUE_TYPE_OPTIONS = RENT_DUE_TYPE_OPTIONS.map(item => ({
    ...item,
    label: item.value === "EARLY" ? "提前" : item.value === "LATE" ? "延后" : "固定"
  }));
  const rentDueUnitText = computed(() => (form.value.ownerLeaseRule.rentDueType === "FIXED" ? "号付款" : "天"));
  const rentDueValue = computed({
    get: () =>
      form.value.ownerLeaseRule.rentDueType === "FIXED"
        ? Number(form.value.ownerLeaseRule.rentDueDay || 0)
        : Number(form.value.ownerLeaseRule.rentDueOffsetDays || 0),
    set: value => {
      const normalized = Math.max(0, Number(value || 0));
      if (form.value.ownerLeaseRule.rentDueType === "FIXED") {
        form.value.ownerLeaseRule.rentDueDay = normalized;
        form.value.ownerLeaseRule.rentDueOffsetDays = 0;
        return;
      }
      form.value.ownerLeaseRule.rentDueOffsetDays = normalized;
      form.value.ownerLeaseRule.rentDueDay = 0;
    }
  });

  const emit = defineEmits<{
    addLeaseFee: [];
    addLeaseFreeRule: [];
    leaseFeeTypeChange: [value: any, index: number];
  }>();

  watch(
    leaseFeeCascaderValues,
    value => {
      Object.keys(localLeaseFeeCascaderValues).forEach(key => delete localLeaseFeeCascaderValues[Number(key)]);
      Object.assign(localLeaseFeeCascaderValues, value || {});
    },
    { immediate: true, deep: true }
  );

  watch(
    () => form.value.ownerLeaseRule.rentDueType,
    value => {
      if (value === "FIXED") {
        form.value.ownerLeaseRule.rentDueDay = Math.max(1, Number(form.value.ownerLeaseRule.rentDueDay || 4));
        form.value.ownerLeaseRule.rentDueOffsetDays = 0;
        return;
      }
      form.value.ownerLeaseRule.rentDueOffsetDays = Math.max(0, Number(form.value.ownerLeaseRule.rentDueOffsetDays || 0));
      form.value.ownerLeaseRule.rentDueDay = 0;
    },
    { immediate: true }
  );
</script>

<style scoped lang="scss">
  .payment-setting-input {
    :deep(.el-input__inner[type=number]) {
      text-align: center;
    }
  }
</style>
