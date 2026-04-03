<template>
  <div class="owner-page-header">
    <el-row class="bg-bg_color w-full px-4 pb-1 pt-[12px]">
      <el-col :span="24">
        <slot name="search" />
      </el-col>
    </el-row>

    <el-row class="bg-bg_color w-full px-4 pb-3">
      <el-col :span="hasActions ? summarySpan : 24">
        <slot name="summary" />
      </el-col>
      <el-col v-if="hasActions" :span="actionSpan" class="text-right">
        <slot name="actions" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, useSlots } from "vue";

  defineOptions({ name: "OwnerPageHeader" });

  const props = withDefaults(
    defineProps<{
      summarySpan?: number;
      actionSpan?: number;
    }>(),
    {
      summarySpan: 18,
      actionSpan: 6
    }
  );

  const slots = useSlots();
  const hasActions = computed(() => Boolean(slots.actions));
</script>
