<template>
  <el-dialog v-model="visible" title="选择房源" width="55vw" append-to-body :close-on-click-modal="false" :align-center="true" :lock-scroll="true">
    <div class="search-wrapper">
      <el-form :model="queryParams" label-width="70px">
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="快速搜索">
              <el-input v-model="queryParams.keywords" placeholder="房源名称 / 房间号" :prefix-icon="Search" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="房源状态">
              <el-select v-model="queryParams.roomStatus" placeholder="全部状态" clearable class="w-full">
                <el-option v-for="item in roomStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6" class="flex justify-end items-start group-buttons">
            <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-table ref="tableRef" v-loading="loading" :data="roomList" row-key="roomId" height="500px" @selection-change="handleSelectionChange" @row-click="handleRowClick">
      <el-table-column type="selection" width="55" :reserve-selection="true" />

      <el-table-column label="房源信息" min-width="200">
        <template #default="{ row }">
          <div class="font-bold">{{ row.houseName }}</div>
          <div class="text-xs text-gray-500">
            {{ row.roomNumber ? "房间号：" + row.roomNumber : "整租房源" }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="户型/面积" width="150">
        <template #default="{ row }">
          <div>{{ row.houseLayout?.bedroom }}室{{ row.houseLayout?.livingRoom }}厅</div>
          <div class="text-xs">{{ row.area }}m² | {{ row.direction }}</div>
        </template>
      </el-table-column>

      <el-table-column label="租金(元/月)" width="130">
        <template #default="{ row }">
          <span class="text-orange-500 font-bold">¥{{ row.price }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.roomStatus === 0 ? 'success' : 'info'">
            {{ row.roomStatusName }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="queryParams.currentPage"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="getList"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-space>
          <el-text v-if="selectedRows.length > 0">
            当前已选
            <b class="text-primary">{{ selectedRows.length }}</b>
            个房源
          </el-text>
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :disabled="selectedRows.length === 0" @click="submitSelection">确认选择</el-button>
        </el-space>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { nextTick, reactive, ref } from "vue";
  import { Refresh, Search } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import { RoomListQueryProps } from "@/types";
  import { ROOM_STATUS_OPTIONS } from "@/constants";

  const props = defineProps<{
    multiple?: boolean;
  }>();

  const emit = defineEmits(["confirm"]);

  const visible = ref(false);
  const loading = ref(false);
  const roomList = ref([]);
  const total = ref(0);
  const tableRef = ref();
  const roomStatusOptions = [...ROOM_STATUS_OPTIONS];

  // 存储所有已选中的行对象（跨页汇总结果）
  const selectedRows = ref([]);
  // 核心：维护一个用于比对回显的 ID 集合
  const persistentIds = ref<Set<number>>(new Set());

  const queryParams = reactive<RoomListQueryProps>({
    currentPage: 1,
    pageSize: 10,
    keywords: "",
    roomStatus: 0
  });

  /** 获取列表数据 */
  const getList = async () => {
    loading.value = true;
    try {
      const res = await getRoomList(queryParams);
      roomList.value = res.data.list || [];
      total.value = res.data.total || 0;

      // 关键：翻页后，必须在 nextTick 显式告诉表格哪些行要勾选
      nextTick(() => {
        syncTableSelection();
      });
    } finally {
      loading.value = false;
    }
  };

  /** 同步表格勾选状态 */
  const syncTableSelection = () => {
    if (!tableRef.value || !roomList.value.length) return;

    roomList.value.forEach(row => {
      const rowId = Number(row.roomId);
      // 如果当前行的 ID 在持久化集合中，则勾选
      if (persistentIds.value.has(rowId)) {
        tableRef.value.toggleRowSelection(row, true);
      }
    });
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

  /** 勾选回调 */
  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection;
    // 同步更新持久化 ID 集合
    // 当用户在表格内手动勾选/取消时，更新 Set 确保翻页回显逻辑正确
    const currentIds = selection.map(item => Number(item.roomId));

    // 仅在手动操作导致的改变时同步 ID 集合
    // 这里需要注意：如果 selection 为空且本页确实有数据，说明是本页全取消了
    persistentIds.value = new Set(currentIds);
  };

  /** 行点击 */
  const handleRowClick = (row: any) => {
    tableRef.value.toggleRowSelection(row);
  };

  /** 确认提交 */
  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  /** * 暴露给父组件的方法
   * @param initSelection 传入格式必须包含 roomId 字段
   */
  const show = (initSelection?: any[]) => {
    visible.value = true;

    // 1. 初始化 ID 持久化集合
    persistentIds.value.clear();
    if (initSelection && initSelection.length > 0) {
      initSelection.forEach(item => {
        const id = item.value || item.roomId; // 兼容您传入的 roomSelection 格式
        if (id) persistentIds.value.add(Number(id));
      });
    }

    // 2. 彻底清除表格上一次打开时的缓存状态
    nextTick(() => {
      tableRef.value?.clearSelection();
      // 3. 执行查询
      handleQuery();
    });
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  .search-wrapper {
    background-color: var(--el-fill-color-light);
    padding: 18px 18px 0 18px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);

    .group-buttons {
      height: 32px;
      margin-bottom: 18px;
    }
  }

  :deep(.el-table) {
    .font-bold {
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }
    .text-xs {
      color: var(--el-text-color-secondary);
    }
    .el-table__row {
      cursor: pointer;
    }
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
</style>
