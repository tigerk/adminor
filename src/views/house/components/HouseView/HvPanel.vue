<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import { ArrowRight, Calendar, Edit, User } from "@element-plus/icons-vue";
  import { LeaseLiteVo, RoomDetailVo } from "@/types";
  import { ROOM_STATUS_ENUM } from "@/constants";
  import { calcLeaseDuration } from "@/utils/house";
  import { formatDate } from "@/utils/date";
  import { message } from "@/utils/message";

  const props = defineProps<{
    currentRoom: RoomDetailVo | null;
  }>();

  const isLeased = computed(() => props.currentRoom?.roomStatus === ROOM_STATUS_ENUM.LEASED.code);
  const isAvailable = computed(() => props.currentRoom?.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code);
  const isBooked = computed(() => props.currentRoom?.roomStatus === ROOM_STATUS_ENUM.BOOKED.code);

  const tenantInfo = computed(() => {
    const li = props.currentRoom?.lease;
    if (!li?.tenantName) return null;
    return {
      tenantId: li.tenantId || "",
      leaseId: li.leaseId || "",
      name: li.tenantName,
      phone: li.tenantPhone || "-",
      rentPrice: li.rentPrice ?? props.currentRoom?.price ?? "-",
      leaseStart: formatDate(li.leaseStart),
      leaseEnd: formatDate(li.leaseEnd),
      duration: calcLeaseDuration(li.leaseStart, li.leaseEnd)
    };
  });

  const bookingInfo = computed(() => props.currentRoom?.booking ?? null);

  const emit = defineEmits<{
    tenant: [room: RoomDetailVo];
    checkout: [room: RoomDetailVo];
    renewLease: [lease: LeaseLiteVo];
    viewContract: [room: RoomDetailVo];
    openTenantDetail: [leaseId: string];
    openBookingDetail: [bookingId: string];
    booking: [room: RoomDetailVo];
  }>();

  // ── 房间备注 ────────────────────────────────────────────
  const remarkEditing = ref(false);
  const remarkText = ref("");
  const remarkLoading = ref(false);

  watch(
    () => props.currentRoom,
    r => {
      remarkText.value = r?.remark ?? "";
      remarkEditing.value = false;
    },
    { immediate: true }
  );

  const handleSaveRemark = async () => {
    remarkLoading.value = true;
    try {
      await new Promise(r => setTimeout(r, 600));
      message("备注保存成功", { type: "success" });
      remarkEditing.value = false;
    } catch {
      message("备注保存失败", { type: "error" });
    } finally {
      remarkLoading.value = false;
    }
  };

  const handleCheckout = () => {
    if (!props.currentRoom?.lease) return message("当前房间没有在租租客", { type: "warning" });
    emit("checkout", props.currentRoom!);
  };
  const handleRenew = () => {
    if (!props.currentRoom?.lease) return message("当前房间没有在租租客", { type: "warning" });
    emit("renewLease", props.currentRoom!.lease as LeaseLiteVo);
  };
</script>

<template>
  <aside class="hv-panel">
    <!-- 租客信息 -->
    <div class="hv-pcard">
      <div class="hv-pcard__hd">
        <div class="hv-pcard__ico hv-pcard__ico--tenant">
          <el-icon :size="13"><User /></el-icon>
        </div>
        <span class="hv-pcard__title">租客信息</span>
        <div v-if="isLeased" style="margin-left: auto; display: flex; gap: 4px; align-items: center">
          <el-button size="small" type="warning" plain @click="handleRenew">续约</el-button>
          <el-button size="small" type="danger" plain @click="handleCheckout">退租</el-button>
        </div>
      </div>
      <div class="hv-pcard__body">
        <template v-if="tenantInfo">
          <div class="hv-tenant" @click="() => emit('openTenantDetail', tenantInfo.leaseId)">
            <div class="hv-tenant__avatar">{{ tenantInfo.name.slice(0, 1) }}</div>
            <div class="hv-tenant__info">
              <div class="hv-tenant__name-row">
                <span class="hv-tenant__name">{{ tenantInfo.name }}</span>
                <span v-if="tenantInfo.duration" class="hv-tenant__dur">{{ tenantInfo.duration }}</span>
              </div>
              <div class="hv-tenant__phone">{{ tenantInfo.phone }}</div>
              <div class="hv-tenant__rent">
                月租
                <strong>{{ tenantInfo.rentPrice }}</strong>
                元
              </div>
              <div class="hv-tenant__dates">
                <el-icon :size="10"><Calendar /></el-icon>
                {{ tenantInfo.leaseStart }} — {{ tenantInfo.leaseEnd }}
              </div>
            </div>
            <el-icon class="hv-tenant__arrow"><ArrowRight /></el-icon>
          </div>
        </template>
        <div v-else class="hv-panel-empty">
          <span class="hv-panel-empty__ico">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" />
              <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </span>
          <span>暂无租客</span>
          <el-button v-if="isAvailable" size="small" type="primary" plain @click="() => emit('tenant', currentRoom!)">立即录入</el-button>
        </div>
      </div>
    </div>

    <!-- 预定信息 -->
    <div class="hv-pcard">
      <div class="hv-pcard__hd">
        <div class="hv-pcard__ico hv-pcard__ico--booking">
          <el-icon :size="13"><Calendar /></el-icon>
        </div>
        <span class="hv-pcard__title">预定信息</span>
        <div v-if="isBooked" style="margin-left: auto">
          <el-button size="small" type="primary" @click="() => emit('tenant', currentRoom!)">
            <el-icon><ArrowRight /></el-icon>
            转为租客
          </el-button>
        </div>
      </div>
      <div class="hv-pcard__body">
        <template v-if="bookingInfo">
          <div class="hv-booking" @click="() => emit('openBookingDetail', bookingInfo.id || '')">
            <div class="hv-booking__name">{{ bookingInfo.tenantName || "-" }}</div>
            <div class="hv-booking__rows">
              <div class="hv-booking__row">
                <span class="hv-booking__lbl">预定时间</span>
                <span>{{ formatDate(bookingInfo.bookingTime) }}</span>
              </div>
              <div class="hv-booking__row">
                <span class="hv-booking__lbl">到期时间</span>
                <span class="c-warning">{{ formatDate(bookingInfo.expiryTime) }}</span>
              </div>
            </div>
            <div class="hv-booking__link">
              <el-icon :size="11"><ArrowRight /></el-icon>
              查看详情
            </div>
          </div>
        </template>
        <div v-else class="hv-panel-empty">
          <span class="hv-panel-empty__ico">📅</span>
          <span>暂无预定</span>
          <el-button v-if="isAvailable" size="small" plain @click="() => emit('booking', currentRoom!)">添加预定</el-button>
        </div>
      </div>
    </div>

    <!-- 房间备注 -->
    <div class="hv-pcard hv-pcard--remark">
      <div class="hv-pcard__hd">
        <div class="hv-pcard__ico hv-pcard__ico--track">
          <el-icon :size="13"><Edit /></el-icon>
        </div>
        <span class="hv-pcard__title">房间备注</span>
        <div style="margin-left: auto">
          <template v-if="remarkEditing">
            <el-button
              size="small"
              link
              @click="
                remarkEditing = false;
                remarkText = currentRoom?.remark || '';
              "
            >
              取消
            </el-button>
            <el-button size="small" link type="primary" :loading="remarkLoading" @click="handleSaveRemark">保存</el-button>
          </template>
          <el-button v-else size="small" link type="primary" @click="remarkEditing = true">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </div>
      <div class="hv-pcard__body hv-pcard__body--remark">
        <el-input v-if="remarkEditing" v-model="remarkText" type="textarea" :rows="5" placeholder="输入房间备注…" resize="none" size="small" />
        <p v-else-if="remarkText" style="margin: 0; padding: 0 14px 14px; font-size: 13px; color: var(--t2); line-height: 1.7">{{ remarkText }}</p>
        <div v-else class="hv-panel-empty" style="padding: 14px">
          <span style="font-size: 18px">✏️</span>
          <span>暂无备注</span>
          <el-button size="small" link type="primary" @click="remarkEditing = true">点击添加</el-button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
  .hv-panel {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--bl);
    background: var(--bg);
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--bl);
      border-radius: 2px;
    }
  }

  .hv-pcard {
    background: var(--card);
    border-bottom: 1px solid var(--bl);
    flex-shrink: 0;

    &--remark {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    &__hd {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 11px 14px 9px;
    }
    &__ico {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &--tenant {
        background: var(--success-bg);
        color: var(--success);
      }
      &--booking {
        background: var(--warning-bg);
        color: var(--warning);
      }
      &--track {
        background: var(--track-icon-bg);
        color: var(--track-icon-color);
      }
    }
    &__title {
      font-size: 13px;
      font-weight: 700;
      flex: 1;
    }
    &__body {
      padding: 0 14px 12px;
      &--remark {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 0 14px 14px;
      }
    }
  }

  .hv-tenant {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      background: var(--hover-bg);
      box-shadow: var(--shadow);
      transform: translateY(-1px);
    }

    &__avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    &__name-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    &__name {
      font-size: 14px;
      font-weight: 700;
    }
    &__dur {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      padding: 1px 6px;
      border-radius: 10px;
      white-space: nowrap;
    }
    &__phone {
      font-size: 11px;
      color: var(--t3);
    }
    &__rent {
      font-size: 12px;
      color: var(--t2);
      strong {
        color: var(--success);
        font-size: 15px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
      }
    }
    &__dates {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--t3);
      white-space: nowrap;
    }
    &__arrow {
      color: var(--t3);
      flex-shrink: 0;
    }
  }

  .hv-booking {
    padding: 10px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    gap: 7px;
    &:hover {
      background: var(--hover-bg);
      box-shadow: var(--shadow);
    }
    &__name {
      font-size: 14px;
      font-weight: 700;
    }
    &__rows {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    &__lbl {
      color: var(--t3);
      font-size: 11px;
    }
    &__link {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--primary);
      font-weight: 500;
      margin-top: 2px;
    }
  }

  .hv-panel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    gap: 8px;
    color: var(--t3);
    font-size: 12px;
    &__ico {
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--t3);
    }
  }

  .c-warning {
    color: var(--warning);
  }
</style>
