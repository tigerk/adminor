import { computed, h, onMounted, reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { useRoute } from "vue-router";
import { addDialog } from "@/components/ReDialog";
import {
  createOwnerPayableBill,
  createOwnerPayableBillPayment,
  getOwnerPayableBillPage,
  getOwnerPayableBillSummary,
  updateOwnerPayableBill,
  voidOwnerPayableBill
} from "@/api/owner/owner";
import type {
  OwnerPayableBillCreateDto,
  OwnerPayableBillListVo,
  OwnerPayableBillQueryDto,
  OwnerPayableBillSummaryVo,
  OwnerPayableBillUpdateDto
} from "@/types/generated";
import OwnerPayableBillDetailDialog from "@/views/finance/owner-payable-bill/view/OwnerPayableBillDetailDialog.vue";
import OwnerPayableBillFormDialog from "@/views/finance/owner-payable-bill/view/OwnerPayableBillFormDialog.vue";
import OwnerPayableBillVoidDialog from "@/views/finance/owner-payable-bill/view/OwnerPayableBillVoidDialog.vue";
import OwnerPayableBillPaymentDialog from "@/views/finance/owner-payable-bill/view/OwnerPayableBillPaymentDialog.vue";
import { message } from "@/utils/message";

const OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY = "owner-payable-bill-page-intro-closed";

type OwnerPayableBillHookOptions = {
  ownerId?: string | number;
  contractId?: string | number;
  embedded?: boolean;
};

function useOwnerPayableBill(options: OwnerPayableBillHookOptions = {}) {
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

  type QueryForm = Omit<OwnerPayableBillQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  const loading = ref(false);
  const showPageIntro = ref(!options.embedded && localStorage.getItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY) !== "1");
  const tableData = ref<OwnerPayableBillListVo[]>([]);
  const summary = ref<OwnerPayableBillSummaryVo>({});

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
    paymentStatus: undefined,
    billStatus: undefined
  });

  const settlementStatusMap: Record<number, string> = {
    0: "未付款",
    1: "部分付款",
    2: "已付款"
  };

  const billStatusMap: Record<number, string> = {
    1: "正常",
    2: "已作废"
  };

  const settlementStatusOptions = [
    { label: "未付款", value: 0 },
    { label: "部分付款", value: 1 },
    { label: "已付款", value: 2 }
  ];

  const summaryCards = computed(() => [
    { key: "count", label: "应付单数", value: numberText(summary.value.billCount) },
    { key: "payable", label: "应付总额", value: moneyText(summary.value.totalPayableAmount) },
    { key: "settled", label: "已付总额", value: moneyText(summary.value.totalPaidAmount) },
    { key: "unpaid", label: "未付总额", value: moneyText(summary.value.totalUnpaidAmount) }
  ]);

  const columns: TableColumnList = [
    { label: "付款状态", prop: "paymentStatus", width: 110, align: "center", slot: "settlementStatus", fixed: "left" },
    { label: "单据状态", prop: "billStatus", width: 90, align: "center", slot: "billStatus", fixed: "left" },
    { label: "应付单号", prop: "billNo", minWidth: 180 },
    { label: "业主", prop: "ownerName", minWidth: 140 },
    { label: "联系电话", prop: "ownerPhone", minWidth: 140 },
    { label: "合同编号", prop: "contractNo", minWidth: 180 },
    { label: "合同房源", prop: "subjectName", minWidth: 180, showOverflowTooltip: true },
    {
      label: "账期",
      minWidth: 200,
      cellRenderer: ({ row }) => (
        <span>
          {row.billStartDate || "-"} 至 {row.billEndDate || "-"}
        </span>
      )
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
      prop: "paidAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.paidAmount)}</span>
    },
    {
      label: "未付金额",
      prop: "unpaidAmount",
      minWidth: 120,
      align: "right",
      cellRenderer: ({ row }) => <span class="amount-cell">{moneyText(row.unpaidAmount)}</span>
    },
    { label: "生成时间", prop: "generatedAt", minWidth: 170 },
    { label: "操作", fixed: "right", width: 220, align: "center", slot: "operation" }
  ];

  function buildQueryPayload(): OwnerPayableBillQueryDto {
    return {
      ...queryForm,
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize)
    };
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [pageResp, summaryResp] = await Promise.all([getOwnerPayableBillPage(buildQueryPayload()), getOwnerPayableBillSummary(buildQueryPayload())]);
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
    queryForm.paymentStatus = undefined;
    queryForm.billStatus = undefined;
    queryForm.ownerId = scopedOwnerId();
    queryForm.contractId = scopedContractId();
    fetchData();
  }

  function closePageIntro() {
    showPageIntro.value = false;
    localStorage.setItem(OWNER_PAYABLE_BILL_PAGE_INTRO_STORAGE_KEY, "1");
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function numberText(value?: string | number) {
    return String(value || "0");
  }

  function settlementStatusText(value?: number) {
    return settlementStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  }

  function billStatusText(value?: number) {
    return billStatusMap[value ?? 1] || `状态${value ?? "-"}`;
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

  function billStatusBadgeType(value?: number) {
    if (value === 2) return "danger";
    return "success";
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
      contentRenderer: () => h(OwnerPayableBillDetailDialog, { billId })
    });
  }

  function handleRowClick(row: OwnerPayableBillListVo) {
    openOwnerPayableBillDetailDialog(row.billId);
  }

  function openPayableBillFormDialog(row?: OwnerPayableBillListVo) {
    const formRef = ref();
    const isEdit = !!row?.billId;
    addDialog({
      title: isEdit ? "修改包租应付单" : "新增包租应付单",
      props: { billId: row?.billId },
      width: "960px",
      top: "3vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(OwnerPayableBillFormDialog, { ref: formRef, bill: row }),
      beforeSure: async done => {
        const payload = await formRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = isEdit ? await updateOwnerPayableBill(payload as OwnerPayableBillUpdateDto) : await createOwnerPayableBill(payload as OwnerPayableBillCreateDto);
        if (resp.code === 0) {
          message(isEdit ? "应付单修改成功" : "应付单新增成功", { type: "success" });
          await fetchData();
          done();
          return;
        }
        message(resp.message || (isEdit ? "应付单修改失败" : "应付单新增失败"), { type: "error" });
      }
    });
  }

  function openPayableBillVoidDialog(row: OwnerPayableBillListVo) {
    const formRef = ref();
    addDialog({
      title: "作废包租应付单",
      width: "520px",
      lockScroll: true,
      alignCenter: true,
      closeOnClickModal: false,
      contentRenderer: () => h(OwnerPayableBillVoidDialog, { ref: formRef, billNo: row.billNo }),
      beforeSure: async done => {
        const payload = await formRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = await voidOwnerPayableBill({ billId: row.billId, voidReason: payload.voidReason });
        if (resp.code === 0) {
          message("应付单作废成功", { type: "success" });
          await fetchData();
          done();
          return;
        }
        message(resp.message || "应付单作废失败", { type: "error" });
      }
    });
  }

  function openPayableBillPaymentDialog(row: OwnerPayableBillListVo) {
    const formRef = ref();
    addDialog({
      title: "登记付款",
      width: "720px",
      lockScroll: true,
      alignCenter: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(OwnerPayableBillPaymentDialog, {
          ref: formRef,
          billId: String(row.billId),
          unpaidAmount: Number(row.unpaidAmount || 0),
          bill: row
        }),
      beforeSure: async done => {
        const payload = await formRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = await createOwnerPayableBillPayment(payload);
        if (resp.code === 0) {
          message("付款登记成功", { type: "success" });
          await fetchData();
          done();
          return;
        }
        message(resp.message || "付款登记失败", { type: "error" });
      }
    });
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
    openPayableBillFormDialog,
    openPayableBillVoidDialog,
    openPayableBillPaymentDialog,
    closePageIntro,
    settlementStatusText,
    billStatusText,
    settlementStatusBadgeType,
    billStatusBadgeType,
    settlementStatusTagType
  };
}

export default useOwnerPayableBill;
