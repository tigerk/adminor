<template>
  <div class="owner-summary-cards" :style="gridStyle">
    <div v-for="card in cards" :key="card.key" class="owner-summary-card">
      <span class="owner-summary-card__label">{{ card.label }}</span>
      <strong class="owner-summary-card__value">{{ card.value }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";

  defineOptions({ name: "OwnerSummaryCards" });

  type SummaryCard = {
    key: string;
    label: string;
    value: string | number;
  };

  const props = withDefaults(
    defineProps<{
      cards: SummaryCard[];
      columns?: number;
    }>(),
    {
      columns: 4
    }
  );

  const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`
  }));
</script>

<style scoped lang="scss">
  .owner-summary-cards {
    display: grid;
    gap: 12px;
  }

  .owner-summary-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .owner-summary-card__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .owner-summary-card__value {
    font-size: 24px;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }
</style>
