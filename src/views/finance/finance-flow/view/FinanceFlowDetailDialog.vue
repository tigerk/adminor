<template>
  <div v-loading="loading" class="ffd-wrap">
    <section class="ffd-summary">
      <div class="ffd-summary__left">
        <div class="ffd-kicker">财务流水</div>
        <div class="ffd-title-line">
          <span class="ffd-flow-no">{{ detail.flowNo || "—" }}</span>
          <span class="status-badge" :class="`status-badge--${statusBadgeType(detail.status)}`">
            <span class="status-badge__dot" />
            {{ statusText(detail.status) }}
          </span>
        </div>
        <div class="ffd-chip-row">
          <span class="ffd-chip">{{ bizTypeText(detail.bizType) }}</span>
          <span v-if="detail.bizNo" class="ffd-chip">业务单号 {{ detail.bizNo }}</span>
          <span v-if="detail.paymentNo || detail.paymentFlowId" class="ffd-chip">支付流水 {{ detail.paymentNo || detail.paymentFlowId }}</span>
        </div>
      </div>

      <div class="ffd-summary__right">
        <div class="ffd-summary-time">
          <span>流水时间</span>
          <strong>{{ formatDateTime(detail.flowAt) }}</strong>
        </div>
      </div>
    </section>

    <section class="ffd-amount-card">
      <div class="ffd-amount">
        <span>流水金额</span>
        <strong :class="amountTone">{{ moneyText(detail.amount) }}</strong>
      </div>
      <div class="ffd-metrics">
        <div v-for="item in amountMetrics" :key="item.label" class="ffd-metric">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="ffd-section-grid">
      <article v-for="section in detailSections" :key="section.key" class="ffd-section" :class="{ 'ffd-section--wide': section.wide }">
        <div class="ffd-section__head">
          <span>{{ section.title }}</span>
          <small v-if="section.desc">{{ section.desc }}</small>
        </div>
        <div class="ffd-info-grid">
          <div v-for="item in section.items" :key="item.label" class="ffd-info-item" :class="{ 'ffd-info-item--full': item.full }">
            <span class="ffd-info-item__label">{{ item.label }}</span>
            <strong class="ffd-info-item__value" :class="{ mono: item.mono }">{{ displayValue(item.value) }}</strong>
          </div>
        </div>
        <div v-if="section.extJson" class="ffd-json">
          <span>扩展数据</span>
          <pre>{{ formatJson(section.extJson) }}</pre>
        </div>
      </article>

      <article v-if="detail.paymentVoucherUrl" class="ffd-section ffd-section--wide">
        <div class="ffd-section__head">
          <span>支付凭证</span>
        </div>
        <el-image :src="detail.paymentVoucherUrl" fit="contain" class="voucher-img" preview-teleported :preview-src-list="[detail.paymentVoucherUrl]" />
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
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

  type IdLike = string | number | null | undefined;
  type DetailValue = string | number | null | undefined;
  type DetailItem = {
    label: string;
    value?: DetailValue;
    mono?: boolean;
    full?: boolean;
  };
  type DetailSection = {
    key: string;
    title: string;
    desc?: string;
    items: DetailItem[];
    wide?: boolean;
    extJson?: string;
  };

  type FinanceFlowDetailRow = FinanceFlowFinanceItemVo & {
    paymentFlowId?: IdLike;
    paymentNo?: string;
    currency?: string;
    extJson?: string;
    ownerId?: IdLike;
    ownerName?: string;
    ownerPhone?: string;
    ownerPayableBillId?: IdLike;
    ownerPayableBillNo?: string;
    ownerPayableBillSubjectName?: string;
  };

  const props = defineProps<{ flowId: string }>();
  const loading = ref(false);
  const detail = ref<FinanceFlowDetailRow>({});

  const amountTone = computed(() => {
    if (detail.value.flowDirection === FinanceFlowDirectionEnumMeta.IN.code) return "is-in";
    if (detail.value.flowDirection === FinanceFlowDirectionEnumMeta.OUT.code) return "is-out";
    return "";
  });

  const hasBillInfo = computed(() =>
    Boolean(detail.value.billId || detail.value.feeName || detail.value.sortOrder || detail.value.billStart || detail.value.billEnd || detail.value.dueDate || detail.value.roomAddress)
  );

  const hasOwnerPayableInfo = computed(() => Boolean(detail.value.ownerPayableBillId || detail.value.ownerPayableBillNo || detail.value.ownerName || detail.value.ownerPayableBillSubjectName));

  const hasPaymentInfo = computed(() => Boolean(detail.value.paymentNo || detail.value.paymentChannel || detail.value.paymentStatus != null || detail.value.thirdTradeNo || detail.value.payAt));

  const hasRemarkInfo = computed(() => Boolean(detail.value.remark || detail.value.paymentRemark || detail.value.extJson));

  const amountMetrics = computed<DetailItem[]>(() => [
    { label: "流水类型", value: flowTypeText(detail.value.flowType) },
    { label: "资金方向", value: flowDirectionText(detail.value.flowDirection) },
    { label: "币种", value: detail.value.currency || "CNY" },
    { label: "创建时间", value: formatDateTime(detail.value.createAt) }
  ]);

  const detailSections = computed<DetailSection[]>(() => {
    const row = detail.value;
    const sections: DetailSection[] = [
      {
        key: "relation",
        title: "业务关系",
        desc: "用于定位这笔财务流水对应的业务单据和支付流水",
        wide: true,
        items: [
          { label: "业务类型", value: bizTypeText(row.bizType) },
          { label: "业务编号", value: row.bizNo, mono: true },
          { label: "业务ID", value: idText(row.bizId), mono: true },
          { label: "财务流水ID", value: idText(row.id), mono: true },
          { label: "关联支付流水ID", value: idText(row.paymentFlowId), mono: true },
          { label: "支付流水号", value: row.paymentNo, mono: true },
          { label: "业务明细", value: businessTypeText(row) }
        ]
      },
      {
        key: "party",
        title: "交易对象",
        items: [
          { label: "付款方", value: row.payerName },
          { label: "付款方电话", value: row.payerPhone },
          { label: "收款方", value: row.receiverName },
          { label: "操作人", value: row.operatorName },
          { label: "业务对象", value: subjectNameText(row) },
          { label: "对象电话", value: subjectPhoneText(row) }
        ]
      }
    ];

    if (hasBillInfo.value) {
      sections.push({
        key: "bill",
        title: "账单信息",
        items: [
          { label: "账单名称", value: businessNameText(row) },
          { label: "账单期数", value: billText(row) },
          { label: "账期", value: billPeriodText(row) },
          { label: "应收/应付日期", value: formatDate(row.dueDate) },
          { label: "房源信息", value: subjectText(row), full: true }
        ]
      });
    }

    if (hasOwnerPayableInfo.value) {
      sections.push({
        key: "ownerPayable",
        title: "包租应付付款",
        items: [
          { label: "应付单号", value: row.ownerPayableBillNo, mono: true },
          { label: "应付单ID", value: idText(row.ownerPayableBillId), mono: true },
          { label: "业主姓名", value: row.ownerName },
          { label: "业主电话", value: row.ownerPhone },
          { label: "合同房源", value: row.ownerPayableBillSubjectName, full: true }
        ]
      });
    }

    if (hasPaymentInfo.value) {
      sections.push({
        key: "payment",
        title: "支付流水",
        items: [
          { label: "支付流水号", value: row.paymentNo, mono: true },
          { label: "支付方式", value: channelText(row.paymentChannel) },
          { label: "支付状态", value: paymentStatusText(row.paymentStatus) },
          { label: "审批状态", value: approvalStatusText(row.paymentApprovalStatus) },
          { label: "支付时间", value: formatDateTime(row.payAt) },
          { label: "交易流水号", value: row.thirdTradeNo, mono: true },
          { label: "支付备注", value: row.paymentRemark, full: true }
        ]
      });
    }

    if (hasRemarkInfo.value) {
      sections.push({
        key: "remark",
        title: "备注与扩展",
        wide: true,
        extJson: row.extJson,
        items: [{ label: "财务备注", value: row.remark || row.paymentRemark, full: true }]
      });
    }

    return sections;
  });

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

  function idText(value?: IdLike) {
    return value === undefined || value === null || value === "" ? "—" : String(value);
  }

  function displayValue(value?: DetailValue) {
    return value === undefined || value === null || value === "" ? "—" : String(value);
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
    return value !== undefined && value !== null ? (map[value] ?? "—") : "—";
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

  function businessTypeText(row: FinanceFlowDetailRow) {
    const feeLabel = feeTypeText(row.feeType);
    return feeLabel !== "—" ? feeLabel : bizTypeText(row.bizType);
  }

  function businessNameText(row: FinanceFlowDetailRow) {
    return row.feeName || row.ownerPayableBillNo || row.bizNo || "—";
  }

  function billText(row: FinanceFlowDetailRow) {
    if (row.sortOrder) {
      return `第 ${row.sortOrder} 期`;
    }
    return row.ownerPayableBillNo || row.bizNo || "—";
  }

  function billPeriodText(row: FinanceFlowDetailRow) {
    if (!row.billStart && !row.billEnd) return "—";
    return `${formatDate(row.billStart)} ~ ${formatDate(row.billEnd)}`;
  }

  function subjectNameText(row: FinanceFlowDetailRow) {
    return row.tenantName || row.ownerName || row.receiverName || row.payerName || "—";
  }

  function subjectPhoneText(row: FinanceFlowDetailRow) {
    return row.tenantPhone || row.ownerPhone || row.payerPhone || "—";
  }

  function subjectText(row: FinanceFlowDetailRow) {
    return row.roomAddress || row.ownerPayableBillSubjectName || subjectNameText(row);
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

  function formatJson(value?: string) {
    if (!value) return "—";
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  onMounted(fetchDetail);
</script>

<style scoped>
  .ffd-wrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 2px 0 4px;
    color: var(--el-text-color-primary);
  }

  .ffd-summary,
  .ffd-amount-card,
  .ffd-section {
    border: 1px solid var(--el-border-color);
    border-radius: 16px;
    background: var(--el-bg-color);
  }

  .ffd-summary {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: stretch;
    padding: 20px 22px;
  }

  .ffd-summary__left {
    flex: 1;
    min-width: 0;
  }

  .ffd-kicker,
  .ffd-summary-time span,
  .ffd-amount span,
  .ffd-metric span,
  .ffd-info-item__label,
  .ffd-section__head small,
  .ffd-json span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .ffd-kicker {
    margin-bottom: 8px;
  }

  .ffd-title-line {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ffd-flow-no {
    color: var(--el-text-color-primary);
    font-size: 24px;
    font-weight: 800;
    line-height: 1.2;
    word-break: break-all;
  }

  .ffd-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .ffd-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 999px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 1.4;
  }

  .ffd-summary__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 210px;
  }

  .ffd-summary-time {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--el-fill-color-lighter);
    text-align: right;
  }

  .ffd-summary-time strong {
    display: block;
    margin-top: 6px;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }

  .ffd-amount-card {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 18px;
    padding: 18px 20px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)), var(--el-bg-color));
  }

  .ffd-amount {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2px 0;
  }

  .ffd-amount strong {
    margin-top: 6px;
    font-size: 36px;
    font-weight: 900;
    line-height: 1.1;
    color: var(--el-color-primary);
  }

  .ffd-amount strong.is-in {
    color: var(--el-color-success);
  }

  .ffd-amount strong.is-out {
    color: var(--el-color-warning);
  }

  .ffd-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .ffd-metric {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: color-mix(in srgb, var(--el-fill-color-light) 70%, transparent);
  }

  .ffd-metric strong {
    display: block;
    margin-top: 5px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }

  .ffd-section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .ffd-section {
    min-width: 0;
    overflow: hidden;
  }

  .ffd-section--wide {
    grid-column: 1 / -1;
  }

  .ffd-section__head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .ffd-section__head span {
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 700;
  }

  .ffd-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
    padding: 16px;
  }

  .ffd-section--wide .ffd-info-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ffd-info-item {
    min-width: 0;
    padding: 2px 0;
  }

  .ffd-info-item--full {
    grid-column: 1 / -1;
  }

  .ffd-info-item__label {
    display: block;
    margin-bottom: 5px;
    line-height: 1.2;
  }

  .ffd-info-item__value {
    display: block;
    min-height: 22px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.55;
    word-break: break-word;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .ffd-json {
    padding: 0 16px 16px;
  }

  .ffd-json pre {
    max-height: 220px;
    margin: 8px 0 0;
    padding: 12px;
    overflow: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .voucher-img {
    width: 100%;
    max-height: 360px;
    border-radius: 12px;
    background: var(--el-fill-color-light);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
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

  @media (max-width: 1200px) {
    .ffd-summary {
      flex-direction: column;
      align-items: stretch;
    }

    .ffd-summary__right {
      justify-content: stretch;
      flex: initial;
    }

    .ffd-summary-time {
      text-align: left;
    }

    .ffd-amount-card {
      grid-template-columns: 1fr;
    }

    .ffd-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ffd-section--wide .ffd-info-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .ffd-section-grid,
    .ffd-info-grid,
    .ffd-section--wide .ffd-info-grid,
    .ffd-metrics {
      grid-template-columns: 1fr;
    }

    .ffd-flow-no {
      font-size: 20px;
    }

    .ffd-amount strong {
      font-size: 30px;
    }
  }
</style>
