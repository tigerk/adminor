<script setup lang="ts">
  import Sortable from "sortablejs";
  import { ref, computed } from "vue";
  import { useRouter } from "vue-router";
  import { message } from "@/utils/message";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";
  import { getKeyList, extractFields, downloadByData } from "@pureadmin/utils";
  import axios from "axios";

  import EpPlus from "~icons/ep/plus?width=30&height=30";
  import Eye from "~icons/ri/eye-line";
  import Delete from "~icons/ri/delete-bin-7-line";
  import { uploadFile } from "@/api/upload";

  defineOptions({
    name: "UploadFile"
  });

  const fileList = ref([]);
  const router = useRouter();
  const curOpenImgIndex = ref(0);
  const dialogVisible = ref(false);

  // 获取vite环境变量中的host
  const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:8888";
  const uploadUrl = `${baseURL}/admin/file/upload`;

  const urlList = computed(() => getKeyList(fileList.value, "url"));
  const imgInfos = computed(() => extractFields(fileList.value, "name", "size"));

  const getImgUrl = name => new URL(`./imgs/${name}.jpg`, import.meta.url).href;
  const srcList = Array.from({ length: 3 }).map((_, index) => {
    return getImgUrl(index + 1);
  });

  /** 上传文件前校验 */
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

  /** 自定义上传方法 */
  const customUpload = async (options: UploadRequestOptions) => {
    const { file, onProgress, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 传入进度回调函数
      const response = await uploadFile(formData, progress => {
        // 调用 Element Plus 的进度回调
        onProgress({ percent: progress } as UploadProgressEvent);
      });

      // 假设服务器返回的数据格式为 { code: 0, data: { url: '...' }, message: '...' }
      if (response.data && response?.code === 0) {
        onSuccess(response.data);
        message("上传成功", { type: "success" });
      } else {
        message("上传失败", { type: "error" });
      }
    } catch (error) {
      console.error("上传失败:", error);
      onError(error);
      message(error.message || "上传失败", { type: "error" });
    }
  };

  /** 上传成功回调 */
  const onUploadSuccess = (response: any, file: UploadFile) => {
    // 更新文件列表中的url，假设服务器返回的url在response.data.url中
    const fileItem = fileList.value.find(item => item.uid === file.uid);
    if (fileItem && response.data && response.data.url) {
      fileItem.url = response.data.url;
    }
  };

  /** 上传失败回调 */
  const onUploadError = (error: any, file: UploadFile) => {
    console.error("上传失败:", error);
    // 可以选择移除失败的文件
    handleRemove(file);
  };

  /** 超出最大上传数时触发 */
  const onExceed = () => {
    message("最多上传3张图片，请先删除再上传");
  };

  /** 移除上传的文件 */
  const handleRemove = (file: UploadFile) => {
    fileList.value.splice(fileList.value.indexOf(file), 1);
  };

  /** 大图预览 */
  const handlePictureCardPreview = (file: UploadFile) => {
    curOpenImgIndex.value = fileList.value.findIndex(img => img.uid === file.uid);
    dialogVisible.value = true;
  };

  const getUploadItem = () => document.querySelectorAll("#pure-upload-item");

  /** 缩略图拖拽排序 */
  const imgDrop = uid => {
    const CLASSNAME = "el-upload-list";
    const _curIndex = fileList.value.findIndex(img => img.uid === uid);
    getUploadItem()?.[_curIndex]?.classList?.add(`${CLASSNAME}__item-actions`);
    const wrapper: HTMLElement = document.querySelector(`.${CLASSNAME}`);
    Sortable.create(wrapper, {
      handle: `.${CLASSNAME}__item`,
      onEnd: ({ newIndex, oldIndex }) => {
        const oldFile = fileList.value[oldIndex];
        fileList.value.splice(oldIndex, 1);
        fileList.value.splice(newIndex, 0, oldFile);
        // fix: https://github.com/SortableJS/Sortable/issues/232 (firefox is ok, but chromium is bad. see https://bugs.chromium.org/p/chromium/issues/detail?id=410328)
        getUploadItem().forEach(ele => {
          ele.classList.remove(`${CLASSNAME}__item-actions`);
        });
      }
    });
  };
</script>

<template>
  <el-card shadow="never">
    <el-upload
      v-model:file-list="fileList"
      drag
      multiple
      class="pure-upload"
      list-type="picture-card"
      accept="image/jpeg,image/png,image/gif"
      :limit="3"
      :http-request="customUpload"
      :on-exceed="onExceed"
      :before-upload="onBefore"
      :on-success="onUploadSuccess"
      :on-error="onUploadError"
    >
      <EpPlus class="m-auto mt-4" />
      <template #file="{ file }">
        <div v-if="file.status == 'ready' || file.status == 'uploading'" class="mt-[35%]! m-auto">
          <p class="font-medium">文件上传中</p>
          <el-progress class="mt-2!" :stroke-width="2" :text-inside="true" :show-text="false" :percentage="file.percentage" />
        </div>
        <div v-else @mouseenter.stop="imgDrop(file.uid)">
          <img class="el-upload-list__item-thumbnail select-none" :src="file.url" />
          <span id="pure-upload-item" :class="['el-upload-list__item-actions', fileList.length > 1 && 'cursor-move!']">
            <span title="查看" class="hover:text-primary" @click="handlePictureCardPreview(file)">
              <IconifyIconOffline :icon="Eye" class="hover:scale-125 duration-100" />
            </span>
            <span class="el-upload-list__item-delete" @click="handleRemove(file)">
              <span title="移除" class="hover:text-[var(--el-color-danger)]">
                <IconifyIconOffline :icon="Delete" class="hover:scale-125 duration-100" />
              </span>
            </span>
          </span>
        </div>
      </template>
    </el-upload>
    <el-image-viewer
      v-if="dialogVisible"
      :initialIndex="curOpenImgIndex"
      :url-list="urlList"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
      @close="dialogVisible = false"
      @switch="index => (curOpenImgIndex = index)"
    />
    <!-- 将自定义内容插入到body里，有了它在图片预览的时候，想插入个分页器或者别的东东在预览区某个位置就很方便咯（用户需求可以很灵活，开源组件库几乎不可能尽善尽美，很多时候寻找别的解决途径或许更好） -->
    <teleport to="body">
      <div v-if="fileList[curOpenImgIndex] && dialogVisible" effect="dark" round size="large" type="info" class="img-name">
        <p class="text-[#fff] dark:text-black">
          {{ fileList[curOpenImgIndex].name }}
        </p>
      </div>
    </teleport>
    <p class="el-upload__tip">可拖拽上传最多3张单个不超过2MB且格式为jpeg/png/gif的图片</p>
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

  .img-name {
    position: absolute;
    bottom: 80px;
    left: 50%;
    z-index: 4000;
    padding: 5px 23px;
    background-color: var(--el-text-color-regular);
    border-radius: 22px;
    transform: translateX(-50%);
  }
</style>
