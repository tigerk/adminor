<script setup lang="ts">
  import { computed } from "vue";
  import { Plus } from "@element-plus/icons-vue";
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
  }>();

  const showRoomSwitcher = computed(() => props.roomTabs.length > 1);
  const showRoomCards = computed(() => props.roomTabs.length > 1 && props.roomTabs.length <= 8);

  function roomKey(room: RoomDetailVo, idx: number) {
    return String(room.id ?? room.roomNumber ?? idx);
  }

  const roomOptions = computed(() =>
    props.roomTabs.map((room, idx) => {
      const status = getRoomStatus(room);
      const roomNumber = room.roomNumber || `房间${idx + 1}`;
      const ownerText = room.lease?.tenantName || room.booking?.tenantName || "待登记租客";
      return {
        key: roomKey(room, idx),
        index: idx,
        statusCls: status.cls,
        statusText: status.text,
        label: `${roomNumber} · ${status.text}`,
        sub: ownerText
      };
    })
  );

  const activeRoomKey = computed({
    get() {
      const room = props.roomTabs[props.activeRoomIndex];
      if (!room) return "";
      return roomKey(room, props.activeRoomIndex);
    },
    set(key: string) {
      const idx = roomOptions.value.findIndex(item => item.key === key);
      if (idx >= 0) {
        emit("update:activeRoomIndex", idx);
      }
    }
  });

  function stepRoom(direction: -1 | 1) {
    const total = props.roomTabs.length;
    if (total <= 1) return;
    const next = (props.activeRoomIndex + direction + total) % total;
    emit("update:activeRoomIndex", next);
  }
</script>

<template>
  <div class="hv-topbar" :class="{ 'is-page': mode === 'page' }">
    <div class="hv-topbar__primary">
      <div class="hv-topbar__summary">
        <div class="hv-topbar__summary-type">{{ getOptionNameByCode(RENTAL_TYPE_OPTIONS, detail.rentalType) }}</div>
        <div class="hv-topbar__summary-stat">已租 {{ roomStats.leased }} 间 / 共 {{ roomStats.total }} 间</div>
      </div>

      <div v-if="showRoomSwitcher" class="hv-room-switcher">
        <div class="hv-room-switcher__label">房间切换</div>
        <div class="hv-room-switcher__main">
          <el-button plain size="small" @click="stepRoom(-1)">上一间</el-button>
          <el-select v-model="activeRoomKey" filterable class="hv-room-switcher__select" placeholder="选择房间">
            <el-option v-for="item in roomOptions" :key="item.key" :label="item.label" :value="item.key">
              <div class="hv-room-option">
                <span class="hv-room-option__status" :class="`is-${item.statusCls}`">{{ item.statusText }}</span>
                <span class="hv-room-option__label">{{ item.label }}</span>
                <span class="hv-room-option__sub">{{ item.sub }}</span>
              </div>
            </el-option>
          </el-select>
          <el-button plain size="small" @click="stepRoom(1)">下一间</el-button>
        </div>
      </div>

      <button v-if="isShareRental" class="hv-troom hv-troom--add" @click="() => emit('editHouse', detail)">
        <el-icon :size="14"><Plus /></el-icon>
        <span>添加房间</span>
      </button>
    </div>

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

  <div v-if="showRoomCards" class="hv-topbar__rooms">
    <button
      v-for="(room, idx) in roomTabs"
      :key="room.id || idx"
      class="hv-troom"
      :class="[`hv-troom--${getRoomStatus(room).cls}`, { 'is-active': activeRoomIndex === idx }]"
      @click="() => emit('update:activeRoomIndex', idx)"
    >
      <div class="hv-troom__left">
        <span class="hv-troom__num">{{ room.roomNumber || String.fromCharCode(65 + idx) }}</span>
        <span class="hv-troom__status" :class="`hv-troom__status--${getRoomStatus(room).cls}`">
          {{ getRoomStatus(room).text }}
        </span>
      </div>
      <div class="hv-troom__divider" />
      <div class="hv-troom__right">
        <template v-if="room.lease?.tenantName">
          <span class="hv-troom__info-line hv-troom__info-line--tenant">{{ room.lease.tenantName }}</span>
          <span class="hv-troom__info-line">押 {{ room.lease.depositMonths ?? 1 }} 付 {{ room.lease.paymentMonths }}</span>
        </template>
        <template v-else-if="room.booking?.tenantName">
          <span class="hv-troom__info-line hv-troom__info-line--booking">{{ room.booking.tenantName }}</span>
          <span class="hv-troom__info-line hv-troom__info-line--date">{{ room.booking.tenantPhone || "-" }}</span>
        </template>
        <template v-else>
          <span class="hv-troom__info-line hv-troom__info-line--empty">待登记租客</span>
        </template>
      </div>
    </button>
  </div>
</template>

<style scoped lang="scss">
  .hv-topbar {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 12px;
    padding: 0 0 10px;
    background: var(--card);
    flex-shrink: 0;

    &.is-page {
      padding-bottom: 8px;
    }
  }

  .hv-topbar__primary {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: stretch;
    min-width: 0;
  }

  .hv-topbar__summary {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
    flex-shrink: 0;
    background: var(--sub);
    border: 1px solid var(--bl);
    border-radius: 8px;
    padding: 6px 14px;

    &-type {
      font-size: 13px;
      font-weight: 700;
      color: var(--t1);
      white-space: nowrap;
    }
    &-stat {
      font-size: 11px;
      color: var(--t3);
      white-space: nowrap;
    }
  }

  .hv-room-switcher {
    display: flex;
    flex: 1;
    gap: 6px;
    min-width: 0;
    padding: 6px 10px;
    border: 1px solid var(--bl);
    border-radius: 8px;
    background: var(--sub);

    &__label {
      flex-shrink: 0;
      font-size: 12px;
      font-weight: 600;
      line-height: 30px;
      color: var(--t2);
    }

    &__main {
      display: flex;
      flex: 1;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    &__select {
      flex: 1;
      min-width: 0;
    }
  }

  .hv-room-option {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;

    &__status {
      display: inline-flex;
      align-items: center;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      font-size: 11px;
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

    &__label {
      overflow: hidden;
      font-size: 12px;
      color: var(--t1);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__sub {
      margin-left: auto;
      overflow: hidden;
      max-width: 140px;
      font-size: 11px;
      color: var(--t3);
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  .hv-topbar__rooms {
    display: flex;
    align-items: stretch;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 0 4px;
    border-bottom: 1px solid var(--bl);
    margin-bottom: 6px;
  }

  .hv-troom {
    display: flex;
    align-items: stretch;
    border-radius: 8px;
    border: 1px solid var(--bl);
    background: var(--sub);
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 160px;
    min-width: 160px;
    overflow: hidden;
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

    &--add {
      border-style: dashed;
      border-color: var(--bl);
      color: var(--t3);
      font-size: 12px;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 80px;
      min-width: 80px;
      &:hover {
        color: var(--primary);
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }

    &__left {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 10px;
      min-width: 48px;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    &__num {
      font-size: 16px;
      font-weight: 800;
      line-height: 1;
      color: var(--t1);
    }
    &__status {
      font-size: 10px;
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
    &__divider {
      width: 1px;
      background: var(--bl);
      flex-shrink: 0;
      align-self: stretch;
    }
    &__right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      gap: 3px;
      padding: 7px 10px;
      min-width: 0;
    }
    &__info-line {
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      &--tenant {
        color: var(--t2);
        font-weight: 500;
      }
      &--booking {
        color: var(--warning);
        font-weight: 500;
      }
      &--empty {
        color: var(--t3);
      }
      &--date {
        color: var(--t3);
        font-size: 10px;
      }
    }
  }

  .hv-topbar__occ {
    flex-shrink: 0;
    padding-left: 14px;
    border-left: 1px solid var(--bl);
    min-width: 120px;
  }

  .hv-occ {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    &__label {
      font-size: 12px;
      font-weight: 700;
      color: var(--t2);
    }
    &__pct {
      font-size: 22px;
      font-weight: 800;
      color: var(--success);
      font-variant-numeric: tabular-nums;
    }
    &__track {
      height: 6px;
      border-radius: 6px;
      background: var(--danger-bg);
      overflow: hidden;
      display: flex;
    }
    &__fill {
      height: 100%;
      transition: width 0.4s ease;
      &--leased {
        background: var(--success);
      }
      &--booked {
        background: var(--warning);
      }
    }
    &__legend {
      display: flex;
      gap: 12px;
      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--t3);
      }
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

  @media (width <= 1280px) {
    .hv-topbar {
      flex-direction: column;
      align-items: stretch;
    }

    .hv-topbar__occ {
      padding-top: 8px;
      padding-left: 0;
      border-top: 1px solid var(--bl);
      border-left: 0;
    }
  }

  @media (width <= 900px) {
    .hv-topbar__primary {
      flex-direction: column;
    }

    .hv-room-switcher__main {
      flex-wrap: wrap;
    }
  }
</style>
