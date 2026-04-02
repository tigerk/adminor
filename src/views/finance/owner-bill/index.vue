<template>
  <div class="owner-finance-page">
    <div class="summary-row">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card">
        <span class="summary-card__label">{{ card.label }}</span>
        <strong class="summary-card__value">{{ card.value }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="mt-3">
      <el-form :inline="true" :model="queryForm">
        <el-form-item>
          <el-input v-model="queryForm.ownerName" placeholder="业主名称" clearable class="!w-[180px]" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="queryForm.billNo" placeholder="账单编号" clearable class="!w-[180px]" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.approvalStatus" placeholder="审批状态" clearable class="!w-[140px]">
            <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.settlementStatus" placeholder="结算状态" clearable class="!w-[140px]">
            <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-3">
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
    </el-card>

    <el-drawer v-model="detailVisible" title="业主账单详情" size="960px">
      <el-skeleton v-if="detailLoading" :rows="10" animated />
      <template v-else>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账单编号">{{ detail.billNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="业主">{{ detail.ownerName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.ownerPhone || "-" }}</el-descriptions-item>
          <el-descriptions-item label="合同编号">{{ detail.contractNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="合作模式">{{ cooperationModeLabelMap[detail.cooperationMode || "LIGHT_MANAGED"] }}</el-descriptions-item>
          <el-descriptions-item label="账期">{{ detail.billStart || "-" }} 至 {{ detail.billEnd || "-" }}</el-descriptions-item>
          <el-descriptions-item label="收入金额">{{ moneyText(detail.incomeAmount) }}</el-descriptions-item>
          <el-descriptions-item label="减免金额">{{ moneyText(detail.reductionAmount) }}</el-descriptions-item>
          <el-descriptions-item label="费用金额">{{ moneyText(detail.expenseAmount) }}</el-descriptions-item>
          <el-descriptions-item label="调账金额">{{ moneyText(detail.adjustAmount) }}</el-descriptions-item>
          <el-descriptions-item label="应付金额">{{ moneyText(detail.payableAmount) }}</el-descriptions-item>
          <el-descriptions-item label="可提现金额">{{ moneyText(detail.withdrawableAmount) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createTime || "-" }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updateTime || "-" }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || "-" }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">账单明细</div>
        <el-table :data="detail.lineList || []" border>
          <el-table-column prop="itemName" label="项目" min-width="160" />
          <el-table-column prop="itemType" label="类型" min-width="120" />
          <el-table-column prop="direction" label="方向" width="90" align="center" />
          <el-table-column label="金额" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="120" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>

        <div class="section-title">减免明细</div>
        <el-table :data="detail.reductionList || []" border>
          <el-table-column prop="reductionName" label="减免项目" min-width="160" />
          <el-table-column prop="reductionType" label="减免类型" min-width="140" />
          <el-table-column label="金额" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="120" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </template>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            type="primary"
            :disabled="!canWithdraw(detail)"
            @click="goWithdraw(detail)"
          >
            去提现
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { getOwnerBillDetail, getOwnerBillPage, getOwnerBillSummary } from "@/api/finance/owner";
  import type { OwnerBillDetailVo, OwnerBillIdDto, OwnerBillListVo, OwnerBillQueryDto, OwnerBillSummaryVo } from "@/types/generated";

  defineOptions({ name: "OwnerBillEntry" });

  const route = useRoute();
  const router = useRouter();
  type QueryForm = Omit<OwnerBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const detailLoading = ref(false);
  const detailVisible = ref(false);
  const total = ref(0);
  const tableData = ref<OwnerBillListVo[]>([]);
  const detail = ref<OwnerBillDetailVo>({});
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

  function canWithdraw(data?: OwnerBillDetailVo) {
    return Number(data?.withdrawableAmount || 0) > 0 && !!data?.ownerId;
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
    if (!billId) return;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const resp = await getOwnerBillDetail({ billId } as OwnerBillIdDto);
      detail.value = resp.data || {};
    } finally {
      detailLoading.value = false;
    }
  }

  function goWithdraw(data?: OwnerBillDetailVo) {
    if (!data?.ownerId) return;
    router.push({
      path: "/finance/owner-withdraw",
      query: {
        ownerId: data.ownerId,
        contractId: data.contractId,
        applyAmount: String(data.withdrawableAmount || 0),
        openCreate: "1"
      }
    });
  }

  onMounted(fetchData);
</script>

<style scoped lang="scss">
  .owner-finance-page {
    display: flex;
    flex-direction: column;
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-card__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .summary-card__value {
    font-size: 24px;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }

  .section-title {
    margin: 20px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
