import { computed, h, onMounted, reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { useRoute } from "vue-router";
import { addDialog } from "@/components/ReDialog";
import { getOwnerBillPage, getOwnerBillSummary } from "@/api/owner/owner";
import OwnerBillDetailDialog from "@/views/finance/owner-bill/view/OwnerBillDetailDialog.vue";
import type { OwnerBillListVo, OwnerBillQueryDto, OwnerBillSummaryVo, OwnerCooperationModeEnum } from "@/types/generated";

const OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY = "owner-payable-bill-page-intro-closed";

function useOwnerPayableBill() {
  const route = useRoute();

  type QueryForm = Omit<OwnerBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
    cooperationMode?: OwnerCooperationModeEnum;
  };

  const loading = ref(false);
  const showPageIntro = ref(localStorage.getItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY) !== "1");
  const tableData = ref<OwnerBillListVo[]>([]);
  const summary = ref<OwnerBillSummaryVo>({});

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

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

  const summaryCards = computed(() => [
    { key: "count", label: "应付单数", value: numberText(summary.value.billCount) },
    { key: "payable", label: "应付总额", value: moneyText(summary.value.totalPayableAmount) },
    { key: "settled", label: "已付总额", value: moneyText(summary.value.totalSettledAmount) },
    { key: "unpaid", label: "未付总额", value: moneyText(summary.value.totalUnpaidAmount) }
  ]);

  const columns: TableColumnList = [
    { label: "应付单号", prop: "billNo", minWidth: 180 },
    { label: "业主", prop: "ownerName", minWidth: 140 },
    { label: "联系电话", prop: "ownerPhone", minWidth: 140 },
    { label: "合同编号", prop: "contractNo", minWidth: 180 },
    { label: "合同房源", prop: "subjectName", minWidth: 180, showOverflowTooltip: true },
    {
      label: "账期",
      minWidth: 200,
      cellRenderer: ({ row }) => <span>{row.billStart || "-"} 至 {row.billEnd || "-"}</span>
    },
    { label: "应付日期", prop: "dueDate", minWidth: 120, align: "center" },
    {
      label: "应付金额",
      prop: "payableAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.payableAmount)}</span>
    },
    {
      label: "已付金额",
      prop: "settledAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.settledAmount)}</span>
    },
    {
      label: "未付金额",
      prop: "unpaidAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.unpaidAmount)}</span>
    },
    { label: "付款状态", prop: "settlementStatus", minWidth: 110, align: "center", slot: "settlementStatus" },
    { label: "生成时间", prop: "generatedAt", minWidth: 170 },
    { label: "操作", fixed: "right", width: 90, align: "center", slot: "operation" }
  ];

  function buildQueryPayload(): OwnerBillQueryDto {
    return {
      ...queryForm,
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize)
    };
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerBillPage(buildQueryPayload()), getOwnerBillSummary(buildQueryPayload())]);
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
    queryForm.cooperationMode = "MASTER_LEASE";
    queryForm.settlementStatus = undefined;
    queryForm.ownerId = String(route.query.ownerId || "") || undefined;
    queryForm.contractId = String(route.query.contractId || "") || undefined;
    fetchData();
  }

  function closePageIntro() {
    showPageIntro.value = false;
    localStorage.setItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY, "1");
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

  function settlementStatusBadgeType(value?: number) {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
  }

  function openOwnerPayableBillDetailDialog(billId?: string | number) {
    if (!billId) return;
    addDialog({
      title: "包租应付单详情",
      props: { billId },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerBillDetailDialog, { billId })
    });
  }

  function handleRowClick(row: OwnerBillListVo) {
    openOwnerPayableBillDetailDialog(row.billId);
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
    settlementStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openOwnerPayableBillDetailDialog,
    closePageIntro,
    settlementStatusText,
    settlementStatusBadgeType,
    settlementStatusTagType
  };
}

export default useOwnerPayableBill;
