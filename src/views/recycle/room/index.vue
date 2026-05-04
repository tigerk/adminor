<script setup lang="ts">
  import { onMounted, reactive, ref, toRaw } from "vue";
  import { useRouter } from "vue-router";
  import type { PaginationProps } from "@pureadmin/table";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { getRoomList, restoreRoom } from "@/api/house/room";
  import type { RoomListVo, RoomQueryDto } from "@/types";
  import { LeaseModeEnumMeta, RentalTypeEnumMeta } from "@/types";
  import { LEASE_MODE_OPTIONS } from "@/constants/house";
  import "@/shared/owner/financePage.scss";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";

  defineOptions({
    name: "RoomRecycle"
  });

  type RoomRecycleQuery = RoomQueryDto & { deleted?: boolean };
  type RoomRecycleRow = RoomListVo & {
    deleteReason?: string;
    deleteBy?: string | number;
    deleteByName?: string;
    deleteAt?: string;
  };

  const router = useRouter();
  const queryFormRef = ref();
  const loading = ref(false);
  const tableSize = ref("default");
  const tableData = ref<RoomRecycleRow[]>([]);

  const queryForm = reactive<RoomRecycleQuery>({
    keywords: "",
    leaseMode: undefined,
    deleted: true,
    currentPage: "1",
    pageSize: "15"
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "状态",
      slot: "status",
      width: 100,
      fixed: "left"
    },
    {
      label: "房源类型",
      slot: "leaseMode",
      width: 130
    },
    {
      label: "小区/项目名称",
      prop: "communityName",
      minWidth: 160
    },
    {
      label: "房源地址",
      prop: "houseName",
      minWidth: 260
    },
    {
      label: "房号",
      prop: "roomNumber",
      width: 100
    },
    {
      label: "房型",
      slot: "layout",
      width: 150
    },
    {
      label: "面积",
      slot: "area",
      width: 100
    },
    {
      label: "所属门店",
      prop: "deptName",
      width: 140
    },
    {
      label: "删除原因",
      prop: "deleteReason",
      minWidth: 260
    },
    {
      label: "删除人",
      slot: "deleteBy",
      width: 150
    },
    {
      label: "删除时间",
      prop: "deleteAt",
      width: 180
    },
    {
      label: "操作",
      slot: "operation",
      fixed: "right",
      width: 150
    }
  ];

  function layoutText(row: RoomRecycleRow) {
    const layout = row.houseLayout;
    if (!layout) return "-";
    if (layout.layoutName) return layout.layoutName;
    return `${layout.bedroom || 0}室${layout.livingRoom || 0}厅${layout.kitchen || 0}厨${layout.bathroom || 0}卫`;
  }

  function leaseModeText(row: RoomRecycleRow) {
    if (row.leaseMode === LeaseModeEnumMeta.FOCUS.code) return LeaseModeEnumMeta.FOCUS.name;
    if (row.leaseMode === LeaseModeEnumMeta.SCATTER.code) {
      if (row.rentalType === RentalTypeEnumMeta.ENTIRE.code) return RentalTypeEnumMeta.ENTIRE.name;
      if (row.rentalType === RentalTypeEnumMeta.SHARED.code) return RentalTypeEnumMeta.SHARED.name;
      return LeaseModeEnumMeta.SCATTER.name;
    }
    return "-";
  }

  function leaseModeTagType(row: RoomRecycleRow) {
    if (row.leaseMode === LeaseModeEnumMeta.FOCUS.code) return "warning";
    if (row.rentalType === RentalTypeEnumMeta.SHARED.code) return "success";
    return "primary";
  }

  async function fetchData() {
    loading.value = true;
    queryForm.deleted = true;
    queryForm.currentPage = String(pagination.currentPage);
    queryForm.pageSize = String(pagination.pageSize);

    try {
      const { code, data, message } = await getRoomList(toRaw(queryForm));
      if (code !== 0) {
        ElMessage.error(message || "获取房间回收站失败");
        return;
      }
      tableData.value = (data?.list || []) as RoomRecycleRow[];
      pagination.total = Number(data?.total || 0);
      pagination.pageSize = Number(data?.pageSize || pagination.pageSize);
      pagination.currentPage = Number(data?.currentPage || pagination.currentPage);
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    pagination.currentPage = 1;
    fetchData();
  }

  function resetQuery() {
    queryForm.keywords = "";
    queryForm.leaseMode = undefined;
    queryForm.deleted = true;
    pagination.currentPage = 1;
    fetchData();
  }

  function handleSizeChange(size: number) {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    fetchData();
  }

  function handleCurrentChange(page: number) {
    pagination.currentPage = page;
    fetchData();
  }

  function openDetail(row: RoomRecycleRow) {
    if (!row.roomId) {
      ElMessage.warning("房间ID缺失，无法查看详情");
      return;
    }
    router.push({
      name: row.leaseMode === LeaseModeEnumMeta.FOCUS.code ? "FocusRoomDetail" : "ScatterRoomDetail",
      params: { roomId: row.roomId }
    });
  }

  function handleRestore(row: RoomRecycleRow) {
    ElMessageBox.prompt(`确认恢复 ${row.houseName || "-"} - ${row.roomNumber || "-"}？`, "恢复房间", {
      confirmButtonText: "确认恢复",
      cancelButtonText: "取消",
      inputType: "textarea",
      inputPlaceholder: "请输入恢复原因（可选）"
    }).then(({ value }) => {
      restoreRoom({ roomId: row.roomId, restoreReason: value?.trim() || "恢复误删房间" }).then(res => {
        if (res.code === 0) {
          ElMessage.success("房间已恢复");
          fetchData();
        } else {
          ElMessage.error(res.message || "恢复房间失败");
        }
      });
    });
  }

  onMounted(fetchData);
</script>

<template>
  <div class="pf-page room-recycle-page">
    <div class="filter-card -mb-2">
      <div class="filter-toolbar">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="房源类型">
            <el-select v-model="queryForm.leaseMode" placeholder="全部类型" clearable class="filter-input" @change="handleSearch">
              <el-option v-for="item in LEASE_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="queryForm.keywords"
              placeholder="项目名称/房间号/房源地址/标签"
              clearable
              class="filter-input"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="useRenderIcon(Search)" @click="handleSearch">查询</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <PureTableBar title="房间回收站" :columns="columns" @refresh="fetchData">
      <template #default="{ size, dynamicColumns }">
        <pure-table
          border
          row-key="roomId"
          alignWhole="center"
          showOverflowTooltip
          class="pf-table"
          :size="size ?? (tableSize as any)"
          :loading="loading"
          :loading-config="{ background: 'transparent' }"
          adaptive
          :adaptiveConfig="{ offsetBottom: 82 }"
          :data="tableData"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #status>
            <el-tag type="danger" effect="light">已删除</el-tag>
          </template>
          <template #leaseMode="{ row }">
            <el-tag :type="leaseModeTagType(row)" effect="light">{{ leaseModeText(row) }}</el-tag>
          </template>
          <template #layout="{ row }">
            <span>{{ layoutText(row) }}</span>
          </template>
          <template #area="{ row }">
            <span>{{ row.area ? `${row.area}㎡` : "-" }}</span>
          </template>
          <template #deleteBy="{ row }">
            <span>{{ row.deleteByName || row.deleteBy || "-" }}</span>
          </template>
          <template #operation="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="success" @click="handleRestore(row)">恢复</el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>
