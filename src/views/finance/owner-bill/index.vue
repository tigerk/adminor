<template>
  <div class="owner-finance-page">
    <OwnerPageHeader :summary-span="24" :action-span="0">
      <template #search>
        <el-form :inline="true" :model="queryForm" class="owner-page-search-form">
          <el-form-item>
            <el-input v-model="queryForm.ownerName" placeholder="业主名称" clearable class="owner-filter-input" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.billNo" placeholder="账单编号" clearable class="owner-filter-input" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.approvalStatus" placeholder="审批状态" clearable class="owner-filter-select">
              <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.settlementStatus" placeholder="结算状态" clearable class="owner-filter-select">
              <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #summary>
        <OwnerSummaryCards :cards="summaryCards" :columns="4" />
      </template>
    </OwnerPageHeader>

    <el-row class="bg-bg_color w-full px-4 pb-4">
      <el-col :span="24">
        <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="billNo" label="账单编号" min-width="180" />
        <el-table-column prop="ownerName" label="业主" min-width="140" />
        <el-table-column prop="ownerPhone" label="联系电话" min-width="140" />
        <el-table-column prop="contractNo" label="合同编号" min-width="180" />
        <el-table-column label="合作模式" min-width="110" align="center">
          <template #default="{ row }">{{ cooperationModeLabelMap[row.cooperationMode || "LIGHT_MANAGED"] }}</template>
        </el-table-column>
        <el-table-column label="账期" min-width="200">
          <template #default="{ row }">{{ row.billStart || "-" }} 至 {{ row.billEnd || "-" }}</template>
        </el-table-column>
        <el-table-column label="应付金额" min-width="120" align="right">
          <template #default="{ row }">{{ moneyText(row.payableAmount) }}</template>
        </el-table-column>
        <el-table-column label="可提现" min-width="120" align="right">
          <template #default="{ row }">{{ moneyText(row.withdrawableAmount) }}</template>
        </el-table-column>
        <el-table-column label="审批状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="approvalStatusTagType(row.approvalStatus)">{{ approvalStatusText(row.approvalStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="settlementStatusTagType(row.settlementStatus)">{{ settlementStatusText(row.settlementStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.billId)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

        <div class="mt-4 flex justify-end">
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
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { useRoute } from "vue-router";
  import { getOwnerBillPage, getOwnerBillSummary } from "@/api/owner/owner";
  import useOwnerBillDialog from "@/views/finance/owner-bill/utils/hook";
  import OwnerPageHeader from "@/shared/owner/OwnerPageHeader.vue";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/panel.scss";
  import type { OwnerBillListVo, OwnerBillQueryDto, OwnerBillSummaryVo } from "@/types/generated";

  defineOptions({ name: "OwnerBillEntry" });

  const route = useRoute();
  const { openOwnerBillDetailDialog } = useOwnerBillDialog();
  type QueryForm = Omit<OwnerBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const total = ref(0);
  const tableData = ref<OwnerBillListVo[]>([]);
  const summary = ref<OwnerBillSummaryVo>({});

  const cooperationModeLabelMap = {
    LIGHT_MANAGED: "轻托管",
    MASTER_LEASE: "包租"
  } as const;
  const approvalStatusMap: Record<number, string> = {
    1: "审批中",
    2: "已通过",
    3: "已驳回",
    4: "已撤回"
  };
  const settlementStatusMap: Record<number, string> = {
    0: "未结算",
    1: "部分结算",
    2: "已结算"
  };
  const approvalStatusOptions = [
    { label: "审批中", value: 1 },
    { label: "已通过", value: 2 },
    { label: "已驳回", value: 3 },
    { label: "已撤回", value: 4 }
  ];
  const settlementStatusOptions = [
    { label: "未结算", value: 0 },
    { label: "部分结算", value: 1 },
    { label: "已结算", value: 2 }
  ];

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerId: String(route.query.ownerId || "") || undefined,
    contractId: String(route.query.contractId || "") || undefined,
    ownerName: "",
    billNo: "",
    approvalStatus: undefined,
    settlementStatus: undefined
  });

  const summaryCards = computed(() => [
    { key: "count", label: "账单数", value: numberText(summary.value.billCount) },
    { key: "income", label: "收入总额", value: moneyText(summary.value.totalIncomeAmount) },
    { key: "payable", label: "应付总额", value: moneyText(summary.value.totalPayableAmount) },
    { key: "withdrawable", label: "可提现总额", value: moneyText(summary.value.totalWithdrawableAmount) }
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

  function approvalStatusText(value?: number) {
    return approvalStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  }

  function settlementStatusText(value?: number) {
    return settlementStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  }

  function approvalStatusTagType(value?: number) {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    return "warning";
  }

  function settlementStatusTagType(value?: number) {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
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
    queryForm.approvalStatus = undefined;
    queryForm.settlementStatus = undefined;
    queryForm.ownerId = String(route.query.ownerId || "") || undefined;
    queryForm.contractId = String(route.query.contractId || "") || undefined;
    fetchData();
  }

  async function openDetail(billId?: string) {
    await openOwnerBillDetailDialog(billId);
  }

  onMounted(fetchData);
</script>

<style scoped lang="scss">
  .owner-finance-page {
    display: flex;
    flex-direction: column;
  }

</style>
