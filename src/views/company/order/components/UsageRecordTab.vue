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
    { label: "服务名称", prop: "productName", minWidth: 140 },
    { label: "服务编码", prop: "productCode", minWidth: 140 },
    { label: "业务类型", prop: "bizType", minWidth: 120 },
    { label: "业务单号", prop: "bizNo", minWidth: 180 },
    { label: "使用数量", prop: "quantity", minWidth: 100 },
    { label: "状态", prop: "statusName", minWidth: 100 },
    {
      label: "使用时间",
      prop: "createTime",
      minWidth: 170,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    { label: "备注", prop: "remark", minWidth: 220, showOverflowTooltip: true }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getCompanyConsumePage({
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

  defineExpose({
    refresh: fetchList
  });
</script>

<template>
  <PureTableBar title="使用记录" :columns="columns" @refresh="fetchList">
    <template v-slot="{ size, dynamicColumns }">
      <pure-table
        row-key="id"
        :border="true"
        align-whole="center"
        table-layout="auto"
        :loading="loading"
        :size="size"
        adaptive
        :adaptiveConfig="{ offsetBottom: 160 }"
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
</template>
