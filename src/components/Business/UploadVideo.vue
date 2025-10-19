<script setup lang="ts">
  import Sortable from "sortablejs";
  import { ref, computed, watch, nextTick, onMounted } from "vue";
  import { message } from "@/utils/message";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";

  import EpPlus from "~icons/ep/plus?width=30&height=30";
  import VideoPlay from "~icons/ep/video-play";
  import Delete from "~icons/ri/delete-bin-7-line";
  import { uploadFile } from "@/api/upload";

  defineOptions({
    name: "UploadVideo"
  });

  const rawFileList = defineModel<UploadFile[] | string[]>();

  const props = defineProps({
    limit: {
      type: Number,
      default: 1
    },
    maxSize: {
      type: Number,
      default: 50 // 默认50MB
    }
  });

  const convertUrlsToUploadFiles = (urls: string[]): UploadFile[] => {
    return urls.map((url, index) => {
      const fileName = url.split("/").pop() || `video-${index + 1}`;
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "mp4";

      let mimeType = "video/mp4";
      switch (fileExtension) {
        case "mp4":
          mimeType = "video/mp4";
          break;
        case "webm":
          mimeType = "video/webm";
          break;
        case "ogg":
          mimeType = "video/ogg";
          break;
        case "mov":
          mimeType = "video/quicktime";
          break;
        case "avi":
          mimeType = "video/x-msvideo";
          break;
        default:
          mimeType = "video/mp4";
      }

      return {
        uid: Date.now() + Math.random() * 1000 + index,
        name: fileName,
        status: "success" as const,
        url: url,
        size: 0,
        type: mimeType,
        percentage: 100,
        raw: undefined
      } as UploadFile;
    });
  };

  const isStringArray = (arr: unknown): arr is string[] => {
    return Array.isArray(arr) && arr.every(item => typeof item === "string");
  };

  const fileList = ref<UploadFile[]>([]);

  watch(
    () => rawFileList.value,
    newValue => {
      if (!newValue) {
        fileList.value = [];
        return;
      }

      if (isStringArray(newValue)) {
        fileList.value = convertUrlsToUploadFiles(newValue);
      } else {
        fileList.value = newValue as UploadFile[];
      }
    },
    { immediate: true, deep: true }
  );

  watch(
    fileList,
    newValue => {
      rawFileList.value = newValue;
    },
    { deep: true }
  );

  const dialogVisible = ref(false);
  const currentVideoUrl = ref("");
  const currentVideoName = ref("");

  const onBefore = file => {
    const videoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!videoTypes.includes(file.type)) {
      message("只能上传mp4/webm/ogg/mov/avi格式的视频");
      return false;
    }
    const isExceed = file.size / 1024 / 1024 > props.maxSize;
    if (isExceed) {
      message(`单个视频大小不能超过${props.maxSize}MB`);
      return false;
    }
    return true;
  };

  const customUpload = async (options: UploadRequestOptions) => {
    const { file, onProgress, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadFile(formData, progress => {
        onProgress({ percent: progress } as UploadProgressEvent);
      });

      console.log("上传响应:", response);

      if (response.data && response?.code === 0) {
        onSuccess(response.data);
        message("上传成功", { type: "success" });
      } else {
        throw new Error(response?.message || "上传失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      onError(error);
      message(error.message || "上传失败", { type: "error" });
    }
  };

  const onUploadSuccess = (response: any, uploadFile: UploadFile) => {
    console.log("onUploadSuccess - response:", response);
    console.log("onUploadSuccess - uploadFile:", uploadFile);

    const fileItem = fileList.value.find(item => item.uid === uploadFile.uid);

    if (fileItem && response) {
      let videoUrl: string | undefined;

      if (typeof response === "string") {
        videoUrl = response;
      } else if (response.url) {
        videoUrl = response.url;
      } else if (response.fileUrl) {
        videoUrl = response.fileUrl;
      } else if (response.path) {
        videoUrl = response.path;
      } else if (response.data && response.data.url) {
        videoUrl = response.data.url;
      }

      if (videoUrl) {
        fileItem.url = videoUrl;
        fileItem.status = "success";
        console.log("视频URL设置成功:", videoUrl);
      } else {
        console.error("无法从响应中提取URL:", response);
        message("上传成功但无法获取视频URL", { type: "warning" });
      }
    }
  };

  const onUploadError = (error: any, file: UploadFile) => {
    console.error("上传失败:", error);
    handleRemove(file);
  };

  const onExceed = () => {
    message(`最多上传${props.limit}个视频，请先删除再上传`);
  };

  const handleRemove = (file: UploadFile) => {
    console.log("删除文件:", file);
    const index = fileList.value.findIndex(item => item.uid === file.uid);
    if (index > -1) {
      fileList.value.splice(index, 1);
      console.log("文件已删除，当前列表:", fileList.value);
    }
  };

  const handleVideoPreview = (file: UploadFile) => {
    console.log("预览视频:", file);

    if (!file.url) {
      message("视频URL不存在，无法预览", { type: "warning" });
      return;
    }

    if (file.status !== "success") {
      message("视频正在上传中，请稍候", { type: "warning" });
      return;
    }

    currentVideoUrl.value = file.url;
    currentVideoName.value = file.name;
    dialogVisible.value = true;
  };

  let sortableInstance: Sortable | null = null;

  /** 初始化拖拽排序 */
  const initSortable = () => {
    console.log("初始化拖拽，当前文件数:", fileList.value.length);

    if (sortableInstance) {
      console.log("销毁旧的 Sortable 实例");
      sortableInstance.destroy();
      sortableInstance = null;
    }

    if (fileList.value.length <= 1) {
      console.log("文件数量不足，跳过拖拽初始化");
      return;
    }

    nextTick(() => {
      let wrapper: HTMLElement | null = document.querySelector(".el-upload-list.el-upload-list--picture-card");

      if (!wrapper) {
        wrapper = document.querySelector(".el-upload-list");
      }

      console.log("找到的容器元素:", wrapper);

      if (wrapper) {
        const items = wrapper.querySelectorAll(".el-upload-list__item");
        console.log("找到的视频项数量:", items.length);

        sortableInstance = Sortable.create(wrapper, {
          animation: 200,
          ghostClass: "sortable-ghost",
          chosenClass: "sortable-chosen",
          dragClass: "sortable-drag",
          filter: ".el-upload--picture-card",
          draggable: ".el-upload-list__item",
          forceFallback: true,
          fallbackClass: "sortable-fallback",
          fallbackOnBody: true,
          swapThreshold: 0.65,

          onStart: evt => {
            console.log("开始拖拽，索引:", evt.oldIndex);
            document.body.style.cursor = "grabbing";
          },

          onEnd: evt => {
            console.log("拖拽结束，从", evt.oldIndex, "到", evt.newIndex);
            document.body.style.cursor = "";

            const { newIndex, oldIndex } = evt;

            if (
              typeof newIndex === "number" &&
              typeof oldIndex === "number" &&
              newIndex !== oldIndex &&
              newIndex >= 0 &&
              oldIndex >= 0 &&
              oldIndex < fileList.value.length &&
              newIndex < fileList.value.length
            ) {
              console.log("执行排序调整");
              const movedItem = fileList.value[oldIndex];
              fileList.value.splice(oldIndex, 1);
              fileList.value.splice(newIndex, 0, movedItem);
              console.log("排序后的列表:", fileList.value);
              message("排序已更新", { type: "success" });
            }
          },

          onMove: evt => {
            return evt.related.className.indexOf("el-upload--picture-card") === -1;
          }
        });

        console.log("Sortable 实例创建成功:", sortableInstance);
      } else {
        console.error("未找到 el-upload-list 容器");
      }
    });
  };

  watch(
    () => fileList.value.length,
    (newLength, oldLength) => {
      console.log("文件列表长度变化:", oldLength, "->", newLength);
      setTimeout(() => {
        initSortable();
      }, 300);
    }
  );

  onMounted(() => {
    console.log("组件已挂载");
    initSortable();
  });
</script>

<template>
  <el-card shadow="never">
    <el-upload
      v-model:file-list="fileList"
      drag
      multiple
      class="pure-upload"
      list-type="picture-card"
      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
      :limit="props.limit"
      :http-request="customUpload"
      :on-exceed="onExceed"
      :before-upload="onBefore"
      :on-success="onUploadSuccess"
      :on-error="onUploadError"
    >
      <EpPlus class="m-auto mt-4" />
      <template #file="{ file }">
        <div v-if="file.status === 'ready' || file.status === 'uploading'" class="mt-[35%]! m-auto">
          <p class="font-medium">视频上传中</p>
          <el-progress class="mt-2!" :stroke-width="2" :text-inside="true" :show-text="false" :percentage="file.percentage || 0" />
        </div>
        <div v-else class="upload-item-content">
          <div class="video-thumbnail">
            <video class="video-preview" :src="file.url" preload="metadata" />
            <div class="video-overlay">
              <IconifyIconOffline :icon="VideoPlay" class="play-icon" />
            </div>
          </div>
          <span class="el-upload-list__item-actions">
            <span title="预览" class="action-btn hover:text-primary" @click.stop="handleVideoPreview(file)">
              <IconifyIconOffline :icon="VideoPlay" class="hover:scale-125 duration-100" />
            </span>
            <span title="移除" class="action-btn hover:text-[var(--el-color-danger)]" @click.stop="handleRemove(file)">
              <IconifyIconOffline :icon="Delete" class="hover:scale-125 duration-100" />
            </span>
          </span>
        </div>
      </template>
    </el-upload>

    <el-dialog v-model="dialogVisible" title="视频预览" width="800px" :close-on-click-modal="true">
      <div class="video-dialog-content">
        <video v-if="currentVideoUrl" :src="currentVideoUrl" controls autoplay class="preview-video">您的浏览器不支持视频播放</video>
        <p class="video-name">{{ currentVideoName }}</p>
      </div>
    </el-dialog>

    <p class="el-upload__tip">
      可拖拽上传最多{{ props.limit }}个，单个不超过{{ props.maxSize }}MB且格式为mp4/webm/ogg/mov/avi的视频
      <span v-if="fileList.length > 1" class="text-primary font-medium">（直接拖拽视频可调整顺序）</span>
    </p>
  </el-card>
</template>

<style lang="scss" scoped>
  :deep(.card-header) {
    display: flex;

    .header-right {
      display: flex;
      flex: auto;
      align-items: center;
      justify-content: flex-end;
      font-size: 14px;
    }
  }

  :deep(.pure-upload) {
    .el-upload-dragger {
      background-color: transparent;
      border: none;
    }
  }

  .upload-item-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .video-thumbnail {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
  }

  .video-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    transition: background 0.3s;

    .play-icon {
      font-size: 48px;
      color: #fff;
      opacity: 0.8;
      transition: all 0.3s;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.5);

      .play-icon {
        opacity: 1;
        transform: scale(1.1);
      }
    }
  }

  .action-btn {
    cursor: pointer;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .video-dialog-content {
    text-align: center;

    .preview-video {
      width: 100%;
      max-height: 500px;
      background: #000;
    }

    .video-name {
      margin-top: 12px;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  :deep(.el-upload-list__item) {
    cursor: grab !important;
    transition: all 0.3s ease;
    position: relative;
    user-select: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      cursor: grabbing !important;
    }
  }

  :deep(.sortable-ghost) {
    opacity: 0.4 !important;
    background: #f0f0f0 !important;
  }

  :deep(.sortable-chosen) {
    cursor: grabbing !important;
    opacity: 0.8 !important;
  }

  :deep(.sortable-drag) {
    opacity: 0.8 !important;
    transform: rotate(5deg) !important;
  }

  :deep(.sortable-fallback) {
    opacity: 0.8 !important;
    cursor: grabbing !important;
  }
</style>
