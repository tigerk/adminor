<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { createCompanyOrder, getCompanyProductList } from "@/api/company-order";
  import type { CompanyProductOrderVo } from "@/types";
  import { message } from "@/utils/message";

  const loading = ref(false);
  const dataList = ref<CompanyProductOrderVo[]>([]);

  const columns: TableColumnList = [
    { label: "服务名称", prop: "productName", minWidth: 160 },
    { label: "服务编码", prop: "productCode", minWidth: 140 },
    { label: "单价（元）", prop: "unitPrice", minWidth: 120 },
    { label: "单位", prop: "unit", minWidth: 90 },
    { label: "最小购买数量", prop: "minQuantity", minWidth: 120 },
    { label: "剩余配额", prop: "remainQuota", minWidth: 110 },
    { label: "总配额", prop: "totalQuota", minWidth: 100 },
    { label: "已用配额", prop: "usedQuota", minWidth: 100 },
    { label: "介绍", prop: "description", minWidth: 220, showOverflowTooltip: true },
    { label: "操作", prop: "operation", width: 120, fixed: "right", slot: "operation" }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getCompanyProductList();
      dataList.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function handleOrder(row: CompanyProductOrderVo) {
    if (!row?.id) return;
    const quantity = Number(row.minQuantity || 1);
    const res = await createCompanyOrder({
      productId: row.id,
      quantity
    });
    if (res.code === 0) {
      message("下单成功", { type: "success" });
      fetchList();
    } else {
      message(res.message || "下单失败", { type: "error" });
    }
  }

  onMounted(() => {
    fetchList();
  });

  defineExpose({
    refresh: fetchList
  });
</script>

<template>
  <PureTableBar title="服务订购" :columns="columns" @refresh="fetchList">
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
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
      >
        <template #operation="{ row }">
          <el-button link type="primary" :size="size" @click="handleOrder(row)">立即订购</el-button>
        </template>
      </pure-table>
    </template>
  </PureTableBar>
</template>
