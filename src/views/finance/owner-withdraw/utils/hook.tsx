import { computed, h, onMounted, reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { addDialog } from "@/components/ReDialog";
import {
  createOwnerWithdraw,
  getOwnerWithdrawDetail,
  getOwnerWithdrawPage,
  getOwnerWithdrawSummary,
  operateOwnerWithdraw
} from "@/api/owner/owner";
import OwnerWithdrawCreateDialog from "@/views/finance/owner-withdraw/form/OwnerWithdrawCreateDialog.vue";
import OwnerWithdrawDetailDialog from "@/views/finance/owner-withdraw/view/OwnerWithdrawDetailDialog.vue";
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
import { message } from "@/utils/message";

type OwnerWithdrawHookOptions = {
  ownerId?: string | number;
  contractId?: string | number;
  embedded?: boolean;
};

function useOwnerWithdraw(options: OwnerWithdrawHookOptions = {}) {
  const route = useRoute();
  const router = useRouter();
  const createFormRef = ref();

  function scopedId(value?: string | number | null) {
    const text = String(value ?? "");
    return text || undefined;
  }

  function scopedOwnerId() {
    return scopedId(options.ownerId ?? (route.query.ownerId as string | undefined));
  }

  function scopedContractId() {
    return scopedId(options.contractId ?? (route.query.contractId as string | undefined));
  }

  type QueryForm = Omit<OwnerWithdrawApplyQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const tableData = ref<OwnerWithdrawApplyListVo[]>([]);
  const summary = ref<OwnerWithdrawSummaryVo>({});

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

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
    ownerId: scopedOwnerId(),
    contractId: scopedContractId(),
    ownerName: "",
    applyNo: "",
    approvalStatus: undefined,
    withdrawStatus: undefined
  });

  function createDefaultForm(): OwnerWithdrawCreateDto {
    return {
      ownerId: scopedOwnerId(),
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

  const columns: TableColumnList = [
    { label: "提现单号", prop: "applyNo", minWidth: 180 },
    { label: "业主", prop: "ownerName", minWidth: 140 },
    { label: "联系电话", prop: "ownerPhone", minWidth: 140 },
    {
      label: "申请金额",
      prop: "applyAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.applyAmount)}</span>
    },
    {
      label: "手续费",
      prop: "feeAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.feeAmount)}</span>
    },
    {
      label: "实际到账",
      prop: "actualAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.actualAmount)}</span>
    },
    { label: "审批状态", prop: "approvalStatus", minWidth: 110, align: "center", slot: "approvalStatus" },
    { label: "打款状态", prop: "withdrawStatus", minWidth: 110, align: "center", slot: "withdrawStatus" },
    { label: "申请时间", prop: "appliedAt", minWidth: 160 },
    { label: "操作", fixed: "right", minWidth: 230, align: "center", slot: "operation" }
  ];

  function buildQueryPayload(): OwnerWithdrawApplyQueryDto {
    return {
      ...queryForm,
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize)
    };
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerWithdrawPage(buildQueryPayload()), getOwnerWithdrawSummary(buildQueryPayload())]);
      tableData.value = pageResp.data?.list || [];
      summary.value = summaryResp.data || {};
      pagination.total = Number(pageResp.data?.total || 0);
      pagination.pageSize = Number(pageResp.data?.pageSize || pagination.pageSize);
      pagination.currentPage = Number(pageResp.data?.currentPage || pagination.currentPage);
      queryForm.currentPage = pagination.currentPage;
      queryForm.pageSize = pagination.pageSize;
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(size: number) {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    fetchData();
  }

  function handleCurrentChange(page: number) {
    pagination.currentPage = page;
    fetchData();
  }

  function resetQuery() {
    pagination.currentPage = 1;
    pagination.pageSize = 10;
    queryForm.currentPage = 1;
    queryForm.pageSize = 10;
    queryForm.ownerName = "";
    queryForm.applyNo = "";
    queryForm.approvalStatus = undefined;
    queryForm.withdrawStatus = undefined;
    queryForm.ownerId = scopedOwnerId();
    queryForm.contractId = scopedContractId();
    fetchData();
  }

  function resetCreateForm() {
    Object.assign(createForm, createDefaultForm());
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

  function approvalStatusBadgeType(value?: number) {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    return "warning";
  }

  function withdrawStatusBadgeType(value?: number) {
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

  function openOwnerWithdrawCreateDialog(formInline?: OwnerWithdrawCreateDto | null, onSuccess?: () => void) {
    addDialog({
      title: "发起业主提现",
      props: { formInline: formInline || null },
      width: "560px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () => h(OwnerWithdrawCreateDialog, { ref: createFormRef, formInline: formInline || null }),
      beforeSure: async done => {
        const payload = await createFormRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = await createOwnerWithdraw(payload);
        if (resp.code === 0) {
          message("提现申请已提交", { type: "success" });
          onSuccess?.();
          done();
        } else {
          message(resp.message || "提现申请提交失败", { type: "error" });
        }
      }
    });
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

  async function openOwnerWithdrawDetailDialog(
    applyId?: string | number,
    onOperate?: (row: Partial<OwnerWithdrawApplyDetailVo>, type: OwnerWithdrawOperateEnum | "CANCEL" | "APPROVE" | "REJECT" | "PAYING" | "SUCCESS" | "FAIL") => void
  ) {
    if (!applyId) return;
    const resp = await getOwnerWithdrawDetail({ applyId } as OwnerWithdrawApplyIdDto);
    if (resp.code !== 0 || !resp.data) {
      message(resp.message || "获取业主提现详情失败", { type: "error" });
      return;
    }
    addDialog({
      title: "业主提现详情",
      props: { formInline: resp.data },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerWithdrawDetailDialog, { formInline: resp.data, onOperate })
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

  function handleRowClick(row: OwnerWithdrawApplyListVo) {
    openDetail(row.applyId);
  }

  onMounted(() => {
    fetchData();
    if (route.query.openCreate === "1" && createForm.ownerId) {
      openCreateDialog();
    }
  });

  return {
    loading,
    queryForm,
    pagination,
    tableData,
    summaryCards,
    columns,
    createForm,
    approvalStatusOptions,
    withdrawStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openDetail,
    openCreateDialog,
    operate,
    rowActions,
    approvalStatusText,
    withdrawStatusText,
    approvalStatusBadgeType,
    withdrawStatusBadgeType,
    approvalStatusTagType,
    withdrawStatusTagType
  };
}

export default useOwnerWithdraw;
