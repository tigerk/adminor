<script setup lang="ts">
  import Sortable from "sortablejs";
  import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from "vue";
  import { message } from "@/utils/message";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";

  import EpPlus from "~icons/ep/plus?width=30&height=30";
  import Eye from "~icons/ri/eye-line";
  import Delete from "~icons/ri/delete-bin-7-line";
  import { uploadFile } from "@/api/upload";
  import { isStringArray } from "@/utils/yeah";

  defineOptions({
    name: "UploadImage"
  });

  const rawFileList = defineModel<UploadFile[] | string[]>();

  const props = defineProps({
    limit: {
      type: Number,
      default: 3
    },
    width: {
      type: [Number, String],
      default: undefined // 不设置默认值，使用 Element Plus 默认大小
    },
    height: {
      type: [Number, String],
      default: undefined
    }
  });

  // 生成唯一的组件ID
  const instance = getCurrentInstance();
  const componentId = `upload-image-${instance?.uid || Date.now()}`;

  const convertUrlsToUploadFiles = (urls: string[]): UploadFile[] => {
    return urls.map((url, index) => {
      const fileName = url.split("/").pop() || `image-${index + 1}`;
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpeg";

      let mimeType = "image/jpeg";
      switch (fileExtension) {
        case "png":
          mimeType = "image/png";
          break;
        case "gif":
          mimeType = "image/gif";
          break;
        case "jpg":
        case "jpeg":
          mimeType = "image/jpeg";
          break;
        default:
          mimeType = "image/jpeg";
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

  const curOpenImgIndex = ref(0);
  const dialogVisible = ref(false);
  const uploadRef = ref();

  const urlList = computed(() => {
    const validFiles = fileList.value.filter(file => file && file.url && file.status === "success");
    console.log("有效图片列表:", validFiles);
    return validFiles.map(file => file.url as string);
  });

  const onBefore = file => {
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      message("只能上传图片");
      return false;
    }
    const isExceed = file.size / 1024 / 1024 > 2;
    if (isExceed) {
      message(`单个图片大小不能超过2MB`);
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
      let imageUrl: string | undefined;

      if (typeof response === "string") {
        imageUrl = response;
      } else if (response.url) {
        imageUrl = response.url;
      } else if (response.fileUrl) {
        imageUrl = response.fileUrl;
      } else if (response.path) {
        imageUrl = response.path;
      } else if (response.data && response.data.url) {
        imageUrl = response.data.url;
      }

      if (imageUrl) {
        fileItem.url = imageUrl;
        fileItem.status = "success";
        console.log("图片URL设置成功:", imageUrl);
      } else {
        console.error("无法从响应中提取URL:", response);
        message("上传成功但无法获取图片URL", { type: "warning" });
      }
    }
  };

  const onUploadError = (error: any, file: UploadFile) => {
    console.error("上传失败:", error);
    handleRemove(file);
  };

  const onExceed = () => {
    message(`最多上传${props.limit}张图片，请先删除再上传`);
  };

  const handleRemove = (file: UploadFile) => {
    console.log("删除文件:", file);
    const index = fileList.value.findIndex(item => item.uid === file.uid);
    if (index > -1) {
      fileList.value.splice(index, 1);
      console.log("文件已删除，当前列表:", fileList.value);
    }
  };

  const handlePictureCardPreview = (file: UploadFile) => {
    console.log("预览文件:", file);
    console.log("当前文件列表:", fileList.value);
    console.log("URL列表:", urlList.value);

    if (!file.url) {
      message("图片URL不存在，无法预览", { type: "warning" });
      return;
    }

    if (file.status !== "success") {
      message("图片正在上传中，请稍候", { type: "warning" });
      return;
    }

    const validFiles = fileList.value.filter(f => f && f.url && f.status === "success");
    const index = validFiles.findIndex(img => img.uid === file.uid);

    console.log("有效文件列表:", validFiles);
    console.log("当前文件索引:", index);

    if (index >= 0) {
      curOpenImgIndex.value = index;
      dialogVisible.value = true;
      console.log("打开预览，索引:", index);
    } else {
      message("无法找到图片，请重试", { type: "warning" });
    }
  };

  let sortableInstance: Sortable | null = null;

  /** 初始化拖拽排序 */
  const initSortable = () => {
    console.log("初始化拖拽，当前文件数:", fileList.value.length);

    // 销毁之前的实例
    if (sortableInstance) {
      console.log("销毁旧的 Sortable 实例");
      sortableInstance.destroy();
      sortableInstance = null;
    }

    // 只有多个文件时才初始化拖拽
    if (fileList.value.length <= 1) {
      console.log("文件数量不足，跳过拖拽初始化");
      return;
    }

    nextTick(() => {
      // 使用唯一的组件ID选择器，确保只操作当前组件的元素
      const componentWrapper = document.getElementById(componentId);
      if (!componentWrapper) {
        console.error("未找到组件容器");
        return;
      }

      const wrapper = componentWrapper.querySelector(".el-upload-list.el-upload-list--picture-card") as HTMLElement;

      console.log("找到的容器元素:", wrapper);

      if (wrapper) {
        const items = wrapper.querySelectorAll(".el-upload-list__item");
        console.log("找到的图片项数量:", items.length);

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

  // 监听文件列表变化，重新初始化拖拽
  watch(
    () => fileList.value.length,
    (newLength, oldLength) => {
      console.log("文件列表长度变化:", oldLength, "->", newLength);
      setTimeout(() => {
        initSortable();
      }, 300);
    }
  );

  // 组件挂载后初始化
  onMounted(() => {
    console.log("组件已挂载，组件ID:", componentId);
    initSortable();
  });

  // 在 script setup 中添加
  const showUploadButton = computed(() => {
    return fileList.value.length < props.limit;
  });

  // 处理尺寸值，支持数字和字符串
  const uploadBoxStyle = computed(() => {
    const style: Record<string, string> = {};

    if (props.width !== undefined) {
      style["--upload-width"] = typeof props.width === "number" ? `${props.width}px` : props.width;
    }

    if (props.height !== undefined) {
      style["--upload-height"] = typeof props.height === "number" ? `${props.height}px` : props.height;
    }

    return style;
  });
</script>

<template>
  <div :id="componentId" :style="uploadBoxStyle">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      drag
      multiple
      class="pure-upload"
      :class="{ hideUploadBtn: !showUploadButton }"
      list-type="picture-card"
      accept="image/jpeg,image/png,image/gif"
      :limit="props.limit"
      :http-request="customUpload"
      :on-exceed="onExceed"
      :before-upload="onBefore"
      :on-success="onUploadSuccess"
      :on-error="onUploadError"
    >
      <!-- 移除外层 div，直接使用 EpPlus -->
      <EpPlus />

      <template #file="{ file }">
        <div v-if="file.status === 'ready' || file.status === 'uploading'" class="upload-progress-wrapper">
          <p class="font-medium">文件上传中</p>
          <el-progress class="mt-2!" :stroke-width="2" :text-inside="true" :show-text="false" :percentage="file.percentage || 0" />
        </div>
        <div v-else class="upload-item-content">
          <img class="el-upload-list__item-thumbnail select-none" :src="file.url" :alt="file.name" draggable="false" />
          <span class="el-upload-list__item-actions">
            <span title="查看" class="action-btn hover:text-primary" @click.stop="handlePictureCardPreview(file)">
              <IconifyIconOffline :icon="Eye" class="hover:scale-125 duration-100" />
            </span>
            <span title="移除" class="action-btn hover:text-[var(--el-color-danger)]" @click.stop="handleRemove(file)">
              <IconifyIconOffline :icon="Delete" class="hover:scale-125 duration-100" />
            </span>
          </span>
        </div>
      </template>
    </el-upload>

    <el-image-viewer
      v-if="dialogVisible"
      :initial-index="curOpenImgIndex"
      :url-list="urlList"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
      @close="dialogVisible = false"
      @switch="index => (curOpenImgIndex = index)"
    />

    <teleport to="body">
      <div v-if="fileList[curOpenImgIndex] && dialogVisible" class="img-name">
        <p class="text-[#fff] dark:text-black">
          {{ fileList[curOpenImgIndex].name }}
        </p>
      </div>
    </teleport>

    <p class="el-upload__tip">
      <slot name="tip" :limit="props.limit" :file-count="fileList.length">
        <span class="text-amber-600 text-base">图片</span>
        可拖拽上传最多{{ props.limit }}张，单个不超过2MB且格式为jpeg/png/gif的图片
        <span v-if="fileList.length > 1" class="text-primary font-medium">（直接拖拽图片可调整顺序）</span>
      </slot>
    </p>
  </div>
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
    // 修复 el-upload-dragger 导致的间距问题
    .el-upload-dragger {
      background-color: transparent;
      border: none;
      padding: 0;
      height: auto;
      min-height: auto;
    }

    // 自定义上传框尺寸
    .el-upload--picture-card {
      width: var(--upload-width, 148px);
      height: var(--upload-height, 148px);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 0 8px 8px 0; // 统一外边距

      // 确保图标居中
      svg {
        width: 30px;
        height: 30px;
        margin: 0;
      }
    }

    .el-upload-list__item {
      width: var(--upload-width, 148px);
      height: var(--upload-height, 148px);
      padding: 0;
      margin: 0 8px 8px 0; // 统一外边距，与上传按钮保持一致
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      overflow: hidden;
    }

    // 确保上传列表正常显示，统一布局
    .el-upload-list--picture-card {
      display: inline-flex; // 改为 inline-flex
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      line-height: 0; // 消除行内元素间隙
      vertical-align: top; // 顶部对齐
    }
  }

  // 上传进度容器 - 居中显示
  .upload-progress-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    text-align: center;
  }

  .img-name {
    position: fixed;
    bottom: 80px;
    left: 50%;
    z-index: 9999;
    padding: 5px 23px;
    background-color: var(--el-text-color-regular);
    border-radius: 22px;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .upload-item-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    // 修复图片显示问题
    .el-upload-list__item-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    // 操作按钮悬浮层
    .el-upload-list__item-actions {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;

      &:hover {
        opacity: 1;
      }
    }
  }

  .action-btn {
    cursor: pointer;
    margin: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 20px;
    transition: all 0.3s;
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

    // 确保图片容器填满
    .el-upload-list__item-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: contain;
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

  :deep(.hideUploadBtn .el-upload--picture-card) {
    display: none;
  }

  // 关键修复：统一提示文字的间距
  .el-upload__tip {
    margin-top: 7px !important; // 使用 !important 确保优先级
    margin-bottom: 0;
    line-height: 1.5;
    display: block;
    clear: both; // 清除浮动影响
  }

  // 额外修复：确保 el-upload 容器本身没有多余间距
  :deep(.el-upload) {
    margin: 0;
    vertical-align: top;
  }

  // 修复：统一整个上传区域的布局
  :deep(.pure-upload) {
    display: block;

    // 确保上传区域容器没有多余的 margin
    > .el-upload-list {
      margin-bottom: 0;
    }
  }
</style>
