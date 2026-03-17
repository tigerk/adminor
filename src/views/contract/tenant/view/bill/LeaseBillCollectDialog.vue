<template>
  <div class="bill-collect-dialog">
    <div class="collect-hero">
      <div class="collect-hero__main">
        <div class="collect-hero__label">账单收款</div>
        <div class="collect-hero__title">第{{ bill.sortOrder || "-" }}期 · 应收 ¥{{ moneyText(bill.totalAmount) }}</div>
        <div class="collect-hero__meta">账期：{{ formatDate(bill.billStart) }} ~ {{ formatDate(bill.billEnd) }}</div>
      </div>
      <div class="collect-hero__aside">
        <div class="collect-hero__status" :class="statusClass">{{ displayStatusText }}</div>
        <div class="collect-hero__amounts">
          <div class="amount-chip">
            <span class="amount-chip__label">本次收款</span>
            <span class="amount-chip__value">¥{{ moneyText(form.payAmount) }}</span>
          </div>
          <div class="amount-chip amount-chip--ghost">
            <span class="amount-chip__label">剩余待收</span>
            <span class="amount-chip__value">¥{{ moneyText(remainingAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="collect-form">
      <div class="content-grid">
        <div class="section-card section-card--form">
          <div class="section-card__title">收款信息</div>
          <div class="form-grid">
            <el-form-item label="支付金额" prop="payAmount" class="form-grid__item">
              <el-input-number v-model="form.payAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
            </el-form-item>
            <el-form-item label="支付方式" prop="payChannel" class="form-grid__item">
              <el-select v-model="form.payChannel" class="w-full" placeholder="请选择支付方式">
                <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="支付时间" prop="payTime" class="form-grid__item form-grid__item--full">
              <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
            </el-form-item>
          </div>
        </div>

        <div class="status-panel">
          <div class="status-panel__title">收款结果预览</div>
          <div class="status-panel__badge" :class="statusClass">{{ displayStatusText }}</div>
          <div class="status-panel__desc">系统会根据支付金额自动判断最终支付状态。</div>
          <div class="status-panel__metrics">
            <div class="metric-item">
              <span class="metric-item__label">应收总额</span>
              <span class="metric-item__value">¥{{ moneyText(bill.totalAmount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">本次收款</span>
              <span class="metric-item__value">¥{{ moneyText(form.payAmount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">剩余待收</span>
              <span class="metric-item__value" :class="{ 'metric-item__value--danger': remainingAmount > 0 }">¥{{ moneyText(remainingAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card summary-card--person">
          <div class="summary-card__label">付款人</div>
          <div class="summary-card__value">{{ bill.payerName || "—" }}</div>
          <div class="summary-card__sub">{{ bill.payerPhone || "—" }}</div>
        </div>
        <div class="summary-card summary-card--address">
          <div class="summary-card__label">房源地址</div>
          <div class="summary-card__value">{{ bill.roomAddress || "—" }}</div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { LeaseBillCollectDto, LeaseBillListVo } from "@/types";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  interface Props {
    bill: LeaseBillListVo;
  }

  const props = defineProps<Props>();

  const formRef = ref<FormInstance>();
  const form = reactive<LeaseBillCollectDto>({
    id: props.bill.id,
    payAmount: props.bill.payAmount ?? props.bill.totalAmount ?? 0,
    payChannel: props.bill.payChannel,
    payTime: props.bill.payTime
  });

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
    payAmount: [{ required: true, message: "请输入支付金额", trigger: "blur" }],
    payChannel: [{ required: true, message: "请选择支付方式", trigger: "change" }],
    payTime: [{ required: true, message: "请选择支付时间", trigger: "change" }]
  });

  const isOverdue = computed(() => {
    if (resolvedPayStatus.value === 2 || !props.bill.dueDate) return false;
    return new Date(props.bill.dueDate).getTime() < Date.now();
  });

  const resolvedPayStatus = computed(() => {
    const totalAmount = Number(props.bill.totalAmount || 0);
    const payAmount = Number(form.payAmount || 0);
    if (payAmount <= 0) return 0;
    if (totalAmount > 0 && payAmount >= totalAmount) return 2;
    return 1;
  });

  const displayStatusText = computed(() => {
    if (resolvedPayStatus.value === 2) return "已支付";
    if (isOverdue.value) return "逾期";
    if (resolvedPayStatus.value === 1) return "部分支付";
    return "未支付";
  });

  const remainingAmount = computed(() => {
    const totalAmount = Number(props.bill.totalAmount || 0);
    const payAmount = Number(form.payAmount || 0);
    return Math.max(totalAmount - payAmount, 0);
  });

  const statusClass = computed(() => {
    if (resolvedPayStatus.value === 2) return "status--2";
    if (isOverdue.value) return "status--overdue";
    return `status--${resolvedPayStatus.value}`;
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
    payStatus: resolvedPayStatus.value,
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
    gap: 18px;
    padding-bottom: 16px;
  }

  .collect-hero {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 24px;
    border: 1px solid #dbeafe;
    border-radius: 18px;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 36%),
      linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
    box-shadow: 0 18px 40px rgba(37, 99, 235, 0.08);
  }

  .collect-hero__main {
    min-width: 0;
  }

  .collect-hero__label {
    color: #2563eb;
    font-size: 12px;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .collect-hero__title {
    margin-top: 6px;
    color: #111827;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.25;
  }

  .collect-hero__meta {
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
  }

  .collect-hero__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
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

  .collect-hero__amounts {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .amount-chip {
    display: grid;
    gap: 4px;
    min-width: 124px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(191, 219, 254, 0.95);
  }

  .amount-chip--ghost {
    background: rgba(248, 250, 252, 0.95);
    border-color: #e2e8f0;
  }

  .amount-chip__label {
    color: #64748b;
    font-size: 12px;
  }

  .amount-chip__value {
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
    gap: 14px;
    align-items: stretch;
  }

  .section-card {
    padding: 20px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
  }

  .section-card--form {
    padding-bottom: 6px;
  }

  .section-card__title {
    margin-bottom: 14px;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
  }

  .form-grid__item {
    min-width: 0;
  }

  .form-grid__item--full {
    grid-column: 1 / -1;
  }

  .status-panel {
    display: grid;
    align-content: start;
    gap: 14px;
    padding: 20px;
    border-radius: 18px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
  }

  .status-panel__title {
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
  }

  .status-panel__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-width: 88px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
  }

  .status-panel__desc {
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
  }

  .status-panel__metrics {
    display: grid;
    gap: 10px;
  }

  .metric-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #edf2f7;
  }

  .metric-item__label {
    color: #64748b;
    font-size: 13px;
  }

  .metric-item__value {
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
  }

  .metric-item__value--danger {
    color: #d97706;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .summary-card {
    padding: 18px 20px;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
  }

  .summary-card__label {
    color: #64748b;
    font-size: 12px;
    letter-spacing: 0.04em;
  }

  .summary-card__value {
    margin-top: 8px;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    word-break: break-all;
  }

  .summary-card__sub {
    margin-top: 6px;
    color: #475569;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .collect-hero,
    .content-grid,
    .summary-grid {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .collect-hero__aside {
      align-items: flex-start;
    }

    .collect-hero__amounts {
      justify-content: flex-start;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-grid__item--full {
      grid-column: auto;
    }
  }
</style>
