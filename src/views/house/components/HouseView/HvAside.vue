<script setup lang="ts">
  import { Edit, House, Location, View } from "@element-plus/icons-vue";
  import { HouseDetailVo } from "@/types";
  import { getWaterTypeLabel, getElectricityTypeLabel } from "@/utils/house";

  const props = defineProps<{
    detail: HouseDetailVo;
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
      water: string | number;
      electricity: string | number;
      propertyFee: string | number;
      communityName: string;
      salesmanName: string;
      deptId: string | number;
      houseRemark: string;
    };
    allImages: string[];
  }>();

  const emit = defineEmits<{
    editHouse: [detail: HouseDetailVo];
  }>();
</script>

<template>
  <aside class="hv-aside">
    <!-- 封面图 -->
    <div class="hv-cover">
      <el-image v-if="allImages.length" :src="allImages[0]" fit="cover" :preview-src-list="allImages" :preview-teleported="true" :initial-index="0" class="hv-cover__img" />
      <div v-else class="hv-cover__empty">
        <el-icon :size="28"><House /></el-icon>
        <span>暂无图片</span>
      </div>
      <div v-if="allImages.length" class="hv-cover__footer">
        <el-icon :size="11"><View /></el-icon>
        {{ allImages.length }} 张图片
      </div>
    </div>

    <!-- 基本档案 -->
    <div class="hv-aside__body">
      <!-- 房源名 + 编辑 -->
      <div class="hv-aside__title-row">
        <div class="hv-aside__title">
          <el-icon class="hv-aside__loc-icon"><Location /></el-icon>
          {{ houseMeta.communityName }}
        </div>
        <el-button size="small" link type="primary" @click="emit('editHouse', detail)">
          <el-icon><Edit /></el-icon>
        </el-button>
      </div>

      <!-- 属性 chips -->
      <div class="hv-chips">
        <span class="hv-chip hv-chip--blue">{{ houseMeta.leaseModeName }}</span>
        <span class="hv-chip hv-chip--blue">{{ houseMeta.rentalType }}</span>
        <span class="hv-chip">{{ houseMeta.area }} m²</span>
        <span class="hv-chip">{{ houseMeta.floor }}层 / {{ houseMeta.floorTotal }}层</span>
        <span class="hv-chip">{{ houseMeta.decoration }}</span>
        <span class="hv-chip" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
        <span class="hv-chip" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
      </div>

      <!-- 费用列 -->
      <div class="hv-aside__costs">
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
          <span class="hv-cost-row__label">电梯</span>
          <span class="hv-cost-row__val">
            <span class="hv-chip" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
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
          <span class="hv-cost-row__label">物业费</span>
          <span class="hv-cost-row__val">
            {{ houseMeta.propertyFee }}
            <em>元/月</em>
          </span>
        </div>
        <div class="hv-cost-row">
          <span class="hv-cost-row__label">燃气</span>
          <span class="hv-cost-row__val">
            <span class="hv-chip" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
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
      </div>

      <!-- 房源备注 -->
      <div v-if="houseMeta.houseRemark" class="hv-aside__remark">
        <p>{{ houseMeta.houseRemark }}</p>
      </div>
    </div>

    <!-- 负责人：固定在左侧底部 -->
    <div class="hv-owner hv-owner--fixed">
      <div class="hv-owner__info">
        <div class="hv-owner__name">{{ detail.salesman?.nickname || houseMeta.salesmanName }}</div>
        <div v-if="detail.salesman?.phone" class="hv-owner__phone">{{ detail.salesman.phone }}</div>
      </div>
      <div class="hv-owner__dept-badge">{{ detail.deptName || houseMeta.deptId }}</div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
  .hv-aside {
    display: flex;
    flex-direction: column;
    background: var(--card);
    border-right: 1px solid var(--b);
    overflow: hidden;

    &__body {
      flex: 1;
      padding: 14px 12px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      &::-webkit-scrollbar {
        width: 3px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--bl);
        border-radius: 2px;
      }
    }

    &__title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }

    &__title {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.4;
      flex: 1;
    }

    &__loc-icon {
      color: var(--primary);
      margin-top: 2px;
      flex-shrink: 0;
    }

    &__costs {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--bl);
      border-radius: var(--r-sm);
      overflow: hidden;
    }

    &__remark {
      background: var(--remark-bg);
      border: 1px solid var(--remark-border);
      border-radius: var(--r-sm);
      padding: 9px 12px;
      p {
        margin: 0;
        font-size: 12px;
        color: var(--remark-text);
        line-height: 1.6;
      }
    }
  }

  .hv-cover {
    position: relative;
    flex-shrink: 0;
    background: var(--sub);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__img {
      width: 100%;
      height: 140px;
      display: block;
      cursor: pointer;
      transition: transform 0.35s ease;
      &:hover {
        transform: scale(1.04);
      }
      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__empty {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--t3);
      font-size: 12px;
    }

    &__footer {
      position: absolute;
      bottom: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      border-radius: 20px;
      font-size: 11px;
      color: #fff;
      pointer-events: none;
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

  .hv-owner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 11px;
    background: var(--sub);
    border: 1px solid var(--bl);
    border-radius: var(--r-sm);

    &--fixed {
      border-radius: 0;
      border-top: 1px solid var(--b);
      background: var(--card);
      flex-shrink: 0;
      padding: 10px 14px;
      margin: 0;
      gap: 10px;
    }

    &__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    &__name {
      font-size: 13px;
      font-weight: 700;
      color: var(--t1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__phone {
      font-size: 11px;
      color: var(--t3);
      margin-top: 1px;
    }

    &__dept-badge {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 6px;
      padding: 2px 7px;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
</style>
