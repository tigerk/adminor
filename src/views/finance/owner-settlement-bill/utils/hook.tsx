import { computed, h, onMounted, reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { useRoute } from "vue-router";
import { addDialog } from "@/components/ReDialog";
import { getOwnerSettlementBillPage, getOwnerSettlementBillSummary, type SettlementBillListVo, type SettlementBillQueryDto, type SettlementBillSummaryVo } from "@/api/owner/owner";
import OwnerSettlementBillDetailDialog from "@/views/finance/owner-settlement-bill/view/OwnerSettlementBillDetailDialog.vue";

const OWNER_SETTLEMENT_BILL_PAGE_INTRO_STORAGE_KEY = "owner-settlement-bill-page-intro-closed";

type OwnerSettlementBillHookOptions = {
  ownerId?: string | number;
  contractId?: string | number;
  embedded?: boolean;
};

function useOwnerSettlementBill(options: OwnerSettlementBillHookOptions = {}) {
  const route = useRoute();

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

  type QueryForm = Omit<SettlementBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const showPageIntro = ref(!options.embedded && localStorage.getItem(OWNER_SETTLEMENT_BILL_PAGE_INTRO_STORAGE_KEY) !== "1");
  const tableData = ref<SettlementBillListVo[]>([]);
  const summary = ref<SettlementBillSummaryVo>({});

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerId: scopedOwnerId(),
    contractId: scopedContractId(),
    ownerName: "",
    billNo: "",
    approvalStatus: undefined,
    settlementStatus: undefined
  });

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

  const summaryCards = computed(() => [
    { key: "count", label: "结算单数", value: numberText(summary.value.billCount) },
    { key: "income", label: "收入总额", value: moneyText(summary.value.totalIncomeAmount) },
    { key: "payable", label: "结算总额", value: moneyText(summary.value.totalPayableAmount) },
    { key: "withdrawable", label: "可提现总额", value: moneyText(summary.value.totalWithdrawableAmount) }
  ]);

  const columns: TableColumnList = [
    { label: "结算单号", prop: "billNo", minWidth: 180 },
    { label: "业主", prop: "ownerName", minWidth: 140 },
    { label: "联系电话", prop: "ownerPhone", minWidth: 140 },
    { label: "合同编号", prop: "contractNo", minWidth: 180 },
    { label: "合同房源", prop: "subjectName", minWidth: 180, showOverflowTooltip: true },
    {
      label: "账期",
      minWidth: 200,
      cellRenderer: ({ row }) => <span>{row.billStartDate || "-"} 至 {row.billEndDate || "-"}</span>
    },
    {
      label: "收入金额",
      prop: "incomeAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.incomeAmount)}</span>
    },
    {
      label: "费用金额",
      prop: "expenseAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.expenseAmount)}</span>
    },
    {
      label: "结算金额",
      prop: "payableAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.payableAmount)}</span>
    },
    {
      label: "可提现",
      prop: "withdrawableAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.withdrawableAmount)}</span>
    },
    { label: "审批状态", prop: "approvalStatus", minWidth: 110, align: "center", slot: "approvalStatus" },
    { label: "结算状态", prop: "settlementStatus", minWidth: 110, align: "center", slot: "settlementStatus" },
    { label: "操作", fixed: "right", width: 90, align: "center", slot: "operation" }
  ];

  function buildQueryPayload(): SettlementBillQueryDto {
    return {
      ...queryForm,
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize)
    };
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerSettlementBillPage(buildQueryPayload()), getOwnerSettlementBillSummary(buildQueryPayload())]);
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
    queryForm.billNo = "";
    queryForm.approvalStatus = undefined;
    queryForm.settlementStatus = undefined;
    queryForm.ownerId = scopedOwnerId();
    queryForm.contractId = scopedContractId();
    fetchData();
  }

  function closePageIntro() {
    showPageIntro.value = false;
    localStorage.setItem(OWNER_SETTLEMENT_BILL_PAGE_INTRO_STORAGE_KEY, "1");
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function numberText(value?: string | number) {
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

  function approvalStatusBadgeType(value?: number) {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    return "warning";
  }

  function settlementStatusBadgeType(value?: number) {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
  }

  function openOwnerSettlementBillDetailDialog(billId?: string | number) {
    if (!billId) return;
    addDialog({
      title: "业主结算单详情",
      props: { billId },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerSettlementBillDetailDialog, { billId })
    });
  }

  function handleRowClick(row: SettlementBillListVo) {
    openOwnerSettlementBillDetailDialog(row.billId);
  }

  onMounted(fetchData);

  return {
    loading,
    showPageIntro,
    queryForm,
    pagination,
    tableData,
    summaryCards,
    columns,
    approvalStatusOptions,
    settlementStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openOwnerSettlementBillDetailDialog,
    closePageIntro,
    approvalStatusText,
    settlementStatusText,
    approvalStatusBadgeType,
    settlementStatusBadgeType,
    approvalStatusTagType,
    settlementStatusTagType
  };
}

export default useOwnerSettlementBill;
