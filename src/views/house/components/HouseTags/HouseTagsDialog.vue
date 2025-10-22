<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import { TagsFormProps } from "@/views/house/components/HouseTags/types";

  const props = withDefaults(defineProps<TagsFormProps>(), {});

  // 存储选中的配置及其数量
  const selectedTags = ref<any[]>([]);
  const tagsOptions = reactive<any[]>([]);

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_tags"
    }).then(resp => {
      resp.data.forEach(item => {
        tagsOptions.push({ label: item.name, value: item.id });
      });
    });

    if (props.formInline && props.formInline.length > 0) {
      // 直接赋值给 ref 的 value
      selectedTags.value = [...props.formInline];
    }
  });

  // 切换选中状态
  const toggleTag = (value: number) => {
    if (selectedTags.value.includes(value)) {
      // 找到要删除的值的索引
      const index = selectedTags.value.indexOf(value);

      // 如果找到了该值，则删除它
      if (index !== -1) {
        selectedTags.value.splice(index, 1);
      }
    } else {
      selectedTags.value.push(value);
    }
  };

  // 判断是否选中
  const isSelected = (value: number) => {
    return selectedTags.value.includes(value);
  };

  function getRef() {
    return selectedTags.value;
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="tags-container">
    <h4 class="section-title">房源特色</h4>
    <div class="tags-grid">
      <div v-for="option in tagsOptions" :key="option.value" class="tags-item">
        <el-checkbox :model-value="isSelected(option.value)" @change="toggleTag(option.value)">
          {{ option.label }}
        </el-checkbox>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tags-container {
    padding: 10px 0;
  }

  .section-title {
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .tags-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px 20px;
  }

  .tags-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .tags-item:hover {
    background: #ecf5ff;
  }
</style>
