<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getTodoAdminPage } from "@/api/sys-notice";
  import { NOTICE_TODO_PRIORITY_HELPER, NOTICE_TODO_STATUS_HELPER, NOTICE_TODO_TYPE_HELPER } from "@/constants";

  defineOptions({
    name: "SysNoticeTodo"
  });

  const loading = ref(false);
  const dataList = ref([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
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
      prop: "todoType",
      minWidth: 140,
      formatter: ({ todoType }) => NOTICE_TODO_TYPE_HELPER.getNameByCode(todoType)
    },
    {
      label: "优先级",
      prop: "priority",
      minWidth: 100,
      formatter: ({ priority }) => NOTICE_TODO_PRIORITY_HELPER.getNameByCode(priority)
    },
    {
      label: "执行人",
      prop: "executorName",
      minWidth: 140,
      formatter: ({ executorName, userId }) => executorName || userId || "-"
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      formatter: ({ status }) => NOTICE_TODO_STATUS_HELPER.getNameByCode(status)
    },
    {
      label: "时间",
      prop: "createTime",
      minWidth: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getTodoAdminPage({
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

  onMounted(() => {
    fetchList();
  });
</script>

<template>
  <div class="main">
    <PureTableBar title="待办消息" :columns="columns" @refresh="fetchList">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          :border="true"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 110 }"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        />
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
