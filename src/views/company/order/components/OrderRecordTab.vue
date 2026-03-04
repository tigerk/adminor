<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getCompanyOrderPage } from "@/api/company-order";
  import type { CompanyOrderRecordVo } from "@/types";

  const loading = ref(false);
  const dataList = ref<CompanyOrderRecordVo[]>([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "订单号", prop: "orderNo", minWidth: 180 },
    { label: "服务名称", prop: "productName", minWidth: 140 },
    { label: "服务编码", prop: "productCode", minWidth: 140 },
    { label: "单价（元）", prop: "unitPrice", minWidth: 110 },
    { label: "购买数量", prop: "quantity", minWidth: 100 },
    { label: "总金额（元）", prop: "totalAmount", minWidth: 120 },
    { label: "状态", prop: "statusName", minWidth: 100 },
    {
      label: "购买时间",
      prop: "purchaseTime",
      minWidth: 170,
      formatter: ({ purchaseTime }) => (purchaseTime ? dayjs(purchaseTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    { label: "备注", prop: "remark", minWidth: 220, showOverflowTooltip: true }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getCompanyOrderPage({
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
  <PureTableBar title="订购记录" :columns="columns" @refresh="fetchList">
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
