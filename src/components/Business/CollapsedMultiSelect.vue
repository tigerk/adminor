<template>
  <el-select v-bind="$attrs" v-model="innerValue" multiple class="collapsed-select" :collapse-tags="true" :collapse-tags-tooltip="false" @change="updateValue">
    <template #tag>
      <!-- 自定义 tag 渲染 -->
      <span class="custom-tag-container">
        <template v-for="(item, index) in displayedTags" :key="item.value">
          <el-tag class="custom-tag" :closable="true" @close="removeTag(item.value)">
            {{ item.label }}
          </el-tag>
        </template>

        <!-- 多余 tag 数量 -->
        <el-tag v-if="extraCount > 0" class="custom-tag count-tag" type="info">+{{ extraCount }}</el-tag>
      </span>
    </template>

    <!-- 选项 -->
    <slot />
  </el-select>
</template>

<script setup>
  import { computed, ref, watch } from "vue";

  const props = defineProps({
    modelValue: Array,
    maxTags: { type: Number, default: 1 }, // ❗ 可配置最大显示数量
    options: { type: Array, required: true } // label/value 数组
  });

  const emit = defineEmits(["update:modelValue"]);

  const innerValue = ref(props.modelValue || []);

  watch(
    () => props.modelValue,
    v => (innerValue.value = v)
  );

  // 选中项对象数组
  const selectedItems = computed(() => props.options.filter(opt => innerValue.value.includes(opt.value)));

  // 前 N 个标签
  const displayedTags = computed(() => selectedItems.value.slice(0, props.maxTags));

  // 多余数量
  const extraCount = computed(() => Math.max(0, selectedItems.value.length - props.maxTags));

  const updateValue = v => emit("update:modelValue", v);

  // 删除 tag
  const removeTag = val => {
    const newArr = innerValue.value.filter(v => v !== val);
    emit("update:modelValue", newArr);
  };
</script>

<style scoped>
  .collapsed-select .custom-tag-container {
    display: flex;
    align-items: center;
    max-height: 32px;
    overflow: hidden;
  }

  .custom-tag {
    margin-right: 4px;
  }

  .count-tag {
    background: #f0f0f0;
    color: #555;
    cursor: default;
  }
</style>
