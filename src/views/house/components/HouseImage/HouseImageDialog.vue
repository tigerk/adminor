<script setup lang="ts">
  import { onMounted, ref, watch } from "vue";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { ImageFormProps } from "@/views/house/components/HouseImage/types";
  import UploadVideo from "@/components/Business/UploadVideo.vue";

  const props = withDefaults(defineProps<ImageFormProps>(), {});

  // 改用 ref 而不是 reactive，因为 v-model 需要 ref
  const imageList = ref<any[]>([]);
  const videoList = ref<any[]>([]);

  // 获取图片列表的方法
  function getImageList() {
    console.log("当前图片列表:", imageList.value);
    return imageList.value.map(item => item.url);
  }

  // 获取图片列表的方法
  function getVideoList() {
    console.log("当前图片列表:", imageList.value);
    return videoList.value.map(item => item.url);
  }

  // 初始化时加载已有的图片数据
  onMounted(() => {
    if (props.formInline && props.formInline.length > 0) {
      // 直接赋值给 ref 的 value
      imageList.value = [...props.formInline];
      console.log("初始化图片列表:", imageList.value);
    }
  });

  // 监听图片列表变化（可选，用于调试）
  watch(
    imageList,
    newVal => {
      console.log("图片列表已更新:", newVal);
    },
    { deep: true }
  );

  // 暴露方法给父组件
  defineExpose({ getImageList, getVideoList });
</script>

<template>
  <div class="image-container">
    <div class="image-grid">
      <!-- v-model 绑定到 ref -->
      <UploadVideo v-model="videoList" :limit="1" />
    </div>
    <el-card shadow="never">
      <div class="image-grid">
        <!-- v-model 绑定到 ref -->
        <UploadImage v-model="imageList" :limit="10" />
      </div>
      <div class="mt-4">
        <p>温馨提示：</p>
        <p>* 默认上传的第一张图为首图</p>
        <p>* 上传图片后，悬浮图片时右上角出现删除图标</p>
        <p>* 直接拖拽图片可调整顺序</p>
      </div>
    </el-card>
  </div>
</template>
