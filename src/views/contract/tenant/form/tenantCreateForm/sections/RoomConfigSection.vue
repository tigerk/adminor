<template>
  <div class="room-config-panel">
    <div class="room-config-panel__head">
      <div class="room-config-panel__title">按房间配置租金和费用</div>
      <div class="room-config-panel__desc">各房间独立配置，系统自动汇总月租金总计。房间费用在当前区域直接展开维护，不再单独打开弹框。</div>
    </div>
    <div class="room-config-panel__selector" :class="{ 'room-config-panel__selector--edit': isEdit }">
      <div class="room-config-panel__selector-top">
        <div class="room-config-panel__selector-title">房源信息</div>
        <div class="room-config-panel__selector-actions">
          <el-tag v-if="isEdit" type="info" size="small" effect="plain">
            <el-space>
              <el-icon class="mr-1"><Lock /></el-icon>
              编辑模式下不可修改房源
            </el-space>
          </el-tag>
          <el-button v-else type="primary" :icon="Plus" @click="$emit('pick-rooms')">选择房间</el-button>
        </div>
      </div>
      <div v-if="roomSelection.length > 0" class="room-config-panel__selector-list" :class="{ 'disabled-box': isEdit }">
        <el-tag
          v-for="(room, index) in roomSelection"
          :key="room.value"
          :closable="!isEdit"
          :disable-transitions="isEdit"
          class="m-1"
          size="large"
          :class="{ 'disabled-tag': isEdit }"
          @close="$emit('remove-room', index)"
        >
          {{ room.label }} |
          <span class="text-orange-500">¥{{ room.extra?.price }}</span>
        </el-tag>
      </div>
      <div v-else class="room-config-panel__selector-empty">{{ isEdit ? "暂无房源信息" : "请先选择房源，再逐个房间配置租金和费用。" }}</div>
    </div>
    <div v-if="roomConfigs.length === 0" class="room-config-empty">请先选择房源</div>
    <div v-else class="room-config-table">
      <table>
        <thead>
          <tr>
            <th style="width: 34%">房间</th>
            <th style="width: 20%">月租金</th>
            <th style="width: 16%">费用项</th>
            <th style="width: 18%">费用合计</th>
            <th style="width: 12%">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in roomConfigs" :key="item.roomId">
            <tr :class="{ 'room-config-table__summary-row--expanded': expandedRoomId === item.roomId }">
              <td>
                <div class="room-config-table__room">{{ item.roomLabel }}</div>
              </td>
              <td>
                <div class="room-rent-input">
                  <span class="room-rent-input__prefix">¥</span>
                  <el-input
                    :model-value="item.rentPrice"
                    type="number"
                    placeholder="请输入月租金"
                    @update:model-value="value => $emit('change-room-rent', item.roomId, value)"
                  >
                    <template #append>元/月</template>
                  </el-input>
                </div>
              </td>
              <td>
                <span class="room-config-table__meta">{{ item.feeList.length }} 项</span>
              </td>
              <td>
                <span class="room-config-table__amount">¥{{ calculateRoomFeeTotal(item).toFixed(2) }}</span>
              </td>
              <td class="text-center">
                <el-button type="primary" link @click="$emit('toggle-room', item.roomId)">
                  {{ expandedRoomId === item.roomId ? "收起" : "展开配置" }}
                </el-button>
              </td>
            </tr>
            <tr v-if="expandedRoomId === item.roomId" class="room-config-table__detail-row">
              <td colspan="5" class="room-config-table__detail-cell">
                <div class="room-config-detail">
                  <OtherFeeSelect v-model="item.feeList" :title="`${item.roomLabel} · 费用项配置`" sub-title="按当前房间单独维护费用项。" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-if="roomConfigs.length > 0" class="room-config-summary-bar">
      <div class="room-config-summary-bar__item">
        <span class="room-config-summary-bar__label">月租金总计</span>
        <span class="room-config-summary-bar__value">¥{{ Number(totalRent || 0).toFixed(2) }}</span>
        <span class="room-config-summary-bar__suffix">/月</span>
      </div>
      <div class="room-config-summary-bar__item">
        <span class="room-config-summary-bar__label">押</span>
        <el-select :model-value="depositMonths" class="room-config-summary-bar__select" placeholder="押金" @update:model-value="value => $emit('update:depositMonths', value)">
          <el-option v-for="item in depositMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="room-config-summary-bar__item">
        <span class="room-config-summary-bar__label">付</span>
        <el-select :model-value="paymentMonths" class="room-config-summary-bar__select" placeholder="付款" @update:model-value="value => $emit('update:paymentMonths', value)">
          <el-option v-for="item in paymentMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="room-config-summary-bar__item">
        <span class="room-config-summary-bar__label">押金</span>
        <span class="room-config-summary-bar__value">¥{{ depositAmount }}</span>
      </div>
      <div class="room-config-summary-bar__item">
        <span class="room-config-summary-bar__label">首次支付</span>
        <span class="room-config-summary-bar__value room-config-summary-bar__value--accent">¥{{ totalFirstPayment || "0.00" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Lock, Plus } from "@element-plus/icons-vue";
  import OtherFeeSelect from "@/shared/contract/OtherFeeSelect.vue";

  interface RoomSelectionItem {
    label: string;
    value: string | number;
    description?: string;
    extra?: any;
  }

  interface RoomScopedOtherFee {
    roomId?: string;
    dictDataId?: string | null;
    name?: string | null;
    paymentMethod?: number | null;
    priceMethod?: number | null;
    priceInput?: number | null;
  }

  interface RoomConfigItem {
    roomId: string;
    roomLabel: string;
    rentPrice: number;
    feeList: RoomScopedOtherFee[];
  }

  defineProps<{
    isEdit?: boolean;
    roomSelection: RoomSelectionItem[];
    roomConfigs: RoomConfigItem[];
    expandedRoomId: string;
    totalRent: number | string;
    depositMonths: number;
    paymentMonths: number;
    depositAmount: string;
    totalFirstPayment: string;
    depositMonthsOptions: Array<{ value: number; label: string }>;
    paymentMonthsOptions: Array<{ value: number; label: string }>;
  }>();

  defineEmits<{
    (e: "pick-rooms"): void;
    (e: "remove-room", index: number): void;
    (e: "change-room-rent", roomId: string, value: number | string): void;
    (e: "toggle-room", roomId: string): void;
    (e: "update:depositMonths", value: number): void;
    (e: "update:paymentMonths", value: number): void;
  }>();

  const calculateRoomFeeTotal = (config: RoomConfigItem) =>
    config.feeList.reduce((sum, fee) => {
      const feeValue = Number(fee.priceInput || 0);
      if (fee.priceMethod === 2) {
        return sum + (Number(config.rentPrice || 0) * feeValue) / 100;
      }
      return sum + feeValue;
    }, 0);
</script>

<style scoped lang="scss">
  .room-config-panel {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background: var(--el-bg-color);
    overflow: hidden;
  }

  .room-config-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 3px;
      background: var(--el-color-primary);
      border-radius: 0 2px 2px 0;
    }
  }

  .room-config-panel__title {
    padding-left: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex-shrink: 0;
  }

  .room-config-panel__desc {
    padding-left: 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex: 1;
    text-align: right;
  }

  .room-config-panel__selector {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  .room-config-panel__selector-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .room-config-panel__selector-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-config-panel__selector-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .room-config-panel__selector-list {
    padding: 4px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
  }

  .room-config-panel__selector-empty {
    padding: 18px 0 6px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .room-config-empty {
    padding: 28px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .room-config-table {
    width: 100%;
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--el-border-color-light);
      text-align: left;
      vertical-align: middle;
    }

    th {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  .room-config-table__summary-row--expanded {
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
  }

  .room-config-table__room {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .room-rent-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .room-rent-input__prefix {
    flex: 0 0 auto;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .room-rent-input :deep(.el-input__inner) {
    text-align: center;
  }

  .room-config-table__meta {
    color: var(--el-text-color-regular);
  }

  .room-config-table__amount {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .room-config-table__detail-row td {
    padding: 0;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .room-config-table__detail-cell {
    padding: 0 !important;
  }

  .room-config-detail {
    padding: 16px;
    background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-blank));
    border-left: 3px solid var(--el-color-primary);
  }

  .room-config-summary-bar {
    display: grid;
    grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr));
    gap: 0;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
  }

  .room-config-summary-bar__item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
    padding: 0 16px;
    border-right: 1px solid var(--el-border-color-light);
  }

  .room-config-summary-bar__item:last-child {
    border-right: none;
  }

  .room-config-summary-bar__label {
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  .room-config-summary-bar__value {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-config-summary-bar__value--accent {
    color: var(--el-color-danger);
  }

  .room-config-summary-bar__suffix {
    color: var(--el-text-color-secondary);
  }

  .room-config-summary-bar__select {
    width: 120px;
  }

  html.dark {
    .room-config-panel {
      border-color: var(--el-border-color);
    }

    .room-config-panel__selector-list {
      background: rgba(255, 255, 255, 0.01);
    }

    .room-config-table__summary-row--expanded {
      background: rgba(230, 125, 52, 0.08);
    }

    .room-config-detail {
      background: rgba(255, 255, 255, 0.02);
    }
  }
</style>
