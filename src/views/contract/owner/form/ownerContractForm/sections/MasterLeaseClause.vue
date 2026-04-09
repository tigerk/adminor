<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="4">
        <el-form-item label="总月租金">
          <el-input-number v-model="form.ownerLeaseRule.rentAmount" :min="0" :precision="2" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="总押金">
          <el-input-number v-model="form.ownerLeaseRule.depositAmount" :min="0" :precision="2" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="押金月数">
          <el-input-number v-model="form.ownerLeaseRule.depositMonths" :min="0" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="付款月数">
          <el-input-number v-model="form.ownerLeaseRule.paymentMonths" :min="1" class="w-full" />
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
      <el-col :span="4">
        <el-form-item label="付款日设置">
          <el-select v-model="form.ownerLeaseRule.rentDueType" class="w-full">
            <el-option v-for="item in RENT_DUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="每月付款日">
          <el-input-number v-model="form.ownerLeaseRule.rentDueDay" :min="1" :max="31" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="首付日期">
          <el-date-picker v-model="form.ownerLeaseRule.firstPayDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="折算方式">
          <el-select v-model="form.ownerLeaseRule.prorateType" class="w-full">
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
        <el-button type="primary" plain @click="emit('addLeaseFee')">添加费用</el-button>
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
                <el-radio-group v-model="fee.feeDirection" class="direction-radio-group" size="small">
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
                  @change="value => emit('leaseFeeTypeChange', value, index)"
                />
              </td>
              <td>
                <el-select v-model="fee.paymentMethod" class="w-full">
                  <el-option v-for="item in PAYMENT_METHOD_OPTIONS_REF" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td>
                <el-input v-model.number="fee.priceInput" type="number" class="w-full" placeholder="请输入">
                  <template #prepend>
                    <el-select v-model="fee.priceMethod" style="width: 140px">
                      <el-option v-for="item in PRICE_METHOD_OPTIONS_REF" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                  <template #append>{{ fee.priceMethod === 1 ? "元" : "%" }}</template>
                </el-input>
              </td>
              <td class="text-center">
                <el-button link type="danger" @click="form.ownerLeaseRule.otherFeeList?.splice(index, 1)">删除</el-button>
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
          <div class="sub-panel__desc">按合同级统一设置，非必填。</div>
        </div>
        <el-button type="primary" plain @click="emit('addLeaseFreeRule')">新增规则</el-button>
      </div>
      <div class="fee-table-wrapper">
        <table class="fee-table fee-table--master-lease lease-free-table">
          <thead>
            <tr>
              <th style="width: 190px">类型</th>
              <th style="width: 170px">开始日期</th>
              <th style="width: 170px">结束日期</th>
              <th style="width: 360px">金额配置</th>
              <th style="width: 76px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!form.ownerLeaseFreeRuleList.length" class="empty-row">
              <td colspan="5"><div class="empty-state">暂无免租规则，点击右上角"新增规则"添加。</div></td>
            </tr>
            <tr v-for="(row, index) in form.ownerLeaseFreeRuleList" :key="index">
              <td>
                <el-select v-model="row.freeType" class="w-full">
                  <el-option v-for="item in FREE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td><el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" /></td>
              <td><el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" /></td>
              <td>
                <template v-if="row.calcMode === 'RATIO'">
                  <el-input v-model.number="row.freeRatio" type="number" class="w-full" placeholder="请输入">
                    <template #prepend>
                      <el-select v-model="row.calcMode" style="width: 140px">
                        <el-option v-for="item in LEASE_FREE_CALC_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                    <template #append>%</template>
                  </el-input>
                </template>
                <template v-else>
                  <el-input v-model.number="row.freeAmount" type="number" class="w-full" placeholder="请输入">
                    <template #prepend>
                      <el-select v-model="row.calcMode" style="width: 140px">
                        <el-option v-for="item in LEASE_FREE_CALC_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                    <template #append>元</template>
                  </el-input>
                </template>
              </td>
              <td class="text-center">
                <el-button link type="danger" @click="form.ownerLeaseFreeRuleList.splice(index, 1)">删除</el-button>
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
    LEASE_FREE_CALC_MODE_OPTIONS,
    PAYMENT_METHOD_OPTIONS_REF,
    PRICE_METHOD_OPTIONS_REF,
    PRORATE_TYPE_OPTIONS,
    RENT_DUE_TYPE_OPTIONS
  } from "../model/ownerContractFormOptions";
  import type { OwnerContractForm } from "../model/ownerContractFormTypes";

  const props = defineProps<{
    otherFeeTypeOptions: any[];
    leaseFeeCascaderValues: Record<number, any[]>;
  }>();
  const { otherFeeTypeOptions, leaseFeeCascaderValues } = toRefs(props);

  const form = defineModel<OwnerContractForm>("form", { required: true });
  const localLeaseFeeCascaderValues = reactive<Record<number, any[]>>({});
  const paymentMethodText = computed(() => {
    const depositMonths = Math.max(0, Number(form.value.ownerLeaseRule.depositMonths || 0));
    const paymentMonths = Math.max(0, Number(form.value.ownerLeaseRule.paymentMonths || 0));
    if (!depositMonths && !paymentMonths) return "-";
    return `押${depositMonths}付${paymentMonths}`;
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
</script>
