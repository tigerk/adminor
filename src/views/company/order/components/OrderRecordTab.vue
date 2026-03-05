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
    { label: "服务名称", prop: "productName", minWidth: 130 },
    { label: "服务编码", prop: "productCode", minWidth: 130 },
    { label: "单价（元）", prop: "unitPrice", minWidth: 100 },
    { label: "购买数量", prop: "quantity", minWidth: 90 },
    { label: "总金额（元）", prop: "totalAmount", minWidth: 110 },
    { label: "状态", prop: "statusName", minWidth: 90, slot: "statusName" },
    { label: "支付方式", prop: "payMethodName", minWidth: 100 },
    { label: "支付渠道", prop: "payChannel", minWidth: 100 },
    { label: "交易流水号", prop: "transactionNo", minWidth: 180, showOverflowTooltip: true },
    {
      label: "购买时间",
      prop: "purchaseTime",
      minWidth: 160,
      formatter: ({ purchaseTime }) => (purchaseTime ? dayjs(purchaseTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    {
      label: "支付时间",
      prop: "payTime",
      minWidth: 160,
      formatter: ({ payTime }) => (payTime ? dayjs(payTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    { label: "备注", prop: "remark", minWidth: 200, showOverflowTooltip: true }
  ];

  // 状态标签映射
  const statusTagMap: Record<number, "success" | "warning" | "danger" | "info"> = {
    1: "warning",
    2: "success",
    3: "info",
    4: "danger"
  };

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

  onMounted(fetchList);

  defineExpose({ refresh: fetchList });
</script>

<template>
  <div class="record-tab">
    <PureTableBar title="订购记录" :columns="columns" @refresh="fetchList">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          :border="false"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
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
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
  .record-tab {
    /* 覆盖 PureTableBar 默认的多余内外边距 */
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

    /* 去掉表格自带的外边框，让容器的 border 充当边框 */
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

      /* hover 行高亮，深色模式自动跟随 Element Plus 变量 */
      tr:hover > td.el-table__cell {
        background: var(--el-table-row-hover-bg-color) !important;
      }
    }

    /* 分页器紧凑化 */
    :deep(.el-pagination) {
      padding: 10px 0 12px;
      justify-content: flex-end;
    }
  }
</style>
