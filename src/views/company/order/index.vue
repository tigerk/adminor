<script setup lang="ts">
  import { ref } from "vue";
  import ServiceOrderTab from "./components/ServiceOrderTab.vue";
  import OrderRecordTab from "./components/OrderRecordTab.vue";
  import UsageRecordTab from "./components/UsageRecordTab.vue";
  import { ShoppingCart, List, DataLine } from "@element-plus/icons-vue";

  defineOptions({
    name: "CompanyOrder"
  });

  const activeTab = ref("service");
  const serviceOrderRef = ref();
  const orderRecordRef = ref();
  const usageRecordRef = ref();

  function handleTabClick() {
    if (activeTab.value === "service") serviceOrderRef.value?.refresh?.();
    if (activeTab.value === "order") orderRecordRef.value?.refresh?.();
    if (activeTab.value === "usage") usageRecordRef.value?.refresh?.();
  }
</script>

<template>
  <div class="company-order-page">
    <el-tabs v-model="activeTab" class="order-tabs" @tab-click="handleTabClick">
      <el-tab-pane name="service">
        <template #label>
          <span class="tab-label">
            <el-icon><ShoppingCart /></el-icon>
            服务订购
          </span>
        </template>
        <ServiceOrderTab ref="serviceOrderRef" />
      </el-tab-pane>
      <el-tab-pane name="order">
        <template #label>
          <span class="tab-label">
            <el-icon><List /></el-icon>
            订购记录
          </span>
        </template>
        <OrderRecordTab ref="orderRecordRef" />
      </el-tab-pane>
      <el-tab-pane name="usage">
        <template #label>
          <span class="tab-label">
            <el-icon><DataLine /></el-icon>
            使用记录
          </span>
        </template>
        <UsageRecordTab ref="usageRecordRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
  .company-order-page {
    height: 100%;
    background-color: var(--el-bg-color-page);
  }

  .order-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 20px;
      background-color: var(--el-bg-color);
      border-bottom: 1px solid var(--el-border-color-lighter);
      flex-shrink: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      height: 48px;
      line-height: 48px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      padding: 0 16px;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      background-color: var(--el-color-primary);
      height: 2px;
      border-radius: 2px 2px 0 0;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: auto;
    }
  }

  .tab-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
</style>
