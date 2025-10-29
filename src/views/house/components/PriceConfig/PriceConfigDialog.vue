<script setup lang="ts">
  import { computed, onMounted, ref, watch } from "vue";
  import type { PriceConfigFormProps } from "./types";
  import { PriceConfigProps, PricePlanProps } from "@/types";
  import { PAYMENT_METHOD_OPTIONS, PRICE_PLANT_OPTIONS } from "@/constants";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { getDictDataByParentCode } from "@/api/sys/dict";
  import { Close, Delete, Plus } from "@element-plus/icons-vue";

  const { getDefaultOtherFee } = usePriceConfigEdit();

  const props = withDefaults(defineProps<PriceConfigFormProps>(), {});

  const priceConfig = ref<PriceConfigProps>({
    ...props.formInline
  });

  // 初始化其他费用列表
  if (!priceConfig.value.otherFees || priceConfig.value.otherFees.length === 0) {
    priceConfig.value.otherFees = [getDefaultOtherFee()];
  }

  // 初始化租金方案列表
  if (!priceConfig.value.pricePlans) {
    priceConfig.value.pricePlans = [];
  }

  const otherFeeTypeOptions = ref<any[]>([]);

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

  onMounted(() => {
    getDictDataByParentCode({
      dictCode: "fee_type"
    }).then(res => {
      otherFeeTypeOptions.value = transformDictToCascader(res.data);
    });
  });

  // 付款方式选项
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const pricePlantOptions = PRICE_PLANT_OPTIONS;

  // 当前选中的方案索引
  const selectedPlans = ref<number[]>([0]); // 默认选中月付

  // 底价方式标签
  const floorPriceMethodLabel = computed(() => {
    return priceConfig.value.floorPriceMethod === 1 ? "按固定金额" : "按出租价格";
  });

  // 底价输入后缀
  const floorPriceInputSuffix = computed(() => {
    return priceConfig.value.floorPriceMethod === 1 ? "元/月" : "%";
  });

  // 添加其他费用
  const addOtherFee = () => {
    priceConfig.value.otherFees.push(getDefaultOtherFee());
  };

  // 删除其他费用
  const removeOtherFee = (index: number) => {
    if (priceConfig.value.otherFees.length > 1) {
      priceConfig.value.otherFees.splice(index, 1);
    }
  };

  // 监听选中的方案变化，动态生成租金方案
  watch(
    selectedPlans,
    newPlans => {
      const existingPlans = priceConfig.value.pricePlans || [];
      const newPricePlans: PricePlanProps[] = [];

      newPlans.forEach(planIndex => {
        // 查找是否已存在该方案
        const existing = existingPlans.find(p => p.planType === String(pricePlantOptions[planIndex].value));

        if (existing) {
          newPricePlans.push(existing);
        } else {
          // 创建新方案
          const planOption = pricePlantOptions[planIndex];
          newPricePlans.push({
            roomId: priceConfig.value.roomId,
            planName: planOption.label,
            planType: String(planOption.value),
            priceRatio: 100,
            price: priceConfig.value.price || 0,
            otherFees: []
          });
        }
      });

      priceConfig.value.pricePlans = newPricePlans;
    },
    { immediate: true }
  );

  // 导出数据
  function getRef() {
    return {
      priceConfig: priceConfig.value
    };
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="rent-config-container">
    <!-- 租金价格和底价配置 -->
    <div class="section">
      <el-row :gutter="40">
        <el-col :span="10">
          <el-form-item label="租金">
            <el-input v-model.number="priceConfig.price" placeholder="请输入租金" type="number">
              <template #append>元/月</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="14">
          <el-form-item label="租金底价">
            <el-input v-model.number="priceConfig.floorPriceInput" placeholder="请输入" type="number">
              <template #prepend>
                <el-select v-model="priceConfig.floorPriceMethod" placeholder="请选择" style="width: 140px">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
              <template #append>{{ floorPriceInputSuffix }}</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 有佣金（暂不实现） -->
    <!-- 这部分根据需求不生成 -->

    <!-- 其他费用配置 -->
    <div class="section">
      <h4 class="section-title">
        其他费用
        <span class="section-subtitle">(租金以外的费用，适用于所有支付方式)</span>
      </h4>
      <div class="fee-list">
        <div v-for="(feeItem, index) in priceConfig.otherFees" :key="index" class="fee-item">
          <el-row :gutter="20" align="middle">
            <el-col :span="5">
              <el-form-item label="">
                <el-cascader
                  v-model="feeItem.dicDataId"
                  placeholder="请选择费用类型"
                  :options="otherFeeTypeOptions"
                  :props="{ expandTrigger: 'hover', value: 'value', label: 'label' }"
                  filterable
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="付款方式">
                <el-select v-model="feeItem.paymentMethod" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="金额">
                <el-select v-model="feeItem.priceMethod" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <el-input v-model.number="feeItem.priceInput" placeholder="请输入" type="number">
                  <template #append>{{ feeItem.priceMethod === 1 ? "元" : "元" }}</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="1">
              <el-form-item>
                <el-button type="danger" :icon="Delete" link :disabled="priceConfig.otherFees.length <= 1" @click="removeOtherFee(index)" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
      <el-button type="primary" plain size="small" @click="addOtherFee">
        <el-icon><Plus /></el-icon>
        其他费用
      </el-button>
    </div>

    <!-- 更多租金方案配置 -->
    <div class="section mt-6">
      <h4 class="section-title">更多租金方案配置</h4>

      <div class="plan-selection">
        <el-checkbox-group v-model="selectedPlans">
          <el-checkbox v-for="(plan, index) in pricePlantOptions" :key="index" :label="index">{{ plan.label }}</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 租金方案表格 -->
      <div v-if="priceConfig.pricePlans && priceConfig.pricePlans.length > 0" class="plan-table-wrapper">
        <table class="plan-table">
          <thead>
            <tr>
              <th style="width: 80px">默认</th>
              <th style="width: 150px">租金方案</th>
              <th class="text-center">租金(元/月)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(plan, index) in priceConfig.pricePlans" :key="index">
              <td class="text-center">
                <el-radio :label="index" value="" />
              </td>
              <td class="text-center">
                <span class="plan-type-text">{{ plan.planName }}</span>
              </td>
              <td class="text-center">
                <el-space style="align-items: center; gap: 8px" class="text-center">
                  <span>出租价格</span>
                  <span>X</span>
                  <el-input-number v-model="plan.priceRatio" :min="0" :max="100" :precision="2" :controls="false">
                    <template #suffix>%</template>
                  </el-input-number>
                  <span style="margin-left: 8px">（ 即：{{ Math.round((priceConfig.price || 0) * (plan.priceRatio / 100)) }} 元/月）</span>
                </el-space>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="plan-notes">
        <div class="note-item">1. 若有默认租金方案，则在广推广上架上按默认</div>
        <div class="note-item">
          2. 租金方案中的租金，不支持小数，且个位数必须为0。若算后存在小数和个位数，自动取偏小的整数；如"月付"方案的租金按折扣比例后为1258.99元，则取1250元。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .rent-config-container {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .section {
    margin-bottom: 30px;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-subtitle {
    font-size: 14px;
    font-weight: 400;
    color: #909399;
  }

  .fee-list {
    margin-bottom: 16px;
  }

  .fee-item {
    margin-bottom: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .plan-selection {
    margin-bottom: 20px;
  }

  .plan-table-wrapper {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .plan-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #fff;
  }

  .plan-table thead {
    background-color: #f5f7fa;
  }

  .plan-table th {
    padding: 10px;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #e4e7ed;
    border-right: 1px solid #e4e7ed;
  }

  .plan-table th:last-child {
    border-right: none;
  }

  .plan-table td {
    padding: 6px;
    border-bottom: 1px solid #e4e7ed;
    border-right: 1px solid #e4e7ed;
    vertical-align: middle;
  }

  .plan-table td:last-child {
    border-right: none;
  }

  .plan-table tbody tr:last-child td {
    border-bottom: none;
  }

  .plan-table tbody tr:hover {
    background-color: #f5f7fa;
  }

  .text-center {
    text-align: center;
  }

  .plan-type-text {
    font-weight: 500;
    color: #303133;
  }

  .plan-notes {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
  }

  .note-item {
    margin-bottom: 8px;
    line-height: 1.6;
  }

  .note-item:last-child {
    margin-bottom: 0;
  }

  .mt-6 {
    margin-top: 32px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-checkbox-group) {
    display: flex;
    gap: 24px;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }
</style>
