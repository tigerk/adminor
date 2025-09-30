import { ref, computed, type Ref, type ComputedRef } from "vue";
import { ElMessage } from "element-plus";
import { type RoomItemDTO, type RoomGridItemDTO, type RoomGridDTO, getRoomGrid } from "@/api/house/room";
import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";

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
 * 处理后的小区分组
 */
interface ProcessedCommunityGroup {
  communityId: number;
  communityName: string;
  address: string;
  totalRooms: number;
  leasedCount: number;
  occupancyRate: string;
  buildingUnits: Map<string, ProcessedFloorGroup[]>;
}

// ==================== Hook 定义 ====================

export const useRoomGrid = (queryForm: Ref<QueryFormItemProps>) => {
  // 响应式数据
  const loading = ref(false);
  const roomGridData = ref<RoomGridDTO | null>(null);

  // 计算属性：处理后的房间分组数据
  const processedRoomGroups: ComputedRef<ProcessedCommunityGroup[]> = computed(() => {
    if (!roomGridData.value?.roomGridItemList) return [];

    // 按小区分组
    const communityMap = new Map<number, ProcessedCommunityGroup>();

    roomGridData.value.roomGridItemList.forEach((item: RoomGridItemDTO) => {
      const communityId = item.communityGroup.communityId || 0;

      if (!communityMap.has(communityId)) {
        communityMap.set(communityId, {
          communityId,
          communityName: item.communityGroup.communityName || "未知小区",
          address: item.communityGroup.address || "未知地址",
          totalRooms: 0,
          leasedCount: 0,
          occupancyRate: "0",
          buildingUnits: new Map()
        });
      }

      const community = communityMap.get(communityId)!;
      const buildingUnitKey = `${item.unitGroup.building}-${item.unitGroup.unit}`;

      // 按楼栋单元分组
      if (!community.buildingUnits.has(buildingUnitKey)) {
        community.buildingUnits.set(buildingUnitKey, []);
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
        floorName: item.unitGroup.building ? `${item.unitGroup.building}栋${item.unitGroup.unit || ""}单元${item.floorGroup.floor}层` : `${item.floorGroup.floor}层`,
        roomCount: item.floorGroup.roomCount || 0,
        leasedCount: item.floorGroup.leasedCount || 0,
        occupancyRate: item.floorGroup.occupancyRate || "0",
        rooms: sortedRooms
      };

      community.buildingUnits.get(buildingUnitKey)!.push(floorGroup);

      // 更新小区统计
      community.totalRooms += floorGroup.roomCount;
      community.leasedCount += floorGroup.leasedCount;
    });

    // 计算小区出租率并排序
    const result = Array.from(communityMap.values()).map(community => {
      if (community.totalRooms > 0) {
        community.occupancyRate = ((community.leasedCount / community.totalRooms) * 100).toFixed(1);
      }

      // 对每个楼栋单元的楼层进行排序
      community.buildingUnits.forEach(floors => {
        floors.sort((a, b) => a.floor - b.floor);
      });

      return community;
    });

    // 按小区名称排序
    return result.sort((a, b) => a.communityName.localeCompare(b.communityName));
  });

  // 加载房间数据
  const loadRoomGrid = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      const { data } = await getRoomGrid({
        ...queryForm.value,
        pageSize: 3,
        currentPage: 1
      });

      if (data) {
        roomGridData.value = data;

        // 临时模拟租期信息（后端添加后删除）
        if (data.roomGridItemList) {
          data.roomGridItemList.forEach((item: RoomGridItemDTO) => {
            item.rooms = item.rooms.map((room: RoomItemDTO) => ({
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
            }));
          });
        }
      }
    } catch (error) {
      console.error("加载房间数据失败:", error);
      ElMessage.error("加载数据失败");
    } finally {
      loading.value = false;
    }
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
  const handleManageCommunity = (community: ProcessedCommunityGroup) => {
    ElMessage.info(`管理小区：${community.communityName}`);
  };

  // 获取房间卡片样式类
  const getRoomCardClass = (room: RoomItemDTO) => {
    const classes: string[] = [];

    switch (room.roomStatus) {
      case 0:
        classes.push("status-vacant");
        break;
      case 1:
        classes.push("status-occupied");
        break;
      case 2:
        classes.push("status-locked");
        break;
      case 3:
        classes.push("status-configuring");
        break;
      case 4:
        classes.push("status-offline");
        break;
    }

    if (room.closed) {
      classes.push("room-disabled");
    }

    return classes;
  };

  // 获取房型标签
  const getRoomTypeLabel = (room: RoomItemDTO) => {
    const layout = room.houseLayout;
    if (!layout) return "未分配";

    if (layout.layoutName) return layout.layoutName;

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

  return {
    // 响应式数据
    loading,
    roomGridData,
    processedRoomGroups,
    // 方法
    loadRoomGrid,
    handleQuickAction,
    handleManageCommunity,
    getRoomCardClass,
    getRoomTypeLabel,
    formatDate,
    formatDateRange,
    formatPrice
  };
};

// 导出类型供组件使用
export type { ProcessedCommunityGroup, ProcessedFloorGroup };
