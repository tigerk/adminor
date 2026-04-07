<template>
  <el-dialog
    v-model="visible"
    title="选择房间"
    width="68vw"
    append-to-body
    :close-on-click-modal="false"
    :align-center="true"
    :draggable="true"
    :show-close="true"
    class="room-picker-dialog"
  >
    <div class="room-picker-body">
      <!-- Left: Selected Panel -->
      <div class="selected-panel">
        <div class="selected-panel__header">
          <div class="selected-panel__header-left">
            <span class="selected-panel__label">已选房间</span>
            <span class="selected-panel__badge" :class="{ active: selectedRows.length > 0 }">
              {{ selectedRows.length }}
            </span>
          </div>
          <button v-if="selectedRows.length > 0" class="clear-btn" @click="clearAllSelection">清空全部</button>
        </div>

        <div class="selected-panel__body">
          <transition-group name="list" tag="div" class="selected-list">
            <div v-for="row in selectedRows" :key="row.roomId" class="selected-card">
              <div class="selected-card__avatar">
                {{ row.roomNumber ? row.roomNumber.charAt(0) : "整" }}
              </div>
              <div class="selected-card__info">
                <div class="selected-card__name">{{ row.houseName }}</div>
                <div class="selected-card__meta">
                  <span class="selected-card__room">
                    {{ row.roomNumber ? row.roomNumber + "室" : "整租" }}
                  </span>
                  <span class="sep">·</span>
                  <span class="selected-card__price">¥{{ row.price }}</span>
                </div>
              </div>
              <button class="selected-card__remove" @click="handleRemoveTag(row)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </transition-group>

          <div v-if="selectedRows.length === 0" class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="25" height="25" rx="4" stroke="currentColor" stroke-width="2.5" />
                <rect x="45" y="10" width="25" height="25" rx="4" stroke="currentColor" stroke-width="2.5" />
                <rect x="10" y="45" width="25" height="25" rx="4" stroke="currentColor" stroke-width="2.5" />
                <rect x="45" y="45" width="25" height="25" rx="4" stroke="currentColor" stroke-width="2.5" />
              </svg>
            </div>
            <p class="empty-state__text">暂未选择房间</p>
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
            <el-input v-model="queryParams.keywords" placeholder="搜索房源名称或房间号..." clearable class="search-bar__input" @keyup.enter="handleQuery" />
          </div>
          <div class="search-bar__select-wrap">
            <el-select v-model="queryParams.occupancyStatus" placeholder="全部状态" clearable class="search-bar__select">
              <el-option v-for="item in roomStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
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
            :data="roomList"
            row-key="roomId"
            style="width: 100%"
            class="room-table"
            :row-class-name="getRowClassName"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick"
          >
            <el-table-column type="selection" width="50" :reserve-selection="true" />

            <el-table-column label="房源信息" min-width="220">
              <template #default="{ row }">
                <div class="cell-info">
                  <div class="cell-info__top">
                    <span class="rental-tag" :class="getRentalTagClass(row.rentalType)">
                      {{ getRentalTypeText(row.rentalType) }}
                    </span>
                    <span class="cell-info__name">{{ row.houseName }}</span>
                  </div>
                  <div class="cell-info__room">
                    <el-icon style="font-size: 11px"><Grid /></el-icon>
                    {{ row.roomNumber || "整租房源" }}
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="房态" width="100" align="center">
              <template #default="{ row }">
                <span class="status-tag" :class="getStatusClass(row)">
                  {{ getRoomStatusText(row) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="户型 / 面积" width="160">
              <template #default="{ row }">
                <div class="cell-layout">
                  <span class="cell-layout__type">{{ row.houseLayout?.bedroom }}室{{ row.houseLayout?.livingRoom }}厅</span>
                  <span class="cell-layout__area">
                    {{ row.area }}m²
                    <span v-if="row.direction" class="cell-layout__dir">· {{ row.direction }}</span>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="月租金" width="120" align="right">
              <template #default="{ row }">
                <div class="cell-price">
                  <span class="cell-price__symbol">¥</span>
                  <span class="cell-price__amount">{{ row.price }}</span>
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
            :page-sizes="[5, 10, 20, 30, 50]"
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
            个房间
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
  import { Close, Grid, Refresh, Search } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import { ROOM_STATUS_OPTIONS } from "@/constants";
  import { getRentalTypeLabel, getRoomStatus } from "@/utils/house";
  import type { RoomQueryDto } from "@/types";

  const emit = defineEmits(["confirm"]);
  const visible = ref(false);
  const loading = ref(false);
  const roomList = ref([]);
  const total = ref(0);
  const tableRef = ref();
  const selectedRows = ref<any[]>([]);
  const roomStatusOptions = [...ROOM_STATUS_OPTIONS];

  const queryParams = reactive({
    currentPage: 1,
    pageSize: 10,
    keywords: "",
    occupancyStatus: 0
  });

  const getRentalTypeText = (rentalType?: number) => getRentalTypeLabel(rentalType);

  const getRoomStatusText = (row: any) => {
    if (!row) return "-";
    return getRoomStatus(row).text;
  };

  const getRentalTagClass = (rentalType?: number) => {
    return rentalType === 1 ? "rental-tag--whole" : "rental-tag--room";
  };

  const getStatusClass = (row: any) => {
    const status = getRoomStatus(row);
    const map: Record<string, string> = {
      vacant: "status-tag--vacant",
      occupied: "status-tag--occupied",
      reserved: "status-tag--reserved"
    };
    return map[status.cls] || "status-tag--default";
  };

  const getRowClassName = ({ row }: { row: any }) => {
    return selectedRows.value.some(r => r.roomId === row.roomId) ? "row--selected" : "";
  };

  const getList = async () => {
    loading.value = true;
    try {
      const requestParams: RoomQueryDto = {
        ...queryParams,
        currentPage: String(queryParams.currentPage),
        pageSize: String(queryParams.pageSize)
      };
      const res = await getRoomList(requestParams);
      roomList.value = res.data.list || [];
      total.value = Number(res.data.total) || 0;
      await nextTick();
      restoreSelection();
    } catch (error) {
      console.error("获取房源列表失败:", error);
    } finally {
      loading.value = false;
    }
  };

  const restoreSelection = () => {
    if (selectedRows.value.length === 0) return;
    roomList.value.forEach(row => {
      const isSelected = selectedRows.value.some(selected => selected.roomId === row.roomId);
      if (isSelected) {
        nextTick(() => tableRef.value?.toggleRowSelection(row, true));
      }
    });
  };

  const handleSelectionChange = (selection: any[]) => {
    const currentPageIds = roomList.value.map(item => item.roomId);
    selectedRows.value = selectedRows.value.filter(item => !currentPageIds.includes(item.roomId));
    selection.forEach(item => {
      if (!selectedRows.value.some(row => row.roomId === item.roomId)) {
        selectedRows.value.push(item);
      }
    });
  };

  const handleRemoveTag = (row: any) => {
    const index = selectedRows.value.findIndex(item => item.roomId === row.roomId);
    if (index > -1) selectedRows.value.splice(index, 1);
    const currentRow = roomList.value.find(item => item.roomId === row.roomId);
    if (currentRow) tableRef.value?.toggleRowSelection(currentRow, false);
  };

  const clearAllSelection = () => {
    selectedRows.value = [];
    tableRef.value?.clearSelection();
  };

  const handleRowClick = (row: any) => {
    tableRef.value?.toggleRowSelection(row);
  };

  const handleQuery = () => {
    queryParams.currentPage = 1;
    getList();
  };

  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.occupancyStatus = 0;
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

  const show = (initSelection?: any[]) => {
    visible.value = true;
    queryParams.currentPage = 1;
    queryParams.pageSize = 10;
    queryParams.keywords = "";
    queryParams.occupancyStatus = 0;

    nextTick(async () => {
      selectedRows.value = [];
      tableRef.value?.clearSelection();
      if (initSelection && initSelection.length > 0) {
        selectedRows.value = initSelection.map(item => ({
          ...item.extra,
          roomId: item.value || item.roomId
        }));
      }
      await getList();
    });
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  /* ─── Dialog Override ─────────────────────────────── */
  :deep(.room-picker-dialog) {
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
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    &__left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    &__icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 15px;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
      flex-shrink: 0;
    }

    &__title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.2px;
    }

    &__subtitle {
      display: none;
    }

    &__close {
      cursor: pointer;
      font-size: 16px;
      color: #bbb;
      transition: color 0.2s;
      padding: 4px;
      border-radius: 6px;

      &:hover {
        color: #666;
        background: #f5f5f5;
      }
    }
  }

  /* ─── Body Layout ─────────────────────────────────── */
  .room-picker-body {
    display: grid;
    grid-template-columns: 270px 1fr;
    height: 70vh;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
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
      padding: 10px 14px 8px;
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
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--el-bg-color);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s;

    &:hover {
      border-color: #fbd5bc;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.08);
    }

    &__avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #fff3eb, #ffe4cc);
      color: #f97316;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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
      margin-top: 2px;
      font-size: 11px;
    }

    &__room {
      color: #888;
    }

    &__price {
      color: #f97316;
      font-weight: 600;
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
    padding: 10px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    flex-shrink: 0;

    &__input-wrap {
      position: relative;
      flex: 1;
      max-width: 240px;
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

    :deep(.search-bar__select) {
      width: 130px;

      .el-input__wrapper {
        border-radius: 8px;
        box-shadow: 0 0 0 1px var(--el-border-color);

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

  :deep(.room-table) {
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
        padding: 9px 0;
      }
    }

    .el-table__row {
      cursor: pointer;

      td {
        border-bottom-color: var(--el-border-color-lighter);
        padding: 9px 0;
        transition: background 0.15s;
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

    &__room {
      display: flex;
      align-items: center;
      gap: 4px;
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

  .status-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;

    &--vacant {
      background: #ecfdf5;
      color: #10b981;
    }

    &--occupied {
      background: #fef2f2;
      color: #ef4444;
    }

    &--reserved {
      background: #fffbeb;
      color: #f59e0b;
    }

    &--default {
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
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

    &__dir {
      color: var(--el-text-color-disabled);
    }
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
    padding: 8px 16px;
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
