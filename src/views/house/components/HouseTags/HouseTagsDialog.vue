<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import { type FacilityFormProps } from "@/views/house/components/HouseFacility/types";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  const props = withDefaults(defineProps<FacilityFormProps>(), {});
  const tags = reactive(props.formInline);

  // 存储选中的配置及其数量
  const selectedTags = reactive<any[]>([]);
  const tagsOptions = reactive<any[]>([]);

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_tags"
    }).then(resp => {
      resp.data.forEach(item => {
        tagsOptions.push({ label: item.name, value: item.id });
      });
    });

    tags.forEach(item => {
      selectedTags.push(item);
    });
  });

  // 切换选中状态
  const toggleTag = (value: number) => {
    if (selectedTags.includes(value)) {
      // 找到要删除的值的索引
      const index = selectedTags.indexOf(value);

      // 如果找到了该值，则删除它
      if (index !== -1) {
        selectedTags.splice(index, 1);
      }
    } else {
      selectedTags.push(value);
    }
  };

  // 判断是否选中
  const isSelected = (value: number) => {
    return selectedTags.includes(value);
  };

  function getRef() {
    return selectedTags;
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="facilities-container">
    <h4 class="section-title">物品配置</h4>
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
  .facilities-container {
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
