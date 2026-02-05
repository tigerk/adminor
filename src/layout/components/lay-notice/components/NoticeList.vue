<script setup lang="ts">
  import { PropType } from "vue";
  import { ListItem } from "../data";
  import NoticeItem from "./NoticeItem.vue";
  import { transformI18n } from "@/plugins/i18n";

  const emit = defineEmits(["item-click"]);

  defineProps({
    list: {
      type: Array as PropType<Array<ListItem>>,
      default: () => []
    },
    emptyText: {
      type: String,
      default: ""
    }
  });

  function handleItemClick(item: ListItem) {
    emit("item-click", item);
  }
</script>

<template>
  <div v-if="list.length">
    <NoticeItem v-for="(item, index) in list" :key="index" :noticeItem="item" @item-click="handleItemClick" />
  </div>
  <el-empty v-else :description="transformI18n(emptyText)" />
</template>
