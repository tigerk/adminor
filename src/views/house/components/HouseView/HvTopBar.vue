<script setup lang="ts">
  import { Plus } from "@element-plus/icons-vue";
  import { HouseDetailVo, RoomDetailVo } from "@/types";
  import { getRoomStatus } from "@/utils/house";
  import { formatDate } from "@/utils/date";
  import { getOptionNameByCode, RENTAL_TYPE_OPTIONS } from "@/constants";

  const props = defineProps<{
    detail: HouseDetailVo;
    roomTabs: RoomDetailVo[];
    activeRoomIndex: number;
    isShareRental: boolean;
    roomStats: { total: number; leased: number; available: number; booked: number };
    occupancyRate: number;
  }>();

  const emit = defineEmits<{
    "update:activeRoomIndex": [idx: number];
    editHouse: [detail: HouseDetailVo];
  }>();
</script>

<template>
  <div class="hv-topbar">
    <!-- 左侧：房源概要 -->
    <div class="hv-topbar__summary">
      <div class="hv-topbar__summary-type">{{ getOptionNameByCode(RENTAL_TYPE_OPTIONS, detail.rentalType) }}</div>
      <div class="hv-topbar__summary-stat">已租 {{ roomStats.leased }} 间 / 共 {{ roomStats.total }} 间</div>
    </div>

    <!-- 房间卡片列表 -->
    <div class="hv-topbar__rooms">
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
            <span class="hv-troom__info-line hv-troom__info-line--tenant">♂ {{ room.lease.tenantName }}</span>
            <span class="hv-troom__info-line">✭ 押 {{ room.lease.depositMonths ?? 1 }} 付 {{ room.lease.paymentMonths }}</span>
          </template>
          <template v-else-if="room.booking?.tenantName">
            <span class="hv-troom__info-line hv-troom__info-line--booking">{{ room.booking.tenantName }}</span>
            <span class="hv-troom__info-line hv-troom__info-line--date">{{ formatDate(room.booking.expiryTime) }}到期</span>
          </template>
          <template v-else>
            <span class="hv-troom__info-line hv-troom__info-line--empty">待登记租客</span>
          </template>
        </div>
      </button>

      <button v-if="isShareRental" class="hv-troom hv-troom--add" @click="() => emit('editHouse', detail)">
        <el-icon :size="14"><Plus /></el-icon>
        <span>添加房间</span>
      </button>
    </div>

    <!-- 右侧：出租率 -->
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
</template>

<style scoped lang="scss">
  .hv-topbar {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 8px 14px 0;
    background: var(--card);
    border-bottom: 1px solid var(--bl);
    flex-shrink: 0;
    overflow-x: auto;
    &::-webkit-scrollbar {
      height: 0;
    }
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
    margin-right: 10px;

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

  .hv-topbar__rooms {
    display: flex;
    align-items: stretch;
    gap: 6px;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    padding: 0 10px 0 0;
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
</style>
