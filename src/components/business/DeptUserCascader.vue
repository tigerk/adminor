<template>
  <el-cascader
    v-model="selectedValue"
    class="w-full"
    :options="options"
    :props="{
      value: 'id',
      label: 'name',
      emitPath: false,
      checkStrictly: true
    }"
    clearable
    filterable
    placeholder="请选择归属部门"
    @change="handleChange"
  >
    <template #default="{ node, data }">
      <span>{{ data.name }}</span>
      <span v-if="!node.isLeaf">({{ data.children.length }})</span>
    </template>
  </el-cascader>
</template>

<script setup>
  import { onMounted, ref } from "vue";
  import { handleTree } from "@/utils/tree.ts";
  import { getDeptList } from "@/api/sys/dept.js";

  const selectedValue = ref([]); // 用于存储选中的值
  const options = ref([]); // 用于存储级联选择器的选项数据 (树形结构)
  const loading = ref(false); // 用于控制加载状态

  // 方案1：使用对象语法定义 emits
  const emit = defineEmits({
    "dept-selected": deptId => {
      // 可以添加验证逻辑
      return typeof deptId === "number" || deptId === null || deptId === undefined;
    }
  });

  // 3. 定义从服务器获取所有级联数据的函数
  // 这个函数应该在组件挂载后调用
  async function fetchAllCascaderData() {
    loading.value = true;
    try {
      // 归属部门
      const { data } = await getDeptList({});
      options.value = handleTree(data);
    } catch (error) {
      console.error("获取部门数据失败:", error);
    } finally {
      loading.value = false;
    }
  }

  // 5. 组件挂载后，立即加载数据
  onMounted(() => {
    fetchAllCascaderData();
  });

  const handleChange = value => {
    // 向父组件触发 change 事件
    emit("dept-selected", value);
  };
</script>
