<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getMyMessagePage, markMessageRead, markMessageReadBatch } from "@/api/sys-notice";
  import { NOTICE_MESSAGE_TYPE_HELPER } from "@/constants";
  import { message } from "@/utils/message";

  defineOptions({
    name: "MyNoticeMessage"
  });

  const loading = ref(false);
  const dataList = ref([]);
  const tableRef = ref();
  const selectedRows = ref([]);
  const selectedIds = computed(() => selectedRows.value.map(item => item?.id).filter(Boolean));

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left",
      width: 48
    },
    {
      label: "标题",
      prop: "title",
      minWidth: 200
    },
    {
      label: "内容",
      prop: "content",
      minWidth: 280,
      showOverflowTooltip: true
    },
    {
      label: "类型",
      prop: "msgType",
      minWidth: 140,
      formatter: ({ msgType }) => NOTICE_MESSAGE_TYPE_HELPER.getNameByCode(msgType)
    },
    {
      label: "时间",
      prop: "createTime",
      minWidth: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    {
      label: "已读",
      prop: "isRead",
      minWidth: 90,
      formatter: ({ isRead }) => (isRead ? "已读" : "未读")
    },
    {
      label: "操作",
      prop: "operation",
      width: 120,
      fixed: "right",
      slot: "operation"
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getMyMessagePage({
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
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

  function handleSelectionChange(rows) {
    selectedRows.value = rows || [];
  }

  async function handleRead(row) {
    if (!row?.id || row?.isRead) return;
    const { code } = await markMessageRead({ id: row.id });
    if (code === 0) {
      message("已读确认成功", { type: "success" });
      fetchList();
    }
  }

  async function handleBatchRead() {
    if (selectedIds.value.length === 0) {
      message("请先选择需要已读确认的消息", { type: "warning" });
      return;
    }
    const { code } = await markMessageReadBatch({ ids: selectedIds.value });
    if (code === 0) {
      message("批量已读确认成功", { type: "success" });
      tableRef.value?.getTableRef()?.clearSelection();
      fetchList();
    }
  }

  onMounted(() => {
    fetchList();
  });
</script>

<template>
  <div class="main">
    <PureTableBar title="个人消息" :columns="columns" @refresh="fetchList">
      <template #buttons>
        <el-button type="primary" :disabled="selectedIds.length === 0" @click="handleBatchRead">批量已读</el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          row-key="id"
          :border="true"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 82 }"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <el-button link type="primary" :size="size" :disabled="row?.isRead" @click="handleRead(row)">已读</el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
