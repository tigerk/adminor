<template>
  <el-dialog v-model="visible" title="选择房源" width="68vw" append-to-body :close-on-click-modal="false" :align-center="true" :draggable="true">
    <div class="house-picker-container">
      <div class="selected-side">
        <div class="side-header">
          <span class="font-bold">已选房源 ({{ selectedRows.length }})</span>
          <el-button v-if="selectedRows.length > 0" type="primary" link @click="clearAllSelection">清空</el-button>
        </div>
        <div class="selected-list">
          <div v-for="row in selectedRows" :key="row.houseId" class="selected-item">
            <div class="item-info">
              <div class="item-name">{{ row.houseName }}</div>
              <div class="item-sub">{{ row.addressText || "-" }} | {{ row.areaText }}</div>
            </div>
            <el-icon class="remove-icon" @click="handleRemoveTag(row)"><Close /></el-icon>
          </div>
          <el-empty v-if="selectedRows.length === 0" description="暂未选择" :image-size="40" />
        </div>
      </div>

      <div class="main-content">
        <div class="search-wrapper">
          <el-form :model="queryParams" inline>
            <el-form-item label="搜索">
              <el-input v-model="queryParams.keywords" placeholder="房源名称/地址" clearable style="width: 220px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-wrapper">
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="houseList"
            row-key="houseId"
            border
            style="width: 100%"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="房源信息" min-width="260">
              <template #default="{ row }">
                <div class="cell-stack">
                  <div>
                    <el-tag size="small">{{ row.rentalTypeText }}</el-tag>
                    <span class="font-bold ml-2">{{ row.houseName }}</span>
                  </div>
                  <div class="text-xs text-gray-500">{{ row.addressText || "-" }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="户型/面积" width="180">
              <template #default="{ row }">
                <div class="text-xs">{{ row.layoutText }}</div>
                <div class="text-xs text-gray-400">{{ row.areaText }}</div>
              </template>
            </el-table-column>
            <el-table-column label="覆盖房间数" width="100" align="center">
              <template #default="{ row }">{{ row.roomCount }}</template>
            </el-table-column>
            <el-table-column label="参考月租金" width="120">
              <template #default="{ row }">
                <span class="text-orange-500 font-bold">¥{{ row.priceText }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.currentPage"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :disabled="selectedRows.length === 0" @click="submitSelection">确认选择 ({{ selectedRows.length }})</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { nextTick, reactive, ref } from "vue";
  import { Close, Refresh, Search } from "@element-plus/icons-vue";
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
    if (index > -1) {
      selectedRows.value.splice(index, 1);
    }
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
    nextTick(() => {
      getList();
    });
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  .house-picker-container {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 16px;
    min-height: 58vh;
  }

  .selected-side {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 14px;
    background: var(--el-fill-color-extra-light);
    display: flex;
    flex-direction: column;
  }

  .side-header,
  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .selected-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: auto;
  }

  .selected-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
  }

  .item-name {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .item-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .remove-icon {
    cursor: pointer;
    color: var(--el-color-danger);
    margin-top: 2px;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-wrapper,
  .table-wrapper {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 14px;
    background: #fff;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  .cell-stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
