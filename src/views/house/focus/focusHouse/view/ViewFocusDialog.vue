<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { ElMessage } from "element-plus";
  import { getFocusById } from "@/api/house/focus";
  import { getRoomList } from "@/api/house/room";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import type { DictData, FocusCreateDto, RoomListVo } from "@/types";
  import { OccupancyStatusEnumMeta } from "@/types/generated/enum.meta";
  import { ELECTRICITY_TYPE_OPTIONS, getOptionByCode, HEATING_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";

  const props = defineProps<{ focusId: string }>();

  const activeTab = ref("info");
  const loading = ref(false);
  const focusDetail = ref<FocusCreateDto | null>(null);
  const roomList = ref<RoomListVo[]>([]);
  const tagLabelMap = ref<Record<string, string>>({});
  const facilityLabelMap = ref<Record<string, string>>({});
  const roomFilter = ref<"all" | "available" | "locked" | "closed">("all");

  const buildingRows = computed(() => focusDetail.value?.buildings ?? []);
  const layoutRows = computed(() => focusDetail.value?.houseLayoutList ?? []);
  const imageList = computed(() => focusDetail.value?.imageList?.filter(Boolean) ?? []);
  const projectTags = computed(() => (focusDetail.value?.tags ?? []).map(item => tagLabelMap.value[item] || item));
  const projectFacilities = computed(() => (focusDetail.value?.facilities ?? []).map(item => facilityLabelMap.value[item] || item));

  const roomStats = computed(() => ({
    total: roomList.value.length,
    available: roomList.value.filter(r => !r.closed && !r.locked).length,
    locked: roomList.value.filter(r => !r.closed && r.locked).length,
    closed: roomList.value.filter(r => r.closed).length
  }));

  const filteredRooms = computed(() => {
    if (roomFilter.value === "all") return roomList.value;
    if (roomFilter.value === "available") return roomList.value.filter(r => !r.closed && !r.locked);
    if (roomFilter.value === "locked") return roomList.value.filter(r => !r.closed && r.locked);
    if (roomFilter.value === "closed") return roomList.value.filter(r => r.closed);
    return roomList.value;
  });

  const getOptionLabel = (options: readonly any[], value?: string) => {
    if (!value) return "-";
    return getOptionByCode([...options], value)?.label || value;
  };
  const getWaterLabel = (v?: string) => getOptionLabel(WATER_TYPE_OPTIONS, v);
  const getElectricityLabel = (v?: string) => getOptionLabel(ELECTRICITY_TYPE_OPTIONS, v);
  const getHeatingLabel = (v?: string) => getOptionLabel(HEATING_TYPE_OPTIONS, v);

  const getOccupancyMeta = (row: RoomListVo) => {
    if (row.closed) return { text: "已关闭", dot: "#9ca3af", color: "#6b7280", key: "closed" };
    if (row.locked) return { text: "已锁定", dot: "#f59e0b", color: "#b45309", key: "locked" };
    const enumMeta = Object.values(OccupancyStatusEnumMeta).find(item => item.code === row.occupancyStatus);
    return {
      text: row.occupancyStatusName || enumMeta?.name || "未知",
      dot: row.occupancyStatusColor || enumMeta?.color || "#9ca3af",
      color: row.occupancyStatusColor || enumMeta?.color || "#6b7280",
      key: "available"
    };
  };

  const loadDictMap = async (dictCode: string) => {
    const resp = await getDictDataByDictCode({ dictCode });
    if (resp.code !== 0) return {};
    return (resp.data || []).reduce<Record<string, string>>((acc, item: DictData) => {
      acc[String(item.value ?? item.id ?? item.name)] = item.name ?? "";
      return acc;
    }, {});
  };

  const loadDetail = async () => {
    loading.value = true;
    try {
      const [focusResp, roomResp, focusTagMap, facilityMap] = await Promise.all([
        getFocusById({ id: props.focusId }),
        getRoomList({ leaseMode: 1, leaseModeId: props.focusId, currentPage: "1", pageSize: "1000" }),
        loadDictMap("focus_tags"),
        loadDictMap("house_facilities")
      ]);
      if (focusResp.code !== 0) {
        ElMessage.error(focusResp.message || "获取项目详情失败");
        return;
      }
      focusDetail.value = focusResp.data ?? null;
      roomList.value = roomResp.code === 0 ? (roomResp.data?.list ?? []) : [];
      tagLabelMap.value = focusTagMap;
      facilityLabelMap.value = facilityMap;
    } catch (e) {
      console.error(e);
      ElMessage.error("获取项目详情失败");
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadDetail);
</script>

<template>
  <div v-loading="loading" class="fv-root">
    <!-- ── Hero ── -->
    <div class="fv-hero">
      <div class="hero-left">
        <p class="hero-name">{{ focusDetail?.focusName || "—" }}</p>
        <div class="hero-pills">
          <span class="pill">
            <i class="i-ri-hashtag" />
            {{ focusDetail?.focusCode || "—" }}
          </span>
          <span v-if="focusDetail?.community?.name" class="pill">
            <i class="i-ri-map-pin-2-line" />
            {{ focusDetail.community.name }}
          </span>
          <span v-if="focusDetail?.community?.address || focusDetail?.address" class="pill">
            <i class="i-ri-road-map-line" />
            {{ focusDetail?.community?.address || focusDetail?.address }}
          </span>
          <span v-if="focusDetail?.storePhone" class="pill">
            <i class="i-ri-phone-line" />
            {{ focusDetail.storePhone }}
          </span>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-cell">
          <span class="stat-n">{{ roomStats.total }}</span>
          <span class="stat-l">总房源</span>
        </div>
        <div class="stat-sep" />
        <div class="stat-cell">
          <span class="stat-n" style="color: #16a34a">{{ roomStats.available }}</span>
          <span class="stat-l">可出租</span>
        </div>
        <div class="stat-sep" />
        <div class="stat-cell">
          <span class="stat-n" style="color: #b45309">{{ roomStats.locked }}</span>
          <span class="stat-l">已锁定</span>
        </div>
        <div class="stat-sep" />
        <div class="stat-cell">
          <span class="stat-n" style="color: var(--el-text-color-secondary)">{{ roomStats.closed }}</span>
          <span class="stat-l">已关闭</span>
        </div>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <div class="fv-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">项目信息</button>
      <button class="tab-btn" :class="{ active: activeTab === 'rooms' }" @click="activeTab = 'rooms'">
        房源列表
        <span class="tab-count">{{ roomStats.total }}</span>
      </button>
    </div>

    <!-- ══════════════════ 项目信息 ══════════════════ -->
    <div v-show="activeTab === 'info'" class="fv-body">
      <div class="section-stack">
        <!-- 基础 + 配套 -->
        <div class="two-col">
          <div class="card">
            <div class="card-head"><span class="card-title">基础信息</span></div>
            <div class="card-body field-grid-2">
              <div class="field">
                <span class="fl">小区名称</span>
                <span class="fv">{{ focusDetail?.community?.name || "-" }}</span>
              </div>
              <div class="field">
                <span class="fl">联系电话</span>
                <span class="fv">{{ focusDetail?.storePhone || "-" }}</span>
              </div>
              <div class="field field-full">
                <span class="fl">项目地址</span>
                <span class="fv">{{ focusDetail?.community?.address || focusDetail?.address || "-" }}</span>
              </div>
              <div class="field">
                <span class="fl">水费类型</span>
                <span class="fv">{{ getWaterLabel(focusDetail?.water) }}</span>
              </div>
              <div class="field">
                <span class="fl">电费类型</span>
                <span class="fv">{{ getElectricityLabel(focusDetail?.electricity) }}</span>
              </div>
              <div class="field">
                <span class="fl">供暖方式</span>
                <span class="fv">{{ getHeatingLabel(focusDetail?.heating) }}</span>
              </div>
              <div class="field">
                <span class="fl">更新时间</span>
                <span class="fv fv-muted">{{ focusDetail?.updateTime || focusDetail?.createTime || "-" }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><span class="card-title">配套 & 设施</span></div>
            <div class="card-body" style="display: flex; flex-direction: column; gap: 14px">
              <div class="cost-row">
                <div class="cost-item">
                  <div class="cost-icon ci-blue">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                      <path d="M8 2c0 0-5 4-5 8a5 5 0 0010 0c0-4-5-8-5-8z" />
                    </svg>
                  </div>
                  <span class="cost-name">水费</span>
                  <span class="cost-val">{{ getWaterLabel(focusDetail?.water) }}</span>
                </div>
                <div class="cost-item">
                  <div class="cost-icon ci-amber">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                      <path d="M8 1l1.5 3.5L13 5l-2.5 2.5.5 3.5L8 9.5l-3 1.5.5-3.5L3 5l3.5-.5z" />
                    </svg>
                  </div>
                  <span class="cost-name">电费</span>
                  <span class="cost-val">{{ getElectricityLabel(focusDetail?.electricity) }}</span>
                </div>
                <div class="cost-item">
                  <div class="cost-icon ci-red">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                      <path d="M8 2c-1 2-4 4-4 7a4 4 0 008 0C12 6 9 4 8 2z" />
                    </svg>
                  </div>
                  <span class="cost-name">供暖</span>
                  <span class="cost-val">{{ getHeatingLabel(focusDetail?.heating) }}</span>
                </div>
                <div class="cost-item">
                  <div class="cost-icon ci-slate">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                      <rect x="3" y="2" width="10" height="12" rx="1" />
                      <path d="M6 6h4M6 9h4" />
                    </svg>
                  </div>
                  <span class="cost-name">电梯</span>
                  <span class="cost-val">{{ focusDetail?.hasElevator ? "有" : "无" }}</span>
                </div>
                <div class="cost-item">
                  <div class="cost-icon ci-green">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                      <circle cx="8" cy="8" r="5" />
                      <path d="M8 5v3l2 1.5" />
                    </svg>
                  </div>
                  <span class="cost-name">燃气</span>
                  <span class="cost-val">{{ focusDetail?.hasGas ? "有" : "无" }}</span>
                </div>
              </div>
              <div v-if="projectTags.length">
                <p class="fl" style="margin-bottom: 6px">项目标签</p>
                <div class="tag-wrap">
                  <span v-for="t in projectTags" :key="t" class="tag tag-outline">{{ t }}</span>
                </div>
              </div>
              <div v-if="projectFacilities.length">
                <p class="fl" style="margin-bottom: 6px">项目设施</p>
                <div class="tag-wrap">
                  <span v-for="f in projectFacilities" :key="f" class="tag tag-filled">{{ f }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 楼栋信息 -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">楼栋信息</span>
            <span class="card-badge">{{ buildingRows.length }} 栋</span>
          </div>
          <div class="table-wrap">
            <el-table :data="buildingRows" size="small" class="inner-table">
              <el-table-column label="楼栋" prop="building" min-width="80" />
              <el-table-column label="单元" prop="unit" min-width="80" />
              <el-table-column label="总楼层" prop="floorTotal" min-width="90" align="center" />
              <el-table-column label="每层房数" prop="houseCountPerFloor" min-width="100" align="center" />
              <el-table-column label="门牌前缀" prop="housePrefix" min-width="100" />
              <el-table-column label="编号长度" prop="numberLength" min-width="90" align="center" />
              <el-table-column label="去4" min-width="70" align="center">
                <template #default="{ row }">
                  <span :class="['flag-tag', row.excludeFour ? 'flag-warn' : 'flag-neutral']">
                    {{ row.excludeFour ? "是" : "否" }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="关闭楼层" min-width="140">
                <template #default="{ row }">
                  <span v-if="row.closedFloors?.length" class="closed-floors">{{ row.closedFloors.join("、") }}</span>
                  <span v-else class="fv-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 户型 + 描述 -->
        <div class="two-col">
          <div class="card">
            <div class="card-head">
              <span class="card-title">户型信息</span>
              <span class="card-badge">{{ layoutRows.length }} 种</span>
            </div>
            <div class="card-body">
              <div class="layout-grid">
                <div v-for="(row, idx) in layoutRows" :key="idx" class="layout-card">
                  <p class="layout-name">{{ row.layoutName }}</p>
                  <div class="layout-rooms">
                    <div class="rm-item">
                      <span class="rm-n">{{ row.bedroom ?? 0 }}</span>
                      <span class="rm-t">卧室</span>
                    </div>
                    <div class="rm-item">
                      <span class="rm-n">{{ row.livingRoom ?? 0 }}</span>
                      <span class="rm-t">客厅</span>
                    </div>
                    <div class="rm-item">
                      <span class="rm-n">{{ row.kitchen ?? 0 }}</span>
                      <span class="rm-t">厨房</span>
                    </div>
                    <div class="rm-item">
                      <span class="rm-n">{{ row.bathroom ?? 0 }}</span>
                      <span class="rm-t">卫生间</span>
                    </div>
                  </div>
                </div>
                <el-empty v-if="!layoutRows.length" description="暂无户型" :image-size="60" />
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><span class="card-title">描述 & 备注</span></div>
            <div class="card-body" style="display: flex; flex-direction: column; gap: 10px">
              <div v-if="focusDetail?.houseDesc" class="desc-block">
                <p class="desc-label">项目介绍</p>
                <p class="desc-text">{{ focusDetail.houseDesc }}</p>
              </div>
              <div v-if="focusDetail?.businessDesc" class="desc-block">
                <p class="desc-label">商圈介绍</p>
                <p class="desc-text">{{ focusDetail.businessDesc }}</p>
              </div>
              <div v-if="focusDetail?.remark" class="desc-block">
                <p class="desc-label">备注</p>
                <p class="desc-text fv-muted">{{ focusDetail.remark }}</p>
              </div>
              <el-empty v-if="!focusDetail?.houseDesc && !focusDetail?.businessDesc && !focusDetail?.remark" description="暂无描述" :image-size="60" />
            </div>
          </div>
        </div>

        <!-- 项目图片 -->
        <div class="card">
          <div class="card-head">
            <span class="card-title">项目图片</span>
            <span class="card-badge">{{ imageList.length }} 张</span>
          </div>
          <div class="card-body">
            <div v-if="imageList.length" class="img-grid">
              <el-image
                v-for="(img, idx) in imageList"
                :key="`${img}-${idx}`"
                :src="img"
                fit="cover"
                :preview-src-list="imageList"
                :initial-index="idx"
                preview-teleported
                class="img-thumb"
              />
            </div>
            <el-empty v-else description="暂无项目图片" :image-size="70" />
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════ 房源列表 ══════════════════ -->
    <div v-show="activeTab === 'rooms'" class="fv-body">
      <!-- 筛选条 -->
      <div class="room-filter-row">
        <button
          v-for="item in [
            { key: 'all', label: '全部', count: roomStats.total },
            { key: 'available', label: '可出租', count: roomStats.available },
            { key: 'locked', label: '已锁定', count: roomStats.locked },
            { key: 'closed', label: '已关闭', count: roomStats.closed }
          ]"
          :key="item.key"
          class="filter-chip"
          :class="{ active: roomFilter === item.key }"
          @click="roomFilter = item.key as any"
        >
          <span v-if="item.key !== 'all'" class="chip-dot" :class="`dot-${item.key}`" />
          {{ item.label }}
          <span class="chip-count">{{ item.count }}</span>
        </button>
      </div>

      <!-- 房源卡片网格 -->
      <div v-if="filteredRooms.length" class="room-grid">
        <div v-for="room in filteredRooms" :key="room.roomId" class="room-card" :class="`room-card--${getOccupancyMeta(room).key}`">
          <!-- 头部：门牌号 + 状态 -->
          <div class="rc-head">
            <span class="rc-door">{{ room.doorNumber || room.roomNumber || "—" }}</span>
            <span class="rc-status" :style="{ color: getOccupancyMeta(room).color }">
              <span class="rc-dot" :style="{ background: getOccupancyMeta(room).dot }" />
              {{ getOccupancyMeta(room).text }}
            </span>
          </div>

          <!-- 户型 + 面积 -->
          <div class="rc-mid">
            <span class="rc-layout">{{ room.houseLayout?.layoutName || "-" }}</span>
            <span class="rc-area">{{ room.area ? `${room.area} ㎡` : "-" }}</span>
          </div>

          <!-- 价格 -->
          <div class="rc-price">
            <span v-if="room.price" class="price-main">¥{{ room.price.toLocaleString() }}</span>
            <span v-else class="price-empty">待定</span>
            <span v-if="room.price" class="price-unit">/月</span>
          </div>

          <div class="rc-divider" />

          <!-- 楼栋 / 楼层 / 朝向 -->
          <div class="rc-info-row">
            <span class="rc-info-item">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" width="12" height="12">
                <rect x="1" y="1" width="12" height="12" rx="1.5" />
                <path d="M4 5h2M4 8h2M8 5h2M8 8h2" />
              </svg>
              {{ room.building || "-" }}{{ room.unit ? ` · ${room.unit}` : "" }}
            </span>
            <span class="rc-info-item">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" width="12" height="12">
                <path d="M2 12V4l5-3 5 3v8" />
                <path d="M5 12V9h4v3" />
              </svg>
              {{ room.floor ? `${room.floor}F` : "-" }}
            </span>
            <span v-if="room.direction" class="rc-info-item">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" width="12" height="12">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 3v2M7 9v2M3 7h2M9 7h2" />
              </svg>
              {{ room.direction }}
            </span>
          </div>

          <!-- 负责人 -->
          <div v-if="room.salesmanName" class="rc-salesman">
            <span class="salesman-avatar">{{ room.salesmanName.charAt(0) }}</span>
            <span class="salesman-name">{{ room.salesmanName }}</span>
            <span v-if="room.salesmanPhone" class="salesman-phone">{{ room.salesmanPhone }}</span>
          </div>

          <!-- 可出租日期 -->
          <div v-if="room.availableDate" class="rc-date">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" width="12" height="12">
              <rect x="1" y="2" width="12" height="11" rx="1.5" />
              <path d="M1 6h12M4 1v2M10 1v2" />
            </svg>
            {{ room.availableDate }}
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无匹配房源" :image-size="80" style="padding: 40px 0" />
    </div>
  </div>
</template>

<style scoped>
  .fv-root {
    min-height: 300px;
    font-size: 13px;
    font-family: var(--el-font-family);
  }

  /* ── Hero ── */
  .fv-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px 14px;
    background: var(--el-color-primary-light-9);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  .hero-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.3;
    margin-bottom: 6px;
  }
  .hero-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 9px;
    border-radius: 20px;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .stat-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 16px;
    gap: 2px;
  }
  .stat-n {
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: var(--el-text-color-primary);
  }
  .stat-l {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
  .stat-sep {
    width: 1px;
    height: 28px;
    background: var(--el-border-color);
  }

  /* ── Tabs ── */
  .fv-tabs {
    display: flex;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: #fff;
  }
  .tab-btn {
    font-size: 13px;
    font-weight: 400;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
  }
  .tab-btn.active {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
    font-weight: 600;
  }
  .tab-btn:hover:not(.active) {
    color: var(--el-text-color-primary);
  }
  .tab-count {
    font-size: 11px;
    background: var(--el-fill-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 0 6px;
    font-weight: 400;
  }

  /* ── Body ── */
  .fv-body {
    padding: 16px 20px 20px;
  }
  .section-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ── Card ── */
  .card {
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .card-badge {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 1px 8px;
  }
  .card-body {
    padding: 14px 16px;
  }
  .two-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }

  /* 字段 */
  .field-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px 20px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .field-full {
    grid-column: 1 / -1;
  }
  .fl {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
  .fv {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
  .fv-muted {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  /* 费用 */
  .cost-row {
    display: flex;
    gap: 8px;
  }
  .cost-item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 6px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }
  .cost-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ci-blue {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .ci-amber {
    background: #fef3c7;
    color: #92400e;
  }
  .ci-red {
    background: #fee2e2;
    color: #991b1b;
  }
  .ci-slate {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }
  .ci-green {
    background: #dcfce7;
    color: #15803d;
  }
  .cost-name {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
  .cost-val {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* 标签 */
  .tag-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .tag-outline {
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-secondary);
  }
  .tag-filled {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-7);
  }

  /* 表格 */
  .table-wrap {
    overflow-x: auto;
  }
  .inner-table :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter) !important;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    padding: 8px 10px;
  }
  .inner-table :deep(td.el-table__cell) {
    font-size: 12px;
    padding: 8px 10px;
  }
  .flag-tag {
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 4px;
  }
  .flag-warn {
    background: #fef9c3;
    color: #92400e;
  }
  .flag-neutral {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }
  .closed-floors {
    font-size: 12px;
    color: #dc2626;
  }

  /* 户型 */
  .layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 10px;
  }
  .layout-card {
    padding: 12px 14px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }
  .layout-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }
  .layout-rooms {
    display: flex;
    gap: 14px;
  }
  .rm-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .rm-n {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-color-primary);
    line-height: 1;
  }
  .rm-t {
    font-size: 10px;
    color: var(--el-text-color-secondary);
  }

  /* 描述 */
  .desc-block {
    padding: 10px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 0 6px 6px 0;
    border-left: 3px solid var(--el-color-primary-light-5);
  }
  .desc-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
    font-weight: 600;
  }
  .desc-text {
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.7;
  }

  /* 图片 */
  .img-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }
  .img-thumb {
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 7px;
    overflow: hidden;
    cursor: zoom-in;
    transition: opacity 0.2s;
  }
  .img-thumb:hover {
    opacity: 0.85;
  }

  /* ══ 房源列表 ══ */
  .room-filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 5px 14px;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid var(--el-border-color);
    background: #fff;
    color: var(--el-text-color-secondary);
    transition: all 0.15s;
    font-family: inherit;
  }
  .filter-chip:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-text-color-primary);
  }
  .filter-chip.active {
    background: var(--el-text-color-primary);
    color: #fff;
    border-color: var(--el-text-color-primary);
  }
  .chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-available {
    background: #16a34a;
  }
  .dot-locked {
    background: #f59e0b;
  }
  .dot-closed {
    background: #9ca3af;
  }
  .chip-count {
    font-size: 11px;
    min-width: 18px;
    text-align: center;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    padding: 0 5px;
  }
  .filter-chip.active .chip-count {
    background: rgba(255, 255, 255, 0.2);
  }

  /* 房源网格 */
  .room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .room-card {
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    position: relative;
    overflow: hidden;
  }
  .room-card:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  /* 状态色条 */
  .room-card--available::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #16a34a;
  }
  .room-card--locked::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #f59e0b;
  }
  .room-card--closed::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #d1d5db;
  }

  .rc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .rc-door {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
  .rc-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
  }
  .rc-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .rc-mid {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .rc-layout {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .rc-area {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .rc-price {
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .price-main {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
  .price-unit {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .price-empty {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
  }

  .rc-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 2px 0;
  }

  .rc-info-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .rc-info-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .rc-salesman {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
  }
  .salesman-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .salesman-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  .salesman-phone {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-left: auto;
  }

  .rc-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
</style>
