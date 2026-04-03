<template>
  <div class="other-fee-select">
    <div class="section">
      <h4 class="section-title">
        其他费用
        <span class="section-subtitle">(租金以外的费用,适用于所有支付方式)</span>
      </h4>

      <div v-if="modelValue && modelValue.length > 0" class="fee-table-wrapper">
        <table class="fee-table">
          <thead>
            <tr>
              <th style="width: 200px">费用类型</th>
              <th style="width: 150px">付款方式</th>
              <th style="width: 300px">金额</th>
              <th style="width: 60px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(feeItem, index) in modelValue" :key="index">
              <td>
                <!-- dictDataId="0" 时只读显示 -->
                <template v-if="feeItem.dictDataId === '0'">
                  <el-space class="readonly-text">
                    <IconifyIconOnline icon="ep:lock" class="accent-green-400" />
                    <el-text type="info">{{ feeItem.name }}</el-text>
                    <el-text type="info">（不可编辑）</el-text>
                  </el-space>
                </template>
                <el-cascader
                  v-else
                  v-model="cascaderValues[index]"
                  placeholder="请选择费用类型"
                  :options="otherFeeTypeOptions"
                  :props="{
                    emitPath: true,
                    checkStrictly: false
                  }"
                  filterable
                  clearable
                  style="width: 100%"
                  @change="value => handleCascaderChange(value, index)"
                />
              </td>
              <td>
                <el-select v-model="feeItem.paymentMethod" placeholder="请选择" style="width: 100%" :disabled="feeItem.dictDataId === '0'">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td>
                <el-input v-model.number="feeItem.priceInput" :min="0" placeholder="请输入" type="number" :disabled="feeItem.dictDataId === '0'">
                  <template #prepend>
                    <el-select v-model="feeItem.priceMethod" placeholder="请选择" style="width: 140px" :disabled="feeItem.dictDataId === '0'">
                      <el-option v-for="item in priceMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                  <template #append>{{ feeItem.priceMethod === 1 ? "元" : "%" }}</template>
                </el-input>
              </td>
              <td class="text-center">
                <el-button v-if="feeItem.dictDataId !== '0'" type="danger" :icon="Delete" link @click="removeOtherFee(index)" />
                <span v-else class="readonly-placeholder">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-left">
        <el-button type="primary" plain size="small" style="margin-top: 12px" @click="addOtherFee">
          <el-icon><Plus /></el-icon>
          其他费用
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import { Delete, Plus } from "@element-plus/icons-vue";
  import type { OtherFeeDto } from "@/types";
  import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
  import { getDictDataByParentCode } from "@/api/sys/dict";

  interface Props {
    modelValue?: OtherFeeDto[];
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => []
  });

  const emit = defineEmits<(e: "update:modelValue", value: OtherFeeDto[]) => void>();

  const otherFeeTypeOptions = ref<any[]>([]);
  const cascaderValues = ref<Record<number, any[]>>({});

  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const priceMethodOptions = PRICE_METHOD_OPTIONS;

  const transformDictToCascader = (dictData: any[]) => {
    return dictData.map(dict => ({
      label: dict.dictName,
      value: dict.dictCode,
      children: dict.dictDataList.map(item => ({
        label: item.name,
        value: item.id
      }))
    }));
  };

  getDictDataByParentCode({
    dictCode: "fee_type"
  }).then(res => {
    otherFeeTypeOptions.value = transformDictToCascader(res.data);
  });

  const getDefaultOtherFee = (): OtherFeeDto => {
    return {
      dictDataId: null,
      name: null,
      paymentMethod: 0,
      priceMethod: 1,
      priceInput: null
    };
  };

  const addOtherFee = () => {
    const newFees = [...props.modelValue, getDefaultOtherFee()];
    emit("update:modelValue", newFees);
  };

  const removeOtherFee = (index: number) => {
    const newFees = [...props.modelValue];
    newFees.splice(index, 1);
    emit("update:modelValue", newFees);
  };

  const handleCascaderChange = (value: any, index: number) => {
    const findOption = (options: any[], targetValue: any): any | null => {
      for (const option of options) {
        if (option.children) {
          for (const child of option.children) {
            if (child.value === targetValue.at(1)) {
              return child;
            }
          }
        }
      }
      return null;
    };

    const selectedOption = findOption(otherFeeTypeOptions.value, value);
    if (selectedOption !== null) {
      const newFees = [...props.modelValue];
      newFees[index] = {
        ...newFees[index],
        name: selectedOption.label,
        dictDataId: selectedOption.value
      };
      emit("update:modelValue", newFees);
    }
  };

  watch(
    [() => props.modelValue, otherFeeTypeOptions],
    ([newValue, options]) => {
      if (newValue && options.length > 0) {
        newValue.forEach((fee, index) => {
          if (fee.dictDataId && fee.dictDataId !== "0") {
            for (const parent of options) {
              const child = parent.children?.find((c: any) => c.value === fee.dictDataId);
              if (child) {
                cascaderValues.value[index] = [parent.value, child.value];
                break;
              }
            }
          }
        });
      }
    },
    { immediate: true, deep: true }
  );
</script>

<style scoped lang="scss">
  .other-fee-select {
    .section {
      margin-bottom: 25px;
    }

    .section-title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
    }

    .fee-table-wrapper {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 4px;
      background-color: var(--el-bg-color);
    }

    .fee-table {
      width: 100%;
      border-collapse: collapse;
      background-color: var(--el-bg-color);
    }

    .fee-table thead {
      background-color: var(--el-fill-color-light);
    }

    .fee-table th {
      padding: 10px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
      color: var(--el-text-color-regular);
      border-bottom: 1px solid var(--el-border-color);
      border-right: 1px solid var(--el-border-color);
    }

    .fee-table th:last-child {
      border-right: none;
    }

    .fee-table td {
      padding: 8px;
      border-bottom: 1px solid var(--el-border-color);
      border-right: 1px solid var(--el-border-color);
      vertical-align: middle;
    }

    .fee-table td:last-child {
      border-right: none;
    }

    .fee-table tbody tr:last-child td {
      border-bottom: none;
    }

    .fee-table tbody tr:hover {
      background-color: var(--el-fill-color-lighter);
    }

    .text-center {
      text-align: center;
    }

    .text-left {
      text-align: left;
    }

    .readonly-text {
      padding: 0 11px;
      color: var(--el-text-color-regular);
      line-height: 32px;
    }

    .readonly-placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
</style>
