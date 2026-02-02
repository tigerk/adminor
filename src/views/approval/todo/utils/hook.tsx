import dayjs from "dayjs";
import { getApplyList, getBizTypeOptions, getDoneList, getTodoCount, getTodoList } from "@/api/approval";
import { computed, h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import useTenant from "@/views/contract/tenant/utils/hook";
import ApprovalDetailDialog from "../../detail/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

export function useApprovalTodo() {
  // 导入租客相关的 hook
  const { openTenantViewDialog } = useTenant();

  const router = useRouter();

  const queryForm = reactive({
    bizType: "",
    status: null as number | null,
    keyword: ""
  });

  const loading = ref(false);
  const dataList = ref([]);
  const activeTab = ref("todo");
  const bizTypeOptions = ref<Array<{ label: string; value: string }>>([]);
  const todoCount = ref(0);
  const tableSize = ref("default");

  const statusOptions = [
    { label: "审批中", value: 1 },
    { label: "已通过", value: 2 },
    { label: "已驳回", value: 3 },
    { label: "已撤回", value: 4 }
  ];

  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  // 待办列表列配置
  const todoColumns: TableColumnList = [
    {
      label: "审批标题",
      prop: "title",
      minWidth: 200
    },
    {
      label: "业务类型",
      prop: "bizTypeName",
      width: 120,
      cellRenderer: ({ row }) => <el-tag>{row.bizTypeName}</el-tag>
    },
    {
      label: "业务关联单号",
      prop: "bizId",
      width: 160
    },
    {
      label: "申请人",
      prop: "applicantName",
      width: 150
    },
    {
      label: "当前节点",
      prop: "nodeName",
      width: 120
    },
    {
      label: "申请时间",
      prop: "applyTime",
      width: 180,
      formatter: ({ applyTime }) => (applyTime ? dayjs(applyTime).format("YYYY-MM-DD HH:mm:ss") : "")
    },
    {
      label: "操作",
      fixed: "right",
      width: 150,
      slot: "operation"
    }
  ];

  // 已办列表列配置
  const doneColumns: TableColumnList = [
    {
      label: "审批标题",
      prop: "title",
      minWidth: 200
    },
    {
      label: "业务类型",
      prop: "bizTypeName",
      width: 120,
      cellRenderer: ({ row }) => <el-tag>{row.bizTypeName}</el-tag>
    },
    {
      label: "申请人",
      prop: "applicantName",
      width: 100
    },
    {
      label: "我的操作",
      prop: "action",
      width: 100,
      cellRenderer: ({ row }) => <el-tag type={row.action === 1 ? "success" : "danger"}>{row.actionName}</el-tag>
    },
    {
      label: "审批意见",
      prop: "remark",
      minWidth: 150
    },
    {
      label: "操作时间",
      prop: "operateTime",
      width: 180,
      formatter: ({ operateTime }) => (operateTime ? dayjs(operateTime).format("YYYY-MM-DD HH:mm:ss") : "")
    },
    {
      label: "最终状态",
      prop: "instanceStatus",
      width: 100,
      cellRenderer: ({ row }) => {
        const statusMap = {
          1: { text: "审批中", type: "warning" },
          2: { text: "已通过", type: "success" },
          3: { text: "已驳回", type: "danger" },
          4: { text: "已撤回", type: "info" }
        };
        const status = statusMap[row.instanceStatus] || { text: "未知", type: "info" };
        return <el-tag type={status.type}>{status.text}</el-tag>;
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  // 我发起的列表列配置
  const applyColumns: TableColumnList = [
    {
      label: "审批单号",
      prop: "instanceNo",
      width: 230
    },
    {
      label: "审批标题",
      prop: "title",
      minWidth: 200
    },
    {
      label: "业务类型",
      prop: "bizTypeName",
      width: 120,
      cellRenderer: ({ row }) => <el-tag>{row.bizTypeName}</el-tag>
    },
    {
      label: "当前节点",
      prop: "currentNodeName",
      width: 120
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: ({ row }) => {
        const statusMap = {
          0: { text: "待提交", type: "info" },
          1: { text: "审批中", type: "warning" },
          2: { text: "已通过", type: "success" },
          3: { text: "已驳回", type: "danger" },
          4: { text: "已撤回", type: "info" }
        };
        const status = statusMap[row.status] || { text: "未知", type: "info" };
        return <el-tag type={status.type}>{status.text}</el-tag>;
      }
    },
    {
      label: "申请时间",
      prop: "createTime",
      width: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "")
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  // 根据当前 tab 返回对应的列配置
  const columns = computed(() => {
    switch (activeTab.value) {
      case "todo":
        return todoColumns;
      case "done":
        return doneColumns;
      case "apply":
        return applyColumns;
      default:
        return todoColumns;
    }
  });

  async function onSearch() {
    loading.value = true;
    try {
      const params = {
        ...queryForm,
        pageNum: pagination.currentPage,
        pageSize: pagination.pageSize
      };

      let res;
      switch (activeTab.value) {
        case "todo":
          res = await getTodoList(params);
          break;
        case "done":
          res = await getDoneList(params);
          break;
        case "apply":
          res = await getApplyList(params);
          break;
      }

      dataList.value = res.data?.list || [];
      pagination.total = Number(res.data?.total || 0);
    } finally {
      loading.value = false;
    }
  }

  async function loadTodoCount() {
    const { data } = await getTodoCount();
    todoCount.value = data || 0;
  }

  async function loadBizTypeOptions() {
    const { data } = await getBizTypeOptions();
    bizTypeOptions.value = data.map(item => ({
      label: item.name,
      value: item.code
    }));
  }

  function resetQueryForm() {
    queryForm.bizType = "";
    queryForm.status = null;
    queryForm.keyword = "";
    onSearch().then();
  }

  function handleTabChange(tab: string) {
    activeTab.value = tab;
    pagination.currentPage = 1;
    onSearch().then();
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch().then();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch().then();
  }

  // 使用 addDialog 打开审批详情
  function handleView(row) {
    addDialog({
      title: row.title || "审批详情",
      width: "800px",
      draggable: true,
      lockScroll: true, // 弹窗打开时锁定滚动
      alignCenter: true, // 弹窗居中对齐
      fullscreen: deviceDetection(), // 移动端全屏
      fullscreenIcon: false,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(ApprovalDetailDialog, {
          instanceId: row.instanceId || row.id,
          from: activeTab.value // todo/done/apply
        }),
      beforeCancel: done => {
        done();
        // 关闭后刷新列表和待办数量
        onSearch().then();
        if (activeTab.value === "todo") {
          loadTodoCount().then();
        }
      }
    });
  }

  onMounted(() => {
    onSearch().then();
    loadTodoCount().then();
    loadBizTypeOptions().then();
  });

  return {
    queryForm,
    loading,
    columns,
    dataList,
    pagination,
    activeTab,
    tableSize,
    bizTypeOptions,
    statusOptions,
    todoCount,
    onSearch,
    resetQueryForm,
    handleTabChange,
    handleSizeChange,
    handleCurrentChange,
    handleView
  };
}
