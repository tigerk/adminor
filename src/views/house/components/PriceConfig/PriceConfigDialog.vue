<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { PriceConfigFormProps } from "./types";
  import { PriceConfigDto, PriceMethodEnumMeta, PricePlanDto } from "@/types";
  import { PRICE_METHOD_OPTIONS, PRICE_PLAN_OPTIONS } from "@/constants";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import OtherFeeSelect from "@/components/Business/OtherFeeSelect.vue";

  const { getDefaultOtherFee } = usePriceConfigEdit();

  const props = withDefaults(defineProps<PriceConfigFormProps>(), {});

  const priceConfig = ref<PriceConfigDto>({
    ...props.formInline,
    // ✅ 用 ?? 确保 null/undefined 时才用默认值（0 是有效值不处理）
    floorPriceMethod: props.formInline?.floorPriceMethod ?? PriceMethodEnumMeta.RATIO.code
  });

  // 初始化其他费用列表 - 确保每个费用项都有完整的初始值
  if (!priceConfig.value.otherFees || priceConfig.value.otherFees.length === 0) {
    priceConfig.value.otherFees = [getDefaultOtherFee()];
  }

  const priceMethodOptions = PRICE_METHOD_OPTIONS;
  const pricePlanOptions = PRICE_PLAN_OPTIONS;

  // 当前选中的方案索引 —— 从已有的 pricePlans 中反向映射，避免 watch immediate 时将传入数据清空
  const selectedPlans = ref<number[]>(
    (priceConfig.value.pricePlans || []).map(plan => pricePlanOptions.findIndex(opt => String(opt.value) === plan.planType)).filter(idx => idx !== -1)
  );

  // 当前选中的默认方案索引 —— 从已有数据中读取
  const defaultPlanIndex = ref<number>(
    Math.max(
      0,
      (priceConfig.value.pricePlans || []).findIndex(p => p.defaultPlan)
    )
  );

  // 底价方式标签
  const floorPriceMethodLabel = computed(() => {
    return priceConfig.value.floorPriceMethod === 1 ? "按固定金额" : "按出租价格";
  });

  // 底价输入后缀
  const floorPriceInputSuffix = computed(() => {
    return priceConfig.value.floorPriceMethod === 1 ? "元/月" : "%";
  });

  // 处理默认方案切换
  const handleDefaultPlanChange = (index: number) => {
    priceConfig.value.pricePlans.forEach((plan, i) => {
      plan.defaultPlan = i === index;
    });
  };

  // 监听选中的方案变化
  watch(
    selectedPlans,
    newPlans => {
      const existingPlans = priceConfig.value.pricePlans || [];
      const newPricePlans: PricePlanDto[] = [];

      newPlans.forEach((planIndex, arrayIndex) => {
        const existing = existingPlans.find(p => p.planType === String(pricePlanOptions[planIndex].value));

        if (existing) {
          newPricePlans.push(existing);
        } else {
          const planOption = pricePlanOptions[planIndex];
          newPricePlans.push({
            roomId: priceConfig.value.roomId,
            planName: planOption.label,
            planType: String(planOption.value),
            priceRatio: 100,
            price: priceConfig.value.price || 0,
            otherFees: [],
            defaultPlan: arrayIndex === 0
          });
        }
      });

      priceConfig.value.pricePlans = newPricePlans;

      const defaultIndex = newPricePlans.findIndex(p => p.defaultPlan);
      if (defaultIndex !== -1) {
        defaultPlanIndex.value = defaultIndex;
      } else if (newPricePlans.length > 0) {
        newPricePlans[0].defaultPlan = true;
        defaultPlanIndex.value = 0;
      }
    },
    { immediate: true }
  );

  // 导出数据
  function getRef() {
    return {
      ...priceConfig.value
    };
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="rent-config-container">
    <!-- 租金价格和底价配置 -->
    <div class="section">
      <el-row :gutter="40">
        <el-col :span="12">
          <el-form-item label="租金">
            <el-input v-model.number="priceConfig.price" :min="0" placeholder="请输入租金" type="number">
              <template #append>元/月</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="租金底价">
            <el-input v-model.number="priceConfig.floorPriceInput" :min="0" placeholder="请输入" type="number">
              <template #prepend>
                <el-select v-model="priceConfig.floorPriceMethod" placeholder="请选择" style="width: 140px">
                  <el-option v-for="item in priceMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
              <template #append>{{ floorPriceInputSuffix }}</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 其他费用配置 -->
    <OtherFeeSelect v-model="priceConfig.otherFees" />

    <!-- 更多租金方案配置 -->
    <div class="section mt-6">
      <h4 class="section-title">更多租金方案配置</h4>

      <div class="plan-selection">
        <el-checkbox-group v-model="selectedPlans">
          <el-checkbox v-for="(plan, index) in pricePlanOptions" :key="index" :label="index">{{ plan.label }}</el-checkbox>
        </el-checkbox-group>
      </div>

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
                <el-radio v-model="defaultPlanIndex" :label="index" @change="handleDefaultPlanChange(index)">
                  <span style="display: none">默认选项{{ index + 1 }}</span>
                </el-radio>
              </td>
              <td class="text-center">
                <span class="plan-type-text">{{ plan.planName }}</span>
              </td>
              <td class="text-center">
                <el-space style="align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center" class="text-center">
                  <span>出租价格</span>
                  <span>X</span>
                  <el-input-number v-model="plan.priceRatio" :min="0" :max="100" :precision="2" :controls="false">
                    <template #suffix>%</template>
                  </el-input-number>
                  <span>( 即:{{ Math.round((priceConfig.price || 0) * (plan.priceRatio / 100)) }} 元/月)</span>
                </el-space>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="plan-notes">
        <div class="note-item">租金方案中的租金,不支持小数,且个位数必须为0,若计算后存在小数和个位数,自动取偏小的整数,如"月付"方案的租金按折扣比例后为 1024.99元,则取1024元。</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* 样式保持不变 */
  .rent-config-container {
    margin-top: 8px;
    padding: 0px;
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .section {
    margin-bottom: 25px;
  }

  .section-title {
    margin: 0 0 8px 0;
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

  :deep(.el-space__item) {
    flex-shrink: 0;
  }

  :deep(.el-space) {
    flex-wrap: wrap;
  }
</style>
