<template>
  <div class="bill-collect-dialog">
    <div class="collect-hero">
      <div>
        <div class="collect-hero__label">账单收款</div>
        <div class="collect-hero__title">第{{ bill.sortOrder || "-" }}期 · 应收 ¥{{ moneyText(bill.totalAmount) }}</div>
        <div class="collect-hero__meta">账期：{{ formatDate(bill.billStart) }} ~ {{ formatDate(bill.billEnd) }}</div>
      </div>
      <div class="collect-hero__status" :class="statusClass">{{ displayStatusText }}</div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="collect-form">
      <div class="section-card">
        <div class="section-card__title">收款信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="支付状态" prop="payStatus">
              <el-select v-model="form.payStatus" class="w-full" placeholder="请选择支付状态">
                <el-option v-for="item in payStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付金额" prop="payAmount">
              <el-input-number v-model="form.payAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="支付方式" prop="payChannel">
              <el-select v-model="form.payChannel" class="w-full" placeholder="请选择支付方式">
                <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付时间" prop="payTime">
              <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card__label">付款人</div>
          <div class="summary-card__value">{{ bill.payerName || "—" }}</div>
          <div class="summary-card__sub">{{ bill.payerPhone || "—" }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card__label">房源地址</div>
          <div class="summary-card__value">{{ bill.roomAddress || "—" }}</div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { LeaseBillCollectDto, LeaseBillListVo } from "@/types";
  import { PaymentFlowChannelEnumMeta, PayStatusEnumMeta } from "@/types/generated/enum.meta";

  interface Props {
    bill: LeaseBillListVo;
  }

  const props = defineProps<Props>();

  const formRef = ref<FormInstance>();
  const form = reactive<LeaseBillCollectDto>({
    id: props.bill.id,
    payStatus: props.bill.payStatus ?? 0,
    payAmount: props.bill.payAmount ?? props.bill.totalAmount ?? 0,
    payChannel: props.bill.payChannel,
    payTime: props.bill.payTime
  });

  const payStatusOptions = Object.values(PayStatusEnumMeta)
    .filter(item => item.code !== 2)
    .map(item => ({
      label: item.name,
      value: item.code
    }));

  const billPayChannelValueMap: Record<string, number> = {
    CASH: 1,
    TRANSFER: 2,
    ALIPAY: 3,
    WECHAT: 4,
    POS: 5,
    OTHER: 5
  };

  const payChannelOptions = Object.values(PaymentFlowChannelEnumMeta)
    .map(item => ({
      label: item.label,
      value: billPayChannelValueMap[item.code]
    }))
    .filter((item, index, list) => item.value != null && list.findIndex(option => option.value === item.value) === index);

  const rules = reactive<FormRules>({
    payStatus: [{ required: true, message: "请选择支付状态", trigger: "change" }],
    payAmount: [{ required: true, message: "请输入支付金额", trigger: "blur" }],
    payChannel: [{ required: true, message: "请选择支付方式", trigger: "change" }],
    payTime: [{ required: true, message: "请选择支付时间", trigger: "change" }]
  });

  const payStatusText = computed(() => {
    const item = payStatusOptions.find(option => option.value === form.payStatus);
    return item?.label || "—";
  });

  const isOverdue = computed(() => {
    if (form.payStatus === 2 || !props.bill.dueDate) return false;
    return new Date(props.bill.dueDate).getTime() < Date.now();
  });

  const isPaidPreview = computed(() => {
    const totalAmount = Number(props.bill.totalAmount || 0);
    const payAmount = Number(form.payAmount || 0);
    return totalAmount > 0 && payAmount >= totalAmount;
  });

  const displayStatusText = computed(() => {
    if (isPaidPreview.value) return "已支付";
    if (isOverdue.value) return "逾期";
    return payStatusText.value;
  });

  const statusClass = computed(() => {
    if (isPaidPreview.value) return "status--2";
    if (isOverdue.value) return "status--overdue";
    return `status--${form.payStatus}`;
  });

  const moneyText = (value?: number) => Number(value || 0).toFixed(2);
  const formatDate = (value?: string) => (value ? value.substring(0, 10) : "—");

  const validate = async () => {
    if (!formRef.value) return false;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return false;
    if (Number(form.payAmount || 0) <= 0) return false;
    return true;
  };

  const getFormData = (): LeaseBillCollectDto => ({
    id: form.id,
    payStatus: form.payStatus,
    payAmount: form.payAmount,
    payChannel: form.payChannel,
    payTime: form.payTime
  });

  defineExpose({
    validate,
    getFormData
  });
</script>

<style scoped lang="scss">
  .bill-collect-dialog {
    display: grid;
    gap: 16px;
    padding-bottom: 12px;
  }

  .collect-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  }

  .collect-hero__label {
    color: #2563eb;
    font-size: 13px;
    font-weight: 600;
  }

  .collect-hero__title {
    margin-top: 6px;
    color: #111827;
    font-size: 20px;
    font-weight: 700;
  }

  .collect-hero__meta {
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
  }

  .collect-hero__status {
    min-width: 88px;
    padding: 10px 14px;
    border-radius: 999px;
    text-align: center;
    font-weight: 600;
    background: #fee2e2;
    color: #dc2626;
  }

  .collect-hero__status.status--1 {
    background: #fef3c7;
    color: #d97706;
  }

  .collect-hero__status.status--2 {
    background: #dcfce7;
    color: #16a34a;
  }

  .collect-hero__status.status--overdue {
    background: #ffe4e6;
    color: #e11d48;
  }

  .section-card {
    padding: 18px 20px 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
  }

  .section-card__title {
    margin-bottom: 12px;
    color: #111827;
    font-size: 15px;
    font-weight: 700;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    padding: 16px 18px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .summary-card__label {
    color: #64748b;
    font-size: 12px;
  }

  .summary-card__value {
    margin-top: 8px;
    color: #111827;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    word-break: break-all;
  }

  .summary-card__sub {
    margin-top: 6px;
    color: #475569;
    font-size: 13px;
  }
</style>
