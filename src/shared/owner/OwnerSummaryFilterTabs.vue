<template>
  <div class="owner-summary-filter-tabs">
    <el-radio-group :model-value="modelValue" @update:model-value="value => $emit('update:modelValue', value)">
      <el-radio-button v-for="item in items" :key="item.key" :value="item.key">
        <span class="owner-summary-filter-tabs__content">
          <span class="owner-summary-filter-tabs__dot" :style="{ backgroundColor: item.color }" />
          {{ item.label }}（{{ item.total }}）
        </span>
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: "OwnerSummaryFilterTabs" });

  type SummaryFilterItem = {
    key: string;
    label: string;
    total: string | number;
    color: string;
  };

  defineProps<{
    modelValue: string | number | boolean;
    items: SummaryFilterItem[];
  }>();

  defineEmits<{
    "update:modelValue": [value: string | number | boolean];
  }>();
</script>

<style scoped lang="scss">
  .owner-summary-filter-tabs {
    display: flex;
    align-items: center;
    min-height: 40px;
  }

  .owner-summary-filter-tabs__content {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .owner-summary-filter-tabs__dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
  }
</style>
