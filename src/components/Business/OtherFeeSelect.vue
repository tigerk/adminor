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
                <el-cascader
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
                <el-select v-model="feeItem.paymentMethod" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </td>
              <td>
                <el-input v-model.number="feeItem.priceInput" :min="0" placeholder="请输入" type="number">
                  <template #prepend>
                    <el-select v-model="feeItem.priceMethod" placeholder="请选择" style="width: 140px">
                      <el-option v-for="item in priceMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                  <template #append>{{ feeItem.priceMethod === 0 ? "元" : "%" }}</template>
                </el-input>
              </td>
              <td class="text-center">
                <el-button type="danger" :icon="Delete" link @click="removeOtherFee(index)" />
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
  import type { OtherFeeProps } from "@/types";
  import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
  import { getDictDataByParentCode } from "@/api/sys/dict";

  interface Props {
    modelValue: OtherFeeProps[];
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => []
  });

  const emit = defineEmits<{
    (e: "update:modelValue", value: OtherFeeProps[]): void;
  }>();

  const otherFeeTypeOptions = ref<any[]>([]);
  const cascaderValues = ref<Record<number, any[]>>({});

  // 付款方式选项
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const priceMethodOptions = PRICE_METHOD_OPTIONS;

  // 转换字典数据为级联选择器格式
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

  // 加载费用类型选项
  getDictDataByParentCode({
    dictCode: "fee_type"
  }).then(res => {
    otherFeeTypeOptions.value = transformDictToCascader(res.data);
  });

  // 获取默认的其他费用对象
  const getDefaultOtherFee = (): OtherFeeProps => {
    return {
      dictDataId: null,
      name: null,
      paymentMethod: 0,
      priceMethod: 1, // 按固定金额
      priceInput: null
    };
  };

  // 添加其他费用
  const addOtherFee = () => {
    const newFees = [...props.modelValue, getDefaultOtherFee()];
    emit("update:modelValue", newFees);
  };

  // 删除其他费用
  const removeOtherFee = (index: number) => {
    const newFees = [...props.modelValue];
    newFees.splice(index, 1);
    emit("update:modelValue", newFees);
  };

  // 处理级联选择器变化
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

  // 初始化级联选择器的值
  watch(
    () => props.modelValue,
    newValue => {
      if (newValue) {
        newValue.forEach((fee, index) => {
          if (fee.dictDataId) {
            // 根据dictDataId找到对应的级联路径
            for (const parent of otherFeeTypeOptions.value) {
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
  }
</style>
