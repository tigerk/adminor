<template>
  <div class="owner-finance-page">
    <OwnerPageHeader :summary-span="20" :action-span="4">
      <template #search>
      <el-form :inline="true" :model="queryForm" class="owner-page-search-form">
        <el-form-item>
          <el-input v-model="queryForm.ownerName" placeholder="业主名称" clearable class="owner-filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="queryForm.applyNo" placeholder="提现单号" clearable class="owner-filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.approvalStatus" placeholder="审批状态" clearable class="owner-filter-select">
            <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.withdrawStatus" placeholder="打款状态" clearable class="owner-filter-select">
            <el-option v-for="item in withdrawStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      </template>

      <template #summary>
        <OwnerSummaryCards :cards="summaryCards" :columns="6" />
      </template>

      <template #actions>
        <el-button type="primary" :disabled="!createForm.ownerId" @click="openCreateDialog">发起提现</el-button>
      </template>
    </OwnerPageHeader>

    <el-row class="bg-bg_color w-full px-4 pb-4">
      <div class="w-full">
        <el-table v-loading="loading" :data="tableData" border>
          <el-table-column prop="applyNo" label="提现单号" min-width="180" />
          <el-table-column prop="ownerName" label="业主" min-width="140" />
          <el-table-column prop="ownerPhone" label="联系电话" min-width="140" />
          <el-table-column label="申请金额" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.applyAmount) }}</template>
          </el-table-column>
          <el-table-column label="手续费" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.feeAmount) }}</template>
          </el-table-column>
          <el-table-column label="实际到账" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.actualAmount) }}</template>
          </el-table-column>
          <el-table-column label="审批状态" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="approvalStatusTagType(row.approvalStatus)">{{ approvalStatusText(row.approvalStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="打款状态" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="withdrawStatusTagType(row.withdrawStatus)">{{ withdrawStatusText(row.withdrawStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="appliedAt" label="申请时间" min-width="160" />
          <el-table-column label="操作" min-width="230" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row.applyId)">详情</el-button>
              <el-button v-for="action in rowActions(row)" :key="action.type" link :type="action.buttonType" @click="operate(row, action.type)">
                {{ action.label }}
              </el-button>
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
      </div>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { useRoute, useRouter } from "vue-router";
  import {
    getOwnerWithdrawPage,
    getOwnerWithdrawSummary,
    operateOwnerWithdraw
  } from "@/api/finance/owner";
  import OwnerPageHeader from "@/shared/owner/OwnerPageHeader.vue";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/panel.scss";
  import useOwnerWithdrawDialog from "@/views/finance/owner-withdraw/utils/hook";
  import type {
    OwnerWithdrawApplyDetailVo,
    OwnerWithdrawApplyListVo,
    OwnerWithdrawApplyQueryDto,
    OwnerWithdrawCreateDto,
    OwnerWithdrawOperateDto,
    OwnerWithdrawOperateEnum,
    OwnerWithdrawSummaryVo
  } from "@/types/generated";

  defineOptions({ name: "OwnerWithdrawEntry" });

  const route = useRoute();
  const router = useRouter();
  const { openOwnerWithdrawCreateDialog, openOwnerWithdrawDetailDialog } = useOwnerWithdrawDialog();
  type QueryForm = Omit<OwnerWithdrawApplyQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const total = ref(0);
  const tableData = ref<OwnerWithdrawApplyListVo[]>([]);
  const summary = ref<OwnerWithdrawSummaryVo>({});

  const approvalStatusMap: Record<number, string> = {
    1: "审批中",
    2: "已通过",
    3: "已驳回",
    4: "已撤回"
  };
  const withdrawStatusMap: Record<number, string> = {
    0: "待处理",
    1: "打款中",
    2: "成功",
    3: "失败",
    4: "已取消"
  };
  const approvalStatusOptions = [
    { label: "审批中", value: 1 },
    { label: "已通过", value: 2 },
    { label: "已驳回", value: 3 },
    { label: "已撤回", value: 4 }
  ];
  const withdrawStatusOptions = [
    { label: "待处理", value: 0 },
    { label: "打款中", value: 1 },
    { label: "成功", value: 2 },
    { label: "失败", value: 3 },
    { label: "已取消", value: 4 }
  ];

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerId: String(route.query.ownerId || "") || undefined,
    contractId: String(route.query.contractId || "") || undefined,
    ownerName: "",
    applyNo: "",
    approvalStatus: undefined,
    withdrawStatus: undefined
  });

  function createDefaultForm(): OwnerWithdrawCreateDto {
    return {
      ownerId: String(route.query.ownerId || "") || undefined,
      applyAmount: Number(route.query.applyAmount || 0) || undefined,
      feeAmount: 0,
      payeeName: "",
      payeeAccountNo: "",
      payeeBankName: "",
      remark: ""
    };
  }

  const createForm = reactive<OwnerWithdrawCreateDto>(createDefaultForm());

  const summaryCards = computed(() => [
    { key: "count", label: "提现单数", value: numberText(summary.value.applyCount) },
    { key: "pending", label: "待审批", value: numberText(summary.value.pendingApprovalCount) },
    { key: "processing", label: "打款中", value: numberText(summary.value.processingCount) },
    { key: "success", label: "已成功", value: numberText(summary.value.successCount) },
    { key: "available", label: "可提现余额", value: moneyText(summary.value.availableAmount) },
    { key: "frozen", label: "冻结金额", value: moneyText(summary.value.frozenAmount) }
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

  function withdrawStatusText(value?: number) {
    return withdrawStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  }

  function approvalStatusTagType(value?: number) {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    return "warning";
  }

  function withdrawStatusTagType(value?: number) {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    if (value === 1) return "warning";
    return "primary";
  }

  function rowActions(row?: Partial<OwnerWithdrawApplyListVo & OwnerWithdrawApplyDetailVo>) {
    if (!row?.applyId) return [];
    if (row.approvalStatus === 1) {
      return [
        { label: "通过", type: "APPROVE", buttonType: "primary" },
        { label: "驳回", type: "REJECT", buttonType: "danger" },
        { label: "取消", type: "info", buttonType: "info" }
      ] as const;
    }
    if (row.approvalStatus === 2 && row.withdrawStatus === 0) {
      return [{ label: "标记打款中", type: "PAYING", buttonType: "warning" }] as const;
    }
    if (row.approvalStatus === 2 && row.withdrawStatus === 1) {
      return [
        { label: "打款成功", type: "SUCCESS", buttonType: "success" },
        { label: "打款失败", type: "FAIL", buttonType: "danger" }
      ] as const;
    }
    return [];
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerWithdrawPage(listParams()), getOwnerWithdrawSummary(listParams())]);
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
    queryForm.applyNo = "";
    queryForm.approvalStatus = undefined;
    queryForm.withdrawStatus = undefined;
    queryForm.ownerId = String(route.query.ownerId || "") || undefined;
    queryForm.contractId = String(route.query.contractId || "") || undefined;
    fetchData();
  }

  function resetCreateForm() {
    Object.assign(createForm, createDefaultForm());
  }

  function openCreateDialog() {
    resetCreateForm();
    openOwnerWithdrawCreateDialog({ ...createForm }, async () => {
      await fetchData();
      if (route.query.openCreate) {
        router.replace({ path: route.path, query: { ownerId: queryForm.ownerId, contractId: queryForm.contractId } });
      }
    });
  }

  async function openDetail(applyId?: string) {
    await openOwnerWithdrawDetailDialog(applyId, operate);
  }

  async function operate(row: Partial<OwnerWithdrawApplyListVo & OwnerWithdrawApplyDetailVo>, operateType: OwnerWithdrawOperateEnum | "CANCEL") {
    if (!row.applyId) return;
    let failureReason = "";
    let thirdTradeNo = "";
    let channel = "";
    if (operateType === "REJECT" || operateType === "FAIL") {
      const promptText = operateType === "REJECT" ? "请输入驳回原因" : "请输入失败原因";
      const result = await ElMessageBox.prompt(promptText, "操作确认", { inputPlaceholder: promptText }).catch(() => null);
      if (!result) return;
      failureReason = result.value;
    } else if (operateType === "SUCCESS") {
      const tradeResult = await ElMessageBox.prompt("请输入三方流水号", "打款成功", { inputPlaceholder: "请输入三方流水号" }).catch(() => null);
      if (!tradeResult) return;
      const channelResult = await ElMessageBox.prompt("请输入打款渠道", "打款成功", { inputPlaceholder: "例如：线下转账 / 易宝" }).catch(() => null);
      if (!channelResult) return;
      thirdTradeNo = tradeResult.value;
      channel = channelResult.value;
    } else {
      const actionLabel = rowActions(row).find(item => item.type === operateType)?.label || "执行";
      const confirmed = await ElMessageBox.confirm(`确认${actionLabel}提现吗？`, "提示", { type: "warning" }).catch(() => null);
      if (!confirmed) return;
    }

    await operateOwnerWithdraw({
      applyId: row.applyId,
      operateType,
      failureReason,
      thirdTradeNo,
      channel
    } as OwnerWithdrawOperateDto);
    ElMessage.success("操作成功");
    await fetchData();
  }

  onMounted(() => {
    fetchData();
    if (route.query.openCreate === "1" && createForm.ownerId) {
      openCreateDialog();
    }
  });
</script>

<style scoped lang="scss">
  .owner-finance-page {
    display: flex;
    flex-direction: column;
  }

</style>
