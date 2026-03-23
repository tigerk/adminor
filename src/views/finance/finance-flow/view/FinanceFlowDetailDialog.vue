<template>
  <div v-loading="loading" class="ffd-wrap">
    <div class="ffd-hero">
      <div class="ffd-hero__left">
        <span class="ffd-hero__label">财务流水号</span>
        <div class="ffd-hero__no">{{ detail.flowNo || "—" }}</div>
      </div>
      <div class="ffd-hero__right">
        <div class="status-badge" :class="`status-badge--${statusBadgeType(detail.status)}`">
          <span class="status-badge__dot" />
          {{ statusText(detail.status) }}
        </div>
      </div>
    </div>

    <div class="ffd-amount-bar">
      <div class="amount-main">
        <span class="amount-label">流水金额</span>
        <span class="amount-value">{{ moneyText(detail.amount) }}</span>
      </div>
      <div class="amount-meta">
        <div class="meta-item">
          <span class="meta-label">流水类型</span>
          <span class="meta-value">{{ flowTypeText(detail.flowType) }}</span>
        </div>
        <div class="meta-divider" />
        <div class="meta-item">
          <span class="meta-label">资金方向</span>
          <span class="meta-value">{{ flowDirectionText(detail.flowDirection) }}</span>
        </div>
        <div class="meta-divider" />
        <div class="meta-item">
          <span class="meta-label">流水时间</span>
          <span class="meta-value">{{ formatDateTime(detail.flowTime) }}</span>
        </div>
      </div>
    </div>

    <div class="ffd-grid">
      <div class="info-card">
        <div class="info-card__header"><span class="info-card__title">费用关联</span></div>
        <div class="info-card__body">
          <div class="info-row">
            <span class="info-row__key">业务类型</span>
            <span class="info-row__val">{{ bizTypeText(detail.bizType) }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">Biz ID</span>
            <span class="info-row__val mono">{{ detail.bizId || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">费用类型</span>
            <span class="info-row__val">{{ feeTypeText(detail.feeType) }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">费用名称</span>
            <span class="info-row__val">{{ detail.feeName || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">所属账单</span>
            <span class="info-row__val">{{ detail.sortOrder ? `第 ${detail.sortOrder} 期` : "—" }}</span>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card__header"><span class="info-card__title">租客与房源</span></div>
        <div class="info-card__body">
          <div class="info-row">
            <span class="info-row__key">租客姓名</span>
            <span class="info-row__val">{{ detail.tenantName || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">联系电话</span>
            <span class="info-row__val">{{ detail.tenantPhone || "—" }}</span>
          </div>
          <div class="info-row info-row--full">
            <span class="info-row__key">房源信息</span>
            <span class="info-row__val">{{ detail.roomAddress || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">账单周期</span>
            <span class="info-row__val">{{ formatDate(detail.billStart) }} ~ {{ formatDate(detail.billEnd) }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">应收日期</span>
            <span class="info-row__val">{{ formatDate(detail.dueDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="info-card">
      <div class="info-card__header"><span class="info-card__title">支付关联</span></div>
      <div class="info-card__body info-card__body--row">
        <div class="info-row">
          <span class="info-row__key">支付流水号</span>
          <span class="info-row__val mono">{{ detail.paymentNo || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">支付方式</span>
          <span class="info-row__val">{{ channelText(detail.paymentChannel) }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">支付状态</span>
          <span class="info-row__val">{{ paymentStatusText(detail.paymentStatus) }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">审批状态</span>
          <span class="info-row__val">{{ approvalStatusText(detail.paymentApprovalStatus) }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">支付时间</span>
          <span class="info-row__val">{{ formatDateTime(detail.payTime) }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">交易流水号</span>
          <span class="info-row__val mono">{{ detail.thirdTradeNo || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">付款人</span>
          <span class="info-row__val">{{ detail.payerName || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">付款人电话</span>
          <span class="info-row__val">{{ detail.payerPhone || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">收款方</span>
          <span class="info-row__val">{{ detail.receiverName || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">操作人</span>
          <span class="info-row__val">{{ detail.operatorName || "—" }}</span>
        </div>
        <div class="info-row info-row--full">
          <span class="info-row__key">财务备注</span>
          <span class="info-row__val">{{ detail.remark || "—" }}</span>
        </div>
        <div class="info-row info-row--full">
          <span class="info-row__key">支付备注</span>
          <span class="info-row__val">{{ detail.paymentRemark || "—" }}</span>
        </div>
      </div>
    </div>

    <div v-if="detail.paymentVoucherUrl" class="info-card">
      <div class="info-card__header"><span class="info-card__title">支付凭证</span></div>
      <div class="info-card__body">
        <el-image :src="detail.paymentVoucherUrl" fit="contain" class="voucher-img" preview-teleported :preview-src-list="[detail.paymentVoucherUrl]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import dayjs from "dayjs";
  import type { FinanceFlowFinanceItemVo } from "@/types";
  import { getFinanceFlowDetail } from "@/api/finance/financeFlow";
  import {
    BizApprovalStatusEnumMeta,
    FinanceBizTypeEnumMeta,
    FinanceFlowDirectionEnumMeta,
    FinanceFlowStatusEnumMeta,
    FinanceFlowTypeEnumMeta,
    LeaseBillFeeTypeEnumMeta,
    PaymentFlowChannelEnumMeta,
    PaymentFlowStatusEnumMeta
  } from "@/types";

  const props = defineProps<{ flowId: string }>();
  const loading = ref(false);
  const detail = ref<FinanceFlowFinanceItemVo>({});

  async function fetchDetail() {
    if (!props.flowId) return;
    loading.value = true;
    try {
      const { data } = await getFinanceFlowDetail({ id: props.flowId });
      detail.value = data || {};
    } finally {
      loading.value = false;
    }
  }

  function moneyText(value?: number) {
    return `¥ ${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function formatDate(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD") : "—";
  }
  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";
  }
  function statusText(value?: number) {
    const map: Record<number, string> = {
      [FinanceFlowStatusEnumMeta.PENDING.code]: FinanceFlowStatusEnumMeta.PENDING.label,
      [FinanceFlowStatusEnumMeta.SUCCESS.code]: FinanceFlowStatusEnumMeta.SUCCESS.label,
      [FinanceFlowStatusEnumMeta.VOIDED.code]: FinanceFlowStatusEnumMeta.VOIDED.label
    };
    return value !== undefined ? (map[value] ?? "—") : "—";
  }
  function statusBadgeType(value?: number): "warning" | "success" | "info" | "danger" {
    if (value === FinanceFlowStatusEnumMeta.SUCCESS.code) return "success";
    if (value === FinanceFlowStatusEnumMeta.VOIDED.code) return "info";
    return "warning";
  }
  function flowTypeText(value?: string) {
    if (!value) return "—";
    return (FinanceFlowTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }
  function flowDirectionText(value?: string) {
    if (!value) return "—";
    return (FinanceFlowDirectionEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }
  function bizTypeText(value?: string) {
    if (!value) return "—";
    return (FinanceBizTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }
  function feeTypeText(value?: string) {
    if (!value) return "—";
    return (LeaseBillFeeTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }
  function channelText(value?: string) {
    if (!value) return "—";
    return (PaymentFlowChannelEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }
  function paymentStatusText(value?: number) {
    if (value === undefined || value === null) return "—";
    const map: Record<number, string> = {
      [PaymentFlowStatusEnumMeta.PENDING.code]: PaymentFlowStatusEnumMeta.PENDING.label,
      [PaymentFlowStatusEnumMeta.PENDING_APPROVAL.code]: PaymentFlowStatusEnumMeta.PENDING_APPROVAL.label,
      [PaymentFlowStatusEnumMeta.SUCCESS.code]: PaymentFlowStatusEnumMeta.SUCCESS.label,
      [PaymentFlowStatusEnumMeta.FAILED.code]: PaymentFlowStatusEnumMeta.FAILED.label,
      [PaymentFlowStatusEnumMeta.CLOSED.code]: PaymentFlowStatusEnumMeta.CLOSED.label,
      [PaymentFlowStatusEnumMeta.REFUNDING.code]: PaymentFlowStatusEnumMeta.REFUNDING.label,
      [PaymentFlowStatusEnumMeta.REFUNDED.code]: PaymentFlowStatusEnumMeta.REFUNDED.label
    };
    return map[value] ?? "—";
  }
  function approvalStatusText(value?: number) {
    if (value === undefined || value === null) return "—";
    const map: Record<number, string> = {
      [BizApprovalStatusEnumMeta.PENDING.code]: BizApprovalStatusEnumMeta.PENDING.name,
      [BizApprovalStatusEnumMeta.APPROVED.code]: BizApprovalStatusEnumMeta.APPROVED.name,
      [BizApprovalStatusEnumMeta.REJECTED.code]: BizApprovalStatusEnumMeta.REJECTED.name,
      [BizApprovalStatusEnumMeta.WITHDRAWN.code]: BizApprovalStatusEnumMeta.WITHDRAWN.name
    };
    return map[value] ?? "—";
  }

  onMounted(fetchDetail);
</script>

<style scoped>
  .ffd-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 2px 0 4px;
  }
  .ffd-hero,
  .ffd-amount-bar,
  .info-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
  }
  .ffd-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 20px;
  }
  .ffd-hero__label,
  .amount-label,
  .meta-label {
    font-size: 11.5px;
    color: var(--el-text-color-placeholder);
  }
  .ffd-hero__no {
    margin-top: 4px;
    font-size: 20px;
    font-weight: 700;
  }
  .ffd-amount-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 22px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)), var(--el-bg-color));
  }
  .amount-main {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .amount-value {
    font-size: 30px;
    font-weight: 800;
    color: var(--el-color-primary);
  }
  .amount-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .meta-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }
  .meta-divider {
    width: 1px;
    height: 28px;
    background: var(--el-border-color);
    opacity: 0.6;
  }
  .ffd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .info-card__header {
    padding: 12px 16px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }
  .info-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .info-card__body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
    padding: 14px 16px 16px;
  }
  .info-card__body--row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .info-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .info-row--full {
    grid-column: 1 / -1;
  }
  .info-row__key {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .info-row__val {
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    word-break: break-all;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .voucher-img {
    width: 100%;
    max-height: 300px;
    border-radius: 10px;
    background: var(--el-fill-color-light);
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
  }
  .status-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .status-badge--warning {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  .status-badge--warning .status-badge__dot {
    background: #f59e0b;
  }
  .status-badge--success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }
  .status-badge--success .status-badge__dot {
    background: #10b981;
  }
  .status-badge--info {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  .status-badge--info .status-badge__dot {
    background: #94a3b8;
  }
  .status-badge--danger {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .status-badge--danger .status-badge__dot {
    background: #ef4444;
  }
</style>
