<script setup lang="ts">
  import { onMounted, ref, watch } from "vue";
  import { useRoute } from "vue-router";
  import { useScatterRoom } from "@/views/house/scatter/scatterRoom/utils/hook";
  import RoomStatusGrid from "../../components/RoomGrid/RoomStatusGrid.vue";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import RoomFilterBar from "@/shared/house/RoomFilterBar.vue";
  import More from "~icons/ep/more-filled";

  defineOptions({
    name: "ScatterRoom"
  });

  const route = useRoute();

  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();
  const {
    queryForm,
    onBack,
    loading,
    roomTableList,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange,
    rentalTypeTabs,
    roomStatusTotal,
    handleRentalTypeClick,
    isRentalTypeActive,
    handleStatusClick,
    isStatusActive,
    displayModeToList,
    displayModeText,
    columns,
    handleDisplayClick,
    handleRoomAction,
    handleRoomDropdownCommand,
    isRoomAvailable
  } = useScatterRoom();

  const tableSize = ref("default");

  function handleTableDropdownCommand(row, command) {
    handleRoomDropdownCommand(row, command);
  }

  function searchFromFirstPage() {
    pagination.currentPage = 1;
    queryForm.currentPage = "1";
    onSearch();
  }

  function applyRouteQuery() {
    queryForm.occupancyStatus = typeof route.query.occupancyStatus === "string" && route.query.occupancyStatus !== "" ? Number(route.query.occupancyStatus) : undefined;
    queryForm.vacancyDaysMin = typeof route.query.vacancyDaysMin === "string" && route.query.vacancyDaysMin !== "" ? Number(route.query.vacancyDaysMin) : undefined;
    queryForm.vacancyDaysMax = typeof route.query.vacancyDaysMax === "string" && route.query.vacancyDaysMax !== "" ? Number(route.query.vacancyDaysMax) : undefined;
    if (queryForm.occupancyStatus === 0) {
      queryForm.locked = undefined;
      queryForm.closed = undefined;
    }
  }

  onMounted(() => {
    applyRouteQuery();
    if (route.query.occupancyStatus || route.query.vacancyDaysMin || route.query.vacancyDaysMax) {
      onSearch();
    }
  });

  watch(
    () => route.query,
    () => {
      applyRouteQuery();
      onSearch();
    }
  );
</script>

<template>
  <div class="main">
    <el-row class="bg-bg_color w-full p-4 overflow-auto">
      <el-col :span="12">
        <el-page-header @back="onBack">
          <template #content>
            <div class="flex items-center">
              <span class="text-large font-600 mr-3">整/合租列表</span>
              <el-tag>{{ displayModeText }}</el-tag>
            </div>
          </template>
        </el-page-header>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-button plain @click="handleDisplayClick">
          <IconifyIconOnline icon="flat-color-icons:department" class="mr-1" />
          {{ displayModeToList ? "切换房态模式" : "切换列表模式" }}
        </el-button>
        <el-dropdown class="pl-2">
          <el-button type="primary" color="#626aef" :dark="true">
            添加房源 &nbsp;
            <IconifyIconOnline icon="ep:arrow-down-bold" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openEntireEditDialog('新增', undefined, onSearch)">整租房源</el-dropdown-item>
              <el-dropdown-item @click="openShareEditDialog('新增', undefined, onSearch)">合租房源</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
    </el-row>

    <RoomFilterBar
      v-model="queryForm.keywords"
      :rental-type-items="rentalTypeTabs"
      :status-items="roomStatusTotal"
      :is-rental-type-active="isRentalTypeActive"
      :is-status-active="isStatusActive"
      @rental-type-click="handleRentalTypeClick"
      @status-click="handleStatusClick"
      @search="searchFromFirstPage"
      @reset-keyword="searchFromFirstPage"
    />

    <!-- 列表模式 -->
    <el-row v-if="displayModeToList" class="bg-bg_color w-full p-4 pt-[12px] overflow-auto">
      <pure-table
        border
        row-key="id"
        alignWhole="center"
        showOverflowTooltip
        :size="tableSize as any"
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 92 }"
        :data="roomTableList"
        :columns="columns"
        :pagination="pagination"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <div class="room-table-actions">
            <el-button link type="primary" @click="handleRoomAction(row, 'view')">查看</el-button>
            <el-button link type="primary" :disabled="!isRoomAvailable(row)" @click="handleRoomAction(row, 'booking')">预约</el-button>
            <el-button link type="primary" :disabled="!isRoomAvailable(row)" @click="handleRoomAction(row, 'tenant')">签约</el-button>
            <el-dropdown :hide-on-click="false" popper-class="action-dropdown" trigger="click" @command="command => handleTableDropdownCommand(row, command)">
              <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="lock" :disabled="row.locked">锁房</el-dropdown-item>
                  <el-dropdown-item command="unlock" :disabled="!row.locked">解锁</el-dropdown-item>
                  <el-dropdown-item command="close" :disabled="row.closed">关闭</el-dropdown-item>
                  <el-dropdown-item command="open" :disabled="!row.closed">开启</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span class="text-danger">删除房间</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </pure-table>
    </el-row>

    <!-- 房态模式 -->
    <el-row v-if="!displayModeToList">
      <el-col :span="24">
        <RoomStatusGrid v-model="queryForm" />
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }

  .room-table-actions {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    width: 100%;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
</style>
