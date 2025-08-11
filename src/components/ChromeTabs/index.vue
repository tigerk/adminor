<template>
  <div class="chrome-tabs">
    <el-tabs
      v-model="activeName"
      type="card"
      class="custom-tabs"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="(tab, index) in tabs"
        :key="tab.name"
        :label="renderTabLabel(tab)"
        :name="tab.name"
      />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from "vue";
import { ElIcon } from "element-plus";
import * as Icons from "@element-plus/icons-vue";

// Props: tabs 列表（包含 icon、title、事件），默认激活 tab
const props = defineProps<{
  tabs: {
    name: string;
    title: string;
    icon?: string; // Element Plus 图标名（如 `HomeFilled`）
    onClick?: () => void;
  }[];
  modelValue?: string;
}>();

// 双向绑定支持
const emit = defineEmits(["update:modelValue"]);

const activeName = ref(props.modelValue || props.tabs[0]?.name);

// watch(activeName, val => {
//   emit("update:modelValue", val);
// });

// 渲染图标 + 标签名
const renderTabLabel = (tab: any) => {
  const IconComponent = tab.icon ? (Icons as any)[tab.icon] : null;
  return h("span", { class: "tab-label" }, [
    IconComponent ? h(ElIcon, null, { default: () => h(IconComponent) }) : null,
    h("span", { class: "tab-title" }, tab.title)
  ]);
};

// 标签点击事件触发传入的回调
const handleTabClick = (pane: any) => {
  const clickedTab = props.tabs.find(t => t.name === pane.paneName);
  clickedTab?.onClick?.();
};
</script>

<style scoped>
.chrome-tabs {
  padding: 0 10px;
}

.custom-tabs >>> .el-tabs__item {
  border-radius: 6px 6px 0 0;
  padding: 8px 16px;
  margin-right: 4px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.custom-tabs >>> .el-tabs__item.is-active {
  background-color: #ffffff;
  border-color: #dcdfe6 #dcdfe6 transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.custom-tabs >>> .el-tabs__nav {
  border-bottom: none;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-title {
  font-size: 14px;
}
</style>
