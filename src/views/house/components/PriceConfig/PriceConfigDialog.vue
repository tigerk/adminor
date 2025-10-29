<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import type { PriceConfigFormProps } from "./types";
  import { OtherFeeProps, PriceConfigProps, PricePlanProps } from "@/types";
  import { PAYMENT_METHOD_OPTIONS, PRICE_PLANT_OPTIONS } from "@/constants";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  const { getDefaultOtherFee } = usePriceConfigEdit();

  const props = withDefaults(defineProps<PriceConfigFormProps>(), {});

  const priceConfig = ref<PriceConfigProps>({
    ...props.formInline
  });

  const otherFeeTypeOptions = ref([]);

  onMounted(() => {
    /**
     * {
     *     "code": 0,
     *     "message": "请求成功",
     *     "data": [
     *         {
     *             "dictCode": "cost_deposit",
     *             "dictName": "押金",
     *             "dictDataList": [
     *                 {
     *                     "id": "1983087625104396290",
     *                     "name": "水电燃押金",
     *                     "value": "shuidianranyajin",
     *                     "color": "#6abe39"
     *                 },
     *                 {
     *                     "id": "1983087665550069762",
     *                     "name": "暖气费押金",
     *                     "value": "nuanqifeiyajin",
     *                     "color": "#6abe39"
     *                 }
     *             ]
     *         },
     *         {
     *             "dictCode": "cost_earnest_money",
     *             "dictName": "定金",
     *             "dictDataList": [
     *                 {
     *                     "id": "1983087527930761218",
     *                     "name": "预付定金",
     *                     "value": "yufudingjin",
     *                     "color": "#6abe39"
     *                 }
     *             ]
     *         },
     *         {
     *             "dictCode": "cost_maintainance",
     *             "dictName": "装修/维修",
     *             "dictDataList": [
     *                 {
     *                     "id": "1983087488114233346",
     *                     "name": "房屋维修",
     *                     "value": "fangwuweixiu",
     *                     "color": "#6abe39"
     *                 }
     *             ]
     *         },
     *         {
     *             "dictCode": "cost_other_fee",
     *             "dictName": "其他费用类型",
     *             "dictDataList": [
     *                 {
     *                     "id": "1978699667417067521",
     *                     "name": "装修/维修/房屋维修",
     *                     "value": "zhuangxiuweixiufangwuweixiu",
     *                     "color": "#e84749"
     *                 }
     *             ]
     *         }
     *     ]
     * }
     */
    getDictDataByDictCode({
      dictCode: "fee_type"
    }).then(res => {
      otherFeeTypeOptions.value = res.data;
    });
  });

  // 其他费用类型选项
  const feeTypeOptions = [
    { label: "装修/维修/房屋维修", value: "maintenance" },
    { label: "其他", value: "other" }
  ];

  // 付款方式选项
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const pricePlantOptions = PRICE_PLANT_OPTIONS;

  // 其他费用列表（基础费用）
  // 从后端接口获取
  const otherFees = reactive<OtherFeeProps[]>([]);

  // 租金方案列表
  const pricePlans = reactive<PricePlanProps[]>([]);

  // 当前选中的方案索引
  const selectedPlans = ref([1]); // 默认选中月付

  // 添加其他费用
  const addOtherFee = () => {
    otherFees.push(getDefaultOtherFee());
  };

  // 删除其他费用
  const removeOtherFee = (index: number) => {
    if (otherFees.length > 1) {
      otherFees.splice(index, 1);
    }
  };

  // 导出数据
  function getRef() {
    return {
      otherFees: otherFees,
      pricePlans: pricePlans,
      selectedPlans: selectedPlans.value
    };
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="rent-config-container">
    <!-- 其他费用配置 -->
    <div class="section">
      <h4 class="section-title">
        其他费用
        <span class="section-subtitle">(租金以外的费用，或用于计费有支付方式)</span>
      </h4>
      <div class="fee-list">
        <div v-for="(feeItem, index) in priceConfig.otherFees" :key="index" class="fee-item">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="费用类型">
                <el-cascader placeholder="请选择费用类型" :options="otherFeeTypeOptions" filterable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="付款方式">
                <el-select v-model="feeItem.paymentMethod" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="金额">
                <el-input v-model.number="feeItem.priceInput" placeholder="请输入" type="number">
                  <template #suffix>元/月</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-form-item label="操作">
                <el-button type="danger" link :disabled="otherFees.length <= 1" @click="removeOtherFee(index)">删除</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
      <el-button type="primary" plain size="small" @click="addOtherFee">+ 添加其他费用</el-button>

      <!-- 共他费用 -->
      <div class="other-fees-note">
        <el-icon>
          <InfoFilled />
        </el-icon>
        若有其他费用方案，则按上述推广上架
      </div>
    </div>

    <!-- 更多租金方案配置 -->
    <div class="section mt-6">
      <h4 class="section-title">更多租金方案配置</h4>

      <div class="plan-selection">
        <el-checkbox-group v-model="selectedPlans">
          <el-checkbox v-for="(plan, index) in pricePlantOptions" :key="index" :label="index">{{ plan.label }}</el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="plan-notes">
        <div class="note-item">1. 若有租入方案，则按"推广"上架上述1默认</div>
        <div class="note-item">2. 租金方案中的租金，不支持小数，且不低于20,若算后的数为小数时，若计算后会小于1258.99元，则取1258元；若大于1250元，则取1250元。</div>
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
    font-size: 16px;
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

  .other-fees-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: #ecf5ff;
    border-left: 3px solid #409eff;
    border-radius: 4px;
    color: #409eff;
    font-size: 14px;
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
    padding: 12px;
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
    padding: 8px 12px;
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

  .other-fees-summary {
    font-size: 13px;
    color: #606266;
  }

  .fee-summary-item {
    margin-bottom: 4px;
  }

  .fee-summary-item:last-child {
    margin-bottom: 0;
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

  :deep(.el-space) {
    width: 100%;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
</style>
