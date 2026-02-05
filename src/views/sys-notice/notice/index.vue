<script setup lang="ts">
  import { ref, reactive, onMounted } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getNoticePage } from "@/api/sys-notice";
  import { NOTICE_NOTICE_TYPE_HELPER } from "@/constants";

  defineOptions({
    name: "SysNoticeNotice"
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
      prop: "noticeType",
      minWidth: 140,
      formatter: ({ noticeType }) => NOTICE_NOTICE_TYPE_HELPER.getNameByCode(noticeType)
    },
    {
      label: "时间",
      prop: "publishTime",
      minWidth: 180,
      formatter: ({ publishTime }) => (publishTime ? dayjs(publishTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getNoticePage({
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
    <PureTableBar title="系统公告" :columns="columns" @refresh="fetchList">
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
