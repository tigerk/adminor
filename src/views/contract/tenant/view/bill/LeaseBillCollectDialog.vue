<template>
  <div class="bill-collect-dialog">
    <div class="collect-hero">
      <div class="collect-hero__main">
        <div class="collect-hero__eyebrow">账单收款</div>
        <div class="collect-hero__title">第{{ bill.sortOrder || "-" }}期账单</div>
        <div class="collect-hero__meta">
          <span>账期：{{ formatDate(bill.billStart) }} ~ {{ formatDate(bill.billEnd) }}</span>
          <span>应缴日：{{ formatDate(bill.dueDate) }}</span>
        </div>
      </div>
      <div class="collect-hero__stats">
        <div class="hero-stat">
          <span class="hero-stat__label">账单应收</span>
          <span class="hero-stat__value">¥{{ moneyText(bill.totalAmount) }}</span>
        </div>
        <div class="hero-stat hero-stat--muted">
          <span class="hero-stat__label">累计已收</span>
          <span class="hero-stat__value">¥{{ moneyText(bill.paidAmount) }}</span>
        </div>
        <div class="hero-stat hero-stat--muted">
          <span class="hero-stat__label">当前待收</span>
          <span class="hero-stat__value">¥{{ moneyText(bill.unpaidAmount) }}</span>
        </div>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="collect-form">
      <div class="content-grid">
        <div class="section-card">
          <div class="section-card__title">支付信息</div>
          <div class="payment-shell">
            <div class="payment-amount-card">
              <div class="payment-amount-card__label">本次收款总额</div>
              <div class="payment-amount-card__value">¥{{ moneyText(form.totalAmount) }}</div>
              <div class="payment-amount-card__hint">金额由下方费用项分摊自动汇总</div>
            </div>

            <div class="form-grid">
              <el-form-item label="支付方式" prop="payChannel" class="form-grid__item">
                <el-select v-model="form.payChannel" class="w-full" placeholder="请选择支付方式">
                  <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="支付时间" prop="payTime" class="form-grid__item">
                <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
              </el-form-item>
            </div>
          </div>

          <div class="payment-tip-bar">
            <div class="payment-tip-bar__item">
              <span class="payment-tip-bar__label">分摊笔数</span>
              <strong>{{ form.items?.length || 0 }}</strong>
            </div>
            <div class="payment-tip-bar__item">
              <span class="payment-tip-bar__label">本次收款后累计已收</span>
              <strong>¥{{ moneyText(nextPaidAmount) }}</strong>
            </div>
            <div class="payment-tip-bar__item">
              <span class="payment-tip-bar__label">本次收款后待收</span>
              <strong :class="{ 'text-[#d97706]': nextUnpaidAmount > 0 }">¥{{ moneyText(nextUnpaidAmount) }}</strong>
            </div>
          </div>

          <div class="alloc-section">
            <div class="alloc-section__header">
              <div>
                <div class="alloc-section__title">费用项分配</div>
                <div class="alloc-section__subtitle">逐项录入本次实收金额，不允许超过该费用项待收金额</div>
              </div>
              <div class="alloc-section__actions">
                <el-button text @click="clearAllocation">清空分配</el-button>
                <el-button text type="primary" @click="fillAllUnpaid">全部收清</el-button>
              </div>
            </div>

            <div class="alloc-table">
              <div class="alloc-table__head">
                <div>费用项</div>
                <div>费用周期</div>
                <div>应收</div>
                <div>已收</div>
                <div>待收</div>
                <div>本次收款</div>
              </div>
              <div v-for="item in allocationList" :key="item.leaseBillFeeId" class="alloc-table__row">
                <div class="alloc-table__name">
                  <div class="alloc-table__name-main">
                    <span>{{ item.feeName || "-" }}</span>
                    <small>{{ feeTypeText(item.feeType) }}</small>
                  </div>
                </div>
                <div>{{ formatDate(item.feeStart) }} ~ {{ formatDate(item.feeEnd) }}</div>
                <div>¥{{ moneyText(item.amount) }}</div>
                <div>¥{{ moneyText(item.paidAmount) }}</div>
                <div class="alloc-table__unpaid">¥{{ moneyText(item.unpaidAmount) }}</div>
                <div>
                  <el-input-number
                    v-model="item.collectAmount"
                    :min="0"
                    :max="Number(item.unpaidAmount || 0)"
                    :precision="2"
                    controls-position="right"
                    class="w-full alloc-table__input"
                  />
                </div>
              </div>
              <div class="alloc-table__footer">
                <div class="alloc-table__footer-label">分配合计</div>
                <div class="alloc-table__footer-value">¥{{ moneyText(allocatedAmount) }}</div>
                <div class="alloc-table__footer-label">剩余待收</div>
                <div class="alloc-table__footer-value" :class="{ 'alloc-table__footer-value--warn': nextUnpaidAmount > 0 }">
                  ¥{{ moneyText(nextUnpaidAmount) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="preview-panel">
          <div class="preview-panel__title">结果预览</div>
          <div class="preview-panel__status">
            <span class="status-badge" :class="statusClass">{{ displayStatusText }}</span>
            <span v-if="isOverdue && resolvedPayStatus !== 2" class="overdue-badge">已逾期</span>
          </div>
          <div class="preview-panel__desc">账单支付状态根据累计已收金额自动计算，逾期作为独立状态展示，不与支付状态混用。</div>
          <div class="progress-card">
            <div class="progress-card__label">
              <span>收款进度</span>
              <strong>{{ collectProgressText }}</strong>
            </div>
            <el-progress :percentage="collectProgressPercent" :stroke-width="10" :show-text="false" :color="collectProgressColor" />
          </div>
          <div class="preview-metrics">
            <div class="preview-metric">
              <span>本次分配合计</span>
              <strong>¥{{ moneyText(allocatedAmount) }}</strong>
            </div>
            <div class="preview-metric">
              <span>收款后累计已收</span>
              <strong>¥{{ moneyText(nextPaidAmount) }}</strong>
            </div>
            <div class="preview-metric">
              <span>收款后剩余待收</span>
              <strong :class="{ 'text-[#d97706]': nextUnpaidAmount > 0 }">¥{{ moneyText(nextUnpaidAmount) }}</strong>
            </div>
            <div class="preview-metric">
              <span>逾期状态</span>
              <strong>{{ isOverdue && resolvedPayStatus !== 2 ? "已逾期" : "未逾期" }}</strong>
            </div>
          </div>
        </div>
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
  import { ElMessage } from "element-plus";
  import type { FormInstance, FormRules } from "element-plus";
  import type { LeaseBillCollectDto, LeaseBillCollectItemDto, LeaseBillFeeVo, LeaseBillListVo } from "@/types";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  interface Props {
    bill: LeaseBillListVo;
  }

  interface AllocationItem extends LeaseBillFeeVo {
    leaseBillFeeId?: string;
    collectAmount: number;
  }

  const props = defineProps<Props>();
  const formRef = ref<FormInstance>();
  const allocationList = ref<AllocationItem[]>([]);

  const form = reactive<LeaseBillCollectDto>({
    id: props.bill.id,
    totalAmount: 0,
    payChannel: undefined,
    payTime: undefined,
    items: []
  });

  const payChannelMap: Record<string, number> = {
    CASH: 1,
    TRANSFER: 2,
    ALIPAY: 3,
    WECHAT: 4,
    POS: 5,
    OTHER: 5
  };

  const payChannelOptions = Object.values(PaymentFlowChannelEnumMeta)
    .map(item => ({ label: item.label, value: payChannelMap[item.code] }))
    .filter((item, index, list) => item.value != null && list.findIndex(option => option.value === item.value) === index);

  const rules = reactive<FormRules>({
    totalAmount: [{ required: true, message: "请输入本次收款总额", trigger: "blur" }],
    payChannel: [{ required: true, message: "请选择支付方式", trigger: "change" }],
    payTime: [{ required: true, message: "请选择支付时间", trigger: "change" }]
  });

  const allocatedAmount = computed(() => allocationList.value.reduce((sum, item) => sum + Number(item.collectAmount || 0), 0));
  const nextPaidAmount = computed(() => Number(props.bill.paidAmount || 0) + allocatedAmount.value);
  const nextUnpaidAmount = computed(() => Math.max(Number(props.bill.totalAmount || 0) - nextPaidAmount.value, 0));
  const resolvedPayStatus = computed(() => {
    if (nextPaidAmount.value <= 0) return 0;
    if (nextPaidAmount.value >= Number(props.bill.totalAmount || 0)) return 2;
    return 1;
  });
  const isOverdue = computed(() => {
    if (!props.bill.dueDate || resolvedPayStatus.value === 2) return false;
    return new Date(props.bill.dueDate).getTime() < Date.now();
  });
  const displayStatusText = computed(() => {
    if (resolvedPayStatus.value === 2) return "已支付";
    if (resolvedPayStatus.value === 1) return "部分支付";
    return "未支付";
  });
  const statusClass = computed(() => {
    if (resolvedPayStatus.value === 2) return "status-badge--paid";
    if (resolvedPayStatus.value === 1) return "status-badge--partial";
    return "status-badge--unpaid";
  });
  const collectProgressPercent = computed(() => {
    const total = Number(props.bill.totalAmount || 0);
    if (total <= 0) return 0;
    return Number(Math.min((nextPaidAmount.value / total) * 100, 100).toFixed(2));
  });
  const collectProgressText = computed(() => `${collectProgressPercent.value}%`);
  const collectProgressColor = computed(() => {
    if (resolvedPayStatus.value === 2) return "#16a34a";
    if (resolvedPayStatus.value === 1) return "#f59e0b";
    return "#ef4444";
  });

  const syncItemsToForm = () => {
    form.items = allocationList.value
      .filter(item => Number(item.collectAmount || 0) > 0)
      .map<LeaseBillCollectItemDto>(item => ({
        leaseBillFeeId: item.leaseBillFeeId,
        amount: Number(item.collectAmount || 0)
      }));
    form.totalAmount = Number(allocatedAmount.value.toFixed(2));
  };

  watch(
    () => props.bill,
    bill => {
      allocationList.value = (bill.feeList || []).map(item => ({
        ...item,
        leaseBillFeeId: item.id,
        collectAmount: 0
      }));
      syncItemsToForm();
    },
    { immediate: true, deep: true }
  );

  watch(allocationList, syncItemsToForm, { deep: true });

  const fillAllUnpaid = () => {
    allocationList.value.forEach(item => {
      item.collectAmount = Number(item.unpaidAmount || 0);
    });
  };

  const clearAllocation = () => {
    allocationList.value.forEach(item => {
      item.collectAmount = 0;
    });
  };

  const feeTypeText = (feeType?: string) => {
    if (feeType === "RENTAL") return "租金";
    if (feeType === "DEPOSIT") return "押金";
    return "其他费用";
  };

  const moneyText = (value?: number) => Number(value || 0).toFixed(2);
  const formatDate = (value?: string) => (value ? value.substring(0, 10) : "—");

  const validate = async () => {
    if (!formRef.value) return false;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return false;
    if (!form.items?.length) {
      ElMessage.warning("请至少分配一条费用项收款金额");
      return false;
    }
    if (Math.abs((form.totalAmount || 0) - allocatedAmount.value) > 0.001) {
      ElMessage.warning("收款总额与费用项分配金额不一致");
      return false;
    }
    return true;
  };

  const getFormData = (): LeaseBillCollectDto => ({
    id: form.id,
    totalAmount: form.totalAmount,
    payChannel: form.payChannel,
    payTime: form.payTime,
    items: form.items
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
    justify-content: space-between;
    gap: 20px;
    padding: 24px;
    border-radius: 18px;
    border: 1px solid #dbeafe;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 36%),
      linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  }

  .collect-hero__eyebrow {
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .collect-hero__title {
    margin-top: 6px;
    color: #0f172a;
    font-size: 24px;
    font-weight: 700;
  }

  .collect-hero__meta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
  }

  .collect-hero__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    gap: 10px;
  }

  .hero-stat {
    display: grid;
    gap: 4px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #bfdbfe;
  }

  .hero-stat--muted {
    border-color: #e2e8f0;
  }

  .hero-stat__label {
    color: #64748b;
    font-size: 12px;
  }

  .hero-stat__value {
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.9fr);
    gap: 14px;
  }

  .section-card,
  .preview-panel,
  .summary-card {
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    background: #fff;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
  }

  .section-card {
    padding: 20px;
  }

  .section-card__title,
  .preview-panel__title {
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
  }

  .form-grid__item--full {
    grid-column: 1 / -1;
  }

  .payment-shell {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 16px;
    align-items: stretch;
  }

  .payment-amount-card {
    display: grid;
    align-content: center;
    gap: 6px;
    padding: 16px 18px;
    border-radius: 16px;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
    border: 1px solid #bfdbfe;
  }

  .payment-amount-card__label {
    color: #64748b;
    font-size: 12px;
  }

  .payment-amount-card__value {
    color: #1d4ed8;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
  }

  .payment-amount-card__hint {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  .payment-tip-bar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .payment-tip-bar__item {
    display: grid;
    gap: 4px;
  }

  .payment-tip-bar__label {
    color: #64748b;
    font-size: 12px;
  }

  .payment-tip-bar__item strong {
    color: #0f172a;
    font-size: 14px;
  }

  .alloc-section {
    margin-top: 12px;
    padding-top: 14px;
    border-top: 1px solid #eef2f7;
  }

  .alloc-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .alloc-section__title {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  .alloc-section__subtitle {
    margin-top: 2px;
    color: #6b7280;
    font-size: 12px;
  }

  .alloc-table {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
  }

  .alloc-table__head,
  .alloc-table__row {
    display: grid;
    grid-template-columns: 1.3fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
  }

  .alloc-table__head {
    background: #f8fafc;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }

  .alloc-table__row {
    border-top: 1px solid #eef2f7;
    font-size: 13px;
    color: #0f172a;
  }

  .alloc-table__name {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .alloc-table__name-main {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .alloc-table__name-main span {
    color: #0f172a;
    font-weight: 600;
  }

  .alloc-table__name-main small {
    color: #64748b;
    font-size: 12px;
  }

  .alloc-table__unpaid {
    color: #d97706;
    font-weight: 600;
  }

  .alloc-table__input :deep(.el-input__wrapper) {
    border-radius: 10px;
  }

  .alloc-table__footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }

  .alloc-table__footer-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
  }

  .alloc-table__footer-value {
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
  }

  .alloc-table__footer-value--warn {
    color: #d97706;
  }

  .preview-panel {
    padding: 20px;
    display: grid;
    gap: 14px;
    align-content: start;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  }

  .preview-panel__status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-panel__desc {
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 88px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
  }

  .status-badge--paid {
    background: #dcfce7;
    color: #16a34a;
  }

  .status-badge--partial {
    background: #fef3c7;
    color: #d97706;
  }

  .status-badge--unpaid {
    background: #fee2e2;
    color: #dc2626;
  }

  .overdue-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 999px;
    background: #fff7ed;
    color: #d97706;
    font-size: 12px;
    font-weight: 700;
  }

  .progress-card {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e5e7eb;
  }

  .progress-card__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #475569;
    font-size: 13px;
  }

  .progress-card__label strong {
    color: #0f172a;
    font-size: 14px;
  }

  .preview-metrics {
    display: grid;
    gap: 10px;
  }

  .preview-metric {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #edf2f7;
    font-size: 13px;
  }

  .preview-metric strong {
    color: #0f172a;
    font-size: 14px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .summary-card {
    padding: 18px 20px;
  }

  .summary-card__label {
    color: #64748b;
    font-size: 12px;
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

  @media (max-width: 960px) {
    .collect-hero,
    .content-grid,
    .summary-grid {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .collect-hero__stats,
    .form-grid,
    .payment-tip-bar,
    .payment-shell {
      grid-template-columns: 1fr;
    }

    .form-grid__item--full {
      grid-column: auto;
    }

    .alloc-table__head,
    .alloc-table__row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .alloc-table__footer {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
