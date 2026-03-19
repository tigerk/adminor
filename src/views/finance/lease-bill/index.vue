<script setup lang="ts">
  import { computed, onMounted, reactive, ref, h } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import type { LeaseBillFeeFinanceItemVo, LeaseBillFinanceItemVo, LeaseBillFinanceQueryDto, LeaseBillFinanceSummaryVo } from "@/types";
  import { getFinanceLeaseBillFeePage, getFinanceLeaseBillPage, getFinanceLeaseBillSummary } from "@/api/finance/leaseBill";
  import { addDialog } from "@/components/ReDialog";
  import LeaseBillDetailDialog from "@/views/contract/tenant/view/bill/LeaseBillDetailDialog.vue";
  import { Search, Wallet, Calendar, CircleCheck, TrendCharts, ArrowDown } from "@element-plus/icons-vue";

  defineOptions({
    name: "FinanceLeaseBill"
  });

  type ViewMode = "bill" | "fee";

  const loading = ref(false);
  const viewMode = ref<ViewMode>("bill");
  const summaryExpanded = ref(false);
  const billList = ref<LeaseBillFinanceItemVo[]>([]);
  const feeList = ref<LeaseBillFeeFinanceItemVo[]>([]);
  const summary = ref<LeaseBillFinanceSummaryVo>({});
  const tableRef = ref();

  const queryForm = reactive<LeaseBillFinanceQueryDto>({
    currentPage: "1",
    pageSize: "15",
    tenantName: "",
    tenantPhone: "",
    roomKeyword: "",
    overdueOnly: false,
    payStatus: undefined
  });

  const billPagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const feePagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const statusTabs = [
    { label: "全部", value: undefined },
    { label: "未支付", value: 0 },
    { label: "部分支付", value: 1 },
    { label: "已支付", value: 2 }
  ];

  const categoryStats = computed(() => summary.value.categoryStats || []);

  /**
   * 展开面板的展示数据：
   * - 后端有分类数据时，直接用 categoryStats
   * - 为空时（数据全为 0 或接口未返回），用汇总数字构造一条"合计"兜底项，让展开区不为空
   */
  const displayCategories = computed(() => {
    if (categoryStats.value.length > 0) return categoryStats.value;
    return [
      {
        feeType: "__total__",
        feeTypeLabel: "合计",
        receivableAmount: summary.value.receivableAmount ?? 0,
        paidAmount: summary.value.paidAmount ?? 0,
        unpaidAmount: (summary.value.receivableAmount ?? 0) - (summary.value.paidAmount ?? 0)
      }
    ];
  });

  const summaryCards = computed(() => [
    { label: "应收", value: moneyText(summary.value.receivableAmount), accent: "blue", icon: Wallet },
    { label: "本日应收", value: moneyText(summary.value.todayReceivableAmount), accent: "amber", icon: Calendar },
    { label: "已付", value: moneyText(summary.value.paidAmount), accent: "green", icon: CircleCheck },
    { label: "今日已付", value: moneyText(summary.value.todayPaidAmount), accent: "violet", icon: TrendCharts }
  ]);

  const billColumns: TableColumnList = [
    {
      label: "支付状态",
      prop: "payStatus",
      minWidth: 100,
      fixed: "left",
      align: "center",
      slot: "payStatus"
    },
    { label: "租客姓名", prop: "tenantName", minWidth: 100 },
    { label: "联系电话", prop: "tenantPhone", minWidth: 120 },
    { label: "房源信息", prop: "roomAddress", minWidth: 200, showOverflowTooltip: true },
    {
      label: "账单",
      minWidth: 160,
      formatter: ({ sortOrder, billType }) => `第${sortOrder || "-"}期 / ${billTypeText(billType)}`
    },
    {
      label: "账期",
      minWidth: 190,
      formatter: ({ billStart, billEnd }) => `${formatDate(billStart)} ~ ${formatDate(billEnd)}`
    },
    {
      label: "应收日期",
      prop: "dueDate",
      minWidth: 100,
      formatter: ({ dueDate }) => formatDate(dueDate)
    },
    {
      label: "应收",
      prop: "totalAmount",
      minWidth: 110,
      align: "right",
      formatter: ({ totalAmount }) => moneyText(totalAmount)
    },
    {
      label: "已付",
      prop: "paidAmount",
      minWidth: 110,
      align: "right",
      formatter: ({ paidAmount }) => moneyText(paidAmount)
    },
    {
      label: "待收",
      prop: "unpaidAmount",
      minWidth: 110,
      align: "right",
      formatter: ({ unpaidAmount }) => moneyText(unpaidAmount)
    },
    {
      label: "逾期",
      prop: "overdue",
      minWidth: 80,
      align: "center",
      slot: "overdue"
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) => formatDateTime(createTime)
    }
  ];

  const feeColumns: TableColumnList = [
    { label: "租客姓名", prop: "tenantName", minWidth: 100, fixed: "left" },
    { label: "联系电话", prop: "tenantPhone", minWidth: 120 },
    { label: "房源信息", prop: "roomAddress", minWidth: 200, showOverflowTooltip: true },
    {
      label: "所属账单",
      minWidth: 100,
      formatter: ({ sortOrder }) => `第${sortOrder || "-"}期`
    },
    {
      label: "费用类型",
      prop: "feeType",
      minWidth: 90,
      align: "center",
      formatter: ({ feeType }) => feeTypeText(feeType)
    },
    { label: "费用名称", prop: "feeName", minWidth: 130, showOverflowTooltip: true },
    {
      label: "费用周期",
      minWidth: 190,
      formatter: ({ feeStart, feeEnd }) => `${formatDate(feeStart)} ~ ${formatDate(feeEnd)}`
    },
    {
      label: "应收",
      prop: "amount",
      minWidth: 110,
      align: "right",
      formatter: ({ amount }) => moneyText(amount)
    },
    {
      label: "已付",
      prop: "paidAmount",
      minWidth: 110,
      align: "right",
      formatter: ({ paidAmount }) => moneyText(paidAmount)
    },
    {
      label: "待收",
      prop: "unpaidAmount",
      minWidth: 110,
      align: "right",
      formatter: ({ unpaidAmount }) => moneyText(unpaidAmount)
    },
    {
      label: "支付状态",
      prop: "payStatus",
      minWidth: 100,
      align: "center",
      slot: "payStatus"
    },
    {
      label: "逾期",
      prop: "overdue",
      minWidth: 80,
      align: "center",
      slot: "overdue"
    }
  ];

  const currentColumns = computed(() => (viewMode.value === "bill" ? billColumns : feeColumns));
  const currentData = computed(() => (viewMode.value === "bill" ? billList.value : feeList.value));
  const currentPagination = computed(() => (viewMode.value === "bill" ? billPagination : feePagination));

  function buildQueryPayload(pageInfo: PaginationProps): LeaseBillFinanceQueryDto {
    return {
      currentPage: String(pageInfo.currentPage),
      pageSize: String(pageInfo.pageSize),
      tenantName: queryForm.tenantName?.trim() || undefined,
      tenantPhone: queryForm.tenantPhone?.trim() || undefined,
      roomKeyword: queryForm.roomKeyword?.trim() || undefined,
      overdueOnly: queryForm.overdueOnly || undefined,
      payStatus: queryForm.payStatus
    };
  }

  async function fetchSummary() {
    const { data } = await getFinanceLeaseBillSummary(buildQueryPayload(currentPagination.value));
    summary.value = data || {};
  }

  async function fetchBillPage() {
    const { data } = await getFinanceLeaseBillPage(buildQueryPayload(billPagination));
    billList.value = data?.list || [];
    billPagination.total = Number(data?.total || 0);
    billPagination.pageSize = Number(data?.pageSize || billPagination.pageSize);
    billPagination.currentPage = Number(data?.currentPage || billPagination.currentPage);
  }

  async function fetchFeePage() {
    const { data } = await getFinanceLeaseBillFeePage(buildQueryPayload(feePagination));
    feeList.value = data?.list || [];
    feePagination.total = Number(data?.total || 0);
    feePagination.pageSize = Number(data?.pageSize || feePagination.pageSize);
    feePagination.currentPage = Number(data?.currentPage || feePagination.currentPage);
  }

  async function fetchPage() {
    loading.value = true;
    try {
      await Promise.all([fetchSummary(), viewMode.value === "bill" ? fetchBillPage() : fetchFeePage()]);
    } finally {
      loading.value = false;
    }
  }

  function onSearch() {
    billPagination.currentPage = 1;
    feePagination.currentPage = 1;
    fetchPage();
  }

  function onReset() {
    queryForm.tenantName = "";
    queryForm.tenantPhone = "";
    queryForm.roomKeyword = "";
    queryForm.overdueOnly = false;
    queryForm.payStatus = undefined;
    onSearch();
  }

  function onSwitchStatus(payStatus?: number) {
    queryForm.payStatus = payStatus;
    onSearch();
  }

  function onSwitchView(mode: ViewMode) {
    viewMode.value = mode;
    fetchPage();
  }

  function handleSizeChange(val: number) {
    currentPagination.value.pageSize = val;
    currentPagination.value.currentPage = 1;
    fetchPage();
  }

  function handleCurrentChange(val: number) {
    currentPagination.value.currentPage = val;
    fetchPage();
  }

  function openBillDetail(billId?: string) {
    if (!billId) return;
    addDialog({
      title: "账单详情",
      width: "80%",
      top: "4%",
      alignCenter: true,
      hideFooter: true,
      contentRenderer: () => h(LeaseBillDetailDialog, { billId })
    });
  }

  function handleRowClick(row: LeaseBillFinanceItemVo | LeaseBillFeeFinanceItemVo) {
    if (viewMode.value === "bill") {
      openBillDetail((row as LeaseBillFinanceItemVo).id);
      return;
    }
    openBillDetail((row as LeaseBillFeeFinanceItemVo).billId);
  }

  function payStatusText(status?: number) {
    if (status === 0) return "未支付";
    if (status === 1) return "部分支付";
    if (status === 2) return "已支付";
    return "—";
  }

  function payStatusTagType(status?: number) {
    if (status === 2) return "success";
    if (status === 1) return "warning";
    return "danger";
  }

  function billTypeText(type?: number) {
    if (type === 1) return "租金";
    if (type === 2) return "押金";
    if (type === 5) return "押金结转入";
    if (type === 6) return "押金结转出";
    return "其他费用";
  }

  function feeTypeText(type?: string) {
    if (type === "RENTAL") return "租金";
    if (type === "DEPOSIT") return "押金";
    return "其他费用";
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function formatDate(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD") : "—";
  }

  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "—";
  }

  onMounted(fetchPage);
</script>

<template>
  <!--
    关键修复：
    1. 根容器必须设置 width: 100% + overflow: hidden，阻止内部元素撑破布局
    2. pure-table 去掉 table-layout="auto"（改为默认 fixed），配合 minWidth 实现横向滚动
    3. adaptiveConfig.offsetBottom 需要准确匹配实际头部高度，这里用 72 覆盖常见场景
  -->
  <div class="flb-page">
    <!-- ① 汇总统计条 + 分类展开（合为一体的卡片） -->
    <div class="flb-summary-wrap" :class="{ 'is-expanded': summaryExpanded }">
      <!-- 顶部统计行 -->
      <div class="flb-summary">
        <div class="flb-summary__cards">
          <div v-for="card in summaryCards" :key="card.label" class="flb-summary__card" :class="`flb-summary__card--${card.accent}`">
            <span class="flb-summary__card-label">{{ card.label }}</span>
            <strong class="flb-summary__card-value">{{ card.value }}</strong>
          </div>
        </div>
        <!-- 展开 handle -->
        <button
          class="flb-summary__expand-handle"
          :class="{ 'is-expanded': summaryExpanded }"
          :title="summaryExpanded ? '收起分类统计' : '展开分类统计'"
          @click="summaryExpanded = !summaryExpanded"
        >
          <el-icon class="flb-summary__expand-handle-arrow"><ArrowDown /></el-icon>
          <span class="flb-summary__expand-handle-text">分类</span>
        </button>
      </div>

      <!-- 展开的分类统计：横向平铺，与统计条融合 -->
      <transition name="cat-expand">
        <div v-if="summaryExpanded" class="flb-categories">
          <div
            v-for="(item, idx) in displayCategories"
            :key="item.feeType"
            class="flb-categories__item"
            :class="`flb-categories__item--${['blue', 'amber', 'green', 'violet'][idx % 4]}`"
          >
            <div class="flb-categories__item-header">
              <div class="flb-categories__item-icon">
                <el-icon><component :is="[Wallet, Calendar, CircleCheck, TrendCharts][idx % 4]" /></el-icon>
              </div>
              <span class="flb-categories__item-name">{{ item.feeTypeLabel || feeTypeText(item.feeType) }}</span>
            </div>
            <div class="flb-categories__item-stats">
              <div class="flb-categories__stat">
                <span class="flb-categories__stat-label">应收</span>
                <span class="flb-categories__stat-value flb-categories__stat-value--receivable">{{ moneyText(item.receivableAmount) }}</span>
              </div>
              <div class="flb-categories__stat">
                <span class="flb-categories__stat-label">已付</span>
                <span class="flb-categories__stat-value flb-categories__stat-value--paid">{{ moneyText(item.paidAmount) }}</span>
              </div>
              <div class="flb-categories__stat">
                <span class="flb-categories__stat-label">待收</span>
                <span class="flb-categories__stat-value flb-categories__stat-value--pending">{{ moneyText(item.unpaidAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- ② 筛选工具栏 -->
    <div class="flb-toolbar">
      <!-- 视图切换 Tab + 支付状态筛选 同行 -->
      <div class="flb-toolbar__top">
        <button class="flb-tab" :class="{ 'flb-tab--active': viewMode === 'bill' }" @click="onSwitchView('bill')">账单列表</button>
        <button class="flb-tab" :class="{ 'flb-tab--active': viewMode === 'fee' }" @click="onSwitchView('fee')">账单明细列表</button>

        <!-- 分隔线 -->
        <div class="flb-toolbar__divider"></div>

        <!-- 支付状态快捷筛选 -->
        <div class="flb-toolbar__status">
          <button
            v-for="tab in statusTabs"
            :key="String(tab.value)"
            class="flb-status-btn"
            :class="{ 'flb-status-btn--active': queryForm.payStatus === tab.value }"
            @click="onSwitchStatus(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <span class="flb-toolbar__desc">
          {{ viewMode === "bill" ? "按账单查看租客应收与实收" : "按账单费用项查看租客账单明细" }}
        </span>
      </div>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="queryForm" class="flb-search-form" style="padding: 12px 16px 10px">
        <el-form-item label="租客姓名">
          <el-input v-model="queryForm.tenantName" clearable placeholder="请输入租客姓名" style="width: 160px" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="queryForm.tenantPhone" clearable placeholder="请输入联系电话" style="width: 160px" />
        </el-form-item>
        <el-form-item label="房源信息">
          <el-input v-model="queryForm.roomKeyword" clearable placeholder="房源关键词" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="queryForm.overdueOnly">仅看逾期账单</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch">
            <el-icon class="mr-1"><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- ③ 表格区域 -->
    <div class="flb-table-wrap">
      <PureTableBar :title="viewMode === 'bill' ? '租客账单列表' : '租客账单明细列表'" :columns="currentColumns" @refresh="fetchPage">
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            ref="tableRef"
            row-key="id"
            border
            align-whole="center"
            :size="size"
            :loading="loading"
            :data="currentData"
            :columns="dynamicColumns"
            :pagination="{ ...currentPagination, size }"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)',
              fontWeight: '600'
            }"
            adaptive
            :adaptiveConfig="{ offsetBottom: 72 }"
            @row-click="handleRowClick"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #payStatus="{ row }">
              <el-tag :type="payStatusTagType(row.payStatus)" size="small" effect="light" round>
                {{ payStatusText(row.payStatus) }}
              </el-tag>
            </template>
            <template #overdue="{ row }">
              <el-tag v-if="row.overdue" type="warning" size="small" round effect="light">逾期</el-tag>
              <span v-else class="text-gray-300">—</span>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /*
* 核心宽度修复原则：
* - 所有容器必须 min-width: 0，防止 flex/grid 子项撑破父容器
* - 根容器 width: 100% + overflow: hidden
* - 表格容器不设固定宽度，依赖 el-table 内部横向滚动
*/

  .flb-page {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    /* 用 padding 代替 overflow:hidden 来避免贴边，同时不裁掉阴影/右侧内容 */
    padding: 0 2px 12px 0;
    box-sizing: border-box;
  }

  /* ── 汇总统计条外层容器（统计行 + 展开面板一体化） ── */
  .flb-summary-wrap {
    background: #fff;
    border: 0.5px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    min-width: 0;
    flex-shrink: 0;
  }

  /* ── 汇总统计条 ── */
  .flb-summary {
    display: flex;
    align-items: stretch;
    min-width: 0;
  }

  .flb-summary__cards {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
  }

  .flb-summary__card {
    flex: 1;
    min-width: 130px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 20px;
    position: relative;

    &:not(:last-child)::after {
      content: "";
      position: absolute;
      right: 0;
      top: 10px;
      bottom: 10px;
      width: 1px;
      background: #f1f5f9;
    }
  }

  .flb-summary__card-label {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1;
    white-space: nowrap;
  }

  .flb-summary__card-value {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  /* 四种颜色主题 */
  .flb-summary__card--blue .flb-summary__card-value {
    color: #1d4ed8;
  }
  .flb-summary__card--amber .flb-summary__card-value {
    color: #d97706;
  }
  .flb-summary__card--green .flb-summary__card-value {
    color: #16a34a;
  }
  .flb-summary__card--violet .flb-summary__card-value {
    color: #7c3aed;
  }

  /* 展开 handle */
  .flb-summary__expand-handle {
    flex-shrink: 0;
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: #f8fafc;
    border: none;
    border-left: 0.5px solid #e2e8f0;
    cursor: pointer;
    color: #94a3b8;
    transition:
      background 0.15s,
      color 0.15s;

    &:hover {
      background: #f1f5f9;
      color: #64748b;
    }

    &.is-expanded .flb-summary__expand-handle-arrow {
      transform: rotate(180deg);
    }
  }

  .flb-summary__expand-handle-arrow {
    font-size: 14px;
    transition: transform 0.22s ease;
  }

  .flb-summary__expand-handle-text {
    font-size: 10px;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    letter-spacing: 1px;
  }

  /* ── 分类展开面板：横向平铺，与统计条融合 ── */
  .flb-categories {
    display: flex;
    border-top: 1px dashed #eef2f7;
    min-width: 0;
    overflow: hidden;
  }

  .flb-categories__item {
    flex: 1;
    min-width: 0;
    padding: 12px 20px 14px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &:not(:first-child)::before {
      content: "";
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 1px;
      background: #f1f5f9;
    }

    /* 顶部色条 */
    &--blue {
      border-top: 2px solid #93c5fd;
    }
    &--amber {
      border-top: 2px solid #fcd34d;
    }
    &--green {
      border-top: 2px solid #6ee7b7;
    }
    &--violet {
      border-top: 2px solid #c4b5fd;
    }
  }

  .flb-categories__item-header {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .flb-categories__item-icon {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  .flb-categories__item--blue .flb-categories__item-icon {
    background: #eff6ff;
    color: #3b82f6;
  }
  .flb-categories__item--amber .flb-categories__item-icon {
    background: #fffbeb;
    color: #f59e0b;
  }
  .flb-categories__item--green .flb-categories__item-icon {
    background: #f0fdf4;
    color: #22c55e;
  }
  .flb-categories__item--violet .flb-categories__item-icon {
    background: #f5f3ff;
    color: #8b5cf6;
  }

  .flb-categories__item-name {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
  }

  .flb-categories__item-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .flb-categories__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .flb-categories__stat-label {
    font-size: 11px;
    color: #94a3b8;
    white-space: nowrap;
  }

  .flb-categories__stat-value {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;

    &--receivable {
      color: #1d4ed8;
    }
    &--paid {
      color: #16a34a;
    }
    &--pending {
      color: #d97706;
    }
  }

  /* 展开/收起动画 */
  .cat-expand-enter-active,
  .cat-expand-leave-active {
    transition:
      max-height 0.25s ease,
      opacity 0.2s ease;
    overflow: hidden;
  }

  .cat-expand-enter-from,
  .cat-expand-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .cat-expand-enter-to,
  .cat-expand-leave-from {
    max-height: 200px;
    opacity: 1;
  }

  /* ── 筛选工具栏 ── */
  .flb-toolbar {
    background: #fff;
    border: 0.5px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    min-width: 0;
    flex-shrink: 0;
  }

  /* 顶部 Tab 行：视图切换 + 分隔 + 状态筛选 + 说明文字 */
  .flb-toolbar__top {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 16px;
    border-bottom: 0.5px solid #f1f5f9;
    min-width: 0;
    flex-wrap: wrap;
  }

  .flb-toolbar__divider {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
    margin: 0 12px;
    flex-shrink: 0;
  }

  .flb-toolbar__desc {
    margin-left: auto;
    font-size: 11px;
    color: #cbd5e1;
    white-space: nowrap;
    padding-left: 12px;
  }

  .flb-tab {
    height: 42px;
    padding: 0 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover {
      color: #475569;
    }

    &--active {
      color: #1d4ed8;
      border-bottom-color: #3b82f6;
    }
  }

  .flb-toolbar__status {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .flb-status-btn {
    height: 24px;
    padding: 0 11px;
    border: 0.5px solid #e2e8f0;
    border-radius: 999px;
    background: #fff;
    color: #64748b;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;

    &:hover {
      border-color: #93c5fd;
      color: #3b82f6;
    }

    &--active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
      font-weight: 500;
    }
  }

  /* 搜索表单 */
  .flb-search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
    min-width: 0;
    border-top: 0.5px solid #f1f5f9;
  }

  :deep(.flb-search-form .el-form-item) {
    margin-right: 12px;
    margin-bottom: 0;
  }

  :deep(.flb-search-form .el-form-item__label) {
    color: #64748b;
    font-size: 13px;
    padding-right: 6px;
  }

  /* ── 表格容器 ── */
  .flb-table-wrap {
    min-width: 0; /* 关键：防止撑破父容器 */
    width: 100%;
    overflow: hidden; /* 让 pure-table 自己处理横向滚动，这里不重复滚动 */
    flex: 1;
  }

  /* pure-table-bar 整体 */
  :deep(.pure-table-bar) {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    background: var(--el-bg-color);
    min-width: 0;
  }

  :deep(.pure-table-bar__header) {
    padding: 10px 14px;
    min-width: 0;
  }

  /* el-table 宽度强约束 */
  :deep(.el-table) {
    width: 100% !important;
  }

  :deep(.el-table__inner-wrapper) {
    width: 100%;
  }

  /* 行点击样式 */
  :deep(.el-table__row) {
    cursor: pointer;

    &:hover td {
      background-color: #f8fafc !important;
    }
  }

  /* slide-down 动画 */
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .slide-down-enter-to,
  .slide-down-leave-from {
    opacity: 1;
    max-height: 400px;
  }

  /* 暗色模式适配 */
  html.dark {
    .flb-summary-wrap,
    .flb-toolbar,
    .flb-categories {
      background: var(--el-bg-color);
      border-color: var(--el-border-color);
    }

    .flb-categories {
      border-top-color: var(--el-border-color-lighter);
    }

    .flb-categories__item-icon {
      opacity: 0.85;
    }

    .flb-summary__expand-handle {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color);
    }

    .flb-summary__card::after,
    .flb-categories__item::before {
      background: var(--el-border-color-lighter);
    }

    .flb-toolbar__top,
    .flb-search-form {
      border-color: var(--el-border-color-lighter);
    }

    .flb-tab {
      color: var(--el-text-color-secondary);
    }
    .flb-tab--active {
      color: #60a5fa;
      border-bottom-color: #3b82f6;
    }

    .flb-status-btn {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color);
      color: var(--el-text-color-regular);
    }
  }
</style>
