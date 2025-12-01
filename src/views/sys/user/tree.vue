<script setup lang="ts">
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { ref, computed, watch, getCurrentInstance } from "vue";

  import Dept from "~icons/ri/git-branch-line";
  import More2Fill from "~icons/ri/more-2-fill?width=18&height=18";
  import OfficeBuilding from "~icons/ep/office-building";
  import LocationCompany from "~icons/ep/add-location";
  import ExpandIcon from "./svg/expand.svg?component";
  import UnExpandIcon from "./svg/unexpand.svg?component";

  interface Tree {
    id: number;
    name: string;
    type?: number;
    highlight?: boolean;
    children?: Tree[];
  }

  defineProps({
    treeLoading: Boolean,
    treeData: Array
  });

  const emit = defineEmits(["tree-select"]);

  const treeRef = ref();
  const isExpand = ref(true);
  const searchValue = ref("");
  const highlightMap = ref({});
  const { proxy } = getCurrentInstance();
  const defaultProps = {
    children: "children",
    label: "name"
  };
  const buttonClass = computed(() => {
    return ["h-[20px]!", "text-sm!", "reset-margin", "text-(--el-text-color-regular)!", "dark:text-white!", "dark:hover:text-primary!"];
  });

  const filterNode = (value: string, data: Tree) => {
    if (!value) return true;
    return data.name.includes(value);
  };

  function nodeClick(value) {
    const nodeId = value.$treeNodeId;

    highlightMap.value[nodeId] = highlightMap.value[nodeId]?.highlight
      ? { id: nodeId, ...highlightMap.value[nodeId], highlight: false }
      : { id: nodeId, ...highlightMap.value[nodeId], highlight: true };
    Object.values(highlightMap.value).forEach((v: Tree) => {
      if (v.id !== nodeId) {
        v.highlight = false;
      }
    });
    emit("tree-select", highlightMap.value[nodeId]?.highlight ? { ...value, selected: true } : Object.assign({ ...value, selected: false }));
  }

  function toggleRowExpansionAll(status) {
    isExpand.value = status;
    const nodes = (proxy.$refs["treeRef"] as any).store._getAllNodes();
    for (const element of nodes) {
      element.expanded = status;
    }
  }

  /** 重置部门树状态（选中状态、搜索框值、树初始化） */
  function onTreeReset() {
    highlightMap.value = {};
    searchValue.value = "";
    toggleRowExpansionAll(true);
  }

  watch(searchValue, val => {
    treeRef.value!.filter(val);
  });

  defineExpose({ onTreeReset });
</script>

<template>
  <div v-loading="treeLoading" class="tree-container">
    <div class="tree-header">
      <el-input v-model="searchValue" placeholder="请输入部门名称" clearable>
        <template #suffix>
          <el-icon class="el-input__icon">
            <IconifyIconOffline v-show="searchValue.length === 0" icon="ri/search-line" />
          </el-icon>
        </template>
      </el-input>
      <el-dropdown :hide-on-click="false" class="more-dropdown">
        <div class="more-trigger">
          <More2Fill />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <el-button
                :class="buttonClass"
                link
                type="primary"
                :icon="useRenderIcon(isExpand ? ExpandIcon : UnExpandIcon)"
                @click="toggleRowExpansionAll(!isExpand)"
              >
                {{ isExpand ? "折叠全部" : "展开全部" }}
              </el-button>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-divider class="header-divider" />
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
              searchValue.trim().length > 0 && node.label.includes(searchValue) && 'tree-node-search-match'
            ]"
          >
            <div class="node-icon-label">
              <IconifyIconOffline :icon="data.type === 1 ? OfficeBuilding : data.type === 2 ? LocationCompany : Dept" class="node-icon" />
              <span class="node-label" :title="node.label">
                {{ node.label }}
              </span>
            </div>
            <span v-if="data.children && data.children.length > 0" class="node-count">
              {{ data.children.length }}
            </span>
          </div>
        </template>
      </el-tree>
    </el-scrollbar>
  </div>
</template>

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

  .tree-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--el-bg-color);
  }

  .search-input {
    flex: 1;

    :deep(.el-input__wrapper) {
      border-radius: 16px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
      }
    }
  }

  .more-dropdown {
    flex-shrink: 0;
  }

  .more-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    border-radius: 50%;
    color: var(--el-text-color-regular);
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
  }

  .header-divider {
    margin: 0;
  }

  .tree-scrollbar {
    height: calc(90vh - 88px);
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

      .node-icon {
        color: var(--el-color-primary);
      }
    }
  }

  .tree-node-active {
    background: var(--el-color-primary-light-9) !important;
    color: var(--el-color-primary) !important;
    font-weight: 500;

    .node-icon,
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

  .node-icon-label {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow: hidden;
  }

  .node-icon {
    flex-shrink: 0;
    font-size: 16px;
    color: var(--el-text-color-secondary);
    transition: all 0.2s;
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
    flex-shrink: 0;
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
