import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { onMounted, reactive, ref, toRaw } from "vue";
import router from "@/router";
import { getRoomList, getRoomTotalVo } from "@/api/house/room";
import { getFocusHouseOptions } from "@/api/house/focus";
import { HouseLayoutDto } from "@/types";

export function useScatterRoom() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive({
    keywords: "",
    leaseModeId: null,
    leaseMode: 2, // 整合租
    roomStatus: null,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const roomTableList = ref([]);
  const focusOptions = ref([]);
  const roomStatusTotal = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const displayModeToList = ref(false);
  const displayModeText = ref("房态模式");

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
      label: "出租方式",
      prop: "rentalType",
      width: 100,
      cellRenderer: ({ row }) => (
        <span>
          <el-tag>{row.rentalType == 1 ? "整租" : "合租"}</el-tag>
        </span>
      )
    },
    {
      label: "小区/项目名称",
      prop: "communityName",
      width: 150
    },
    {
      label: "房源地址",
      prop: "houseName",
      width: 300
    },
    {
      label: "房号",
      prop: "roomNumber",
      width: 100
    },
    {
      label: "房型",
      prop: "houseLayout.layoutName",
      width: 150,
      cellRenderer: ({ row }) => <span>{row.houseLayout?.layoutName ?? ""}</span>
    },
    {
      label: "出租价格",
      prop: "price",
      width: 120,
      cellRenderer: ({ row }) => <span>{(row.price ?? 0).toFixed(2)} 元/月</span>
    },
    {
      label: "物业费",
      prop: "propertyFee",
      width: 100,
      cellRenderer: ({ row }) => <span>{(row.propertyFee ?? 0).toFixed(2)} 元/月</span>
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
      label: "所属门店",
      prop: "deptName",
      width: 120
    },
    {
      label: "负责人",
      prop: "salesmanName",
      width: 180,
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

    getRoomTotalVo(toRaw(queryForm)).then(res => {
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
    onFocusOptions();
  });

  function onFocusOptions() {
    getFocusHouseOptions().then(res => {
      focusOptions.value = res.data;
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

  function formatHouseLayout(layout: HouseLayoutDto): string {
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
    focusOptions,
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
