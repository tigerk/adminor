<template>
  <el-dialog v-model="visible" title="选择房源" width="65vw" append-to-body :close-on-click-modal="false" :align-center="true" :draggable="true">
    <div class="room-picker-container">
      <div class="selected-side">
        <div class="side-header">
          <span class="font-bold">已选房源 ({{ selectedRows.length }})</span>
          <el-button v-if="selectedRows.length > 0" type="primary" link @click="clearAllSelection">清空</el-button>
        </div>
        <div class="selected-list">
          <div v-for="row in selectedRows" :key="row.roomId" class="selected-item">
            <div class="item-info">
              <div class="item-name">{{ row.houseName }}</div>
              <div class="item-sub">{{ row.roomNumber ? row.roomNumber + "室" : "整租" }} | ¥{{ row.price }}</div>
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
              <el-input v-model="queryParams.keywords" placeholder="房源名称/房间号" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.roomStatus" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="item in roomStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
              <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="roomList"
          row-key="roomId"
          height="500px"
          border
          show-header
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
        >
          <el-table-column type="selection" width="45" :reserve-selection="true" />
          <el-table-column label="房源信息" min-width="180">
            <template #default="{ row }">
              <el-space>
                <el-tag size="small">{{ getOptionByCode([...RENTAL_TYPE_OPTIONS], row.rentalType).label }}</el-tag>
                <div class="font-bold">
                  {{ row.houseName }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ row.roomNumber || "整租房源" }}
                </div>
              </el-space>

            </template>
          </el-table-column>
          <el-table-column label="房态" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ getOptionByCode([...ROOM_STATUS_OPTIONS], row.roomStatus).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="户型/面积" width="140">
            <template #default="{ row }">
              <div class="text-xs">{{ row.houseLayout?.bedroom }}室{{ row.houseLayout?.livingRoom }}厅</div>
              <div class="text-xs text-gray-400">{{ row.area }}m² | {{ row.direction }}</div>
            </template>
          </el-table-column>
          <el-table-column label="租金(元/月)" width="100">
            <template #default="{ row }">
              <span class="text-orange-500 font-bold">¥{{ row.price }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="queryParams.currentPage"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            small
            layout="total, prev, pager, next"
            @current-change="getList"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedRows.length === 0" @click="submitSelection">确认选择</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { nextTick, reactive, ref } from "vue";
  import { Close, Refresh, Search } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import { getOptionByCode, RENTAL_TYPE_OPTIONS, ROOM_STATUS_OPTIONS } from "@/constants";

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
    roomStatus: 0
  });

  const getList = async () => {
    loading.value = true;
    try {
      const res = await getRoomList(queryParams);
      roomList.value = res.data.list || [];
      total.value = res.data.total || 0;
    } finally {
      loading.value = false;
    }
  };

  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection;
  };

  const handleRemoveTag = (row: any) => {
    tableRef.value?.toggleRowSelection(row, false);
  };

  const clearAllSelection = () => {
    tableRef.value?.clearSelection();
  };

  const handleRowClick = (row: any) => {
    tableRef.value.toggleRowSelection(row);
  };

  const handleQuery = () => {
    queryParams.currentPage = 1;
    getList();
  };

  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.roomStatus = 0;
    handleQuery();
  };

  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  const show = (initSelection?: any[]) => {
    visible.value = true;
    nextTick(async () => {
      tableRef.value?.clearSelection();
      if (initSelection && initSelection.length > 0) {
        // 这里的 mapping 需要对应您在 tenantCreateForm 传入的结构
        const recoveryRows = initSelection.map(item => ({
          ...item.extra,
          roomId: item.value || item.roomId
        }));
        recoveryRows.forEach(row => {
          tableRef.value?.toggleRowSelection(row, true);
        });
        selectedRows.value = recoveryRows;
      } else {
        selectedRows.value = [];
      }
      handleQuery();
    });
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  .room-picker-container {
    display: flex;
    gap: 20px;

    .selected-side {
      width: 320px;
      border-right: 1px solid var(--el-border-color-lighter);
      display: flex;
      flex-direction: column;
      padding-right: 15px;
      height: 550px;

      .side-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        margin-bottom: 10px;
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .selected-list {
        flex: 1;
        overflow-y: auto;

        .selected-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          margin-bottom: 8px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            background: var(--el-color-primary-light-9);
            .remove-icon {
              color: var(--el-color-danger);
            }
          }

          .item-info {
            flex: 1;
            overflow: hidden;
            .item-name {
              font-size: 13px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .item-sub {
              font-size: 11px;
              color: var(--el-text-color-secondary);
            }
          }

          .remove-icon {
            cursor: pointer;
            font-size: 14px;
            color: var(--el-text-color-placeholder);
            margin-left: 8px;
          }
        }
      }
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .search-wrapper {
        margin-bottom: 15px;
        :deep(.el-form-item) {
          margin-bottom: 0;
        }
      }
    }
  }
</style>
