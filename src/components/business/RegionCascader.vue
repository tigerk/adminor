<template>
  <el-cascader
    v-model="selectedValue"
    :options="options"
    :props="cascaderProps"
    placeholder="请选择"
    class="el-col-24"
    :disabled="loading"
    filterable
    clearable
    @change="handleChange"
  />
</template>

<script setup>
  import { onMounted, ref } from "vue";
  import { getRegionList } from "@/api/region.ts";
  import { handleTree } from "@/utils/tree.ts";

  const selectedValue = ref([]); // 用于存储选中的值
  const options = ref([]); // 用于存储级联选择器的选项数据 (树形结构)
  const loading = ref(false); // 用于控制加载状态

  // 2. 定义级联选择器的配置 (不需要 lazy 和 lazyLoad)
  const cascaderProps = {
    label: "name", // 服务器返回的标签字段名
    value: "id",
    // ✅ 任意层级可选
    checkStrictly: true,
    // ✅ 返回完整路径
    emitPath: true
  };

  // 3. 定义从服务器获取所有级联数据的函数
  // 这个函数应该在组件挂载后调用
  async function fetchAllCascaderData() {
    loading.value = true;
    getRegionList().then(res => {
      options.value = handleTree(res.data);
      loading.value = false;
    });
  }

  // 4. 处理选择变化
  function handleChange(value) {
    // 可以在这里处理选中后的逻辑
    console.log("选中的值:", value[value.length - 1]);
  }

  // 5. 组件挂载后，立即加载数据
  onMounted(() => {
    fetchAllCascaderData();
  });
</script>
