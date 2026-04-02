<template>
  <div class="owner-finance-page">
    <div class="summary-row">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card">
        <span class="summary-card__label">{{ card.label }}</span>
        <strong class="summary-card__value">{{ card.value }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="mt-3">
      <div class="toolbar-row">
        <el-form :inline="true" :model="queryForm">
          <el-form-item>
            <el-input v-model="queryForm.ownerName" placeholder="业主名称" clearable class="!w-[180px]" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.applyNo" placeholder="提现单号" clearable class="!w-[180px]" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.approvalStatus" placeholder="审批状态" clearable class="!w-[140px]">
              <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.withdrawStatus" placeholder="打款状态" clearable class="!w-[140px]">
              <el-option v-for="item in withdrawStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" :disabled="!createForm.ownerId" @click="openCreateDialog">发起提现</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
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
    </el-card>

    <el-dialog v-model="createVisible" title="发起业主提现" width="560px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item label="业主ID" prop="ownerId">
          <el-input v-model="createForm.ownerId" placeholder="请输入业主ID" />
        </el-form-item>
        <el-form-item label="申请金额" prop="applyAmount">
          <el-input-number v-model="createForm.applyAmount" class="!w-full" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item label="手续费">
          <el-input-number v-model="createForm.feeAmount" class="!w-full" :min="0" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="收款人" prop="payeeName">
          <el-input v-model="createForm.payeeName" placeholder="请输入收款人" />
        </el-form-item>
        <el-form-item label="银行卡号" prop="payeeAccountNo">
          <el-input v-model="createForm.payeeAccountNo" placeholder="请输入银行卡号" />
        </el-form-item>
        <el-form-item label="开户行" prop="payeeBankName">
          <el-input v-model="createForm.payeeBankName" placeholder="请输入开户行" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="业主提现详情" size="960px">
      <el-skeleton v-if="detailLoading" :rows="10" animated />
      <template v-else>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="提现单号">{{ detail.applyNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="业主">{{ detail.ownerName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.ownerPhone || "-" }}</el-descriptions-item>
          <el-descriptions-item label="收款人">{{ detail.payeeName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="银行卡号">{{ detail.payeeAccountNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="开户行">{{ detail.payeeBankName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="申请金额">{{ moneyText(detail.applyAmount) }}</el-descriptions-item>
          <el-descriptions-item label="实际到账">{{ moneyText(detail.actualAmount) }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">{{ approvalStatusText(detail.approvalStatus) }}</el-descriptions-item>
          <el-descriptions-item label="打款状态">{{ withdrawStatusText(detail.withdrawStatus) }}</el-descriptions-item>
          <el-descriptions-item label="三方流水号">{{ detail.thirdTradeNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="打款渠道">{{ detail.channel || "-" }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ detail.appliedAt || "-" }}</el-descriptions-item>
          <el-descriptions-item label="打款时间">{{ detail.paidAt || "-" }}</el-descriptions-item>
          <el-descriptions-item label="失败原因" :span="2">{{ detail.failureReason || "-" }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || "-" }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button v-for="action in detailActions" :key="action.type" :type="action.buttonType" plain @click="operate(detail, action.type)">
            {{ action.label }}
          </el-button>
        </div>

        <div class="section-title">账户流水</div>
        <el-table :data="detail.flowList || []" border>
          <el-table-column prop="changeType" label="变动类型" min-width="150" />
          <el-table-column prop="flowDirection" label="方向" width="100" align="center" />
          <el-table-column label="金额" min-width="120" align="right">
            <template #default="{ row }">{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="可用余额" min-width="160" align="right">
            <template #default="{ row }">{{ moneyText(row.availableBefore) }} → {{ moneyText(row.availableAfter) }}</template>
          </el-table-column>
          <el-table-column label="冻结余额" min-width="160" align="right">
            <template #default="{ row }">{{ moneyText(row.frozenBefore) }} → {{ moneyText(row.frozenAfter) }}</template>
          </el-table-column>
          <el-table-column prop="createTime" label="时间" min-width="160" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { ElMessage, ElMessageBox } from "element-plus";
  import type { FormInstance, FormRules } from "element-plus";
  import { useRoute, useRouter } from "vue-router";
  import {
    createOwnerWithdraw,
    getOwnerWithdrawDetail,
    getOwnerWithdrawPage,
    getOwnerWithdrawSummary,
    operateOwnerWithdraw
  } from "@/api/finance/owner";
  import type {
    OwnerWithdrawApplyDetailVo,
    OwnerWithdrawApplyIdDto,
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
  type QueryForm = Omit<OwnerWithdrawApplyQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const detailLoading = ref(false);
  const submitLoading = ref(false);
  const detailVisible = ref(false);
  const createVisible = ref(false);
  const total = ref(0);
  const tableData = ref<OwnerWithdrawApplyListVo[]>([]);
  const detail = ref<OwnerWithdrawApplyDetailVo>({});
  const summary = ref<OwnerWithdrawSummaryVo>({});
  const createFormRef = ref<FormInstance>();

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

  const createForm = reactive<OwnerWithdrawCreateDto>({
    ownerId: String(route.query.ownerId || "") || undefined,
    applyAmount: Number(route.query.applyAmount || 0) || undefined,
    feeAmount: 0,
    payeeName: "",
    payeeAccountNo: "",
    payeeBankName: "",
    remark: ""
  });

  const createRules: FormRules<OwnerWithdrawCreateDto> = {
    ownerId: [{ required: true, message: "请输入业主ID", trigger: "blur" }],
    applyAmount: [{ required: true, message: "请输入申请金额", trigger: "change" }],
    payeeName: [{ required: true, message: "请输入收款人", trigger: "blur" }],
    payeeAccountNo: [{ required: true, message: "请输入银行卡号", trigger: "blur" }],
    payeeBankName: [{ required: true, message: "请输入开户行", trigger: "blur" }]
  };

  const summaryCards = computed(() => [
    { key: "count", label: "提现单数", value: numberText(summary.value.applyCount) },
    { key: "pending", label: "待审批", value: numberText(summary.value.pendingApprovalCount) },
    { key: "processing", label: "打款中", value: numberText(summary.value.processingCount) },
    { key: "success", label: "已成功", value: numberText(summary.value.successCount) },
    { key: "available", label: "可提现余额", value: moneyText(summary.value.availableAmount) },
    { key: "frozen", label: "冻结金额", value: moneyText(summary.value.frozenAmount) }
  ]);

  const detailActions = computed(() => rowActions(detail.value));

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
    createForm.ownerId = String(route.query.ownerId || "") || undefined;
    createForm.applyAmount = Number(route.query.applyAmount || 0) || undefined;
    createForm.feeAmount = 0;
    createForm.payeeName = "";
    createForm.payeeAccountNo = "";
    createForm.payeeBankName = "";
    createForm.remark = "";
    createFormRef.value?.clearValidate();
  }

  function openCreateDialog() {
    resetCreateForm();
    createVisible.value = true;
  }

  async function submitCreate() {
    const valid = await createFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    submitLoading.value = true;
    try {
      await createOwnerWithdraw(createForm);
      ElMessage.success("提现申请已提交");
      createVisible.value = false;
      await fetchData();
      if (route.query.openCreate) {
        router.replace({ path: route.path, query: { ownerId: queryForm.ownerId, contractId: queryForm.contractId } });
      }
    } finally {
      submitLoading.value = false;
    }
  }

  async function openDetail(applyId?: string) {
    if (!applyId) return;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const resp = await getOwnerWithdrawDetail({ applyId } as OwnerWithdrawApplyIdDto);
      detail.value = resp.data || {};
    } finally {
      detailLoading.value = false;
    }
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
    if (detailVisible.value && detail.value.applyId === row.applyId) {
      await openDetail(row.applyId);
    }
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

  .summary-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
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
    font-size: 22px;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }

  .toolbar-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .detail-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 18px 0 8px;
  }

  .section-title {
    margin: 20px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
