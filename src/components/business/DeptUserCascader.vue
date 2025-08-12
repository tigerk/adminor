<!-- DeptCascader.vue -->
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
    :loading="loading"
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
  import { onMounted, ref, watch, computed } from "vue";
  import { handleTree } from "@/utils/tree.ts";
  import { getDeptList } from "@/api/sys/dept.js";
  import { ElMessage } from "element-plus";

  // 定义 props - 支持 v-model
  const props = defineProps({
    modelValue: {
      type: [Number, String, Array],
      default: null
    },
    // 是否在设置默认值时也触发 dept-selected 事件
    emitOnDefault: {
      type: Boolean,
      default: true
    }
  });

  // 定义 emits - 支持 v-model 和自定义事件
  const emit = defineEmits({
    "update:modelValue": value => true,
    "dept-selected": deptId => {
      return typeof deptId === "number" || deptId === null || deptId === undefined;
    }
  });

  // 响应式数据
  const options = ref([]); // 级联选择器的选项数据 (树形结构)
  const loading = ref(false); // 加载状态
  const isComponentMounted = ref(false); // 组件是否已挂载

  // 计算属性 - 用于双向绑定
  const selectedValue = computed({
    get() {
      return props.modelValue;
    },
    set(value) {
      emit("update:modelValue", value);
    }
  });

  // 监听外部传入的值变化，并根据配置通知父组件
  watch(
    () => props.modelValue,
    (newValue, oldValue) => {
      console.log("外部传入的值发生变化:", newValue, "旧值:", oldValue);

      // 如果组件还未挂载完成，且不允许在默认值时触发事件，则不触发
      if (!isComponentMounted.value && !props.emitOnDefault) {
        return;
      }

      // 触发 dept-selected 事件，通知父组件
      emit("dept-selected", newValue);
    },
    {
      immediate: true // 立即执行，包括初始值
    }
  );

  // 获取部门数据
  async function fetchAllCascaderData() {
    loading.value = true;
    try {
      const { data } = await getDeptList({});
      options.value = handleTree(data);
      console.log("部门数据加载成功:", options.value);
    } catch (error) {
      console.error("获取部门数据失败:", error);
      // 可以添加错误提示
      if (typeof ElMessage !== "undefined") {
        ElMessage.error("获取部门数据失败");
      }
    } finally {
      loading.value = false;
    }
  }

  // 处理选择变化
  const handleChange = value => {
    console.log("级联选择器值变化:", value);
    // 触发自定义事件
    emit("dept-selected", value);
    // v-model 的值已经通过 computed 自动更新了
  };

  // 组件挂载后加载数据
  onMounted(async () => {
    await fetchAllCascaderData();

    // 设置组件已挂载标志
    isComponentMounted.value = true;

    // 如果在组件挂载后设置了初始值，且允许在默认值时触发事件，则立即触发一次
    if (props.modelValue !== null && props.emitOnDefault) {
      emit("dept-selected", props.modelValue);
    }
  });
</script>

<style scoped>
  /* 可以添加组件特定的样式 */
  .w-full {
    width: 100%;
  }
</style>
