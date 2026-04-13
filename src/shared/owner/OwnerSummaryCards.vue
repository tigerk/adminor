<template>
  <div class="owner-summary-cards" :style="gridStyle">
    <div v-for="card in cards" :key="card.key" class="owner-summary-card">
      <div class="owner-summary-card__left">
        <span class="owner-summary-card__label">{{ card.label }}</span>
        <strong class="owner-summary-card__value">{{ card.value }}</strong>
      </div>
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
    gap: 8px;
  }

  .owner-summary-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: var(--el-bg-color);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: box-shadow 0.2s;
  }

  .owner-summary-card:hover {
    box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
  }

  .owner-summary-card__left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .owner-summary-card__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    white-space: nowrap;
  }

  .owner-summary-card__value {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }
</style>
