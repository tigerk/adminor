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

        <div class="table-wrapper">
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="roomList"
            row-key="roomId"
            border
            show-header
            style="width: 100%"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="房源信息" min-width="180">
              <template #default="{ row }">
                <el-space :size="2">
                  <div>
                    <el-tag size="small">{{ getOptionByCode([...RENTAL_TYPE_OPTIONS], row.rentalType).label }}</el-tag>
                    <span class="font-bold ml-2">{{ row.houseName }}</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ row.roomNumber || "整租房源" }}
                  </div>
                </el-space>
              </template>
            </el-table-column>
            <el-table-column label="房态" width="100" align="center">
              <template #default="{ row }">
                <el-tag>{{ getOptionByCode([...ROOM_STATUS_OPTIONS], row.roomStatus).label }}</el-tag>
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
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.currentPage"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[5, 10, 20, 30, 50]"
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

  // 获取列表数据
  const getList = async () => {
    loading.value = true;
    try {
      const res = await getRoomList(queryParams);

      // 关键修复：将字符串类型转换为数字类型
      roomList.value = res.data.list || [];
      total.value = Number(res.data.total) || 0;

      // 数据加载完成后，恢复当前页的选中状态
      await nextTick();
      restoreSelection();
    } catch (error) {
      console.error("获取房源列表失败:", error);
    } finally {
      loading.value = false;
    }
  };

  // 恢复当前页面的选中状态
  const restoreSelection = () => {
    if (selectedRows.value.length === 0) return;

    roomList.value.forEach(row => {
      const isSelected = selectedRows.value.some(selected => selected.roomId === row.roomId);
      if (isSelected) {
        nextTick(() => {
          tableRef.value?.toggleRowSelection(row, true);
        });
      }
    });
  };

  // 处理选择变化
  const handleSelectionChange = (selection: any[]) => {
    const currentPageIds = roomList.value.map(item => item.roomId);

    // 移除当前页中未选中的项
    selectedRows.value = selectedRows.value.filter(item => !currentPageIds.includes(item.roomId));

    // 添加当前页新选中的项
    selection.forEach(item => {
      if (!selectedRows.value.some(row => row.roomId === item.roomId)) {
        selectedRows.value.push(item);
      }
    });
  };

  // 移除单个选中项
  const handleRemoveTag = (row: any) => {
    const index = selectedRows.value.findIndex(item => item.roomId === row.roomId);
    if (index > -1) {
      selectedRows.value.splice(index, 1);
    }

    const currentRow = roomList.value.find(item => item.roomId === row.roomId);
    if (currentRow) {
      tableRef.value?.toggleRowSelection(currentRow, false);
    }
  };

  // 清空所有选择
  const clearAllSelection = () => {
    selectedRows.value = [];
    tableRef.value?.clearSelection();
  };

  // 点击行切换选中状态
  const handleRowClick = (row: any) => {
    tableRef.value?.toggleRowSelection(row);
  };

  // 查询
  const handleQuery = () => {
    queryParams.currentPage = 1;
    getList();
  };

  // 重置查询
  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.roomStatus = 0;
    queryParams.currentPage = 1;
    getList();
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    queryParams.currentPage = page;
    getList();
  };

  // 处理每页条数变化
  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size;
    queryParams.currentPage = 1;
    getList();
  };

  // 提交选择
  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };

  // 显示对话框
  const show = (initSelection?: any[]) => {
    visible.value = true;

    queryParams.currentPage = 1;
    queryParams.pageSize = 10;
    queryParams.keywords = "";
    queryParams.roomStatus = 0;

    nextTick(async () => {
      selectedRows.value = [];
      tableRef.value?.clearSelection();

      if (initSelection && initSelection.length > 0) {
        const recoveryRows = initSelection.map(item => ({
          ...item.extra,
          roomId: item.value || item.roomId
        }));
        selectedRows.value = recoveryRows;
      }

      await getList();
    });
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  .room-picker-container {
    display: flex;
    gap: 20px;
    min-height: 600px;

    .selected-side {
      width: 320px;
      flex-shrink: 0;
      border-right: 1px solid var(--el-border-color-lighter);
      display: flex;
      flex-direction: column;
      padding-right: 15px;

      .side-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        margin-bottom: 10px;
      }

      .selected-list {
        flex: 1;
        overflow-y: auto;
        max-height: 600px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: var(--el-fill-color-light);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--el-border-color);
          border-radius: 3px;

          &:hover {
            background: var(--el-border-color-dark);
          }
        }

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
              color: var(--el-text-color-primary);
            }

            .item-sub {
              font-size: 11px;
              color: var(--el-text-color-secondary);
              margin-top: 2px;
            }
          }

          .remove-icon {
            cursor: pointer;
            font-size: 14px;
            color: var(--el-text-color-placeholder);
            margin-left: 8px;
            transition: color 0.3s;
            flex-shrink: 0;
          }
        }
      }
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;

      .search-wrapper {
        margin-bottom: 10px;
        flex-shrink: 0;

        :deep(.el-form) {
          margin-bottom: 0;
        }

        :deep(.el-form-item) {
          margin-bottom: 0;
        }
      }

      .table-wrapper {
        flex: 1;
        overflow: hidden;

        :deep(.el-table) {
          height: 550px !important;
        }
      }

      .pagination-wrapper {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        padding: 10px 0;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
