<template>
  <el-dialog
    v-model="visible"
    title="选择房源"
    width="72vw"
    append-to-body
    :close-on-click-modal="false"
    :align-center="true"
    :draggable="true"
    :show-close="true"
    class="house-picker-dialog"
  >
    <div class="house-picker-body">
      <!-- Left: Selected Panel -->
      <div class="selected-panel">
        <div class="selected-panel__header">
          <div class="selected-panel__header-left">
            <span class="selected-panel__label">已选房源</span>
            <span class="selected-panel__badge" :class="{ active: selectedRows.length > 0 }">
              {{ selectedRows.length }}
            </span>
          </div>
          <button v-if="selectedRows.length > 0" class="clear-btn" @click="clearAllSelection">清空全部</button>
        </div>

        <div class="selected-panel__body">
          <transition-group name="list" tag="div" class="selected-list">
            <div v-for="row in selectedRows" :key="row.houseId" class="selected-card">
              <div class="selected-card__dot" />
              <div class="selected-card__info">
                <div class="selected-card__name">{{ row.houseName }}</div>
                <div class="selected-card__meta">
                  <span>{{ row.rentalTypeText }}</span>
                  <span class="sep">·</span>
                  <span>{{ row.areaText }}</span>
                </div>
                <div class="selected-card__addr">{{ row.addressText || "暂无地址" }}</div>
              </div>
              <button class="selected-card__remove" @click="handleRemoveTag(row)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </transition-group>

          <div v-if="selectedRows.length === 0" class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="35" width="50" height="35" rx="4" stroke="currentColor" stroke-width="2.5" fill="none" />
                <path d="M8 38L40 12L72 38" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="30" y="50" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </div>
            <p class="empty-state__text">暂未选择房源</p>
            <p class="empty-state__hint">从右侧列表中选择</p>
          </div>
        </div>
      </div>

      <!-- Right: Search + Table -->
      <div class="main-panel">
        <!-- Search Bar -->
        <div class="search-bar">
          <div class="search-bar__input-wrap">
            <el-icon class="search-bar__icon"><Search /></el-icon>
            <el-input v-model="queryParams.keywords" placeholder="搜索房源名称或地址..." clearable class="search-bar__input" @keyup.enter="handleQuery" />
          </div>
          <button class="btn btn--primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </button>
          <button class="btn btn--ghost" @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </button>
        </div>

        <!-- Table -->
        <div v-loading="loading" class="table-wrap">
          <el-table
            ref="tableRef"
            :data="houseList"
            row-key="houseId"
            style="width: 100%"
            class="house-table"
            :row-class-name="getRowClassName"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick"
          >
            <el-table-column type="selection" width="50" :reserve-selection="true" />

            <el-table-column label="房源信息" min-width="260">
              <template #default="{ row }">
                <div class="cell-info">
                  <div class="cell-info__top">
                    <span class="rental-tag" :class="getRentalTagClass(row.rentalType)">
                      {{ row.rentalTypeText }}
                    </span>
                    <span class="cell-info__name">{{ row.houseName }}</span>
                  </div>
                  <div class="cell-info__addr">{{ row.addressText || "—" }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="户型 / 面积" width="160">
              <template #default="{ row }">
                <div class="cell-layout">
                  <span class="cell-layout__type">{{ row.layoutText }}</span>
                  <span class="cell-layout__area">{{ row.areaText }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="覆盖房间" width="100" align="center">
              <template #default="{ row }">
                <span class="room-count">{{ row.roomCount }}</span>
              </template>
            </el-table-column>

            <el-table-column label="参考月租金" width="130" align="right">
              <template #default="{ row }">
                <div class="cell-price">
                  <span class="cell-price__symbol">¥</span>
                  <span class="cell-price__amount">{{ row.priceText }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="pagination-bar__total">共 {{ total }} 条记录</span>
          <el-pagination
            v-model:current-page="queryParams.currentPage"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="picker-footer">
        <div class="picker-footer__summary">
          <template v-if="selectedRows.length > 0">
            已选
            <strong>{{ selectedRows.length }}</strong>
            套房源
          </template>
        </div>
        <div class="picker-footer__actions">
          <button class="btn btn--ghost" @click="handleClose">取消</button>
          <button class="btn btn--primary btn--confirm" :disabled="selectedRows.length === 0" @click="submitSelection">
            确认选择
            <span v-if="selectedRows.length > 0" class="btn__count">{{ selectedRows.length }}</span>
          </button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { nextTick, reactive, ref } from "vue";
  import { Close, House, Refresh, Search } from "@element-plus/icons-vue";
  import { getHouseList } from "@/api/house/house";
  import { getRentalTypeLabel } from "@/utils/house";
  import type { HouseListVo, HouseQueryDto } from "@/types";

  defineOptions({ name: "HousePicker" });

  type HousePickerRow = {
    houseId: string;
    houseName: string;
    area?: number;
    rentalType?: number;
    rentalTypeText: string;
    roomCount: number;
    priceText: string;
    addressText: string;
    layoutText: string;
    areaText: string;
    communityName?: string;
    building?: string;
    unit?: string;
    doorNumber?: string;
    certificateNo?: string;
    address?: string;
  };

  type HousePickerShowOptions = {
    selected?: any[];
    excludeOwnerContractId?: string | number;
  };

  const emit = defineEmits<{
    (e: "confirm", value: HousePickerRow[]): void;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const tableRef = ref();
  const total = ref(0);
  const houseList = ref<HousePickerRow[]>([]);
  const selectedRows = ref<HousePickerRow[]>([]);

  const queryParams = reactive({
    currentPage: 1,
    pageSize: 10,
    keywords: ""
  });

  const excludeOwnerContractId = ref<string>("");

  const getRentalTagClass = (rentalType?: number) => {
    return rentalType === 1 ? "rental-tag--whole" : "rental-tag--room";
  };

  const getRowClassName = ({ row }: { row: HousePickerRow }) => {
    return selectedRows.value.some(r => r.houseId === row.houseId) ? "row--selected" : "";
  };

  const toHouseRows = (rows: HouseListVo[]) =>
    rows.map(row => ({
      houseId: String(row.houseId || ""),
      houseName: row.houseName || "-",
      area: row.area ? Number(row.area) : 0,
      rentalType: row.rentalType,
      rentalTypeText: getRentalTypeLabel(row.rentalType),
      roomCount: row.roomCount || 0,
      priceText: row.referenceRentAmount != null ? String(row.referenceRentAmount) : "-",
      addressText: row.addressText || "",
      layoutText: row.layoutText || "-",
      areaText: row.area ? `${row.area}m²` : "-",
      communityName: row.communityName,
      building: row.building,
      unit: row.unit,
      doorNumber: row.doorNumber,
      certificateNo: row.certificateNo,
      address: row.addressText || ""
    }));

  const getList = async () => {
    loading.value = true;
    try {
      const requestParams: HouseQueryDto = {
        currentPage: String(queryParams.currentPage),
        pageSize: String(queryParams.pageSize),
        keywords: queryParams.keywords,
        excludeOwnerContractId: excludeOwnerContractId.value || undefined
      };
      const res = await getHouseList(requestParams);
      const rows = (res.data?.list || []) as HouseListVo[];
      houseList.value = toHouseRows(rows);
      total.value = Number(res.data?.total) || 0;
      await nextTick();
      restoreSelection();
    } finally {
      loading.value = false;
    }
  };

  const restoreSelection = () => {
    if (!selectedRows.value.length) return;
    houseList.value.forEach(row => {
      const isSelected = selectedRows.value.some(item => item.houseId === row.houseId);
      if (isSelected) {
        nextTick(() => tableRef.value?.toggleRowSelection(row, true));
      }
    });
  };

  const handleSelectionChange = (selection: HousePickerRow[]) => {
    const currentPageIds = houseList.value.map(item => item.houseId);
    selectedRows.value = selectedRows.value.filter(item => !currentPageIds.includes(item.houseId));
    selection.forEach(item => {
      if (!selectedRows.value.some(row => row.houseId === item.houseId)) {
        selectedRows.value.push(item);
      }
    });
  };

  const handleRemoveTag = (row: HousePickerRow) => {
    const index = selectedRows.value.findIndex(item => item.houseId === row.houseId);
    if (index > -1) selectedRows.value.splice(index, 1);
    const currentRow = houseList.value.find(item => item.houseId === row.houseId);
    if (currentRow) tableRef.value?.toggleRowSelection(currentRow, false);
  };

  const clearAllSelection = () => {
    selectedRows.value = [];
    tableRef.value?.clearSelection();
  };

  const handleRowClick = (row: HousePickerRow) => {
    tableRef.value?.toggleRowSelection(row);
  };

  const handleQuery = () => {
    queryParams.currentPage = 1;
    getList();
  };

  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.currentPage = 1;
    getList();
  };

  const handlePageChange = (page: number) => {
    queryParams.currentPage = page;
    getList();
  };

  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size;
    queryParams.currentPage = 1;
    getList();
  };

  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  const handleClose = () => {
    visible.value = false;
  };

  const show = (options?: HousePickerShowOptions | any[]) => {
    visible.value = true;
    const resolvedOptions = Array.isArray(options) ? { selected: options } : options || {};
    excludeOwnerContractId.value = resolvedOptions.excludeOwnerContractId ? String(resolvedOptions.excludeOwnerContractId) : "";
    selectedRows.value = (resolvedOptions.selected || []).map((item: any) => ({
      houseId: String(item.houseId || ""),
      houseName: item.houseName || "-",
      area: item.area ? Number(item.area) : 0,
      rentalType: item.rentalType,
      rentalTypeText: item.rentalTypeText || getRentalTypeLabel(item.rentalType),
      roomCount: item.roomCount || 1,
      priceText: item.priceText || "-",
      addressText: item.addressText || item.address || item.communityAddress || "",
      layoutText: item.layoutText || "-",
      areaText: item.areaText || (item.area ? `${item.area}m²` : "-"),
      communityName: item.communityName,
      building: item.building,
      unit: item.unit,
      doorNumber: item.doorNumber,
      certificateNo: item.certificateNo,
      address: item.address || item.addressText || item.communityAddress
    }));
    nextTick(() => getList());
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  /* ─── Dialog Override ─────────────────────────────── */
  :deep(.house-picker-dialog) {
    border-radius: 16px !important;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12) !important;

    .el-dialog {
      background: var(--el-bg-color);
    }

    .el-dialog__header {
      padding: 18px 56px 14px 20px !important;
      margin: 0 !important;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .el-dialog__title {
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 16px;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--el-fill-color-light);
      }
    }

    .el-dialog__close {
      color: var(--el-text-color-regular);
      font-size: 18px;
    }

    .el-dialog__body {
      padding: 0 !important;
    }

    .el-dialog__footer {
      padding: 0 !important;
      border-top: 1px solid var(--el-border-color-light);
    }
  }

  /* ─── Header ──────────────────────────────────────── */
  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, #fff8f5 0%, #fff 100%);
    border-bottom: 1px solid #f5ece8;

    &__left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    &__icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }

    &__title {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.3px;
    }

    &__subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: #999;
    }

    &__close {
      cursor: pointer;
      font-size: 18px;
      color: #bbb;
      transition: color 0.2s;
      padding: 6px;
      border-radius: 8px;

      &:hover {
        color: #666;
        background: #f5f5f5;
      }
    }
  }

  /* ─── Body Layout ─────────────────────────────────── */
  .house-picker-body {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 70vh;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  /* ─── Selected Panel ──────────────────────────────── */
  .selected-panel {
    border-right: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      flex-shrink: 0;
    }

    &__header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__label {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__badge {
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &.active {
        background: #f97316;
        color: #fff;
      }
    }

    &__body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      min-height: 0;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
      }
    }
  }

  .clear-btn {
    font-size: 12px;
    color: #f97316;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: var(--el-color-primary-light-9);
    }
  }

  /* ─── Selected Card ───────────────────────────────── */
  .selected-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .selected-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    background: var(--el-bg-color);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s;

    &:hover {
      border-color: #fbd5bc;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.08);
    }

    &__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f97316;
      flex-shrink: 0;
      margin-top: 5px;
    }

    &__info {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 3px;
      font-size: 11px;
      color: #f97316;
      font-weight: 500;
    }

    &__addr {
      margin-top: 2px;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__remove {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-placeholder);
      transition: all 0.2s;

      &:hover {
        background: #fee2e2;
        color: #ef4444;
      }
    }
  }

  .sep {
    color: #ddd;
  }

  /* ─── Empty State ─────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 8px;

    &__icon {
      width: 60px;
      height: 60px;
      color: var(--el-border-color);
    }

    &__text {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      font-weight: 500;
    }

    &__hint {
      margin: 0;
      font-size: 11px;
      color: var(--el-text-color-disabled);
    }
  }

  /* ─── Main Panel ──────────────────────────────────── */
  .main-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--el-bg-color);
  }

  /* ─── Search Bar ──────────────────────────────────── */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    flex-shrink: 0;

    &__input-wrap {
      position: relative;
      flex: 1;
      max-width: 280px;
    }

    &__icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--el-text-color-placeholder);
      font-size: 14px;
      z-index: 1;
    }

    :deep(.search-bar__input) {
      .el-input__wrapper {
        padding-left: 36px;
        border-radius: 8px;
        box-shadow: 0 0 0 1px var(--el-border-color);
        transition: box-shadow 0.2s;

        &:hover,
        &.is-focus {
          box-shadow: 0 0 0 2px #f97316 !important;
        }
      }
    }
  }

  /* ─── Buttons ─────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 34px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    white-space: nowrap;

    &--primary {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }
    }

    &--ghost {
      background: var(--el-bg-color);
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color);

      &:hover {
        border-color: #f97316;
        color: #f97316;
        background: var(--el-color-primary-light-9);
      }
    }

    &--confirm {
      padding-right: 12px;
    }

    &__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      font-weight: 700;
      margin-left: 2px;
    }
  }

  /* ─── Table ───────────────────────────────────────── */
  .table-wrap {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 10px;
  }

  :deep(.house-table) {
    height: 100%;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    --el-table-bg-color: var(--el-bg-color);
    --el-table-tr-bg-color: var(--el-bg-color);
    --el-table-header-bg-color: var(--el-fill-color-lighter);
    --el-table-border-color: var(--el-border-color-light);
    --el-table-row-hover-bg-color: var(--el-fill-color-light);
    --el-table-text-color: var(--el-text-color-primary);
    --el-table-header-text-color: var(--el-text-color-secondary);

    .el-table__header-wrapper {
      th.el-table__cell {
        background: var(--el-fill-color-lighter);
        color: var(--el-text-color-secondary);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.3px;
        border-bottom: 1px solid var(--el-border-color-light);
        padding: 12px 0;
      }
    }

    .el-table__row {
      cursor: pointer;
      transition: background 0.15s;

      td {
        border-bottom-color: var(--el-border-color-lighter);
        padding: 13px 0;
      }

      &:hover > td {
        background: var(--el-fill-color-light) !important;
      }

      &.row--selected > td {
        background: var(--el-color-primary-light-9) !important;
      }
    }

    .el-checkbox__input.is-checked .el-checkbox__inner {
      background: #f97316;
      border-color: #f97316;
    }

    .el-checkbox__inner:hover {
      border-color: #f97316;
    }
  }

  /* ─── Cell Styles ─────────────────────────────────── */
  .cell-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__addr {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  .rental-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;

    &--whole {
      background: #fff3eb;
      color: #f97316;
    }

    &--room {
      background: #eef2ff;
      color: #6366f1;
    }
  }

  .cell-layout {
    display: flex;
    flex-direction: column;
    gap: 2px;

    &__type {
      font-size: 13px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }

    &__area {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  .room-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--el-fill-color);
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .cell-price {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 1px;
    padding-right: 16px;

    &__symbol {
      font-size: 11px;
      font-weight: 600;
      color: #f97316;
    }

    &__amount {
      font-size: 15px;
      font-weight: 700;
      color: #f97316;
      letter-spacing: -0.5px;
    }
  }

  /* ─── Pagination ──────────────────────────────────── */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-light);
    flex-shrink: 0;

    &__total {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }

    :deep(.el-pagination) {
      .el-pager li:not(.is-disabled).is-active {
        background: #f97316;
      }

      .btn-prev,
      .btn-next {
        border-radius: 6px;
      }
    }
  }

  /* ─── Footer ──────────────────────────────────────── */
  .picker-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__summary {
      font-size: 13px;
      color: var(--el-text-color-secondary);

      strong {
        color: #f97316;
        font-weight: 700;
      }
    }

    &__actions {
      display: flex;
      gap: 10px;
    }
  }

  /* ─── List Transition ─────────────────────────────── */
  .list-enter-active,
  .list-leave-active {
    transition: all 0.25s ease;
  }

  .list-enter-from {
    opacity: 0;
    transform: translateX(-12px);
  }

  .list-leave-to {
    opacity: 0;
    transform: translateX(12px);
  }
</style>
