<script setup lang="ts">
  import { ref, computed } from "vue";
  import { Edit, View } from "@element-plus/icons-vue";
  import { HouseDetailVo, PriceConfigDto, RoomDetailVo, RoomTrackVo } from "@/types";
  import { getRoomStatus, payMethodLabel } from "@/utils/house";

  const props = defineProps<{
    detail: HouseDetailVo;
    currentRoom: RoomDetailVo | null;
    currentStatus: { text: string; cls: string; color: string };
    rentPrice: string | number;
    priceConfig: PriceConfigDto | null;
    trackRecords: RoomTrackVo[];
    trackLoading: boolean;
    salesmanName: string;
    roomDetail: {
      roomNumber: string;
      direction: string;
      innerArea: string;
      floorInfo: string;
      firstAvailDate: string;
      vacancyStart: string;
    };
  }>();

  const emit = defineEmits<{
    editHouse: [detail: HouseDetailVo];
    openPriceConfig: [];
    addTrack: [content: string];
    "update:activeTab": [tab: "room" | "rent" | "track"];
  }>();

  const activeDetailTab = ref<"room" | "rent" | "track">("room");
  const trackInput = ref("");

  const handleAddTrack = () => {
    if (!trackInput.value.trim()) return;
    emit("addTrack", trackInput.value.trim());
    trackInput.value = "";
  };

  // 暴露 tab 切换方法供父级调用（如顶部"添加跟进"按钮）
  defineExpose({
    switchToTrackTab: () => {
      activeDetailTab.value = "track";
    }
  });
</script>

<template>
  <main class="hv-main">
    <!-- 房间头部 -->
    <div class="hv-room-header">
      <div class="hv-room-header__left">
        <h2 class="hv-room-header__name">
          {{ currentRoom?.roomNumber ? `${currentRoom.roomNumber} 号房间` : "房间详情" }}
        </h2>
        <span class="hv-badge" :class="`hv-badge--${currentStatus.cls}`">
          <span class="hv-badge__dot" />
          {{ currentStatus.text }}
        </span>
      </div>

      <div class="hv-room-header__price">
        <span class="hv-room-header__amount">{{ rentPrice }}</span>
        <span class="hv-room-header__unit">元/月</span>
        <button class="hv-room-header__price-edit" @click="emit('openPriceConfig')">
          <el-icon :size="11"><Edit /></el-icon>
          调价
        </button>
      </div>

      <div class="hv-room-header__actions">
        <el-button size="small" @click="emit('editHouse', detail)">修改房间</el-button>
        <el-button size="small" @click="activeDetailTab = 'track'">添加跟进</el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="hv-tabs">
      <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">房间信息</button>
      <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'rent' }" @click="activeDetailTab = 'rent'">租金配置</button>
      <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'track' }" @click="activeDetailTab = 'track'">跟进记录</button>
    </div>

    <!-- Tab 内容 -->
    <div class="hv-tab-body">
      <!-- ── 房间信息 ── -->
      <template v-if="activeDetailTab === 'room'">
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">基本信息</span>
            <el-button size="small" link type="primary" @click="emit('editHouse', detail)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
          <div class="hv-kv-grid">
            <div class="hv-kv">
              <span class="hv-kv__k">房间号</span>
              <span class="hv-kv__v hv-kv__v--bold">{{ roomDetail.roomNumber }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">朝向</span>
              <span class="hv-kv__v">{{ roomDetail.direction }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">套内面积</span>
              <span class="hv-kv__v hv-kv__v--accent">{{ roomDetail.innerArea }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">楼层</span>
              <span class="hv-kv__v">{{ roomDetail.floorInfo }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">首次可租</span>
              <span class="hv-kv__v">{{ roomDetail.firstAvailDate }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">空置开始</span>
              <span class="hv-kv__v">{{ roomDetail.vacancyStart }}</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">锁房期限</span>
              <span class="hv-kv__v hv-kv__v--muted">—</span>
            </div>
            <div class="hv-kv">
              <span class="hv-kv__k">锁房备注</span>
              <span class="hv-kv__v hv-kv__v--muted">—</span>
            </div>
          </div>
        </div>

        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">房间配置</span>
            <el-button size="small" link type="primary">
              <el-icon><View /></el-icon>
              物资明细
            </el-button>
          </div>
          <div class="hv-empty-tip">
            <span class="hv-empty-tip__ico">📦</span>
            暂无配置信息
          </div>
        </div>
      </template>

      <!-- ── 租金配置 ── -->
      <template v-if="activeDetailTab === 'rent'">
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">租金明细</span>
            <el-button size="small" link type="primary" @click="emit('openPriceConfig')">
              <el-icon><Edit /></el-icon>
              编辑配置
            </el-button>
          </div>
          <div class="hv-price-trio">
            <div class="hv-price-card hv-price-card--main">
              <div class="hv-price-card__lbl">挂牌租金</div>
              <div class="hv-price-card__val">
                <strong>{{ rentPrice }}</strong>
                <em>元/月</em>
              </div>
            </div>
            <div class="hv-price-card">
              <div class="hv-price-card__lbl">底价</div>
              <div class="hv-price-card__val">
                <template v-if="priceConfig?.floorPrice">
                  <strong class="hv-price-card__val--warn">{{ priceConfig.floorPrice }}</strong>
                  <em>元/月</em>
                </template>
                <span v-else class="hv-price-card__nil">未设置</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hv-section">
          <div class="hv-section__hd"><span class="hv-section__title">其他费用</span></div>
          <template v-if="priceConfig?.otherFees?.length">
            <div class="hv-fee-list">
              <div v-for="(fee, i) in priceConfig.otherFees" :key="i" class="hv-fee-row">
                <span class="hv-fee-row__name">{{ fee.name || "-" }}</span>
                <span class="hv-fee-row__amt">{{ fee.priceInput ?? "-" }}{{ fee.priceMethod === 2 ? "%" : "元" }}</span>
                <el-tag size="small" effect="plain">{{ payMethodLabel(fee.paymentMethod) }}</el-tag>
              </div>
            </div>
          </template>
          <div v-else class="hv-empty-tip">
            <span class="hv-empty-tip__ico">💳</span>
            暂未配置其他费用
          </div>
        </div>

        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">租金方案</span>
            <el-button link size="small" type="primary" @click="emit('openPriceConfig')">查看 / 编辑</el-button>
          </div>
          <template v-if="priceConfig?.pricePlans?.length">
            <div class="hv-plan-table">
              <div class="hv-plan-table__head">
                <span>租金方案</span>
                <span>价格</span>
                <span>比例</span>
              </div>
              <div v-for="(plan, i) in priceConfig.pricePlans" :key="i" class="hv-plan-table__row">
                <span>{{ plan.planName || "-" }} {{ plan.defaultPlan ? "(默认)" : "" }}</span>
                <span class="c-primary fw-600">{{ plan.price ?? "-" }} 元</span>
                <span>{{ plan.priceRatio ? plan.priceRatio + "%" : "-" }}</span>
              </div>
            </div>
          </template>
          <div v-else class="hv-empty-tip">
            <span class="hv-empty-tip__ico">📋</span>
            暂无租金方案
          </div>
        </div>
      </template>

      <!-- ── 跟进记录 ── -->
      <template v-if="activeDetailTab === 'track'">
        <div class="hv-track-compose">
          <div class="hv-track-compose__avatar">{{ salesmanName.slice(0, 1) }}</div>
          <div class="hv-track-compose__right">
            <el-input v-model="trackInput" type="textarea" :rows="3" placeholder="记录跟进情况，支持描述客户意向、看房情况、沟通进展…" resize="none" />
            <div class="hv-track-compose__footer">
              <span class="hv-track-compose__hint">{{ trackInput.length }} 字</span>
              <el-button type="primary" size="small" :loading="trackLoading" :disabled="!trackInput.trim()" @click="handleAddTrack">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 3px"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                提交记录
              </el-button>
            </div>
          </div>
        </div>

        <div class="hv-timeline">
          <div v-if="!trackRecords.length" class="hv-timeline__empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor" opacity=".2" />
            </svg>
            <p>暂无跟进记录</p>
            <span>记录每一次跟进，把握租客意向</span>
          </div>
          <div v-for="(rec, idx) in trackRecords" :key="rec.id" class="hv-timeline__item">
            <div v-if="idx < trackRecords.length - 1" class="hv-timeline__line" />
            <div class="hv-timeline__dot" />
            <div class="hv-timeline__card">
              <div class="hv-timeline__meta">
                <div class="hv-timeline__author-wrap">
                  <div class="hv-timeline__author-avatar">{{ (rec.updateByName || rec.updateBy || "?").slice(0, 1) }}</div>
                  <span class="hv-timeline__author">{{ rec.updateByName || rec.updateBy || "未知" }}</span>
                </div>
                <span class="hv-timeline__time">{{ rec.createTime }}</span>
              </div>
              <p class="hv-timeline__body">{{ rec.trackContent }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss">
  .hv-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card);
  }

  .hv-room-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--b);
    flex-shrink: 0;
    background: var(--card);

    &__left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 0 0 auto;
    }
    &__name {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
      color: var(--t1);
    }

    &__price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 0 16px;
      border-left: 1px solid var(--bl);
      border-right: 1px solid var(--bl);
      flex: 0 0 auto;
    }
    &__amount {
      font-size: 24px;
      font-weight: 800;
      color: var(--success);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    &__unit {
      font-size: 12px;
      color: var(--t3);
    }
    &__price-edit {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: 6px;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid var(--b);
      background: transparent;
      color: var(--t3);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover {
        color: var(--primary);
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }
    &__actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .hv-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    &__dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }
    &--leased {
      background: var(--success-bg);
      color: var(--success);
    }
    &--available {
      background: var(--danger-bg);
      color: var(--danger);
    }
    &--booked {
      background: var(--warning-bg);
      color: var(--warning);
    }
    &--locked {
      background: var(--info-bg);
      color: var(--info);
    }
  }

  .hv-tabs {
    display: flex;
    border-bottom: 1px solid var(--b);
    padding: 0 20px;
    flex-shrink: 0;
    background: var(--card);
  }
  .hv-tab {
    padding: 12px 16px 11px;
    font-size: 13px;
    font-weight: 500;
    color: var(--t2);
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    transition: color 0.15s;
    &.is-active {
      color: var(--primary);
      font-weight: 700;
      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 16px;
        right: 16px;
        height: 2.5px;
        background: var(--primary);
        border-radius: 2px;
      }
    }
    &:hover:not(.is-active) {
      color: var(--t1);
    }
  }
  .hv-tab-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 24px;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--b);
      border-radius: 2px;
    }
  }

  .hv-section {
    padding: 18px 0;
    border-bottom: 1px solid var(--bl);
    &:last-child {
      border-bottom: none;
    }
    &__hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    &__title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 7px;
      &::before {
        content: "";
        display: inline-block;
        width: 3px;
        height: 14px;
        background: var(--primary);
        border-radius: 2px;
      }
    }
  }

  .hv-kv-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    overflow: hidden;
  }
  .hv-kv {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 11px 13px;
    border-right: 1px solid var(--bl);
    border-bottom: 1px solid var(--bl);
    transition: background 0.1s;
    &:hover {
      background: var(--sub);
    }
    &:nth-child(4n) {
      border-right: none;
    }
    &:nth-last-child(-n + 4) {
      border-bottom: none;
    }
    &__k {
      font-size: 10px;
      color: var(--t3);
      font-weight: 500;
      letter-spacing: 0.2px;
    }
    &__v {
      font-size: 13px;
      font-weight: 500;
      &--bold {
        font-weight: 700;
      }
      &--accent {
        color: var(--primary);
        font-weight: 700;
      }
      &--muted {
        color: var(--t3);
        font-weight: 400;
      }
    }
  }

  .hv-price-trio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .hv-price-card {
    padding: 14px 15px;
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    background: var(--sub);
    transition: box-shadow 0.15s;
    &:hover {
      box-shadow: var(--shadow);
    }
    &--main {
      background: linear-gradient(140deg, var(--price-main-from), var(--price-main-to));
      border-color: var(--success-border);
    }
    &__lbl {
      font-size: 10px;
      color: var(--t3);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 8px;
    }
    &__val {
      display: flex;
      align-items: baseline;
      gap: 3px;
      strong {
        font-size: 20px;
        font-weight: 800;
        color: var(--success);
        font-variant-numeric: tabular-nums;
      }
      em {
        font-size: 11px;
        color: var(--t3);
        font-style: normal;
      }
      &--warn {
        color: var(--warning) !important;
        font-size: 18px !important;
      }
    }
    &__nil {
      font-size: 14px;
      color: var(--t3);
    }
  }

  .hv-fee-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .hv-fee-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 13px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    transition: background 0.12s;
    &:hover {
      background: var(--hover-bg);
    }
    &__name {
      font-weight: 600;
      flex: 1;
    }
    &__amt {
      color: var(--primary);
      font-weight: 700;
    }
  }

  .hv-plan-table {
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    overflow: hidden;
    font-size: 12px;
    &__head,
    &__row {
      display: grid;
      grid-template-columns: 1.4fr 1fr 0.8fr;
    }
    &__head {
      background: var(--sub);
      font-size: 10px;
      font-weight: 700;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      span {
        padding: 9px 13px;
      }
    }
    &__row {
      border-top: 1px solid var(--bl);
      transition: background 0.1s;
      span {
        padding: 9px 13px;
      }
      &:hover {
        background: var(--sub);
      }
    }
  }

  .hv-empty-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 2px;
    color: var(--t3);
    font-size: 13px;
    &__ico {
      font-size: 18px;
    }
  }

  .c-primary {
    color: var(--primary);
  }
  .fw-600 {
    font-weight: 600;
  }

  // 跟进记录
  .hv-track-compose {
    display: flex;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--bl);

    &__avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      flex-shrink: 0;
    }
    &__right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &__hint {
      font-size: 11px;
      color: var(--t3);
    }
  }

  .hv-timeline {
    padding: 20px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;

    &__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 8px;
      color: var(--t3);
      p {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--t2);
      }
      span {
        font-size: 12px;
        color: var(--t3);
      }
      svg {
        color: var(--t3);
      }
    }

    &__item {
      display: flex;
      gap: 14px;
      position: relative;
      padding-bottom: 20px;
      &:last-child {
        padding-bottom: 0;
      }
    }
    &__dot {
      width: 10px;
      height: 10px;
      min-width: 10px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--dot-border);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
      margin-top: 13px;
      flex-shrink: 0;
      z-index: 1;
    }
    &__line {
      position: absolute;
      left: 4px;
      top: 22px;
      bottom: 0;
      width: 2px;
      background: var(--bl);
    }
    &__card {
      flex: 1;
      background: var(--card);
      border: 1px solid var(--b);
      border-radius: var(--r);
      padding: 12px 14px;
      box-shadow: var(--shadow);
      transition: box-shadow 0.15s;
      &:hover {
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 8px 24px rgba(0, 0, 0, 0.06);
      }
    }
    &__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    &__author-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    &__author-avatar {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__author {
      font-size: 12px;
      font-weight: 700;
      color: var(--t1);
    }
    &__time {
      font-size: 11px;
      color: var(--t3);
      font-variant-numeric: tabular-nums;
    }
    &__body {
      margin: 0;
      font-size: 13px;
      color: var(--t2);
      line-height: 1.7;
    }
  }
</style>
