import { computed, type ComputedRef, type Ref, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { closeRoom, getRoomGrid, lockRoom, openRoom, unlockRoom } from "@/api/house/room";
import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";
import { getFocusById } from "@/api/house/focus";
import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
import { useHouseView } from "@/views/house/components/HouseView/hook";
import type { HouseDetailVo, RoomCreateDto, RoomGridItemVo, RoomGridDto, RoomListVo, ScatterCreateDto, ScatterHouseDto } from "@/types";
import useBooking from "@/views/contract/booking/utils/hook";
import useTenant from "@/views/contract/tenant/utils/hook";
import { OCCUPANCY_STATUS_ENUM } from "@/constants";
import { message } from "@/utils/message";

// ==================== Hook 特有的类型定义 ====================
// 说明：以下三个 Processed* 接口是必须保留的前端展示层类型。
// 后端已有 CompoundGroup / BuildingGroup / FloorGroup，但它们只携带原始数字统计字段，
// 缺少格式化展示字段（floorName、buildingUnitName）和聚合关联数据（floors、buildingUnits、rooms），
// 无法直接用于模板渲染，因此前端需要在 computed 中将原始数据处理成这三个结构后再使用。

/**
 * 处理后的楼层分组（前端展示层）
 * 对应后端 FloorGroup + RoomGridItemVo.rooms，补充 floorName 格式化字段和 rooms 关联列表
 */
interface ProcessedFloorGroup {
  floor: number;
  floorName: string; // 格式化楼层名，如 "3层"（后端 FloorGroup 无此字段）
  roomCount: number;
  leasedCount: number;
  occupancyRate: string; // 格式化百分比字符串（后端 FloorGroup.occupancyRate 为 number）
  rooms: RoomListVo[]; // 关联的房间列表（后端 FloorGroup 无此字段）
}

/**
 * 楼栋单元分组（前端展示层）
 * 对应后端 BuildingGroup，补充 buildingUnitName 格式化字段和 floors 聚合数组
 */
interface ProcessedBuildingUnit {
  building: string;
  unit: string;
  buildingUnitName: string; // 格式化名称，如 "1栋2单元"（后端 BuildingGroup 无此字段）
  totalRooms: number;
  leasedCount: number;
  occupancyRate: string;
  floorCount: number;
  floors: ProcessedFloorGroup[]; // 聚合后的楼层列表（后端 BuildingGroup 无此字段）
}

/**
 * 处理后的小区分组（前端展示层）
 * 对应后端 CompoundGroup，leaseModeId/communityId 修正为 string（与后端一致），
 * 补充 buildingUnits 聚合数组
 */
interface ProcessedCompoundGroup {
  leaseModeId: string; // 后端 CompoundGroup.leaseModeId 为 string，原代码误写为 number
  leaseMode: number;
  displayName: string;
  communityId: string; // 后端 CompoundGroup.communityId 为 string，原代码误写为 number
  communityName: string;
  communityAddress: string;
  totalRooms: number;
  leasedCount: number;
  occupancyRate: string;
  buildingUnits: ProcessedBuildingUnit[]; // 聚合后的楼栋单元列表（后端 CompoundGroup 无此字段）
}

// ==================== Hook 定义 ====================

export const useRoomGrid = (queryForm: Ref<QueryFormItemProps>) => {
  const { openFocusEditDialog } = useFocusEdit();
  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();
  const { openHouseViewDialog } = useHouseView();
  const { openBookingDialog } = useBooking();
  const { openTenantDialog } = useTenant();

  // 响应式数据
  const loading = ref(false);
  const loadingMore = ref(false);
  const roomGridData = ref<RoomGridDto | null>(null);
  const hasMore = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(3);

  // 存储所有原始数据项
  const allRoomGridItems = ref<RoomGridItemVo[]>([]);

  // 计算属性：处理后的房间分组数据
  const processedRoomGroups: ComputedRef<ProcessedCompoundGroup[]> = computed(() => {
    if (!allRoomGridItems.value.length) return [];

    // key 使用 string，与后端 CompoundGroup.leaseModeId: string 类型一致
    const compoundMap = new Map<string, ProcessedCompoundGroup>();
    const compoundOrder: string[] = [];

    allRoomGridItems.value.forEach((item: RoomGridItemVo) => {
      // compoundGroup / buildingGroup / floorGroup 均为后端可选字段，需防护
      const compoundGroup = item.compoundGroup;
      const buildingGroup = item.buildingGroup;
      const floorGroup = item.floorGroup;
      if (!compoundGroup || !buildingGroup || !floorGroup) return;

      const leaseModeId = compoundGroup.leaseModeId ?? "";

      if (!compoundMap.has(leaseModeId)) {
        compoundOrder.push(leaseModeId);
        compoundMap.set(leaseModeId, {
          leaseModeId,
          leaseMode: compoundGroup.leaseMode ?? 0,
          displayName: compoundGroup.displayName ?? "未知小区",
          communityId: compoundGroup.communityId ?? "",
          communityName: compoundGroup.communityName ?? "未知小区",
          communityAddress: compoundGroup.communityAddress ?? "未知地址",
          totalRooms: 0,
          leasedCount: 0,
          occupancyRate: "0",
          buildingUnits: []
        });
      }

      const compound = compoundMap.get(leaseModeId)!;

      // 查找或创建楼栋单元
      const building = buildingGroup.building ?? "";
      const unit = buildingGroup.unit ?? "";
      let buildingUnit = compound.buildingUnits.find(bu => bu.building === building && bu.unit === unit);

      if (!buildingUnit) {
        buildingUnit = {
          building,
          unit,
          buildingUnitName: building ? `${building}栋${unit ? unit + "单元" : ""}` : "默认楼栋",
          totalRooms: 0,
          leasedCount: 0,
          occupancyRate: "0",
          floorCount: 0,
          floors: []
        };
        compound.buildingUnits.push(buildingUnit);
      }

      // 排序房间
      const sortedRooms = [...(item.rooms ?? [])].sort((a, b) => {
        const numA = parseInt((a.roomNumber ?? "").replace(/\D/g, "")) || 0;
        const numB = parseInt((b.roomNumber ?? "").replace(/\D/g, "")) || 0;
        return numA === numB ? (a.roomNumber ?? "").localeCompare(b.roomNumber ?? "") : numA - numB;
      });

      // 添加楼层数据
      const floorNum = floorGroup.floor ?? 0;
      const floorGroupData: ProcessedFloorGroup = {
        floor: floorNum,
        floorName: `${floorNum}层`,
        roomCount: floorGroup.roomCount ?? 0,
        leasedCount: floorGroup.leasedCount ?? 0,
        // 后端 FloorGroup.occupancyRate 为 number，格式化为百分比字符串
        occupancyRate: floorGroup.occupancyRate != null ? String(floorGroup.occupancyRate) : "0",
        rooms: sortedRooms
      };

      buildingUnit.floors.push(floorGroupData);

      // 更新楼栋单元统计
      buildingUnit.totalRooms += floorGroupData.roomCount;
      buildingUnit.leasedCount += floorGroupData.leasedCount;
      buildingUnit.floorCount = buildingUnit.floors.length;

      // 更新小区统计
      compound.totalRooms += floorGroupData.roomCount;
      compound.leasedCount += floorGroupData.leasedCount;
    });

    const result: ProcessedCompoundGroup[] = [];

    compoundOrder.forEach(leaseModeId => {
      const compound = compoundMap.get(leaseModeId)!;

      if (compound.totalRooms > 0) {
        compound.occupancyRate = ((compound.leasedCount / compound.totalRooms) * 100).toFixed(1);
      }

      compound.buildingUnits.forEach(buildingUnit => {
        if (buildingUnit.totalRooms > 0) {
          buildingUnit.occupancyRate = ((buildingUnit.leasedCount / buildingUnit.totalRooms) * 100).toFixed(1);
        }
        buildingUnit.floors.sort((a, b) => a.floor - b.floor);
      });

      compound.buildingUnits.sort((a, b) => {
        const buildingA = parseInt(a.building.replace(/\D/g, "")) || 0;
        const buildingB = parseInt(b.building.replace(/\D/g, "")) || 0;
        if (buildingA !== buildingB) return buildingA - buildingB;
        return (a.unit ?? "").localeCompare(b.unit ?? "");
      });

      result.push(compound);
    });

    return result;
  });

  // 加载房间数据
  const loadRoomGrid = async (isLoadMore = false) => {
    if (loading.value || loadingMore.value) return;

    if (isLoadMore && !hasMore.value) return;

    if (isLoadMore) {
      loadingMore.value = true;
      currentPage.value++;
    } else {
      loading.value = true;
      currentPage.value = 1;
      allRoomGridItems.value = [];
    }

    try {
      const { data } = await getRoomGrid({
        ...queryForm.value,
        pageSize: pageSize.value.toString(),
        currentPage: currentPage.value.toString()
      });

      if (data) {
        roomGridData.value = data;
        hasMore.value = data.hasMore ?? false;

        if (data.roomGridItemList) {
          const processedItems = data.roomGridItemList.map((item: RoomGridItemVo) => ({ ...item }));

          if (isLoadMore) {
            allRoomGridItems.value.push(...processedItems);
          } else {
            allRoomGridItems.value = processedItems;
          }
        }
      }
    } catch (error) {
      console.error("加载房间数据失败:", error);
      ElMessage.error("加载数据失败");
      if (isLoadMore) {
        currentPage.value--;
      }
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };

  const loadMore = async () => {
    await loadRoomGrid(true);
  };

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (!loadingMore.value && hasMore.value) {
        loadMore();
      }
    }
  };

  const resetAndReload = async () => {
    currentPage.value = 1;
    allRoomGridItems.value = [];
    hasMore.value = false;
    await loadRoomGrid(false);
  };

  const handleQuickAction = (room: RoomListVo, action: string) => {
    switch (action) {
      case "booking":
        openBookingDialog("添加", { roomIds: [room.roomId], roomList: [room] }, () => {
          room.roomStatus = OCCUPANCY_STATUS_ENUM.BOOKED.code;
          room.roomStatusName = OCCUPANCY_STATUS_ENUM.BOOKED.name;
          room.roomStatusColor = OCCUPANCY_STATUS_ENUM.BOOKED.color;
        });
        break;
      case "tenant":
        openTenantDialog(
          "添加",
          {
            booking: { roomIds: [room.roomId], roomList: [room] },
            lease: undefined,
            tenantPersonal: undefined,
            tenantCompany: undefined,
            tenantMateList: undefined,
            otherFees: undefined
          },
          () => {
            room.roomStatus = OCCUPANCY_STATUS_ENUM.LEASED.code;
            room.roomStatusName = OCCUPANCY_STATUS_ENUM.LEASED.name;
            room.roomStatusColor = OCCUPANCY_STATUS_ENUM.LEASED.color;
          }
        );
        ElMessage.success(`准备为房间 ${room.roomNumber} 签约`);
        break;
      case "view":
        openHouseViewDialog(room);
        break;
      default:
        message(`未知操作：${action}`, { type: "error" });
    }
  };

  // 管理小区（集中式项目）
  const handleManageCompound = (community: ProcessedCompoundGroup) => {
    console.log(`点击项目编辑：${community.displayName}`);
    if (community.leaseModeId) {
      getFocusById({ id: community.leaseModeId }).then(res => {
        openFocusEditDialog("更新", res.data);
      });
    }
  };

  const getRoomCardClass = (room: RoomListVo) => {
    const classes: string[] = [];
    if (room.closed) classes.push("room-disabled");
    return classes;
  };

  const getRoomCardStyle = (room: RoomListVo) => {
    const style: Record<string, string> = {};
    if (room.roomStatusColor) {
      style.borderColor = room.roomStatusColor;
    }
    return style;
  };

  const getRoomTypeLabel = (room: RoomListVo) => {
    const layout = room.houseLayout;
    if (!layout) return "未分配";
    if (layout.layoutName) return layout.layoutName;

    const bedroom = layout.bedroom ?? 0;
    const labels: Record<number, string> = { 0: "单间", 1: "一室", 2: "两室", 3: "三室", 4: "四室" };
    return labels[bedroom] ?? `${bedroom}室`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return "未知";
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  const formatPrice = (price?: string | number) => {
    if (!price) return "0";
    return typeof price === "number" ? price.toLocaleString() : parseFloat(price).toLocaleString();
  };

  // IntersectionObserver
  let observer: IntersectionObserver | null = null;

  const setupLoadMore = (triggerElement?: HTMLElement) => {
    if (!triggerElement) {
      console.warn("IntersectionObserver: 触发元素不存在");
      return;
    }
    if (observer) observer.disconnect();

    console.log("初始化 IntersectionObserver");

    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          console.log("IntersectionObserver 触发:", {
            isIntersecting: entry.isIntersecting,
            hasMore: hasMore.value,
            loadingMore: loadingMore.value,
            loading: loading.value,
            currentPage: currentPage.value
          });
          if (entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
            console.log("开始加载更多数据");
            loadMore();
          }
        });
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(triggerElement);
    console.log("开始观察触发元素");
  };

  const cleanupObserver = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // 处理下拉菜单操作
  const handleDropdownAction = (room: RoomListVo, command: string) => {
    function handleCloseRoom(room: RoomListVo) {
      closeRoom({ roomId: room.roomId }).then(res => {
        if (res.code === 0) {
          ElMessage.success(`已关闭房间 ${room.roomNumber}`);
          resetAndReload();
        } else {
          ElMessage.error(res.message ?? "关闭失败");
        }
      });
    }

    function handleOpenRoom(room: RoomListVo) {
      openRoom({ roomId: room.roomId }).then(res => {
        if (res.code === 0) {
          ElMessage.success(`已开启房间 ${room.roomNumber}`);
          resetAndReload();
        } else {
          ElMessage.error(res.message ?? "打开失败");
        }
      });
    }

    switch (command) {
      case "edit":
        if (room.leaseMode === 2 && room.rentalType === 1) {
          // openEntireEditDialog 签名已更新为 (title, id?)，直接传 houseId
          openEntireEditDialog("编辑", room.houseId).then(() => {
            resetAndReload().then();
          });
        } else if (room.leaseMode === 2 && room.rentalType === 2) {
          editShareHouse("编辑", room);
        }
        break;
      case "lock":
        handleLockRoom(room);
        break;
      case "unlock":
        handleUnlockRoom(room);
        break;
      case "close":
        handleCloseRoom(room);
        break;
      case "open":
        handleOpenRoom(room);
        break;
      case "salesman":
        ElMessage.info(`负责人：${room.salesmanName}`);
        break;
    }
  };

  /**
   * 编辑合租房源
   */
  function editShareHouse(title: string, room: RoomListVo) {
    openShareEditDialog(title, room.houseId).then(() => {
      resetAndReload().then();
    });
  }

  const handleLockRoom = (room: RoomListVo) => {
    ElMessageBox.confirm(`确认锁定 ${room.houseName}-房间 ${room.roomNumber}？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(() => {
      lockRoom({ roomId: room.roomId }).then(res => {
        if (res.code === 0) {
          ElMessage.success(`房间 ${room.roomNumber} 已锁定`);
          resetAndReload().then();
        } else {
          ElMessage.error(`锁定房间 ${room.roomNumber} 失败：${res.message}`);
        }
      });
    });
  };

  const handleUnlockRoom = (room: RoomListVo) => {
    ElMessageBox.confirm(`确认解锁 ${room.houseName}-房间 ${room.roomNumber}？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(() => {
      unlockRoom({ roomId: room.roomId }).then(res => {
        if (res.code === 0) {
          ElMessage.success(`房间 ${room.roomNumber} 已解锁`);
          resetAndReload();
        } else {
          ElMessage.error(`解锁房间 ${room.roomNumber} 失败：${res.message}`);
        }
      });
    });
  };

  return {
    loading,
    loadingMore,
    roomGridData,
    processedRoomGroups,
    hasMore,
    currentPage,
    pageSize,
    loadRoomGrid,
    loadMore,
    handleScroll,
    resetAndReload,
    handleQuickAction,
    handleManageCompound,
    getRoomCardClass,
    getRoomCardStyle,
    getRoomTypeLabel,
    formatDate,
    formatDateRange,
    formatPrice,
    setupLoadMore,
    cleanupObserver,
    handleDropdownAction
  };
};

// 导出类型供组件使用
export type { ProcessedCompoundGroup, ProcessedFloorGroup, ProcessedBuildingUnit };
