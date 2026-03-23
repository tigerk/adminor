<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { addDialog } from "@/components/ReDialog";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { PaymentFlowFinanceItemVo, PaymentFlowFinanceQueryDto, PaymentFlowFinanceSummaryVo, PaymentFlowStatusEnumMeta } from "@/types";
  import { getFinancePaymentFlowPage, getFinancePaymentFlowSummary } from "@/api/finance/paymentFlow";
  import PaymentFlowDetailDialog from "@/views/finance/payment-flow/view/PaymentFlowDetailDialog.vue";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({
    name: "FinancePaymentFlow"
  });

  const loading = ref(false);
  const list = ref<PaymentFlowFinanceItemVo[]>([]);
  const summary = ref<PaymentFlowFinanceSummaryVo>({});

  const queryForm = reactive<PaymentFlowFinanceQueryDto>({
    currentPage: "1",
    pageSize: "15",
    tenantName: "",
    tenantPhone: "",
    roomKeyword: "",
    status: 1
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const statusTabs = [
    { label: "待审批", value: 1 },
    { label: "支付成功", value: 2 },
    { label: "已关闭", value: 4 }
  ];

  const summaryCards = computed(() => [
    {
      key: "pending",
      label: "待审批流水",
      total: summary.value.pendingApprovalAmount || 0,
      today: summary.value.todayPendingApprovalAmount || 0,
      accent: "amber"
    },
    {
      key: "success",
      label: "成功支付",
      total: summary.value.successAmount || 0,
      today: summary.value.todaySuccessAmount || 0,
      accent: "green"
    },
    {
      key: "closed",
      label: "已关闭流水",
      total: summary.value.closedAmount || 0,
      today: summary.value.todayClosedAmount || 0,
      accent: "slate"
    }
  ]);

  const columns: TableColumnList = [
    { label: "支付流水号", prop: "paymentNo", minWidth: 180, fixed: "left" },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      align: "center",
      slot: "status"
    },
    { label: "租客姓名", prop: "tenantName", minWidth: 100 },
    { label: "联系电话", prop: "tenantPhone", minWidth: 120 },
    { label: "房源信息", prop: "roomAddress", minWidth: 220, showOverflowTooltip: true },
    {
      label: "所属账单",
      minWidth: 110,
      formatter: ({ sortOrder }) => (sortOrder ? `第${sortOrder}期` : "-")
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
      formatter: ({ amount }) => moneyText(amount)
    },
    { label: "付款人", prop: "payerName", minWidth: 100 },
    { label: "操作人", prop: "operatorName", minWidth: 100 },
    {
      label: "支付时间",
      prop: "payTime",
      minWidth: 160,
      formatter: ({ payTime }) => formatDateTime(payTime)
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) => formatDateTime(createTime)
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

  function onSwitchStatus(status: number) {
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
      contentRenderer: () => h(PaymentFlowDetailDialog, { flowId })
    });
  }

  function handleRowClick(row: PaymentFlowFinanceItemVo) {
    openDetail(row.id);
  }

  function statusText(status?: number) {
    if (status === PaymentFlowStatusEnumMeta.PENDING_APPROVAL.code) return "待审批";
    if (status === PaymentFlowStatusEnumMeta.SUCCESS.code) return "支付成功";
    if (status === PaymentFlowStatusEnumMeta.CLOSED.code) return "已关闭";
    return "-";
  }

  function statusTagType(status?: number) {
    if (status === 2) return "success";
    if (status === 4) return "info";
    return "warning";
  }

  function channelText(channel?: string) {
    if (!channel) return "-";
    return (PaymentFlowChannelEnumMeta as Record<string, { label: string }>)[channel]?.label || channel;
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
  }

  onMounted(fetchPage);
</script>

<template>
  <div class="payment-flow-page">
    <div class="summary-strip">
      <div v-for="card in summaryCards" :key="card.key" class="summary-item" :class="`summary-item--${card.accent}`">
        <div class="summary-item__label">{{ card.label }}</div>
        <div class="summary-item__meta">
          <span>{{ moneyText(card.total) }}</span>
          <span>今日金额 {{ moneyText(card.today) }}</span>
        </div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-card__section toolbar-card__section--form">
        <el-form :inline="true" :model="queryForm" class="query-form">
          <el-form-item label="租客姓名">
            <el-input v-model="queryForm.tenantName" clearable placeholder="请输入租客姓名" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="queryForm.tenantPhone" clearable placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="房源信息">
            <el-input v-model="queryForm.roomKeyword" clearable placeholder="请输入房源关键词" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <PureTableBar title="租客支付流水列表" :columns="columns" @refresh="fetchPage">
      <template #buttons>
        <el-button v-for="item in statusTabs" :key="item.value" :type="queryForm.status === item.value ? 'primary' : 'default'" @click="onSwitchStatus(item.value)">
          {{ item.label }}
        </el-button>
      </template>

      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          adaptive
          :adaptiveConfig="{ offsetBottom: 96 }"
          alignWhole="center"
          table-layout="auto"
          showOverflowTooltip
          :loading="loading"
          :size="size"
          :data="list"
          :columns="dynamicColumns"
          :pagination="pagination"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
          @row-click="handleRowClick"
        >
          <template #status="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
  .payment-flow-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .summary-strip,
  .toolbar-card {
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    background: #fff;
  }

  .summary-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 12px;
  }

  .summary-item {
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    padding: 14px 16px;
  }

  .summary-item__label {
    font-size: 13px;
    color: #64748b;
  }

  .summary-item__meta {
    margin-top: 8px;
    display: flex;
    gap: 18px;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }

  .summary-item__meta span:last-child {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    align-self: end;
    margin-bottom: 4px;
  }

  .summary-item--amber {
    background: linear-gradient(135deg, #fffaf0 0%, #fff7ed 100%);
  }

  .summary-item--green {
    background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
  }

  .summary-item--slate {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .toolbar-card {
    padding: 14px 18px 10px;
  }

  .toolbar-card__section--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }

  .query-form {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  :deep(.query-form .el-form-item) {
    margin-bottom: 8px;
  }

  @media (max-width: 960px) {
    .summary-strip {
      grid-template-columns: 1fr;
    }
  }
</style>
