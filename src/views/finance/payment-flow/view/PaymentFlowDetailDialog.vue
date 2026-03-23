<template>
  <div v-loading="loading" class="pfd-wrap">
    <!-- ── 顶部流水号 + 状态 ── -->
    <div class="pfd-hero">
      <div class="pfd-hero__left">
        <span class="pfd-hero__label">支付流水号</span>
        <div class="pfd-hero__no">{{ detail.paymentNo || "—" }}</div>
      </div>
      <div class="pfd-hero__right">
        <div class="status-badge" :class="`status-badge--${statusBadgeType(detail.status)}`">
          <span class="status-badge__dot" />
          {{ statusText(detail.status) }}
        </div>
      </div>
    </div>

    <!-- ── 金额突出展示 ── -->
    <div class="pfd-amount-bar">
      <div class="amount-main">
        <span class="amount-label">支付金额</span>
        <span class="amount-value">{{ moneyText(detail.amount) }}</span>
      </div>
      <div class="amount-meta">
        <div class="meta-item">
          <span class="meta-label">支付方式</span>
          <span class="meta-value">{{ channelText(detail.channel) }}</span>
        </div>
        <div class="meta-divider" />
        <div class="meta-item">
          <span class="meta-label">支付时间</span>
          <span class="meta-value">{{ formatDateTime(detail.payTime) }}</span>
        </div>
        <div class="meta-divider" />
        <div class="meta-item">
          <span class="meta-label">创建时间</span>
          <span class="meta-value">{{ formatDateTime(detail.createTime) }}</span>
        </div>
      </div>
    </div>

    <!-- ── 双列信息区 ── -->
    <div class="pfd-grid">
      <!-- 租客信息 -->
      <div class="info-card">
        <div class="info-card__header">
          <span class="info-card__icon tenant-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </span>
          <span class="info-card__title">租客信息</span>
        </div>
        <div class="info-card__body">
          <div class="info-row">
            <span class="info-row__key">租客姓名</span>
            <span class="info-row__val">{{ detail.tenantName || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">联系电话</span>
            <span class="info-row__val">{{ detail.tenantPhone || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">付款人</span>
            <span class="info-row__val">{{ detail.payerName || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="info-row__key">付款人电话</span>
            <span class="info-row__val">{{ detail.payerPhone || "—" }}</span>
          </div>
          <div class="info-row info-row--full">
            <span class="info-row__key">房源信息</span>
            <span class="info-row__val">{{ detail.roomAddress || "—" }}</span>
          </div>
        </div>
      </div>

      <!-- 支付信息 -->
      <div class="info-card">
        <div class="info-card__header">
          <span class="info-card__icon pay-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h12a2 2 0 002-2V9H2zm3 3a1 1 0 011-1h2a1 1 0 110 2H6a1 1 0 01-1-1z" />
            </svg>
          </span>
          <span class="info-card__title">支付信息</span>
        </div>
        <div class="info-card__body">
          <div class="info-row">
            <span class="info-row__key">操作人</span>
            <span class="info-row__val">{{ detail.operatorName || "—" }}</span>
          </div>
          <div class="info-row info-row--full">
            <span class="info-row__key">交易流水号</span>
            <span class="info-row__val mono">{{ detail.thirdTradeNo || "—" }}</span>
          </div>
          <div class="info-row info-row--full">
            <span class="info-row__key">支付备注</span>
            <span class="info-row__val">{{ detail.remark || "—" }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 账单关联 ── -->
    <div class="info-card">
      <div class="info-card__header">
        <span class="info-card__icon bill-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path
              fill-rule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <span class="info-card__title">账单关联</span>
      </div>
      <div class="info-card__body info-card__body--row">
        <div class="info-row">
          <span class="info-row__key">所属账单</span>
          <span class="info-row__val">{{ detail.sortOrder ? `第 ${detail.sortOrder} 期` : "—" }}</span>
        </div>
        <div class="info-row">
          <span class="info-row__key">账单 ID</span>
          <span class="info-row__val mono">{{ detail.billId || "—" }}</span>
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

    <!-- ── 支付凭证 ── -->
    <div v-if="detail.paymentVoucherUrl" class="info-card">
      <div class="info-card__header">
        <span class="info-card__icon voucher-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
        </span>
        <span class="info-card__title">支付凭证</span>
      </div>
      <div class="info-card__body">
        <el-image :src="detail.paymentVoucherUrl" fit="contain" class="voucher-img" preview-teleported :preview-src-list="[detail.paymentVoucherUrl]" />
      </div>
    </div>

    <div class="info-card">
      <div class="info-card__header">
        <span class="info-card__icon bill-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path d="M4 4h12v2H4zM4 9h12v2H4zM4 14h12v2H4z" />
          </svg>
        </span>
        <span class="info-card__title">财务流水</span>
      </div>
      <div class="info-card__body">
        <el-table :data="detail.financeFlowList || []" border>
          <el-table-column prop="flowNo" label="财务流水号" min-width="190" />
          <el-table-column label="流水类型" min-width="100">
            <template #default="{ row }">
              {{ financeFlowTypeText(row.flowType) }}
            </template>
          </el-table-column>
          <el-table-column label="资金方向" min-width="90">
            <template #default="{ row }">
              {{ financeFlowDirectionText(row.flowDirection) }}
            </template>
          </el-table-column>
          <el-table-column prop="bizType" label="业务类型" min-width="140">
            <template #default="{ row }">
              {{ financeBizTypeText(row.bizType) }}
            </template>
          </el-table-column>
          <el-table-column label="费用类型" min-width="110">
            <template #default="{ row }">
              {{ feeTypeText(row.feeType) }}
            </template>
          </el-table-column>
          <el-table-column prop="feeName" label="费用名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" min-width="100" align="right">
            <template #default="{ row }">
              {{ moneyText(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" min-width="100" />
          <el-table-column prop="flowTime" label="流水时间" min-width="150">
            <template #default="{ row }">
              {{ formatDateTime(row.flowTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import dayjs from "dayjs";
  import type { FinanceFlowVo, PaymentFlowFinanceItemVo } from "@/types";
  import { getFinancePaymentFlowDetail } from "@/api/finance/paymentFlow";
  import {
    BizApprovalStatusEnumMeta,
    FinanceBizTypeEnumMeta,
    FinanceFlowDirectionEnumMeta,
    FinanceFlowTypeEnumMeta,
    LeaseBillFeeTypeEnumMeta,
    PaymentFlowChannelEnumMeta,
    PaymentFlowStatusEnumMeta
  } from "@/types/generated/enum.meta";

  const props = defineProps<{ flowId: string }>();
  const loading = ref(false);
  const detail = ref<PaymentFlowFinanceItemVo & { financeFlowList?: FinanceFlowVo[] }>({});

  async function fetchDetail() {
    if (!props.flowId) return;
    loading.value = true;
    try {
      const { data } = await getFinancePaymentFlowDetail({ id: props.flowId });
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

  function statusText(status?: number) {
    // PaymentFlowStatusEnumMeta: PENDING=0, PENDING_APPROVAL=1, SUCCESS=2, FAILED=3, CLOSED=4
    const map: Record<number, string> = {
      [PaymentFlowStatusEnumMeta.PENDING.code]: "待支付",
      [PaymentFlowStatusEnumMeta.PENDING_APPROVAL.code]: "待审批",
      [PaymentFlowStatusEnumMeta.SUCCESS.code]: "支付成功",
      [PaymentFlowStatusEnumMeta.FAILED.code]: "支付失败",
      [PaymentFlowStatusEnumMeta.CLOSED.code]: "已关闭",
      [PaymentFlowStatusEnumMeta.REFUNDING.code]: "退款中",
      [PaymentFlowStatusEnumMeta.REFUNDED.code]: "已退款"
    };
    return status !== undefined ? (map[status] ?? "—") : "—";
  }

  function statusBadgeType(status?: number): "warning" | "success" | "info" | "danger" {
    if (status === PaymentFlowStatusEnumMeta.SUCCESS.code) return "success";
    if (status === PaymentFlowStatusEnumMeta.CLOSED.code || status === PaymentFlowStatusEnumMeta.FAILED.code) return "info";
    if (status === PaymentFlowStatusEnumMeta.REFUNDED.code) return "danger";
    return "warning";
  }

  function approvalStatusText(status?: number) {
    // BizApprovalStatusEnumMeta: PENDING=1, APPROVED=2, REJECTED=3, WITHDRAWN=4
    if (status === undefined || status === null) return null;
    const map: Record<number, string> = {
      [BizApprovalStatusEnumMeta.PENDING.code]: "审批中",
      [BizApprovalStatusEnumMeta.APPROVED.code]: "已通过",
      [BizApprovalStatusEnumMeta.REJECTED.code]: "已驳回",
      [BizApprovalStatusEnumMeta.WITHDRAWN.code]: "已撤回"
    };
    return map[status] ?? null;
  }

  function approvalBadgeType(status?: number): "warning" | "success" | "danger" | "info" {
    if (status === BizApprovalStatusEnumMeta.APPROVED.code) return "success";
    if (status === BizApprovalStatusEnumMeta.REJECTED.code) return "danger";
    if (status === BizApprovalStatusEnumMeta.WITHDRAWN.code) return "info";
    return "warning";
  }

  function channelText(channel?: string) {
    if (!channel) return "—";
    return (PaymentFlowChannelEnumMeta as Record<string, { label: string }>)[channel]?.label || channel;
  }

  function financeFlowTypeText(type?: string) {
    if (!type) return "—";
    return (FinanceFlowTypeEnumMeta as Record<string, { label: string }>)[type]?.label || type;
  }

  function financeFlowDirectionText(direction?: string) {
    if (!direction) return "—";
    return (FinanceFlowDirectionEnumMeta as Record<string, { label: string }>)[direction]?.label || direction;
  }

  function financeBizTypeText(type?: string) {
    if (!type) return "—";
    return (FinanceBizTypeEnumMeta as Record<string, { label: string }>)[type]?.label || type;
  }

  function feeTypeText(type?: string) {
    if (!type) return "—";
    return (LeaseBillFeeTypeEnumMeta as Record<string, { label: string }>)[type]?.label || type;
  }

  onMounted(fetchDetail);
</script>

<style scoped>
  /* ── 容器 ── */
  .pfd-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 2px 0 4px;
  }

  /* ── Hero 顶部 ── */
  .pfd-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    padding: 16px 20px;
  }

  .pfd-hero__label {
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--el-text-color-placeholder);
    font-weight: 500;
  }

  .pfd-hero__no {
    margin-top: 4px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  .pfd-hero__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── 状态徽章 ── */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
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

  :is(.dark) .status-badge--warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.3);
  }
  :is(.dark) .status-badge--success {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.3);
  }
  :is(.dark) .status-badge--info {
    background: rgba(100, 116, 139, 0.15);
    color: #94a3b8;
    border-color: rgba(100, 116, 139, 0.3);
  }

  /* ── 审批状态 ── */
  .approval-badge {
    font-size: 12px;
    border-radius: 20px;
    padding: 3px 10px;
    font-weight: 500;
    border: 1px solid;
  }

  .approval-badge--warning {
    color: #92400e;
    background: #fef3c7;
    border-color: #fcd34d;
  }
  .approval-badge--success {
    color: #065f46;
    background: #d1fae5;
    border-color: #6ee7b7;
  }
  .approval-badge--danger {
    color: #991b1b;
    background: #fee2e2;
    border-color: #fca5a5;
  }
  .approval-badge--info {
    color: #475569;
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  :is(.dark) .approval-badge--warning {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
  }
  :is(.dark) .approval-badge--success {
    color: #34d399;
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
  }
  :is(.dark) .approval-badge--danger {
    color: #f87171;
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
  }
  :is(.dark) .approval-badge--info {
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.15);
    border-color: rgba(100, 116, 139, 0.35);
  }

  /* ── 金额横幅 ── */
  .pfd-amount-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)), var(--el-bg-color));
    border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color-light));
    border-radius: 14px;
    padding: 16px 22px;
  }

  .amount-main {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .amount-label {
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--el-text-color-placeholder);
    font-weight: 500;
  }

  .amount-value {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
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

  .meta-label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
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

  /* ── 双列信息布局 ── */
  .pfd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* ── 信息卡片 ── */
  .info-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    overflow: hidden;
  }

  .info-card__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .info-card__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .tenant-icon {
    background: #ede9fe;
    color: #7c3aed;
  }
  .pay-icon {
    background: #dbeafe;
    color: #2563eb;
  }
  .bill-icon {
    background: #fef3c7;
    color: #d97706;
  }
  .voucher-icon {
    background: #d1fae5;
    color: #059669;
  }

  :is(.dark) .tenant-icon {
    background: rgba(124, 58, 237, 0.2);
    color: #a78bfa;
  }
  :is(.dark) .pay-icon {
    background: rgba(37, 99, 235, 0.2);
    color: #60a5fa;
  }
  :is(.dark) .bill-icon {
    background: rgba(217, 119, 6, 0.2);
    color: #fcd34d;
  }
  :is(.dark) .voucher-icon {
    background: rgba(5, 150, 105, 0.2);
    color: #34d399;
  }

  .info-card__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .info-card__body {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-card__body--row {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px 32px;
  }

  .info-card--horizontal {
    /* full width */
  }

  /* ── 信息行 ── */
  .info-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 160px;
  }

  .info-row--full {
    width: 100%;
  }

  .info-row__key {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 70px;
  }

  .info-row__val {
    font-size: 13px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    word-break: break-all;
  }

  .info-row__val.mono {
    font-family: ui-monospace, "Cascadia Code", monospace;
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--el-text-color-secondary);
  }

  /* ── 凭证图片 ── */
  .voucher-img {
    width: 200px;
    height: 200px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-light);
    cursor: zoom-in;
    transition: opacity 0.2s;
  }
  .voucher-img:hover {
    opacity: 0.85;
  }

  /* ── 响应式 ── */
  @media (max-width: 680px) {
    .pfd-grid {
      grid-template-columns: 1fr;
    }
    .pfd-amount-bar {
      flex-direction: column;
      align-items: flex-start;
    }
    .amount-meta {
      justify-content: flex-start;
    }
  }
</style>
