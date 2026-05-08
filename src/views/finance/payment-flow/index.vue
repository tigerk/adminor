<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { addDialog } from "@/components/ReDialog";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { PaymentFlowFinanceItemVo, PaymentFlowFinanceQueryDto, PaymentFlowFinanceSummaryVo } from "@/types";
  import { getFinancePaymentFlowPage, getFinancePaymentFlowSummary } from "@/api/finance/paymentFlow";
  import PaymentFlowDetailDialog from "@/views/finance/payment-flow/view/PaymentFlowDetailDialog.vue";
  import { PaymentFlowBizTypeEnumMeta, PaymentFlowChannelEnumMeta, PaymentFlowStatusEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "FinancePaymentFlow" });

  type PaymentFlowRow = PaymentFlowFinanceItemVo & {
    ownerName?: string;
    ownerPhone?: string;
    ownerPayableBillNo?: string;
    ownerPayableBillSubjectName?: string;
    receiverName?: string;
    bizNo?: string;
    bizType?: string;
  };

  const PAYMENT_BIZ_TYPE_LABEL_MAP: Record<string, string> = {
    OWNER_PAYABLE_BILL_PAYMENT: "包租应付付款"
  };

  const loading = ref(false);
  const list = ref<PaymentFlowRow[]>([]);
  const summary = ref<PaymentFlowFinanceSummaryVo>({});

  const queryForm = reactive<PaymentFlowFinanceQueryDto>({
    currentPage: "1",
    pageSize: "15",
    tenantName: "",
    tenantPhone: "",
    roomKeyword: "",
    status: null
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const statusTabs = [
    { label: "全部", value: null, color: "amber" },
    { label: "待审批", value: PaymentFlowStatusEnumMeta.PENDING_APPROVAL.code, color: "amber" },
    { label: "支付成功", value: PaymentFlowStatusEnumMeta.SUCCESS.code, color: "emerald" },
    { label: "已关闭", value: PaymentFlowStatusEnumMeta.CLOSED.code, color: "slate" },
    { label: "已作废", value: PaymentFlowStatusEnumMeta.VOIDED.code, color: "slate" },
  ];

  const summaryCards = computed(() => [
    {
      key: "pending",
      label: "待审批",
      sublabel: "待审批流水金额",
      total: summary.value.pendingApprovalAmount || 0,
      today: summary.value.todayPendingApprovalAmount || 0,
      colorClass: "card-amber"
    },
    {
      key: "success",
      label: "成功支付",
      sublabel: "支付成功流水金额",
      total: summary.value.successAmount || 0,
      today: summary.value.todaySuccessAmount || 0,
      colorClass: "card-emerald"
    },
    {
      key: "closed",
      label: "已关闭",
      sublabel: "已关闭流水金额",
      total: summary.value.closedAmount || 0,
      today: summary.value.todayClosedAmount || 0,
      colorClass: "card-slate"
    }
  ]);

  const columns: TableColumnList = [
    {
      label: "状态",
      prop: "status",
      width: 110,
      align: "center",
      slot: "status",
      fixed: "left"
    },
    { label: "支付流水号", prop: "paymentNo", minWidth: 185 },
    {
      label: "业务类型",
      prop: "bizType",
      minWidth: 140,
      formatter: row => paymentBizTypeText((row as PaymentFlowRow).bizType)
    },
    {
      label: "对象名称",
      prop: "tenantName",
      minWidth: 120,
      formatter: row => subjectNameText(row as PaymentFlowRow)
    },
    {
      label: "联系电话",
      prop: "tenantPhone",
      minWidth: 125,
      formatter: row => subjectPhoneText(row as PaymentFlowRow)
    },
    {
      label: "房源/对象",
      prop: "roomAddress",
      minWidth: 220,
      showOverflowTooltip: true,
      formatter: row => subjectText(row as PaymentFlowRow)
    },
    {
      label: "业务单据",
      minWidth: 130,
      showOverflowTooltip: true,
      formatter: row => paymentBizNoText(row as PaymentFlowRow)
    },
    {
      label: "支付方式",
      prop: "channel",
      minWidth: 100,
      formatter: ({ channel }) => channelText(channel)
    },
    {
      label: "支付金额",
      prop: "amount",
      minWidth: 120,
      align: "right",
      slot: "amount"
    },
    { label: "付款人", prop: "payerName", minWidth: 100 },
    { label: "操作人", prop: "operatorName", minWidth: 100 },
    {
      label: "支付时间",
      prop: "payAt",
      minWidth: 160,
      formatter: ({ payAt }) => formatDateTime(payAt)
    },
    {
      label: "创建时间",
      prop: "createAt",
      minWidth: 160,
      formatter: ({ createAt }) => formatDateTime(createAt)
    }
  ];

  function buildQueryPayload(): PaymentFlowFinanceQueryDto {
    return {
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize),
      status: queryForm.status,
      tenantName: queryForm.tenantName?.trim() || undefined,
      tenantPhone: queryForm.tenantPhone?.trim() || undefined,
      roomKeyword: queryForm.roomKeyword?.trim() || undefined
    };
  }

  async function fetchSummary() {
    const { data } = await getFinancePaymentFlowSummary(buildQueryPayload());
    summary.value = data || {};
  }

  async function fetchPage() {
    loading.value = true;
    try {
      const [{ data: pageData }] = await Promise.all([getFinancePaymentFlowPage(buildQueryPayload()), fetchSummary()]);
      list.value = pageData?.list || [];
      pagination.total = Number(pageData?.total || 0);
      pagination.pageSize = Number(pageData?.pageSize || pagination.pageSize);
      pagination.currentPage = Number(pageData?.currentPage || pagination.currentPage);
    } finally {
      loading.value = false;
    }
  }

  function onSearch() {
    pagination.currentPage = 1;
    fetchPage();
  }

  function onReset() {
    queryForm.tenantName = "";
    queryForm.tenantPhone = "";
    queryForm.roomKeyword = "";
    pagination.currentPage = 1;
    fetchPage();
  }

  function onSwitchStatus(status: number | null) {
    queryForm.status = status;
    onSearch();
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    fetchPage();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    fetchPage();
  }

  function openDetail(flowId?: string) {
    if (!flowId) return;
    addDialog({
      title: "支付流水详情",
      width: "72%",
      top: "6%",
      hideFooter: true,
      alignCenter: true,
      contentRenderer: () =>
        h(PaymentFlowDetailDialog, {
          flowId,
          onVoided: () => fetchPage()
        })
    });
  }

  function handleRowClick(row: PaymentFlowRow) {
    openDetail(row.id);
  }

  function statusText(status?: number) {
    const map: Record<number, string> = { 1: "待审批", 2: "支付成功", 4: "已关闭", 7: "已作废" };
    return map[status ?? -1] ?? "—";
  }

  function statusConfig(status?: number): { type: "warning" | "success" | "info" | "danger" | "primary"; dot: string } {
    if (status === 2) return { type: "success", dot: "bg-emerald-500" };
    if (status === 7) return { type: "danger", dot: "bg-red-500" };
    if (status === 4) return { type: "info", dot: "bg-slate-400" };
    return { type: "warning", dot: "bg-amber-400" };
  }

  function paymentBizTypeText(value?: string) {
    if (!value) return "—";
    return (PaymentFlowBizTypeEnumMeta as Record<string, { label: string }>)[value]?.label || PAYMENT_BIZ_TYPE_LABEL_MAP[value] || value;
  }

  function subjectNameText(row: PaymentFlowRow) {
    return row.tenantName || row.ownerName || row.receiverName || row.payerName || "—";
  }

  function subjectPhoneText(row: PaymentFlowRow) {
    return row.tenantPhone || row.ownerPhone || row.payerPhone || "—";
  }

  function subjectText(row: PaymentFlowRow) {
    return row.roomAddress || row.ownerPayableBillSubjectName || subjectNameText(row);
  }

  function paymentBizNoText(row: PaymentFlowRow) {
    if (row.sortOrder) return `第 ${row.sortOrder} 期`;
    return row.ownerPayableBillNo || row.bizNo || "—";
  }

  function channelText(channel?: string) {
    if (!channel) return "—";
    return (PaymentFlowChannelEnumMeta as Record<string, { label: string }>)[channel]?.label || channel;
  }

  function moneyText(value?: number) {
    return `¥ ${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";
  }

  onMounted(fetchPage);
</script>

<template>
  <div class="pf-page">
    <!-- ── 汇总卡片区（紧凑横向布局）── -->
    <div class="summary-row mb-2 mt-1">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card" :class="card.colorClass">
        <div class="summary-card__left">
          <span class="summary-card__label">{{ card.sublabel }}</span>
          <div class="summary-card__amount">{{ moneyText(card.total) }}</div>
        </div>
        <div class="summary-card__right">
          <span class="today-dot" />
          <span class="summary-card__today-text">
            今日
            <strong>{{ moneyText(card.today) }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- ── 查询工具栏 ── -->
    <div class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="对象名称">
          <el-input v-model="queryForm.tenantName" clearable placeholder="请输入对象名称" class="filter-input" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="queryForm.tenantPhone" clearable placeholder="请输入联系电话" class="filter-input" />
        </el-form-item>
        <el-form-item label="房源/对象">
          <el-input v-model="queryForm.roomKeyword" clearable placeholder="房源 / 账单 / 对象" class="filter-input" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- ── 表格区 ── -->
      <PureTableBar title="支付流水" :columns="columns" @refresh="fetchPage">
      <template #buttons>
        <div class="status-tab-group">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="status-tab"
            :class="{ 'is-active': queryForm.status === tab.value, [`tab-${tab.color}`]: true }"
            @click="onSwitchStatus(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </template>

      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          adaptive
          :adaptiveConfig="{ offsetBottom: 80 }"
          alignWhole="center"
          table-layout="auto"
          showOverflowTooltip
          :loading="loading"
          :size="size"
          :data="list"
          :columns="dynamicColumns"
          :pagination="pagination"
          class="pf-table"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
          @row-click="handleRowClick"
        >
          <!-- 状态列 -->
          <template #status="{ row }">
            <div class="status-badge" :class="`status-badge--${statusConfig(row.status).type}`">
              <span class="status-badge__dot" />
              {{ statusText(row.status) }}
            </div>
          </template>

          <!-- 金额列 -->
          <template #amount="{ row }">
            <span class="amount-cell">{{ moneyText(row.amount) }}</span>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
  /* ── 页面容器 ── */
  .pf-page {
    display: flex;
    flex-direction: column;
    gap: 0 !important;
  }

  /* ── 汇总卡片：横向紧凑 ── */
  .summary-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .summary-card {
    border-radius: 10px;
    padding: 10px 16px;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: box-shadow 0.2s;
  }

  .summary-card:hover {
    box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
  }

  .summary-card__left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-card__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .summary-card__amount {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .summary-card__right {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .today-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .summary-card__today-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .summary-card__today-text strong {
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  /* 卡片颜色主题 */
  .card-amber {
    background: linear-gradient(135deg, color-mix(in srgb, #f59e0b 8%, var(--el-bg-color)), var(--el-bg-color));
    border-color: color-mix(in srgb, #f59e0b 25%, var(--el-border-color-light));
  }
  .card-amber .today-dot {
    background: #f59e0b;
  }
  .card-amber .summary-card__amount {
    color: #b45309;
  }
  :is(.dark) .card-amber .summary-card__amount {
    color: #fbbf24;
  }

  .card-emerald {
    background: linear-gradient(135deg, color-mix(in srgb, #10b981 8%, var(--el-bg-color)), var(--el-bg-color));
    border-color: color-mix(in srgb, #10b981 25%, var(--el-border-color-light));
  }
  .card-emerald .today-dot {
    background: #10b981;
  }
  .card-emerald .summary-card__amount {
    color: #065f46;
  }
  :is(.dark) .card-emerald .summary-card__amount {
    color: #34d399;
  }

  .card-slate {
    background: linear-gradient(135deg, color-mix(in srgb, #64748b 6%, var(--el-bg-color)), var(--el-bg-color));
    border-color: color-mix(in srgb, #64748b 20%, var(--el-border-color-light));
  }
  .card-slate .today-dot {
    background: #94a3b8;
  }
  .card-slate .summary-card__amount {
    color: var(--el-text-color-primary);
  }

  /* ── 查询栏 ── */
  .filter-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    padding: 10px 14px 2px;
  }

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0 6px;
  }

  :deep(.filter-form .el-form-item) {
    margin-bottom: 8px;
  }

  .filter-input {
    width: 170px;
  }

  /* ── 状态切换 ── */
  .status-tab-group {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .status-tab {
    display: inline-flex;
    align-items: center;
    padding: 4px 13px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--el-border-color);
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
    line-height: 1.5;
  }

  .status-tab:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

  .status-tab.is-active.tab-amber {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
  }
  :is(.dark) .status-tab.is-active.tab-amber {
    background: rgba(245, 158, 11, 0.18);
    border-color: #f59e0b;
    color: #fbbf24;
  }

  .status-tab.is-active.tab-emerald {
    background: #d1fae5;
    border-color: #10b981;
    color: #065f46;
  }
  :is(.dark) .status-tab.is-active.tab-emerald {
    background: rgba(16, 185, 129, 0.18);
    border-color: #10b981;
    color: #34d399;
  }

  .status-tab.is-active.tab-slate {
    background: #f1f5f9;
    border-color: #64748b;
    color: #334155;
  }
  :is(.dark) .status-tab.is-active.tab-slate {
    background: rgba(100, 116, 139, 0.18);
    border-color: #94a3b8;
    color: #cbd5e1;
  }

  /* ── 状态徽章 ── */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .status-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-badge--warning {
    background: #fef3c7;
    color: #92400e;
  }
  .status-badge--warning .status-badge__dot {
    background: #f59e0b;
  }

  .status-badge--danger {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .status-badge--danger .status-badge__dot {
    background: #ef4444;
  }

  .status-badge--success {
    background: #d1fae5;
    color: #065f46;
  }
  .status-badge--success .status-badge__dot {
    background: #10b981;
  }

  .status-badge--info {
    background: #f1f5f9;
    color: #475569;
  }
  .status-badge--info .status-badge__dot {
    background: #94a3b8;
  }

  :is(.dark) .status-badge--warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }
  :is(.dark) .status-badge--success {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }
  :is(.dark) .status-badge--info {
    background: rgba(100, 116, 139, 0.15);
    color: #94a3b8;
  }

  :is(.dark) .status-badge--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.35);
  }

  /* ── 金额列 ── */
  .amount-cell {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
  }

  /* ── 表格行交互 ── */
  :deep(.pf-table .el-table__row) {
    cursor: pointer;
  }

  /* ── 响应式 ── */
  @media (max-width: 900px) {
    .summary-row {
      grid-template-columns: 1fr;
    }
  }
</style>
