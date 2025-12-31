<script setup lang="ts">
  import { nextTick, onMounted, ref } from "vue";
  import { useFocusHouse } from "@/views/house/focus/focusHouse/utils/hook";

  defineOptions({
    name: "FocusHouse"
  });

  const {
    queryForm,
    isShow,
    curRow,
    loading,
    rowStyle,
    focusList,
    focusOptions,
    isLinkage,
    pagination,
    treeSearchValue,
    onFocusHouseSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange
  } = useFocusHouse();
</script>

<template>

</template>

<style scoped lang="scss"></style>
