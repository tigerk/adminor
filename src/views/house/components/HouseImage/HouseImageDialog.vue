<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { ImageFormProps } from "@/views/house/components/HouseImage/types";

  const props = withDefaults(defineProps<ImageFormProps>(), {});
  const images = reactive(props.formInline);

  // 存储选中的配置及其数量
  const imageList = reactive<any[]>([]);

  function getImageList() {
    return imageList;
  }

  onMounted(() => {
    images.forEach(item => {
      imageList.push(item);
    });
  });

  defineExpose({ getImageList });
</script>

<template>
  <div class="image-container">
    <div class="image-grid">
      <UploadImage v-model="imageList" :limit="10" />
    </div>
    <div>
      <p>温馨提示：</p>
      <p>* 支持图片格式 （ipg、png、jpeg），最多上传24张，每张最大10M；</p>
      <p>* 支持视频格式（mp4、avi、mov），最多上传1个视频，不可大于50M；</p>
      <p>* 拖动图片可以进行排序显示；</p>
      <p>* 默认上传的第一张图为首图，悬浮图片上显示设为封面按钮；</p>
      <p>*上传图片后，图片下面显示图片标签类型；悬浮图片时右上角出现删除图标</p>
    </div>
  </div>
</template>

<style scoped>
  .image-container {
    padding: 10px 0;
  }

  .image-grid {
    display: grid;
    //grid-template-columns: repeat(6, 1fr);
    gap: 16px 20px;
  }
</style>
