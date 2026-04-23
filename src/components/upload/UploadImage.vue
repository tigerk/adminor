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

  defineOptions({ name: "UploadImage" });

  const rawFileList = defineModel<UploadFile[] | string[]>();

  const props = defineProps({
    limit: { type: Number, default: 1 },
    width: { type: [Number, String], default: undefined },
    height: { type: [Number, String], default: undefined },
    maxSizeMb: { type: Number, default: 10 }
  });

  const instance = getCurrentInstance();
  const componentId = `upload-image-${instance?.uid || Date.now()}`;

  // ─── fileList 由 el-upload 通过 v-model 自行维护 ─────────────────────
  // 我们只在两种情况主动写入：1.外部回填  2.删除
  const fileList = ref<UploadFile[]>([]);

  const urlToUploadFile = (url: string, index: number): UploadFile =>
    ({
      uid: -(Date.now() + index), // 负数 uid，区别于 el-upload 自增的正数 uid
      name: url.split("/").pop() || `image-${index + 1}`,
      status: "success" as const,
      url,
      size: 0,
      type: "image/jpeg",
      percentage: 100,
      raw: undefined
    }) as UploadFile;

  // ─── 对外 emit：只在明确时机手动调用，不用 watch 监听 fileList ────────
  const emitUrls = () => {
    const urls = fileList.value.filter(f => f.status === "success" && f.url).map(f => f.url!);
    rawFileList.value = urls;
  };

  // ─── 回填：外部传入 string[] 时同步到 fileList ──────────────────────
  // 严格只处理 string[]；我们自己 emit 出去的 string[] 也会触发这里，
  // 所以用 URL 内容对比跳过"自己 emit 引起的回流"
  watch(
    () => rawFileList.value,
    newVal => {
      if (!isStringArray(newVal)) return;
      const urls = (newVal as string[]).filter(Boolean);
      const curUrls = fileList.value.filter(f => f.status === "success" && f.url).map(f => f.url!);
      // 内容相同则跳过，防止自己 emit 引起的回流重置 fileList
      if (urls.length === curUrls.length && urls.every((u, i) => u === curUrls[i])) return;
      fileList.value = urls.map(urlToUploadFile);
    },
    { immediate: true }
  );

  // ─── 上传 ──────────────────────────────────────────────────────────
  const onBefore = (file: File) => {
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      message("只能上传图片");
      return false;
    }
    if (file.size / 1024 / 1024 > props.maxSizeMb) {
      message(`单个图片大小不能超过${props.maxSizeMb}MB`);
      return false;
    }
    return true;
  };

  const customUpload = async (options: UploadRequestOptions) => {
    const { file, onProgress, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadFile(formData, (progress: number) => {
        onProgress({ percent: progress } as UploadProgressEvent);
      });

      if (response?.code === 0 && response.data) {
        const imageUrl: string = response.data;

        // 先把 url 写进 fileList 对应项，再调 onSuccess
        // el-upload 通过 raw 字段关联 options.file 和 fileList 里的项
        const fileItem = fileList.value.find(f => f.raw === file);
        if (fileItem) fileItem.url = imageUrl;

        // onSuccess 会把 fileItem.status 改为 'success'
        onSuccess(imageUrl);

        // nextTick 保证 status 已是 success 后再 emit
        nextTick(() => {
          emitUrls();
          message("上传成功", { type: "success" });
        });
      } else {
        throw new Error(response?.message || "上传失败");
      }
    } catch (error: any) {
      onError(error);
      message(error.message || "上传失败", { type: "error" });
    }
  };

  const onUploadError = (_error: any, file: UploadFile) => {
    handleRemove(file);
  };

  const onExceed = () => {
    message(`最多上传${props.limit}张图片，请先删除再上传`);
  };

  // ─── 删除 ──────────────────────────────────────────────────────────
  const handleRemove = (file: UploadFile) => {
    const index = fileList.value.findIndex(item => item.uid === file.uid || (file.url && item.url === file.url));
    if (index > -1) {
      fileList.value.splice(index, 1);
      emitUrls();
    }
  };

  // ─── 预览 ──────────────────────────────────────────────────────────
  const curOpenImgIndex = ref(0);
  const dialogVisible = ref(false);
  const uploadRef = ref();

  const urlList = computed(() => fileList.value.filter(f => f.url && f.status === "success").map(f => f.url!));

  const handlePictureCardPreview = (file: UploadFile) => {
    if (!file.url) {
      message("图片URL不存在，无法预览", { type: "warning" });
      return;
    }
    if (file.status !== "success") {
      message("图片正在上传中，请稍候", { type: "warning" });
      return;
    }
    const validFiles = fileList.value.filter(f => f.url && f.status === "success");
    const index = validFiles.findIndex(f => f.uid === file.uid || f.url === file.url);
    if (index >= 0) {
      curOpenImgIndex.value = index;
      dialogVisible.value = true;
    } else {
      message("无法找到图片，请重试", { type: "warning" });
    }
  };

  // ─── 拖拽排序 ──────────────────────────────────────────────────────
  let sortableInstance: Sortable | null = null;

  const initSortable = () => {
    sortableInstance?.destroy();
    sortableInstance = null;
    if (fileList.value.length <= 1) return;
    nextTick(() => {
      const wrapper = document.getElementById(componentId)?.querySelector(".el-upload-list.el-upload-list--picture-card") as HTMLElement | null;
      if (!wrapper) return;
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
        onStart: () => {
          document.body.style.cursor = "grabbing";
        },
        onEnd: evt => {
          document.body.style.cursor = "";
          const { newIndex, oldIndex } = evt;
          if (typeof newIndex === "number" && typeof oldIndex === "number" && newIndex !== oldIndex && oldIndex < fileList.value.length && newIndex < fileList.value.length) {
            const moved = fileList.value.splice(oldIndex, 1)[0];
            fileList.value.splice(newIndex, 0, moved);
            emitUrls();
            message("排序已更新", { type: "success" });
          }
        },
        onMove: evt => evt.related.className.indexOf("el-upload--picture-card") === -1
      });
    });
  };

  watch(
    () => fileList.value.length,
    () => {
      setTimeout(initSortable, 300);
    }
  );
  onMounted(initSortable);

  // ─── 样式 ──────────────────────────────────────────────────────────
  const showUploadButton = computed(() => fileList.value.length < props.limit);

  const uploadBoxStyle = computed(() => {
    const style: Record<string, string> = {};
    if (props.width !== undefined) style["--upload-width"] = typeof props.width === "number" ? `${props.width}px` : props.width;
    if (props.height !== undefined) style["--upload-height"] = typeof props.height === "number" ? `${props.height}px` : props.height;
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
      :on-error="onUploadError"
    >
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
        <p class="text-[#fff] dark:text-black">{{ fileList[curOpenImgIndex].name }}</p>
      </div>
    </teleport>

    <p class="el-upload__tip">
      <slot name="tip" :limit="props.limit" :file-count="fileList.length">
        <span class="text-amber-600 text-base">图片</span>
        可拖拽上传最多{{ props.limit }}张，单个不超过{{ props.maxSizeMb }}MB且格式为jpeg/png/gif的图片
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
    .el-upload-dragger {
      background-color: transparent;
      border: none;
      padding: 0;
      height: auto;
      min-height: auto;
    }

    .el-upload--picture-card {
      width: var(--upload-width, 148px);
      height: var(--upload-height, 148px);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 0 8px 8px 0;
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
      margin: 0 8px 8px 0;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .el-upload-list--picture-card {
      display: inline-flex;
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      line-height: 0;
      vertical-align: top;
    }
  }

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

    .el-upload-list__item-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

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

  .el-upload__tip {
    margin-top: 7px !important;
    margin-bottom: 0;
    line-height: 1.5;
    display: block;
    clear: both;
  }

  :deep(.el-upload) {
    margin: 0;
    vertical-align: top;
  }

  :deep(.pure-upload) {
    display: block;
    > .el-upload-list {
      margin-bottom: 0;
    }
  }
</style>
