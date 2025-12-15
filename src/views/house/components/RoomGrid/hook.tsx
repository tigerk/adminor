import { computed, type ComputedRef, type Ref, ref } from "vue";
import { ElMessage } from "element-plus";
import { getRoomGrid, type RoomGridDTO, type RoomGridItemDTO, type RoomItemDTO } from "@/api/house/room";
import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";
import { getFocusById } from "@/api/house/focus";
import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
import { getEntireHouseById, getShareHouseById } from "@/api/house/scatter";
import type { EntireFormItemProps, ScatterHouseResponse, ShareFormItemProps } from "@/types";

// ==================== Hook 特有的类型定义 ====================

/**
 * 处理后的楼层分组
 */
interface ProcessedFloorGroup {
  floor: number;
  floorName: string;
  roomCount: number;
  leasedCount: number;
  occupancyRate: string;
  rooms: RoomItemDTO[];
}

/**
 * 楼栋单元分组
 */
interface ProcessedBuildingUnit {
  building: string;
  unit: string;
  buildingUnitName: string;
  totalRooms: number;
  leasedCount: number;
  occupancyRate: string;
  floorCount: number;
  floors: ProcessedFloorGroup[];
}

/**
 * 处理后的小区分组
 */
interface ProcessedCompoundGroup {
  leaseModeId: number;
  leaseMode: number;
  displayName: string;
  communityId: number;
  communityName: string;
  communityAddress: string;
  totalRooms: number;
  leasedCount: number;
  occupancyRate: string;
  buildingUnits: ProcessedBuildingUnit[];
}

// ==================== Hook 定义 ====================

export const useRoomGrid = (queryForm: Ref<QueryFormItemProps>) => {
  const { openFocusEditDialog } = useFocusEdit();
  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();

  // 响应式数据
  const loading = ref(false);
  const loadingMore = ref(false);
  const roomGridData = ref<RoomGridDTO | null>(null);
  const hasMore = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(3); // 可根据需要调整每页大小

  // 存储所有原始数据项
  const allRoomGridItems = ref<RoomGridItemDTO[]>([]);

  // 计算属性：处理后的房间分组数据
  const processedRoomGroups: ComputedRef<ProcessedCompoundGroup[]> = computed(() => {
    if (!allRoomGridItems.value.length) return [];

    // 按小区分组，但保持原始顺序
    const compoundMap = new Map<number, ProcessedCompoundGroup>();
    const compoundOrder: number[] = []; // 记录小区出现的顺序

    allRoomGridItems.value.forEach((item: RoomGridItemDTO) => {
      const leaseModeId = item.compoundGroup.leaseModeId || 0;

      if (!compoundMap.has(leaseModeId)) {
        compoundOrder.push(leaseModeId); // 记录顺序
        compoundMap.set(leaseModeId, {
          leaseModeId: item.compoundGroup.leaseModeId ?? 0,
          leaseMode: item.compoundGroup.leaseMode,
          displayName: item.compoundGroup.displayName || "未知小区",
          communityId: leaseModeId,
          communityName: item.compoundGroup.communityName || "未知小区",
          communityAddress: item.compoundGroup.communityAddress || "未知地址",
          totalRooms: 0,
          leasedCount: 0,
          occupancyRate: "0",
          buildingUnits: []
        });
      }

      const compound = compoundMap.get(leaseModeId)!;

      // 查找或创建楼栋单元
      const building = item.buildingGroup.building || "";
      const unit = item.buildingGroup.unit || "";
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
      const sortedRooms = [...item.rooms].sort((a, b) => {
        const numA = parseInt((a.roomNumber || "").replace(/\D/g, "")) || 0;
        const numB = parseInt((b.roomNumber || "").replace(/\D/g, "")) || 0;
        return numA !== numB ? numA - numB : (a.roomNumber || "").localeCompare(b.roomNumber || "");
      });

      // 添加楼层数据
      const floorGroup: ProcessedFloorGroup = {
        floor: item.floorGroup.floor || 0,
        floorName: `${item.floorGroup.floor}层`,
        roomCount: item.floorGroup.roomCount || 0,
        leasedCount: item.floorGroup.leasedCount || 0,
        occupancyRate: item.floorGroup.occupancyRate || "0",
        rooms: sortedRooms
      };

      buildingUnit.floors.push(floorGroup);

      // 更新楼栋单元统计
      buildingUnit.totalRooms += floorGroup.roomCount;
      buildingUnit.leasedCount += floorGroup.leasedCount;
      buildingUnit.floorCount = buildingUnit.floors.length;

      // 更新小区统计
      compound.totalRooms += floorGroup.roomCount;
      compound.leasedCount += floorGroup.leasedCount;
    });

    // 处理每个小区的数据
    const result: ProcessedCompoundGroup[] = [];

    // 按照原始顺序处理小区
    compoundOrder.forEach(leaseModeId => {
      const compound = compoundMap.get(leaseModeId)!;

      // 计算小区出租率
      if (compound.totalRooms > 0) {
        compound.occupancyRate = ((compound.leasedCount / compound.totalRooms) * 100).toFixed(1);
      }

      // 对每个楼栋单元进行处理
      compound.buildingUnits.forEach(buildingUnit => {
        // 计算楼栋单元出租率
        if (buildingUnit.totalRooms > 0) {
          buildingUnit.occupancyRate = ((buildingUnit.leasedCount / buildingUnit.totalRooms) * 100).toFixed(1);
        }

        // 对楼层进行排序
        buildingUnit.floors.sort((a, b) => a.floor - b.floor);
      });

      // 对楼栋单元进行排序（按楼栋号和单元号）
      compound.buildingUnits.sort((a, b) => {
        const buildingA = parseInt(a.building.replace(/\D/g, "")) || 0;
        const buildingB = parseInt(b.building.replace(/\D/g, "")) || 0;
        if (buildingA !== buildingB) {
          return buildingA - buildingB;
        }
        return (a.unit || "").localeCompare(b.unit || "");
      });

      result.push(compound);
    });

    // 不再按小区名称排序，保持原始顺序
    return result;
  });

  // 加载房间数据
  const loadRoomGrid = async (isLoadMore = false) => {
    // 如果正在加载，则不重复请求
    if (loading.value || loadingMore.value) return;

    // 如果是加载更多且没有更多数据，直接返回
    if (isLoadMore && !hasMore.value) {
      return;
    }

    // 设置加载状态
    if (isLoadMore) {
      loadingMore.value = true;
      currentPage.value++; // ⚠️ 在请求前增加页码
    } else {
      loading.value = true;
      // 如果不是加载更多，重置分页
      currentPage.value = 1;
      allRoomGridItems.value = [];
    }

    try {
      const { data } = await getRoomGrid({
        ...queryForm.value,
        pageSize: pageSize.value,
        currentPage: currentPage.value
      });

      if (data) {
        roomGridData.value = data;
        hasMore.value = data.hasMore || false;

        // 临时模拟租期信息（后端添加后删除）
        if (data.roomGridItemList) {
          const processedItems = data.roomGridItemList.map((item: RoomGridItemDTO) => ({
            ...item,
            rooms: item.rooms.map((room: RoomItemDTO) => ({
              ...room,
              leaseInfo:
                room.roomStatus === 1
                  ? {
                      leaseStartDate: "2025-09-20",
                      leaseEndDate: "2026-09-19",
                      availableDate: "2026-09-20",
                      daysUntilAvailable: Math.floor(Math.random() * 30) + 1,
                      tenantName: "张三",
                      tenantPhone: "13800138000"
                    }
                  : room.roomStatus === 0
                    ? {
                        availableDate: "2025-09-20",
                        daysUntilAvailable: Math.floor(Math.random() * 30) + 1
                      }
                    : undefined,
              balcony: Math.random() > 0.7
            }))
          }));

          // 追加或替换数据
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
        currentPage.value--; // 失败时回滚页码
      }
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };

  // 加载更多数据
  const loadMore = async () => {
    await loadRoomGrid(true);
  };

  // 处理滚动事件（可在组件中使用）
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // 计算是否接近底部（距离底部小于100px时触发）
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (!loadingMore.value && hasMore.value) {
        loadMore();
      }
    }
  };

  // 重置并重新加载
  const resetAndReload = async () => {
    currentPage.value = 1;
    allRoomGridItems.value = [];
    hasMore.value = false;
    await loadRoomGrid(false);
  };

  // 处理快速操作
  const handleQuickAction = (room: RoomItemDTO, action: string) => {
    switch (action) {
      case "contract":
        ElMessage.success(`准备为房间 ${room.roomNumber} 签约`);
        break;
      case "renew":
        ElMessage.success(`准备为房间 ${room.roomNumber} 续约`);
        break;
      case "lock":
        ElMessage.warning(`确认锁定房间 ${room.roomNumber}？`);
        break;
      case "unlock":
        ElMessage.success(`房间 ${room.roomNumber} 已解锁`);
        break;
      case "edit":
        ElMessage.info(`编辑房间 ${room.roomNumber} 信息`);
        break;
      case "view":
        ElMessage.info(`查看房间 ${room.roomNumber} 详情`);
        break;
    }
  };

  // 管理小区
  const handleManageCompound = (community: ProcessedCompoundGroup) => {
    console.log(`点击项目编辑：${community}`);
    if (community.leaseModeId) {
      getFocusById({
        id: community.leaseModeId
      }).then(res => {
        openFocusEditDialog("更新", res.data);
      });
    }
  };

  // 获取房间卡片样式类
  const getRoomCardClass = (room: RoomItemDTO) => {
    const classes: string[] = [];

    if (room.closed) {
      classes.push("room-disabled");
    }

    return classes;
  };

  // 辅助函数：将hex颜色转换为rgba
  const hexToRgba = (hex: string, alpha: number = 1) => {
    // 移除#号
    hex = hex.replace("#", "");

    // 处理3位或6位的hex
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map(char => char + char)
        .join("");
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 获取房间卡片动态样式
  const getRoomCardStyle = (room: RoomItemDTO) => {
    const style: any = {};

    if (room.roomStatusColor) {
      // 使用接口返回的颜色
      style.borderColor = room.roomStatusColor;

      // 根据状态设置背景渐变
      const colorHex = room.roomStatusColor;
      // 将颜色转换为更淡的背景色
      style.background = `linear-gradient(135deg, ${hexToRgba(colorHex, 0.05)} 0%, #fff 100%)`;
    }

    return style;
  };

  // 获取房型标签
  const getRoomTypeLabel = (room: RoomItemDTO) => {
    const layout = room.houseLayout;
    if (!layout) {
      return "未分配";
    }

    if (layout.layoutName) {
      return layout.layoutName;
    }

    const bedroom = layout.bedroom || 0;
    const labels: Record<number, string> = {
      0: "单间",
      1: "一室",
      2: "两室",
      3: "三室",
      4: "四室"
    };

    return labels[bedroom] || `${bedroom}室`;
  };

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 格式化日期范围
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return "未知";
    return `${formatDate(startDate)}~${formatDate(endDate)}`;
  };

  // 格式化价格
  const formatPrice = (price?: string | number) => {
    if (!price) return "0";
    return typeof price === "number" ? price.toLocaleString() : parseFloat(price).toLocaleString();
  };

  // 添加 IntersectionObserver 相关
  let observer: IntersectionObserver | null = null;

  const setupLoadMore = (triggerElement?: HTMLElement) => {
    if (!triggerElement) {
      console.warn("IntersectionObserver: 触发元素不存在");
      return;
    }

    if (observer) {
      observer.disconnect();
    }

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
      {
        root: null, // ⚠️ 使用 null 表示相对于视口
        rootMargin: "100px",
        threshold: 0.1
      }
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
  const handleDropdownAction = (room: RoomItemDTO, command: string) => {
    switch (command) {
      case "edit":
        if (room.leaseMode == 2 && room.rentalType == 1) {
          editEntireHouse("更新", room);
        } else if (room.leaseMode == 2 && room.rentalType == 2) {
          editShareHouse("更新", room);
        }
        break;
      case "lock":
        ElMessage.warning(`确认锁定房间 ${room.roomNumber}？`);
        break;
      case "unlock":
        ElMessage.success(`房间 ${room.roomNumber} 已解锁`);
        break;
      case "salesman":
        ElMessage.info(`负责人：${room.salesmanName}`);
        break;
    }
  };

  function editEntireHouse(title: string, room: RoomItemDTO) {
    getEntireHouseById({ id: room.houseId }).then(res => {
      if (res.code !== 0) {
        return;
      }

      openEntireEditDialog("编辑", convertToEntireFormItemProps(res.data));
    });
  }

  // 将 ScatterHouseResponse 转换为 EntireFormItemProps
  function convertToEntireFormItemProps(resp: ScatterHouseResponse): EntireFormItemProps {
    const price = resp.roomList[0]?.price || 0;

    return {
      id: resp.id,
      leaseMode: resp.leaseMode,
      community: resp.community,
      deptId: resp.deptId,
      salesmanId: resp.salesmanId,
      water: resp.water,
      electricity: resp.electricity,
      heating: resp.heating,
      hasElevator: resp.hasElevator,
      hasGas: resp.hasGas,
      houseList: [
        {
          id: resp.id,
          houseLayout: resp.houseLayout,
          rentalType: resp.rentalType,
          decorationType: resp.decorationType,
          propertyFee: resp.propertyFee,
          houseCode: resp.houseCode,
          building: resp.building,
          unit: resp.unit,
          doorNumber: resp.doorNumber,
          floor: resp.floor,
          floorTotal: resp.floorTotal,
          direction: resp.direction,
          area: resp.area,
          price: price,
          roomList: resp.roomList || [] // 如果 roomList 为空，则初始化为空数组
        }
      ]
    };
  }

  function editShareHouse(title: string, room: RoomItemDTO) {
    getShareHouseById({ id: room.houseId }).then(res => {
      if (res.code !== 0) {
        return;
      }

      const shareFormItemProps = convertToShareFormItemProps(res.data);

      openShareEditDialog("编辑", shareFormItemProps);
    });
  }

  // 将 ScatterHouseResponse 转换为 ShareFormItemProps
  function convertToShareFormItemProps(resp: ScatterHouseResponse): ShareFormItemProps {
    return {
      id: resp.id,
      leaseMode: resp.leaseMode,
      community: resp.community,
      deptId: resp.deptId,
      salesmanId: resp.salesmanId,
      water: resp.water,
      electricity: resp.electricity,
      heating: resp.heating,
      hasElevator: resp.hasElevator,
      hasGas: resp.hasGas,
      houseList: [
        {
          id: resp.id,
          houseLayout: resp.houseLayout,
          rentalType: resp.rentalType,
          decorationType: resp.decorationType,
          propertyFee: resp.propertyFee,
          houseCode: resp.houseCode,
          building: resp.building,
          unit: resp.unit,
          doorNumber: resp.doorNumber,
          floor: resp.floor,
          floorTotal: resp.floorTotal,
          direction: resp.direction,
          area: resp.area,
          roomList: resp.roomList || [] // 如果 roomList 为空，则初始化为空数组
        }
      ]
    };
  }

  return {
    // 响应式数据
    loading,
    loadingMore,
    roomGridData,
    processedRoomGroups,
    hasMore,
    currentPage,
    pageSize,
    // 方法
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
