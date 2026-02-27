<script setup lang="ts">
  import { ref, computed } from "vue";
  import { Edit, House, Location, View } from "@element-plus/icons-vue";
  import { HouseDetailVo, PriceConfigDto, RoomDetailVo, RoomTrackVo } from "@/types";
  import { getRoomStatus, payMethodLabel, getWaterTypeLabel, getElectricityTypeLabel } from "@/utils/house";

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
    /** house_tags 字典：value/id → label */
    tagsMap?: Record<string, string>;
    /** house_facilities 字典：value → label */
    facilitiesMap?: Record<string, string>;
    /** 房源基本信息（来自原 HvAside） */
    houseMeta: {
      layoutName: string;
      leaseModeName: string;
      rentalType: string;
      decoration: string;
      area: string | number;
      floor: string | number;
      floorTotal: string | number;
      hasElevator: string;
      hasGas: string;
      water: string;
      electricity: string;
      propertyFee: string | number;
      communityName: string;
      salesmanName: string;
      deptId: string | number;
      houseRemark: string;
    };
    /** 房源/房间图片列表 */
    allImages: string[];
  }>();

  const emit = defineEmits<{
    editHouse: [detail: HouseDetailVo];
    openPriceConfig: [];
    addTrack: [content: string];
    "update:activeTab": [tab: "room" | "house" | "rent" | "track"];
  }>();

  const activeDetailTab = ref<"room" | "house" | "rent" | "track">("room");
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
        <el-button size="small" type="primary" @click="emit('editHouse', detail)">修改房间</el-button>
        <el-button size="small" type="danger" @click="activeDetailTab = 'track'">添加跟进</el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="hv-tabs">
      <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">房间信息</button>
      <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'house' }" @click="activeDetailTab = 'house'">房源信息</button>
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

        <!-- 房间特色 -->
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">房间特色</span>
          </div>
          <div v-if="currentRoom?.tags?.length" class="hv-tag-list">
            <span v-for="tag in currentRoom.tags" :key="tag" class="hv-tag hv-tag--feature">
              {{ tagsMap?.[String(tag)] || tag }}
            </span>
          </div>
          <div v-else class="hv-empty-tip">
            <span class="hv-empty-tip__ico">🏷️</span>
            暂无房间特色
          </div>
        </div>

        <!-- 房间配置 -->
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">房间配置</span>
          </div>
          <div v-if="currentRoom?.facilities?.length" class="hv-tag-list">
            <span v-for="f in currentRoom.facilities" :key="f.name" class="hv-tag hv-tag--facility">
              {{ (f.name && facilitiesMap?.[f.name]) || f.name }}
              <em v-if="f.count">×{{ f.count }}</em>
            </span>
          </div>
          <div v-else class="hv-empty-tip">
            <span class="hv-empty-tip__ico">📦</span>
            暂无配置信息
          </div>
        </div>
      </template>

      <!-- ── 房源信息 ── -->
      <template v-if="activeDetailTab === 'house'">
        <!-- 图片 -->
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">房源图片</span>
          </div>
          <div v-if="allImages.length" class="hv-house-images">
            <el-image
              v-for="(img, i) in allImages"
              :key="img"
              :src="img"
              fit="cover"
              :preview-src-list="allImages"
              :initial-index="i"
              :preview-teleported="true"
              class="hv-house-images__item"
            />
          </div>
          <div v-else class="hv-empty-tip">
            <span class="hv-empty-tip__ico">🖼️</span>
            暂无图片
          </div>
        </div>

        <!-- 基本属性 -->
        <div class="hv-section">
          <div class="hv-section__hd">
            <span class="hv-section__title">房源档案</span>
            <el-button size="small" link type="primary" @click="emit('editHouse', detail)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
          <!-- Chips -->
          <div class="hv-chips" style="margin-bottom: 12px">
            <span class="hv-chip hv-chip--blue">{{ houseMeta.leaseModeName }}</span>
            <span class="hv-chip hv-chip--blue">{{ houseMeta.rentalType }}</span>
            <span class="hv-chip">{{ houseMeta.area }} m²</span>
            <span class="hv-chip">{{ houseMeta.floor }}层 / {{ houseMeta.floorTotal }}层</span>
            <span class="hv-chip">{{ houseMeta.decoration }}</span>
            <span class="hv-chip" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
            <span class="hv-chip" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
          </div>
          <!-- KV 表格 -->
          <div class="hv-aside-costs">
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">小区</span>
              <span class="hv-cost-row__val">{{ houseMeta.communityName }}</span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">房型</span>
              <span class="hv-cost-row__val">{{ houseMeta.layoutName }}</span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">楼层</span>
              <span class="hv-cost-row__val">
                {{ houseMeta.floor }}
                <em>层</em>
                <em>共</em>
                {{ houseMeta.floorTotal }}
                <em>层</em>
              </span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">面积</span>
              <span class="hv-cost-row__val">
                {{ houseMeta.area }}
                <em>m²</em>
              </span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">装修</span>
              <span class="hv-cost-row__val">{{ houseMeta.decoration }}</span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">电梯</span>
              <span class="hv-cost-row__val">
                <span class="hv-chip hv-chip--sm" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
              </span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">燃气</span>
              <span class="hv-cost-row__val">
                <span class="hv-chip hv-chip--sm" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
              </span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">水费</span>
              <span class="hv-cost-row__val">{{ getWaterTypeLabel(houseMeta.water) }}</span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">电费</span>
              <span class="hv-cost-row__val">{{ getElectricityTypeLabel(houseMeta.electricity) }}</span>
            </div>
            <div class="hv-cost-row">
              <span class="hv-cost-row__label">物业费</span>
              <span class="hv-cost-row__val">
                {{ houseMeta.propertyFee }}
                <em>元/月</em>
              </span>
            </div>
          </div>
        </div>

        <!-- 负责人 -->
        <div class="hv-section">
          <div class="hv-section__hd"><span class="hv-section__title">负责人</span></div>
          <div class="hv-owner-card">
            <div class="hv-owner-card__avatar">{{ (detail.salesman?.nickname || houseMeta.salesmanName || "?").slice(0, 1) }}</div>
            <div class="hv-owner-card__info">
              <div class="hv-owner-card__name">{{ detail.salesman?.nickname || houseMeta.salesmanName }}</div>
              <div v-if="detail.salesman?.phone" class="hv-owner-card__phone">{{ detail.salesman.phone }}</div>
            </div>
            <div class="hv-owner-card__dept">{{ detail.deptName || houseMeta.deptId }}</div>
          </div>
        </div>

        <!-- 备注 -->
        <div v-if="houseMeta.houseRemark" class="hv-section">
          <div class="hv-section__hd"><span class="hv-section__title">房源备注</span></div>
          <div class="hv-remark-box">
            <p>{{ houseMeta.houseRemark }}</p>
          </div>
        </div>
      </template>
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
      gap: 1px;
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

  // 房源信息 Tab 样式
  .hv-house-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;

    &__item {
      width: 100%;
      height: 90px;
      border-radius: var(--r-sm);
      overflow: hidden;
      cursor: pointer;
      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      &:hover :deep(img) {
        transform: scale(1.05);
      }
    }
  }

  .hv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .hv-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    background: var(--sub);
    color: var(--t2);
    border: 1px solid var(--bl);
    white-space: nowrap;
    &--sm {
      font-size: 11px;
      padding: 1px 6px;
    }
    &--blue {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--el-color-primary-light-7);
    }
    &--green {
      background: var(--success-bg);
      color: var(--success);
      border-color: var(--success-border);
    }
  }

  .hv-aside-costs {
    border: 1px solid var(--bl);
    border-radius: var(--r-sm);
    overflow: hidden;
  }
  .hv-cost-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 11px;
    font-size: 12px;
    border-bottom: 1px solid var(--bl);
    &:last-child {
      border-bottom: none;
    }
    &__label {
      color: var(--t3);
      font-weight: 500;
    }
    &__val {
      font-weight: 600;
      em {
        font-style: normal;
        font-size: 10px;
        color: var(--t3);
        font-weight: 400;
        margin-left: 2px;
      }
    }
  }

  .hv-owner-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--sub);
    border: 1px solid var(--bl);
    border-radius: var(--r-sm);

    &__avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 15px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__info {
      flex: 1;
      min-width: 0;
    }
    &__name {
      font-size: 14px;
      font-weight: 700;
      color: var(--t1);
    }
    &__phone {
      font-size: 12px;
      color: var(--t3);
      margin-top: 2px;
    }
    &__dept {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 6px;
      padding: 3px 9px;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  .hv-remark-box {
    background: var(--remark-bg);
    border: 1px solid var(--remark-border);
    border-radius: var(--r-sm);
    padding: 10px 13px;
    p {
      margin: 0;
      font-size: 12px;
      color: var(--remark-text);
      line-height: 1.7;
    }
  }
  .hv-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hv-tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;

    em {
      font-style: normal;
      font-size: 11px;
      opacity: 0.75;
    }

    &--feature {
      background: var(--el-color-primary-light-9, #ecf5ff);
      color: var(--primary);
      border: 1px solid var(--el-color-primary-light-7, #c6e2ff);
    }

    &--facility {
      background: var(--sub, #f8f9fa);
      color: var(--t2);
      border: 1px solid var(--bl);
    }
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
