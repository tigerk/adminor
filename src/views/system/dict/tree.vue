<script setup lang="ts">
  import { ref, watch, h } from "vue";
  import { useDict } from "./utils/hook";
  import { useDark } from "@pureadmin/utils";
  import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";

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

    // 如果节点有子节点，不触发选中事件
    if (value.children && value.children.length > 0) {
      return;
    }

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
  <div v-loading="treeLoading" class="tree-container">
    <div class="search-box">
      <el-input v-model="searchValue" placeholder="请输入字典名称" clearable>
        <template #suffix>
          <el-icon class="el-input__icon">
            <IconifyIconOffline v-show="searchValue.length === 0" icon="ri/search-line" />
          </el-icon>
        </template>
      </el-input>
    </div>
    <el-divider class="search-divider" />
    <el-scrollbar class="tree-scrollbar">
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
          <div
            :class="[
              'tree-node-content',
              highlightMap[node.id]?.highlight && 'tree-node-active',
              searchValue.trim().length > 0 && `${node.label}（${data.dictCode}）`.includes(searchValue) && 'tree-node-search-match'
            ]"
          >
            <span class="node-label" :title="`${node.label}（${data.dictCode}）`">
              {{ node.label }}
            </span>
            <span v-if="data.children && data.children.length > 0" class="node-count">
              {{ data.children.length }}
            </span>
          </div>
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
  .tree-container {
    height: 100%;
    min-height: calc(100vh - 141px);
    background: var(--el-bg-color);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.03);
  }

  .search-box {
    padding: 12px;
    background: var(--el-bg-color);
  }

  .search-input {
    :deep(.el-input__wrapper) {
      border-radius: 16px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
      }
    }
  }

  .search-divider {
    margin: 0;
  }

  .tree-scrollbar {
    height: calc(90vh - 150px);
    padding: 8px;
  }

  :deep(.el-tree) {
    --el-tree-node-hover-bg-color: transparent;
    background: transparent;
  }

  :deep(.el-tree-node) {
    margin-bottom: 2px;
    position: relative;
  }

  :deep(.el-tree-node__content) {
    height: 36px;
    padding: 0 8px;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  :deep(.el-tree-node__expand-icon) {
    padding: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: all 0.2s;

    &.is-leaf {
      color: transparent;
    }
  }

  :deep(.el-tree-node__children) {
    overflow: visible;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: var(--el-color-primary-light-9);
  }

  .tree-node-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .tree-node-active {
    background: var(--el-color-primary-light-9) !important;
    color: var(--el-color-primary) !important;
    font-weight: 500;

    .node-label {
      color: var(--el-color-primary);
    }
  }

  .tree-node-search-match {
    .node-label {
      color: var(--el-color-danger);
      font-weight: 500;
    }
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    line-height: 1.5;
  }

  .node-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    margin-left: 8px;
    font-size: 12px;
    line-height: 1;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .tree-node-active .node-count {
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }

  // 暗黑模式适配
  .dark {
    .tree-container {
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
    }

    .tree-node-active {
      background: var(--el-color-primary-dark-2) !important;
    }
  }
</style>
