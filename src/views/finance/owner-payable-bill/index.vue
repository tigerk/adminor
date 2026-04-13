<template>
  <div class="pf-page">
    <div v-if="showPageIntro" class="page-intro-wrap">
      <el-alert class="page-intro-alert" type="warning" closable @close="closePageIntro">
        <div class="page-intro-alert__content">
          <span class="page-intro-alert__title">包租应付单</span>
          <span class="page-intro-alert__desc">用于管理包租模式下按付款设置生成的业主应付账单与付款执行</span>
        </div>
      </el-alert>
    </div>

    <div class="summary-block">
      <OwnerSummaryCards :cards="summaryCards" :columns="4" />
    </div>

    <div class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="业主名称">
          <el-input v-model="queryForm.ownerName" placeholder="请输入业主名称" clearable class="filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item label="应付单号">
          <el-input v-model="queryForm.billNo" placeholder="请输入应付单号" clearable class="filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="queryForm.settlementStatus" placeholder="请选择付款状态" clearable class="filter-input">
            <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="list-card">
      <div class="list-card__header">
        <div class="list-card__title">包租应付单</div>
      </div>
      <div class="list-card__body">
        <div class="list-card__table">
          <el-table v-loading="loading" :data="tableData" border>
            <el-table-column prop="billNo" label="应付单号" min-width="180" />
            <el-table-column prop="ownerName" label="业主" min-width="140" />
            <el-table-column prop="ownerPhone" label="联系电话" min-width="140" />
            <el-table-column prop="contractNo" label="合同编号" min-width="180" />
            <el-table-column prop="subjectName" label="合同房源" min-width="180" show-overflow-tooltip />
            <el-table-column label="账期" min-width="200">
              <template #default="{ row }">{{ row.billStart || "-" }} 至 {{ row.billEnd || "-" }}</template>
            </el-table-column>
            <el-table-column label="应付日期" min-width="120" align="center">
              <template #default="{ row }">{{ row.dueDate || "-" }}</template>
            </el-table-column>
            <el-table-column label="应付金额" min-width="120" align="right">
              <template #default="{ row }">{{ moneyText(row.payableAmount) }}</template>
            </el-table-column>
            <el-table-column label="已付金额" min-width="120" align="right">
              <template #default="{ row }">{{ moneyText(row.settledAmount) }}</template>
            </el-table-column>
            <el-table-column label="未付金额" min-width="120" align="right">
              <template #default="{ row }">{{ moneyText(row.unpaidAmount) }}</template>
            </el-table-column>
            <el-table-column label="付款状态" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="settlementStatusTagType(row.settlementStatus)">{{ settlementStatusText(row.settlementStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="generatedAt" label="生成时间" min-width="170" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDetail(row.billId)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="list-card__pagination">
          <el-pagination
            v-model:current-page="queryForm.currentPage"
            v-model:page-size="queryForm.pageSize"
            :page-sizes="[10, 20, 30, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @current-change="fetchData"
            @size-change="fetchData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { useRoute } from "vue-router";
  import { getOwnerBillPage, getOwnerBillSummary } from "@/api/owner/owner";
  import useOwnerPayableBillDialog from "@/views/finance/owner-payable-bill/utils/hook";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/financePage.scss";
  import type { OwnerBillListVo, OwnerBillQueryDto, OwnerBillSummaryVo, OwnerCooperationModeEnum } from "@/types/generated";

  defineOptions({ name: "OwnerPayableBillEntry" });

  const OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY = "owner-payable-bill-page-intro-closed";

  const route = useRoute();
  const { openOwnerPayableBillDetailDialog } = useOwnerPayableBillDialog();
  type QueryForm = Omit<OwnerBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
    cooperationMode?: OwnerCooperationModeEnum;
  };

  const loading = ref(false);
  const total = ref(0);
  const showPageIntro = ref(localStorage.getItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY) !== "1");
  const tableData = ref<OwnerBillListVo[]>([]);
  const summary = ref<OwnerBillSummaryVo>({});

  const settlementStatusMap: Record<number, string> = {
    0: "未付款",
    1: "部分付款",
    2: "已付款"
  };
  const settlementStatusOptions = [
    { label: "未付款", value: 0 },
    { label: "部分付款", value: 1 },
    { label: "已付款", value: 2 }
  ];

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerId: String(route.query.ownerId || "") || undefined,
    contractId: String(route.query.contractId || "") || undefined,
    ownerName: "",
    billNo: "",
    cooperationMode: "MASTER_LEASE" as OwnerCooperationModeEnum,
    settlementStatus: undefined
  });

  const summaryCards = computed(() => [
    { key: "count", label: "应付单数", value: numberText(summary.value.billCount) },
    { key: "payable", label: "应付总额", value: moneyText(summary.value.totalPayableAmount) },
    { key: "settled", label: "已付总额", value: moneyText(summary.value.totalSettledAmount) },
    { key: "unpaid", label: "未付总额", value: moneyText(summary.value.totalUnpaidAmount) }
  ]);

  function listParams() {
    return {
      ...queryForm,
      currentPage: String(queryForm.currentPage),
      pageSize: String(queryForm.pageSize)
    };
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function numberText(value?: string) {
    return String(value || "0");
  }

  function settlementStatusText(value?: number) {
    return settlementStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  }

  function settlementStatusTagType(value?: number) {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
  }

  function closePageIntro() {
    showPageIntro.value = false;
    localStorage.setItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY, "1");
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerBillPage(listParams()), getOwnerBillSummary(listParams())]);
      tableData.value = pageResp.data?.list || [];
      total.value = Number(pageResp.data?.total || 0);
      summary.value = summaryResp.data || {};
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    queryForm.currentPage = 1;
    queryForm.pageSize = 10;
    queryForm.ownerName = "";
    queryForm.billNo = "";
    queryForm.cooperationMode = "MASTER_LEASE";
    queryForm.settlementStatus = undefined;
    queryForm.ownerId = String(route.query.ownerId || "") || undefined;
    queryForm.contractId = String(route.query.contractId || "") || undefined;
    fetchData();
  }

  async function openDetail(billId?: string) {
    await openOwnerPayableBillDetailDialog(billId);
  }

  onMounted(fetchData);
</script>

<style scoped lang="scss"></style>
