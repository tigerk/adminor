<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
  import { ArrowLeft, MoreFilled, Plus, RefreshRight } from "@element-plus/icons-vue";
  import type { HouseDetailVo, RoomDetailVo } from "@/types";
  import { getRoomStatus } from "@/utils/house";
  import { getOptionNameByCode, RENTAL_TYPE_OPTIONS } from "@/constants";

  const props = defineProps<{
    detail: HouseDetailVo;
    roomTabs: RoomDetailVo[];
    activeRoomIndex: number;
    isShareRental: boolean;
    roomStats: { total: number; leased: number; available: number; booked: number };
    occupancyRate: number;
    mode?: "dialog" | "page";
  }>();

  const emit = defineEmits<{
    "update:activeRoomIndex": [idx: number];
    editHouse: [detail: HouseDetailVo];
    back: [];
    reload: [];
  }>();

  const roomRailRef = ref<HTMLElement>();
  const visibleRoomCount = ref(0);
  let roomRailObserver: ResizeObserver | null = null;

  const showRoomCards = computed(() => props.roomTabs.length > 0);
  const showPageActions = computed(() => props.mode === "page");

  function roomKey(room: RoomDetailVo, idx: number) {
    return String(room.id ?? room.roomNumber ?? idx);
  }

  const roomOptions = computed(() =>
    props.roomTabs.map((room, idx) => {
      const status = getRoomStatus(room);
      const roomNumber = room.roomNumber || String.fromCharCode(65 + idx);
      return {
        key: roomKey(room, idx),
        index: idx,
        roomNumber,
        statusCls: status.cls,
        statusText: status.text,
        tenantName: room.lease?.tenantName || room.booking?.tenantName || "待登记租客",
        tenantSub: room.lease?.tenantName
          ? `押 ${room.lease.depositMonths ?? 1} 付 ${room.lease.paymentMonths}`
          : room.booking?.tenantPhone || ""
      };
    })
  );

  const visibleRooms = computed(() => {
    if (visibleRoomCount.value <= 0) return roomOptions.value;
    return roomOptions.value.slice(0, visibleRoomCount.value);
  });

  const overflowRooms = computed(() => {
    if (visibleRoomCount.value <= 0) return [];
    return roomOptions.value.slice(visibleRoomCount.value);
  });

  function recalcVisibleRoomCount() {
    const list = roomOptions.value;
    if (!roomRailRef.value || list.length === 0) {
      visibleRoomCount.value = list.length;
      return;
    }

    const railWidth = roomRailRef.value.clientWidth;
    const cardWidth = roomRailRef.value.querySelector<HTMLElement>(".hv-troom")?.offsetWidth || 168;
    const cardGap = 8;
    const moreWidth = 42;
    const allNeedWidth = list.length * cardWidth + (list.length - 1) * cardGap;

    if (allNeedWidth <= railWidth) {
      visibleRoomCount.value = list.length;
      return;
    }

    const availableWidth = Math.max(0, railWidth - moreWidth - cardGap);
    const fitCount = Math.floor((availableWidth + cardGap) / (cardWidth + cardGap));
    visibleRoomCount.value = Math.max(1, Math.min(list.length - 1, fitCount));
  }

  function pickRoom(idx: number) {
    if (idx === props.activeRoomIndex) return;
    emit("update:activeRoomIndex", idx);
  }

  watch(
    () => roomOptions.value.length,
    async () => {
      await nextTick();
      recalcVisibleRoomCount();
    },
    { immediate: true }
  );

  watch(
    () => props.mode,
    async () => {
      await nextTick();
      recalcVisibleRoomCount();
    }
  );

  onMounted(() => {
    nextTick(() => {
      recalcVisibleRoomCount();
      if (roomRailRef.value) {
        roomRailObserver = new ResizeObserver(() => recalcVisibleRoomCount());
        roomRailObserver.observe(roomRailRef.value);
      }
    });
  });

  onBeforeUnmount(() => {
    roomRailObserver?.disconnect();
    roomRailObserver = null;
  });
</script>

<template>
  <div class="hv-topbar" :class="{ 'is-page': mode === 'page' }">
    <div class="hv-topbar__primary">
      <div v-if="showPageActions" class="hv-page-actions">
        <el-button class="hv-page-action-btn" @click="emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </div>

      <div class="hv-topbar__summary">
        <div class="hv-topbar__summary-type">{{ getOptionNameByCode(RENTAL_TYPE_OPTIONS, detail.rentalType) }}</div>
        <div class="hv-topbar__summary-stat">已租 {{ roomStats.leased }} 间 / 共 {{ roomStats.total }} 间</div>
      </div>

      <div v-if="showRoomCards" class="hv-room-rail">
        <div ref="roomRailRef" class="hv-room-rail__list">
          <button
            v-for="item in visibleRooms"
            :key="item.key"
            class="hv-troom"
            :class="[`hv-troom--${item.statusCls}`, { 'is-active': activeRoomIndex === item.index }]"
            @click="pickRoom(item.index)"
          >
            <div class="hv-troom__left">
              <span class="hv-troom__num">{{ item.roomNumber }}</span>
              <span class="hv-troom__status" :class="`hv-troom__status--${item.statusCls}`">{{ item.statusText }}</span>
            </div>
            <div class="hv-troom__divider" />
            <div class="hv-troom__right">
              <span class="hv-troom__info-line hv-troom__info-line--tenant">{{ item.tenantName }}</span>
              <span v-if="item.tenantSub" class="hv-troom__info-line">{{ item.tenantSub }}</span>
            </div>
          </button>

          <el-dropdown v-if="overflowRooms.length > 0" trigger="click" placement="bottom-end" class="hv-room-rail__more">
            <el-button class="hv-room-rail__more-btn" plain>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="hv-room-rail__dropdown">
                <el-dropdown-item v-for="item in overflowRooms" :key="item.key" @click="pickRoom(item.index)">
                  <div class="hv-room-rail-option">
                    <span class="hv-room-rail-option__room">{{ item.roomNumber }}</span>
                    <span class="hv-room-rail-option__status" :class="`is-${item.statusCls}`">{{ item.statusText }}</span>
                    <span class="hv-room-rail-option__tenant">{{ item.tenantName }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div class="hv-topbar__side">
      <button v-if="isShareRental" class="hv-add-room" @click="() => emit('editHouse', detail)">
        <el-icon :size="14"><Plus /></el-icon>
        <span>添加房间</span>
      </button>

      <div class="hv-topbar__occ">
        <div class="hv-occ">
          <div class="hv-occ__head">
            <span class="hv-occ__label">出租率</span>
            <span class="hv-occ__pct">{{ occupancyRate }}%</span>
          </div>
          <div class="hv-occ__track">
            <div class="hv-occ__fill hv-occ__fill--leased" :style="{ width: roomStats.total ? (roomStats.leased / roomStats.total) * 100 + '%' : '0' }" />
            <div class="hv-occ__fill hv-occ__fill--booked" :style="{ width: roomStats.total ? (roomStats.booked / roomStats.total) * 100 + '%' : '0' }" />
          </div>
          <div class="hv-occ__legend">
            <span>
              <i class="hv-dot hv-dot--leased" />
              已租 {{ roomStats.leased }}
            </span>
            <span>
              <i class="hv-dot hv-dot--booked" />
              预定 {{ roomStats.booked }}
            </span>
            <span>
              <i class="hv-dot hv-dot--available" />
              空置 {{ roomStats.available }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .hv-topbar {
    --rm-topbar-action-height: 60px;

    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    background: var(--card);
    flex-shrink: 0;

    &.is-page {
      padding-bottom: 0;
    }
  }

  .hv-topbar__primary {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: stretch;
    min-width: 0;
  }

  .hv-page-actions {
    display: inline-flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: stretch;
    align-self: stretch;
  }

  .hv-page-action-btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    min-width: 86px;
    height: 100%;
    min-height: var(--rm-topbar-action-height);
    align-self: stretch;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid var(--bl);
    border-radius: 8px;
    background: var(--card);
    color: var(--t2);
    font-weight: 500;
    transition: all 0.18s ease;
    box-shadow: none;

    &:hover {
      color: var(--primary);
      border-color: var(--primary);
      background: var(--primary-light);
    }

    :deep(.el-icon) {
      font-size: 14px;
    }
  }

  .hv-topbar__summary {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
    flex-shrink: 0;
    width: 150px;
    padding: 8px 14px;
    border: 1px solid var(--bl);
    border-radius: 8px;
    background: var(--sub);

    &-type {
      font-size: 14px;
      font-weight: 700;
      color: var(--t1);
      white-space: nowrap;
    }

    &-stat {
      font-size: 13px;
      color: var(--t3);
      white-space: nowrap;
    }
  }

  .hv-room-rail {
    display: flex;
    flex: 1;
    gap: 10px;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .hv-room-rail__label {
    width: 56px;
    flex-shrink: 0;
    align-self: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--t2);
  }

  .hv-room-rail__list {
    display: flex;
    align-items: stretch;
    gap: 8px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    padding-right: 1px;
  }

  .hv-room-rail__more {
    margin-left: auto;
    flex-shrink: 0;
  }

  .hv-room-rail__more-btn {
    width: 38px;
    height: 100%;
    min-height: 60px;
    padding: 0;
    border: 1px dashed var(--bl);
    border-radius: 8px;
  }

  :deep(.hv-room-rail__dropdown .el-dropdown-menu__item) {
    min-width: 240px;
    padding: 7px 10px;
  }

  .hv-room-rail-option {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  .hv-room-rail-option__room {
    font-size: 13px;
    font-weight: 700;
    color: var(--t1);
    flex-shrink: 0;
  }

  .hv-room-rail-option__status {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;

    &.is-leased {
      color: var(--success);
      background: var(--success-bg);
    }

    &.is-available {
      color: var(--danger);
      background: var(--danger-bg);
    }

    &.is-booked {
      color: var(--warning);
      background: var(--warning-bg);
    }

    &.is-locked {
      color: var(--info);
      background: var(--info-bg);
    }
  }

  .hv-room-rail-option__tenant {
    overflow: hidden;
    font-size: 13px;
    color: var(--t3);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hv-troom {
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    width: 168px;
    min-width: 168px;
    overflow: hidden;
    text-align: left;
    border: 1px solid var(--bl);
    border-radius: 8px;
    background: var(--card);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &.is-active {
      border-color: var(--primary);
      background: var(--card);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);

      .hv-troom__left {
        background: var(--primary);
        color: #fff;
      }
      .hv-troom__status--leased {
        color: #a5f3c0;
      }
      .hv-troom__status--available {
        color: #fca5a5;
      }
      .hv-troom__status--booked {
        color: #fcd34d;
      }
      .hv-troom__status--locked {
        color: #cbd5e1;
      }
    }
  }

  .hv-troom__left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 48px;
    padding: 8px 10px;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .hv-troom__num {
    font-size: 17px;
    font-weight: 800;
    line-height: 1;
    color: var(--t1);
  }

  .hv-troom__status {
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;

    &--leased {
      color: var(--success);
    }

    &--available {
      color: var(--danger);
    }

    &--booked {
      color: var(--warning);
    }

    &--locked {
      color: var(--info);
    }
  }

  .hv-troom__divider {
    width: 1px;
    align-self: stretch;
    background: var(--bl);
    flex-shrink: 0;
  }

  .hv-troom__right {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    min-width: 0;
    padding: 7px 10px;
    text-align: center;
  }

  .hv-troom__info-line {
    display: block;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--tenant {
      color: var(--t2);
      font-weight: 500;
    }
  }

  .hv-topbar__side {
    display: flex;
    align-items: stretch;
    align-self: stretch;
    gap: 12px;
    min-width: 0;
    flex-shrink: 0;
  }

  .hv-add-room {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 108px;
    height: 100%;
    min-height: var(--rm-topbar-action-height);
    align-self: stretch;
    box-sizing: border-box;
    padding: 0 14px;
    border: 1px dashed var(--bl);
    border-radius: 8px;
    background: var(--sub);
    color: var(--t2);
    font-family: inherit;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      color: var(--primary);
      border-color: var(--primary);
      background: var(--primary-light);
    }
  }

  .hv-topbar__occ {
    min-width: 140px;
    padding-left: 12px;
    border-left: 1px solid var(--bl);
  }

  .hv-occ {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hv-occ__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .hv-occ__label {
    font-size: 13px;
    font-weight: 700;
    color: var(--t2);
  }

  .hv-occ__pct {
    font-size: 22px;
    font-weight: 800;
    color: var(--success);
    font-variant-numeric: tabular-nums;
  }

  .hv-occ__track {
    display: flex;
    overflow: hidden;
    height: 6px;
    border-radius: 6px;
    background: var(--danger-bg);
  }

  .hv-occ__fill {
    height: 100%;
    transition: width 0.4s ease;

    &--leased {
      background: var(--success);
    }

    &--booked {
      background: var(--warning);
    }
  }

  .hv-occ__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--t3);
      white-space: nowrap;
    }
  }

  .hv-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    font-style: normal;

    &--leased {
      background: var(--success);
    }

    &--booked {
      background: var(--warning);
    }

    &--available {
      background: var(--danger);
      opacity: 0.5;
    }
  }

  @media (width <= 1360px) {
    .hv-topbar {
      flex-direction: column;
      gap: 8px;
    }

    .hv-topbar__side {
      justify-content: flex-end;
    }

    .hv-topbar__occ {
      min-width: 180px;
    }
  }

  @media (width <= 960px) {
    .hv-topbar__primary {
      flex-direction: column;
    }

    .hv-room-rail__label {
      width: auto;
      line-height: 1.2;
      align-self: flex-start;
    }

    .hv-room-rail {
      flex-direction: column;
      gap: 8px;
    }

    .hv-topbar__side {
      flex-direction: column;
      align-items: stretch;
    }

    .hv-topbar__occ {
      padding-top: 10px;
      padding-left: 0;
      border-top: 1px solid var(--bl);
      border-left: 0;
    }
  }
</style>
