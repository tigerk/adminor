import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted, toRaw } from "vue";
import router from "@/router";
import { getRoomList, getRoomTotal } from "@/api/house/room";
import { getFocusHouseOptions } from "@/api/house/focus";

export function userFocusRoom() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive({
    keywords: "",
    houseId: null,
    roomStatus: null,
    pageSize: 10,
    currentPage: 1
  });

  const curRow = ref();
  const dataList = ref([]);
  const houseOptions = ref([]);
  const roomStatusTotal = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();

  const columns: TableColumnList = [
    {
      label: "状态",
      prop: "roomStatusName",
      width: 100,
      cellRenderer: ({ row }) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            textAlign: "center"
          }}
        >
          <span
            class="status-dot"
            style={{
              backgroundColor: row.roomStatusColor,
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              flexShrink: 0,
              marginRight: "8px"
            }}
          ></span>
          <span>{row.roomStatusName}</span>
        </div>
      )
    },
    {
      label: "项目",
      prop: "houseName",
      width: 120
    },
    {
      label: "房型",
      prop: "houseLayout.layoutName"
    },
    {
      label: "负责人",
      prop: "salesmanName",
      cellRenderer: ({ row }) => (
        <span>
          {row.salesmanName} {row.salesmanPhone}
        </span>
      )
    },
    {
      label: "操作",
      fixed: "right",
      slot: "operation"
    }
  ];

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    const { data } = await getRoomList(toRaw(queryForm));
    dataList.value = data.list;
    pagination.total = Number(data.total);
    pagination.pageSize = Number(data.pageSize);
    pagination.currentPage = Number(data.currentPage);

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    onHouseOptions();

    getRoomTotal(toRaw(queryForm)).then(res => {
      roomStatusTotal.value = res.data.statusList;

      let total = 0;
      res.data.statusList.forEach(item => {
        total += item.total;
      });

      roomStatusTotal.value.unshift({ roomStatus: "", roomStatusName: "全部", total: total });
    });
  });

  function onHouseOptions() {
    getFocusHouseOptions().then(res => {
      houseOptions.value = res.data;
    });
  }

  function onBack() {
    // 检查是否有历史记录可以返回
    if (window.history.length <= 1) {
      // 如果没有历史记录，跳转到默认页面
      router.push("/"); // 或者其他默认页面
    } else {
      router.go(-1);
    }
  }

  return {
    queryForm,
    onBack,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    houseOptions,
    roomStatusTotal,
    treeData,
    isLinkage,
    pagination,
    treeSearchValue,
    onSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange
  };
}
