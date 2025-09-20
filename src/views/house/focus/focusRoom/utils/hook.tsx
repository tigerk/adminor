import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted, toRaw } from "vue";
import router from "@/router";
import { getRoomList, getRoomTotal } from "@/api/house/room";
import { getFocusHouseOptions } from "@/api/house/focus";
import type { HouseLayoutProps } from "@/views/house/focus/components/FocusCreate/utils/types";

export function userFocusRoom() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive({
    keywords: "",
    houseId: null,
    roomStatus: null,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const roomTableList = ref([]);
  const houseOptions = ref([]);
  const roomStatusTotal = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const displayModeToList = ref(true);
  const displayModeText = ref("列表模式");

  const columns: TableColumnList = [
    {
      label: "状态",
      prop: "roomStatusName",
      width: 100,
      fixed: "left",
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
      label: "小区/项目名称",
      prop: "propertyName",
      width: 150
    },
    {
      label: "房源地址",
      prop: "houseName",
      width: 200
    },
    {
      label: "房型",
      prop: "houseLayout.layoutName",
      width: 150,
      cellRenderer: ({ row }) => <span>{row.houseLayout?.layoutName ?? ""}</span>
    },
    {
      label: "价格(元/月)",
      prop: "price",
      width: 120
    },
    {
      label: "户型",
      width: 120,
      cellRenderer: ({ row }) => <span>{formatHouseLayout(row.houseLayout)}</span>
    },
    {
      label: "面积",
      prop: "area",
      width: 80,
      cellRenderer: ({ row }) => <span>{row.area}㎡</span>
    },
    {
      label: "朝向",
      prop: "direction",
      width: 80
    },
    {
      label: "负责人",
      prop: "salesmanName",
      width: 120,
      cellRenderer: ({ row }) => (
        <span>
          {row.salesmanName} - {row.salesmanPhone}
        </span>
      )
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
    if (data) {
      roomTableList.value = data.list;
      pagination.total = Number(data.total);
      pagination.pageSize = Number(data.pageSize);
      pagination.currentPage = Number(data.currentPage);
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);

    getRoomTotal(toRaw(queryForm)).then(res => {
      roomStatusTotal.value = res.data.statusList;

      let total = 0;
      res.data.statusList.forEach(item => {
        total += item.total;
      });

      roomStatusTotal.value.unshift({ roomStatus: "", roomStatusName: "全部", total: total });
    });
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

  function formatHouseLayout(layout: HouseLayoutProps): string {
    if (!layout) return "";
    const { bedroom, livingRoom, kitchen, bathroom } = layout;
    return `${bedroom || 0}室${livingRoom || 0}厅${kitchen || 0}厨${bathroom || 0}卫`;
  }

  function handleDisplayClick() {
    displayModeToList.value = !displayModeToList.value;
    displayModeText.value = displayModeToList.value ? "列表模式" : "房态模式";
  }

  return {
    queryForm,
    onBack,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    roomTableList,
    houseOptions,
    roomStatusTotal,
    displayModeToList,
    displayModeText,
    handleDisplayClick,
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
