import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { cancelBooking, createBooking, getBookingDetail, getBookingList, getBookingTotal } from "@/api/contract/booking";
import type { BookingCancelProps, BookingListProps, BookingQueryParams, LeaseProps, TenantCompanyProps, TenantPersonalProps } from "@/types";
import { ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import BookingCreateForm from "../form/bookingCreateForm.vue";
import BookingDetailDialog from "../view/bookingDetailDialog.vue";
import { BOOKING_STATUS_COLOR_MAP } from "@/constants";
import useTenant from "@/views/contract/tenant/utils/hook";

function useBooking() {
  const router = useRouter();

  const { openTenantDialog } = useTenant();

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<BookingQueryParams>({
    tenantName: "",
    tenantPhone: "",
    bookingStatus: undefined,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const bookingStatusTotal = ref([]);
  const bookingList = ref<BookingListProps[]>([]);
  const loading = ref(true);
  const tableSize = ref("default");
  const formRef = ref();

  // 计算当前页的起始索引
  const startIndex = computed(() => (pagination.currentPage - 1) * pagination.pageSize + 1);

  // 渲染序号列
  const renderIndexCell = ({ index }) => <span>{startIndex.value + index}</span>;

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    return BOOKING_STATUS_COLOR_MAP[status] || "#909399";
  };

  // 格式化日期时间
  const formatDateTime = (dateTime: Date) => {
    if (!dateTime) {
      return "-";
    }
    return new Date(dateTime).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const columns: TableColumnList = [
    {
      label: "序号",
      prop: "index",
      width: 60,
      fixed: "left",
      cellRenderer: renderIndexCell
    },
    {
      label: "状态",
      prop: "bookingStatus",
      width: 110,
      fixed: "left",
      cellRenderer: ({ row }) => {
        const statusColor = getStatusColor(row.bookingStatus);
        return (
          <el-tag
            style={{
              borderColor: statusColor,
              backgroundColor: "var(--el-bg-color)", // 跟随主题的背景色
              color: statusColor
            }}
          >
            {row.bookingStatusName}
          </el-tag>
        );
      }
    },
    {
      label: "房间",
      prop: "roomList",
      width: 200,
      showOverflowTooltip: false,
      cellRenderer: ({ row }) => (
        <el-tooltip placement="top" effect="light" popper-class="room-tooltip">
          {{
            // 👇 悬浮内容（自定义）
            content: () => (
              <el-space wrap>
                {row.roomList.map(room => (
                  <el-tag key={room.roomId} type="primary">
                    {`${room.houseName}-${room.roomNumber}`}
                  </el-tag>
                ))}
              </el-space>
            ),
            // 👇 单元格显示内容
            default: () => (
              <div>
                <el-space>
                  <el-text
                    truncated
                    style={{
                      width: "100px",
                      display: "inline-block"
                    }}
                  >
                    {row.roomList.map(room => `${room.communityName} ${room.doorNumber} -${room.roomNumber}`).join(" | ")}
                  </el-text>
                  <el-tag size="small" type="info">
                    共 {row.roomList.length} 间
                  </el-tag>
                </el-space>
              </div>
            )
          }}
        </el-tooltip>
      )
    },
    {
      label: "租客信息",
      prop: "tenantName",
      minWidth: 200,
      cellRenderer: ({ row }) => (
        <el-space>
          <div>{row.tenantName}</div>
          <el-text type="info" size="small">
            {row.tenantPhone}
          </el-text>
        </el-space>
      )
    },
    {
      label: "预定金额",
      prop: "bookingAmount",
      width: 120,
      cellRenderer: ({ row }) => <span style={{ color: "#f56c6c", fontWeight: 600 }}>¥{row.bookingAmount}</span>
    },
    {
      label: "意向租金",
      prop: "expectedRentPrice",
      width: 120,
      cellRenderer: ({ row }) => <span>¥{row.expectedRentPrice}/月</span>
    },
    {
      label: "预计租期",
      prop: "expectedLeaseStart",
      minWidth: 220,
      cellRenderer: ({ row }) => (
        <el-space>
          <el-text size="small">{formatDateTime(row.expectedLeaseStart)?.split(" ")[0]}</el-text>
          <span>至</span>
          <el-text size="small">{formatDateTime(row.expectedLeaseEnd)?.split(" ")[0]}</el-text>
        </el-space>
      )
    },
    {
      label: "到期时间",
      prop: "expiryTime",
      width: 160,
      cellRenderer: ({ row }) => <span style={{ color: new Date(row.expiryTime) < new Date() ? "#f56c6c" : "" }}>{formatDateTime(row.expiryTime)}</span>
    },
    {
      label: "预定时间",
      prop: "bookingTime",
      width: 160,
      cellRenderer: ({ row }) => formatDateTime(row.bookingTime)
    },
    {
      label: "操作",
      fixed: "right",
      width: 130,
      slot: "operation"
    }
  ];

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onBookingSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onBookingSearch();
  }

  function onBookingSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    getBookingList(toRaw(queryForm))
      .then(resp => {
        if (resp.code === 0) {
          bookingList.value = resp.data.list;
          pagination.total = Number(resp.data.total);
          pagination.pageSize = Number(resp.data.pageSize);
          pagination.currentPage = Number(resp.data.currentPage);
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  onMounted(async () => {
    onBookingSearch();

    getBookingTotal(toRaw(queryForm)).then(res => {
      bookingStatusTotal.value = res.data?.statusList || [];

      let total = 0;
      res.data.statusList.forEach(item => {
        total += item.total;
      });

      bookingStatusTotal.value.unshift({
        status: undefined,
        statusName: "全部",
        statusColor: "#909399",
        total: total
      });
    });
  });

  function openBookingDialog(title = "添加", row?: any, onSuccess?: (data: any) => void) {
    addDialog({
      title: `${title}预定`,
      props: {
        formInline: {
          title,
          ...row
        }
      },
      top: "1vh",
      width: "50vw",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(BookingCreateForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormInstance = formRef.value;
        const getFormRuleRef = FormInstance?.getRef?.();
        const curData = FormInstance?.formInline;

        getFormRuleRef.validate(valid => {
          if (valid) {
            // 处理房间ID数组
            curData.roomIds = FormInstance.roomSelection.map(item => item.value);

            createBooking(curData).then(resp => {
              if (resp.code === 0) {
                message(`预定创建成功`, { type: "success" });
                onSuccess?.(resp.data);
                done();
                onBookingSearch();
              } else {
                message(resp.message, { type: "error" });
              }
            });
          }
        });
      }
    });
  }

  // 查看预定详情
  function handleViewBooking(row: BookingListProps) {
    loading.value = true;

    getBookingDetail({ id: row.id })
      .then(resp => {
        loading.value = false;

        if (resp.code === 0) {
          addDialog({
            title: `预定详情 - ${row.tenantName}`,
            props: {
              formInline: resp.data
            },
            top: "1vh",
            width: "55vw",
            lockScroll: true,
            alignCenter: true,
            draggable: true,
            fullscreen: deviceDetection(),
            fullscreenIcon: true,
            closeOnClickModal: false,
            hideFooter: true,
            contentRenderer: () => h(BookingDetailDialog, { formInline: resp.data })
          });
        } else {
          message(resp.message, { type: "error" });
        }
      })
      .catch(() => {
        loading.value = false;
        message("获取预定详情失败", { type: "error" });
      });
  }

  // 转为租客
  function handleConvertToTenant(row: BookingListProps) {
    ElMessageBox.confirm(`确认将预定"${row.tenantName}"转为租客合同吗？`, "转为租客", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(() => {
      let tenantPersonal: TenantPersonalProps = undefined;
      let tenantCompany: TenantCompanyProps = undefined;
      if (row.tenantType === 0) {
        tenantPersonal = {
          name: row.tenantName,
          phone: row.tenantPhone,
          idType: undefined,
          idNo: undefined
        };
      } else {
        tenantCompany = {
          companyName: row.tenantName,
          uscc: undefined,
          legalPerson: row.tenantName,
          contactName: row.tenantName,
          contactPhone: row.tenantPhone
        };
      }

      const lease: LeaseProps = {
        contractNature: undefined,
        roomIds: row.roomIds,
        contractTemplateId: undefined,
        rentPrice: row.expectedRentPrice,
        leaseDate: [row.expectedLeaseStart, row.expectedLeaseEnd],
        leaseStart: row.expectedLeaseStart,
        leaseEnd: row.expectedLeaseEnd,
        depositMonths: undefined,
        paymentMonths: undefined,
        firstBillDay: undefined,
        checkDate: undefined,
        rentDueType: undefined,
        salesmanId: undefined
      };

      openTenantDialog("添加", {
        booking: row,
        lease: lease,
        tenantCompany: tenantCompany,
        tenantPersonal: tenantPersonal,
        tenantMateList: [],
        otherFees: []
      });
    });
  }

  // 取消预定
  function handleCancelBooking(row: BookingListProps) {
    ElMessageBox.prompt("请输入取消原因", "取消预定", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入取消原因"
    }).then(({ value }) => {
      const params: BookingCancelProps = {
        id: row.id,
        cancelReason: value
      };

      cancelBooking(params).then(resp => {
        if (resp.code === 0) {
          message("预定已取消！", { type: "success" });
          onBookingSearch();
        } else {
          message(resp.message, { type: "error" });
        }
      });
    });
  }

  const resetQueryForm = (formEl: any) => {
    formEl?.value?.resetFields();
    Object.assign(queryForm, {
      tenantName: "",
      tenantPhone: "",
      bookingStatus: undefined,
      pageSize: 15,
      currentPage: 1
    });
    onBookingSearch();
  };

  return {
    resetQueryForm,
    queryForm,
    tableSize,
    curRow,
    loading,
    columns,
    rowStyle,
    bookingStatusTotal,
    bookingList,
    pagination,
    openBookingDialog,
    onBookingSearch,
    handleSizeChange,
    handleCurrentChange,
    handleViewBooking,
    handleConvertToTenant,
    handleCancelBooking,
    getStatusColor
  };
}

export default useBooking;
