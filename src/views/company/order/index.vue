<script setup lang="ts">
  import { ref } from "vue";
  import ServiceOrderTab from "./components/ServiceOrderTab.vue";
  import OrderRecordTab from "./components/OrderRecordTab.vue";
  import UsageRecordTab from "./components/UsageRecordTab.vue";

  defineOptions({
    name: "CompanyOrder"
  });

  const activeTab = ref("service");
  const serviceOrderRef = ref();
  const orderRecordRef = ref();
  const usageRecordRef = ref();

  function handleTabClick() {
    if (activeTab.value === "service") {
      serviceOrderRef.value?.refresh?.();
    }
    if (activeTab.value === "order") {
      orderRecordRef.value?.refresh?.();
    }
    if (activeTab.value === "usage") {
      usageRecordRef.value?.refresh?.();
    }
  }
</script>

<template>
  <div class="main company-order-page">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="服务订购" name="service">
        <ServiceOrderTab ref="serviceOrderRef" />
      </el-tab-pane>
      <el-tab-pane label="订购记录" name="order">
        <OrderRecordTab ref="orderRecordRef" />
      </el-tab-pane>
      <el-tab-pane label="使用记录" name="usage">
        <UsageRecordTab ref="usageRecordRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
  .company-order-page {
    :deep(.el-tabs__content) {
      padding-top: 8px;
    }
  }
</style>
