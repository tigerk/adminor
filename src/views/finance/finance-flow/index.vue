<script setup lang="ts">
  import { h, onMounted, reactive, ref, computed } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { addDialog } from "@/components/ReDialog";
  import { PureTableBar } from "@/components/RePureTableBar";
  import type { FinanceFlowFinanceItemVo, FinanceFlowFinanceQueryDto, FinanceFlowFinanceSummaryVo } from "@/types";
  import { getFinanceFlowPage, getFinanceFlowSummary } from "@/api/finance/financeFlow";
  import FinanceFlowDetailDialog from "@/views/finance/finance-flow/view/FinanceFlowDetailDialog.vue";
  import {
    FinanceBizTypeEnumMeta,
    FinanceFlowDirectionEnumMeta,
    FinanceFlowStatusEnumMeta,
    FinanceFlowTypeEnumMeta,
    LeaseBillFeeTypeEnumMeta
  } from "@/types";

  defineOptions({ name: "FinanceFlowIndex" });

  type FinanceFlowRow = FinanceFlowFinanceItemVo & {
    ownerId?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerPayableBillId?: string;
    ownerPayableBillNo?: string;
    ownerPayableBillSubjectName?: string;
  };

  const loading = ref(false);
  const list = ref<FinanceFlowRow[]>([]);
  const summary = ref<FinanceFlowFinanceSummaryVo>({});

  const queryForm = reactive<FinanceFlowFinanceQueryDto>({
    currentPage: "1",
    pageSize: "15",
    status: undefined,
    flowType: undefined,
    feeType: undefined,
    roomKeyword: ""
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const statusTabs = [
    { label: "全部", value: undefined, color: "blue" },
    { label: FinanceFlowStatusEnumMeta.SUCCESS.label, value: FinanceFlowStatusEnumMeta.SUCCESS.code, color: "emerald" },
    { label: FinanceFlowStatusEnumMeta.VOIDED.label, value: FinanceFlowStatusEnumMeta.VOIDED.code, color: "slate" }
  ];

  const flowTypeOptions = Object.values(FinanceFlowTypeEnumMeta);
  const feeTypeOptions = Object.values(LeaseBillFeeTypeEnumMeta);

  const summaryCards = computed(() => [
    // {
    //   key: "pending",
    //   label: "待入账",
    //   sublabel: "待入账流水",
    //   total: Number(summary.value.pendingAmount || 0),
    //   todayAmount: Number(summary.value.todayPendingAmount || 0),
    //   colorClass: "card-amber"
    // },
    {
      key: "success",
      label: "已入账",
      sublabel: "已入账流水",
      total: Number(summary.value.successAmount || 0),
      todayAmount: Number(summary.value.todaySuccessAmount || 0),
      colorClass: "card-emerald"
    },
    {
      key: "voided",
      label: "已作废",
      sublabel: "已作废流水",
      total: Number(summary.value.voidedAmount || 0),
      todayAmount: Number(summary.value.todayVoidedAmount || 0),
      colorClass: "card-slate"
    }
  ]);

  const columns: TableColumnList = [
    { label: "状态", prop: "status", minWidth: 170, align: "center", slot: "status", fixed: "left" },
    { label: "财务流水号", prop: "flowNo", minWidth: 180 },
    {
      label: "流水类型",
      prop: "flowType",
      minWidth: 100,
      formatter: ({ flowType }) => flowTypeText(flowType)
    },
    {
      label: "资金方向",
      prop: "flowDirection",
      minWidth: 100,
      formatter: ({ flowDirection }) => flowDirectionText(flowDirection)
    },
    {
      label: "业务类型",
      prop: "bizType",
      minWidth: 120,
      formatter: ({ bizType }) => financeBizTypeText(bizType)
    },
    {
      label: "业务明细",
      prop: "feeType",
      minWidth: 110,
      formatter: row => businessTypeText(row as FinanceFlowRow)
    },
    {
      label: "业务单据",
      prop: "feeName",
      minWidth: 160,
      showOverflowTooltip: true,
      formatter: row => businessNameText(row as FinanceFlowRow)
    },
    {
      label: "房源/对象",
      prop: "roomAddress",
      minWidth: 220,
      showOverflowTooltip: true,
      formatter: row => subjectText(row as FinanceFlowRow)
    },
    {
      label: "关联账单",
      minWidth: 150,
      showOverflowTooltip: true,
      formatter: row => billText(row as FinanceFlowRow)
    },
    {
      label: "金额",
      prop: "amount",
      minWidth: 110,
      align: "right",
      slot: "amount"
    },
    { label: "操作人", prop: "operatorName", minWidth: 100 },
    {
      label: "流水时间",
      prop: "flowAt",
      minWidth: 160,
      formatter: ({ flowAt }) => formatDateTime(flowAt)
    }
  ];

  function buildQueryPayload(): FinanceFlowFinanceQueryDto {
    return {
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize),
      status: queryForm.status,
      flowType: queryForm.flowType,
      feeType: queryForm.feeType,
      roomKeyword: queryForm.roomKeyword?.trim() || undefined
    };
  }

  async function fetchSummary() {
    const { data } = await getFinanceFlowSummary(buildQueryPayload());
    summary.value = data || {};
  }

  async function fetchPage() {
    loading.value = true;
    try {
      const [{ data: pageData }] = await Promise.all([getFinanceFlowPage(buildQueryPayload()), fetchSummary()]);
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
    queryForm.flowType = undefined;
    queryForm.feeType = undefined;
    queryForm.roomKeyword = "";
    pagination.currentPage = 1;
    fetchPage();
  }

  function onSwitchStatus(status?: number) {
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
      title: "财务流水详情",
      width: "72%",
      top: "6%",
      hideFooter: true,
      alignCenter: true,
      contentRenderer: () => h(FinanceFlowDetailDialog, { flowId })
    });
  }

  function handleRowClick(row: FinanceFlowRow) {
    openDetail(row.id);
  }

  function statusText(status?: number) {
    const map = {
      [FinanceFlowStatusEnumMeta.PENDING.code]: FinanceFlowStatusEnumMeta.PENDING.label,
      [FinanceFlowStatusEnumMeta.SUCCESS.code]: FinanceFlowStatusEnumMeta.SUCCESS.label,
      [FinanceFlowStatusEnumMeta.VOIDED.code]: FinanceFlowStatusEnumMeta.VOIDED.label
    } as Record<number, string>;
    return status !== undefined ? (map[status] ?? "—") : "—";
  }

  function statusConfig(status?: number): { type: "warning" | "success" | "info"; dot: string } {
    if (status === FinanceFlowStatusEnumMeta.SUCCESS.code) return { type: "success", dot: "bg-emerald-500" };
    if (status === FinanceFlowStatusEnumMeta.VOIDED.code) return { type: "info", dot: "bg-slate-400" };
    return { type: "warning", dot: "bg-amber-400" };
  }

  function flowTypeText(value?: string) {
    if (!value) return "—";
    return (FinanceFlowTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }

  function flowDirectionText(value?: string) {
    if (!value) return "—";
    return (FinanceFlowDirectionEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }

  function financeBizTypeText(value?: string) {
    if (!value) return "—";
    return (FinanceBizTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }

  function feeTypeText(value?: string) {
    if (!value) return "—";
    return (LeaseBillFeeTypeEnumMeta as Record<string, { label: string }>)[value]?.label || value;
  }

  function businessTypeText(row: FinanceFlowRow) {
    const feeLabel = feeTypeText(row.feeType);
    return feeLabel !== "—" ? feeLabel : financeBizTypeText(row.bizType);
  }

  function businessNameText(row: FinanceFlowRow) {
    return row.feeName || row.ownerPayableBillNo || row.bizNo || "—";
  }

  function subjectText(row: FinanceFlowRow) {
    return row.roomAddress || row.ownerPayableBillSubjectName || row.ownerName || row.receiverName || row.payerName || "—";
  }

  function billText(row: FinanceFlowRow) {
    if (row.sortOrder) {
      return `第 ${row.sortOrder} 期`;
    }
    return row.ownerPayableBillNo || row.bizNo || "—";
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
            <strong>{{ moneyText(card.todayAmount) }}</strong>
          </span>
        </div>
      </div>
    </div>

    <div class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="流水类型">
          <el-select v-model="queryForm.flowType" clearable placeholder="请选择流水类型" class="filter-input">
            <el-option v-for="item in flowTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="queryForm.feeType" clearable placeholder="请选择费用类型" class="filter-input">
            <el-option v-for="item in feeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象/房源">
          <el-input v-model="queryForm.roomKeyword" clearable placeholder="对象 / 房源 / 账单" class="filter-input" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <PureTableBar title="财务流水" :columns="columns" @refresh="fetchPage">
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
          <template #status="{ row }">
            <div class="status-badge" :class="`status-badge--${statusConfig(row.status).type}`">
              <span class="status-badge__dot" />
              {{ statusText(row.status) }}
            </div>
          </template>

          <template #amount="{ row }">
            <span class="amount-cell">{{ moneyText(row.amount) }}</span>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
  .pf-page {
    display: flex;
    flex-direction: column;
    gap: 0 !important;
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    width: 180px;
  }

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
  .status-tab.is-active.tab-blue {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
  :is(.dark) .status-tab.is-active.tab-amber {
    background: rgba(245, 158, 11, 0.18);
    border-color: #f59e0b;
    color: #fbbf24;
  }
  :is(.dark) .status-tab.is-active.tab-blue {
    background: rgba(64, 158, 255, 0.18);
    border-color: var(--el-color-primary);
    color: #93c5fd;
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

  .amount-cell {
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 1280px) {
    .summary-row {
      grid-template-columns: 1fr;
    }
  }
</style>
