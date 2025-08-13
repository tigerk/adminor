<script setup lang="ts">
  import { ref, watch, h } from "vue";
  import { useDict } from "./utils/hook";
  import { message } from "@/utils/message";
  import { useDark } from "@pureadmin/utils";
  import { ElMessageBox } from "element-plus";
  import { ReText } from "@/components/ReText";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
  import ContextMenu from "@imengyu/vue3-context-menu";

  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import AddFill from "~icons/ri/add-circle-line";

  interface Tree {
    id: number;
    dictName: string;
    dictCode: string;
    highlight?: boolean;
    children?: Tree[];
  }

  const emit = defineEmits(["tree-select"]);

  const treeRef = ref();
  const searchValue = ref("");
  const highlightMap = ref({});
  const defaultProps = {
    children: "children",
    label: "dictName"
  };

  const { isDark } = useDark();

  const { treeLoading, treeData, getDictTreeData } = useDict();

  const filterNode = (value: string, data: Tree) => {
    if (!value) return true;
    return `${data.dictName}（${data.dictCode}）`.includes(value);
  };

  function nodeClick(value) {
    const nodeId = value.$treeNodeId;
    highlightMap.value[nodeId] = highlightMap.value[nodeId]?.highlight
      ? Object.assign({ id: nodeId }, highlightMap.value[nodeId], {
          highlight: false
        })
      : Object.assign({ id: nodeId }, highlightMap.value[nodeId], {
          highlight: true
        });
    Object.values(highlightMap.value).forEach((v: Tree) => {
      if (v.id !== nodeId) {
        v.highlight = false;
      }
    });
    emit("tree-select", highlightMap.value[nodeId]?.highlight ? Object.assign({ ...value, selected: true }) : Object.assign({ ...value, selected: false }));
  }

  watch(searchValue, val => {
    treeRef.value!.filter(val);
  });
</script>

<template>
  <div v-loading="treeLoading" class="h-full bg-bg_color overflow-hidden relative" :style="{ minHeight: `calc(100vh - 141px)` }">
    <div class="flex items-center h-[34px]">
      <el-input v-model="searchValue" class="mx-2" size="small" placeholder="请输入字典名称" clearable>
        <template #suffix>
          <el-icon class="el-input__icon">
            <IconifyIconOffline v-show="searchValue.length === 0" icon="ri/search-line" />
          </el-icon>
        </template>
      </el-input>
    </div>
    <el-divider />
    <el-scrollbar height="calc(90vh - 150px)">
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        size="small"
        :props="defaultProps"
        default-expand-all
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        @node-click="nodeClick"
      >
        <template #default="{ node, data }">
          <ReText
            :class="[
              'w-full!',
              'p-1!',
              'mt-2!',
              'mr-2!',
              'rounded',
              'select-none',
              'hover:text-primary',
              searchValue.trim().length > 0 && `${node.label}（${data.dictCode}）`.includes(searchValue) && 'text-red-500!',
              highlightMap[node.id]?.highlight ? 'dark:text-primary!' : ''
            ]"
            :style="{
              color: highlightMap[node.id]?.highlight ? 'var(--el-color-primary)' : '',
              background: highlightMap[node.id]?.highlight ? 'var(--el-color-primary-light-7)' : 'transparent'
            }"
          >
            {{ `${node.label}（${data.dictCode}）` }}
          </ReText>
        </template>
      </el-tree>
    </el-scrollbar>
  </div>
</template>

<style>
  .mx-context-menu {
    padding: 6px;
    border-radius: 4px;
  }

  .mx-context-menu-item {
    cursor: pointer;
  }
</style>

<style lang="scss" scoped>
  :deep(.el-divider) {
    margin: 0;
  }

  :deep(.el-tree) {
    --el-tree-node-hover-bg-color: transparent;
  }

  :deep(.el-tree-node) {
    margin-top: 4px;
    margin-left: -10px;
  }
</style>
