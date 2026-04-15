<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getCompanyConsumePage } from "@/api/company-order";
  import type { CompanyConsumeRecordVo } from "@/types";

  const loading = ref(false);
  const dataList = ref<CompanyConsumeRecordVo[]>([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "流水号", prop: "consumeNo", minWidth: 180 },
    { label: "服务名称", prop: "productName", minWidth: 130 },
    { label: "服务编码", prop: "productCode", minWidth: 130 },
    { label: "业务类型", prop: "bizType", minWidth: 110, slot: "bizType" },
    { label: "业务单号", prop: "bizNo", minWidth: 170 },
    { label: "使用数量", prop: "quantity", minWidth: 90 },
    { label: "状态", prop: "statusName", minWidth: 90, slot: "statusName" },
    {
      label: "使用时间",
      prop: "createAt",
      minWidth: 160,
      formatter: ({ createAt }) => (createAt ? dayjs(createAt).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    { label: "备注", prop: "remark", minWidth: 200, showOverflowTooltip: true }
  ];

  const statusTagMap: Record<number, "success" | "warning" | "danger" | "info"> = {
    1: "success",
    2: "danger",
    3: "warning"
  };

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getCompanyConsumePage({
        currentPage: String(pagination.currentPage),
        pageSize: String(pagination.pageSize)
      });
      dataList.value = data?.list ?? [];
      pagination.total = Number(data?.total ?? 0);
      pagination.pageSize = Number(data?.pageSize ?? pagination.pageSize);
      pagination.currentPage = Number(data?.currentPage ?? pagination.currentPage);
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    fetchList();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    fetchList();
  }

  onMounted(fetchList);

  defineExpose({ refresh: fetchList });
</script>

<template>
  <div class="record-tab">
    <PureTableBar title="使用记录" :columns="columns" @refresh="fetchList">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          :border="false"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 92 }"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-secondary)',
            fontWeight: '600',
            fontSize: '13px',
            borderBottom: '1px solid var(--el-border-color-lighter)'
          }"
          :cell-style="{
            color: 'var(--el-text-color-primary)',
            fontSize: '13px'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #statusName="{ row }">
            <el-tag :type="statusTagMap[row.status] ?? 'info'" size="small" round effect="light">
              {{ row.statusName || "-" }}
            </el-tag>
          </template>
          <template #bizType="{ row }">
            <el-tag size="small" effect="plain" round>
              {{ row.bizType || "-" }}
            </el-tag>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
  .record-tab {
    :deep(.pure-table-bar) {
      padding: 12px 14px 0;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
    }

    :deep(.pure-table-bar-title) {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    :deep(.el-table) {
      --el-table-border-color: var(--el-border-color-lighter);

      &::before {
        display: none;
      }

      th.el-table__cell {
        padding: 8px 0;
      }

      td.el-table__cell {
        padding: 9px 0;
      }

      tr:hover > td.el-table__cell {
        background: var(--el-table-row-hover-bg-color) !important;
      }
    }

    :deep(.el-pagination) {
      padding: 10px 0 12px;
      justify-content: flex-end;
    }
  }
</style>
