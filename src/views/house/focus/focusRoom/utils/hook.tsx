import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { onMounted, reactive, ref, toRaw } from "vue";
import router from "@/router";
import { getRoomList, getRoomTotalVo } from "@/api/house/room";
import { getFocusHouseOptions } from "@/api/house/focus";
import type { HouseLayoutDto, RoomQueryDto, RoomTotalItemVo } from "@/types";
import { ROOM_FILTER_TYPE } from "@/constants";

export function userFocusRoom() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<RoomQueryDto>({
    keywords: "",
    leaseModeId: null,
    leaseMode: 1, // 集中式
    // 三个独立维度，初始全部为空（表示"全部"）
    occupancyStatus: undefined,
    locked: undefined,
    closed: undefined,
    pageSize: "15",
    currentPage: "1"
  });

  // 当前激活的状态栏标识，用于高亮显示
  // 格式："all" | "status-{code}" | "locked" | "closed"
  const activeStatusKey = ref<string>("all");

  const curRow = ref();
  const roomTableList = ref([]);
  const focusOptions = ref([]);
  const roomStatusTotal = ref<RoomTotalItemVo[]>([]);
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
      prop: "occupancyStatusName",
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
              backgroundColor: row.occupancyStatusColor,
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              flexShrink: 0,
              marginRight: "8px"
            }}
          ></span>
          <span>{row.occupancyStatusName}</span>
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

  /**
   * 处理状态栏点击。
   *
   * 后端返回的每个 RoomTotalItemVo 包含 filterType 字段：
   *   filterType = 0 (BY_STATUS)  → 使用 roomStatus 字段筛选
   *   filterType = 1 (BY_LOCKED)  → 使用 locked=true 筛选
   *   filterType = 2 (BY_CLOSED)  → 使用 closed=true 筛选
   *   filterType = undefined      → "全部"，清空所有筛选条件
   *
   * 三个维度互斥：点击任意一项时，先清空其他两个，再设置当前维度。
   */
  function handleStatusClick(item: RoomTotalItemVo & { filterType?: number; roomStatus?: number }) {
    // 先清空三个维度
    queryForm.occupancyStatus = undefined;
    queryForm.locked = undefined;
    queryForm.closed = undefined;

    if (item.filterType === undefined || item.filterType === null) {
      // 全部
      activeStatusKey.value = "all";
    } else if (item.filterType === ROOM_FILTER_TYPE.BY_STATUS) {
      // 按出租占用状态
      queryForm.occupancyStatus = item.roomStatus ?? undefined;
      activeStatusKey.value = `status-${item.roomStatus}`;
    } else if (item.filterType === ROOM_FILTER_TYPE.BY_LOCKED) {
      // 锁房
      queryForm.locked = true;
      activeStatusKey.value = "locked";
    } else if (item.filterType === ROOM_FILTER_TYPE.BY_CLOSED) {
      // 已关闭
      queryForm.closed = true;
      activeStatusKey.value = "closed";
    }

    // 回到第一页后重新查询
    pagination.currentPage = 1;
    onSearch().then();
  }

  /**
   * 判断某个状态栏项是否处于激活状态，用于模板高亮。
   */
  function isStatusActive(item: RoomTotalItemVo & { filterType?: number }): boolean {
    if (item.filterType === undefined || item.filterType === null) {
      return activeStatusKey.value === "all";
    }
    if (item.filterType === ROOM_FILTER_TYPE.BY_STATUS) {
      return activeStatusKey.value === `status-${item.roomStatus}`;
    }
    if (item.filterType === ROOM_FILTER_TYPE.BY_LOCKED) {
      return activeStatusKey.value === "locked";
    }
    if (item.filterType === ROOM_FILTER_TYPE.BY_CLOSED) {
      return activeStatusKey.value === "closed";
    }
    return false;
  }

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onSearch();
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  async function loadRoomStatusTotal() {
    try {
      const totalQuery = {
        ...toRaw(queryForm),
        occupancyStatus: undefined,
        locked: undefined,
        closed: undefined,
        currentPage: undefined,
        pageSize: undefined
      };

      const res = await getRoomTotalVo(totalQuery);
      if (!res.data) return;

      const statusList = res.data.statusList ?? [];
      const allTotal = res.data.total ?? statusList.reduce((sum, item) => sum + (item.total ?? 0), 0);

      roomStatusTotal.value = [{ roomStatusName: "全部", total: allTotal, filterType: undefined, roomStatus: undefined, roomStatusColor: undefined }, ...statusList];
    } catch {
      // 忽略统计接口异常，不影响列表查询
    }
  }

  async function onSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage.toString();
    queryForm.pageSize = pagination.pageSize.toString();

    try {
      const [{ data }] = await Promise.all([getRoomList(toRaw(queryForm)), loadRoomStatusTotal()]);
      if (data) {
        roomTableList.value = data.list;
        pagination.total = Number(data.total);
        pagination.pageSize = Number(data.pageSize);
        pagination.currentPage = Number(data.currentPage);
      }
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 500);
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    // 重置时也清空状态筛选
    queryForm.occupancyStatus = undefined;
    queryForm.locked = undefined;
    queryForm.closed = undefined;
    activeStatusKey.value = "all";
    onSearch();
  };

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
    if (window.history.length <= 1) {
      router.push("/");
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
    activeStatusKey,
    handleStatusClick,
    isStatusActive,
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
