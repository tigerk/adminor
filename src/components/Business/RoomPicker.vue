<template>
  <el-dialog v-model="visible" title="选择房源" width="55vw" append-to-body :close-on-click-modal="false" :align-center="true" :lock-scroll="true">
    <el-form :inline="true" :model="queryParams" class="mb-4">
      <el-form-item label="关键字">
        <el-input v-model="queryParams.keywords" placeholder="房源名称/房间号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.roomStatus" placeholder="房源状态" clearable>
          <el-option v-for="item in roomStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table ref="tableRef" v-loading="loading" :data="roomList" row-key="roomId" height="550px" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" :reserve-selection="true" />
      <el-table-column label="房源信息" min-width="200">
        <template #default="{ row }">
          <div class="font-bold">{{ row.houseName }}</div>
          <div class="text-xs text-gray-500">{{ row.roomNumber ? "房间号：" + row.roomNumber : "整租" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="户型/面积" width="150">
        <template #default="{ row }">
          <div>{{ row.houseLayout?.bedroom }}室{{ row.houseLayout?.livingRoom }}厅</div>
          <div class="text-xs">{{ row.area }}m² | {{ row.direction }}</div>
        </template>
      </el-table-column>
      <el-table-column label="租金(元/月)" width="120">
        <template #default="{ row }">
          <span class="text-orange-500 font-bold">¥{{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag>
            {{ row.roomStatusName }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" layout="total, prev, pager, next" @current-change="getList" />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="selectedRows.length === 0" @click="submitSelection">确认选择 ({{ selectedRows.length }})</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import { Refresh, Search } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import { RoomListQueryProps } from "@/types";
  import { ROOM_STATUS_OPTIONS } from "@/constants";

  const props = defineProps<{
    multiple?: boolean; // 是否允许多选
  }>();

  const emit = defineEmits(["confirm"]);

  const visible = ref(false);
  const loading = ref(false);
  const roomList = ref([]);
  const total = ref(0);
  const selectedRows = ref([]);
  const tableRef = ref();
  const roomStatusOptions = [...ROOM_STATUS_OPTIONS];

  const queryParams = reactive<RoomListQueryProps>({
    currentPage: 1,
    pageSize: 10,
    keywords: "",
    roomStatus: 0 // 空置房源
  });

  // 获取列表数据
  const getList = async () => {
    loading.value = true;
    try {
      const res = await getRoomList(queryParams);
      roomList.value = res.data.list;
      total.value = res.data.total;
    } finally {
      loading.value = false;
    }
  };

  const handleQuery = () => {
    queryParams.currentPage = 1;
    getList();
  };

  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.roomStatus = 1;
    handleQuery();
  };

  const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection;
  };

  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  // 暴露给父组件的方法
  const show = (initSelected?: any[]) => {
    visible.value = true;
    handleQuery();
    // 如果需要回显已选中的行，可以在这里逻辑处理 tableRef.value.toggleRowSelection
  };

  defineExpose({ show });
</script>
