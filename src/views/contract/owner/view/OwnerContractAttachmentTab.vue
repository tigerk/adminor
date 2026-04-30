<template>
  <div class="owner-contract-attachment-tab">
    <section class="attachment-section">
      <div class="section-head">
        <div>
          <div class="section-title">资料附件</div>
          <div class="section-desc">按资料用途分组管理业主合同相关附件；线下签约上传的合同会归档到“线下签约合同”。</div>
        </div>
        <el-button type="primary" :disabled="!attachmentDirty || hasUploading || attachmentReadonly" @click="saveAttachments">保存资料</el-button>
      </div>

      <div class="category-summary">
        <div v-for="category in categoryOptions" :key="category.value" class="category-summary__item">
          <span>{{ category.label }}</span>
          <strong>{{ successUrls(category.value).length }}</strong>
        </div>
      </div>
    </section>

    <section class="attachment-category-grid">
      <div v-for="category in categoryOptions" :key="category.value" class="attachment-category-card">
        <div class="category-head">
          <div>
            <div class="category-title">{{ category.label }}</div>
            <div class="category-desc">{{ category.desc }}</div>
          </div>
          <el-upload
            v-model:file-list="fileListMap[category.value]"
            :show-file-list="false"
            multiple
            :http-request="options => uploadToCategory(category.value, options)"
            :before-upload="beforeUpload"
            :disabled="attachmentReadonly"
            accept="image/*,.pdf,.doc,.docx"
          >
            <el-button type="primary" plain size="small" :disabled="attachmentReadonly">上传</el-button>
          </el-upload>
        </div>

        <div v-if="displayFileList(category.value).length" class="attachment-card-grid">
          <div v-for="file in displayFileList(category.value)" :key="`${category.value}-${file.uid || file.url || file.name}`" class="attachment-card">
            <div class="attachment-card__preview">
              <el-image
                v-if="file.url && isImageFile(file.url)"
                :src="file.url"
                :preview-src-list="imagePreviewUrls(category.value)"
                fit="cover"
                preview-teleported
              />
              <div v-else class="attachment-card__file">
                <el-icon><Document /></el-icon>
                <span>{{ fileExt(file.name || file.url || "") }}</span>
              </div>
            </div>
            <div class="attachment-card__body">
              <div class="attachment-card__name" :title="file.name || fileName(file.url || '')">{{ file.name || fileName(file.url || "") }}</div>
              <div class="attachment-card__status">
                <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage || 0" :show-text="false" />
                <span v-else>{{ file.status === "success" ? "已上传" : "待上传" }}</span>
              </div>
            </div>
            <div class="attachment-card__actions">
              <el-button link type="primary" :disabled="!file.url" @click="openFile(file.url)">查看</el-button>
              <el-button link type="danger" :disabled="attachmentReadonly" @click="removeFile(category.value, file)">删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无资料" :image-size="58" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from "vue";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";
  import { Document } from "@element-plus/icons-vue";
  import { updateOwnerContractAttachments } from "@/api/contract/owner";
  import { uploadFile } from "@/api/upload";
  import { message } from "@/utils/message";
  import { OwnerContractStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerContractAttachmentUpdateDto, OwnerContractDto, OwnerDetailVo } from "@/types/generated";

  const categoryOptions = [
    { value: "SIGNED_CONTRACT", label: "线下签约合同", desc: "纸质合同照片、扫描件或签署版 PDF。" },
    { value: "SUPPLEMENT_AGREEMENT", label: "补充协议", desc: "合同补充协议、变更协议等资料。" },
    { value: "AUTHORIZATION", label: "授权委托书", desc: "业主授权、代理签约等授权文件。" },
    { value: "OWNER_MATERIAL", label: "业主资料", desc: "业主补充证件、证明、收款资料等。" },
    { value: "HOUSE_MATERIAL", label: "房源资料", desc: "房源交接、产权或房源相关证明。" },
    { value: "OTHER", label: "其他资料", desc: "无法归入以上分类的业务附件。" }
  ] as const;

  type CategoryCode = (typeof categoryOptions)[number]["value"];
  type AttachmentGroup = {
    bizSubtype?: string;
    attachmentUrls?: string[];
  };
  type OwnerContractWithAttachmentGroups = OwnerContractDto & {
    contractAttachmentGroupList?: AttachmentGroup[];
  };
  type OwnerDetailWithAttachmentGroups = OwnerDetailVo & {
    ownerContract?: OwnerContractWithAttachmentGroups;
  };

  const props = defineProps<{
    detailData?: OwnerDetailWithAttachmentGroups | null;
  }>();

  const emit = defineEmits<{
    updated: [];
  }>();

  const fileListMap = ref<Record<CategoryCode, UploadFile[]>>(createEmptyFileListMap());
  const attachmentDirty = ref(false);

  const contract = computed(() => props.detailData?.ownerContract);
  const contractId = computed(() => contract.value?.id);
  const attachmentReadonly = computed(() => contract.value?.status === OwnerContractStatusEnumMeta.VOIDED.code);
  const hasUploading = computed(() => categoryOptions.some(category => fileListMap.value[category.value].some(file => file.status === "uploading")));

  watch(
    () => contract.value?.contractAttachmentGroupList,
    groups => {
      const nextMap = createEmptyFileListMap();
      for (const group of groups || []) {
        const category = normalizeCategory(group.bizSubtype);
        nextMap[category] = (group.attachmentUrls || []).filter(Boolean).map((url, index) => toUploadFile(url, index));
      }
      fileListMap.value = nextMap;
      attachmentDirty.value = false;
    },
    { immediate: true }
  );

  function createEmptyFileListMap(): Record<CategoryCode, UploadFile[]> {
    return categoryOptions.reduce(
      (result, category) => {
        result[category.value] = [];
        return result;
      },
      {} as Record<CategoryCode, UploadFile[]>
    );
  }

  function normalizeCategory(value?: string): CategoryCode {
    return categoryOptions.some(category => category.value === value) ? (value as CategoryCode) : "OTHER";
  }

  function toUploadFile(url: string, index: number): UploadFile {
    return {
      uid: -(Date.now() + index),
      name: fileName(url),
      status: "success",
      url,
      percentage: 100
    } as UploadFile;
  }

  function displayFileList(category: CategoryCode) {
    return fileListMap.value[category].filter(file => file.status !== "fail");
  }

  function successUrls(category: CategoryCode) {
    return fileListMap.value[category].filter(file => file.status === "success" && file.url).map(file => file.url!);
  }

  function imagePreviewUrls(category: CategoryCode) {
    return successUrls(category).filter(url => isImageFile(url));
  }

  function fileName(url: string) {
    if (!url) return "附件";
    return decodeURIComponent(url.split("?")[0].split("/").pop() || "附件");
  }

  function fileExt(value: string) {
    const name = fileName(value);
    const ext = name.includes(".") ? name.split(".").pop() || "FILE" : "FILE";
    return ext.toUpperCase();
  }

  function isImageFile(value?: string) {
    if (!value) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(value.split("?")[0]);
  }

  function beforeUpload(file: File) {
    const allowTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const allowExt = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i.test(file.name);
    if (!allowTypes.includes(file.type) && !allowExt) {
      message("仅支持图片、PDF 或 Word 文件", { type: "warning" });
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      message("单个文件不能超过 20MB", { type: "warning" });
      return false;
    }
    return true;
  }

  async function uploadToCategory(category: CategoryCode, options: UploadRequestOptions) {
    const { file, onProgress, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await uploadFile(formData, progress => {
        onProgress({ percent: progress } as UploadProgressEvent);
      });
      if (response?.code !== 0 || !response.data) {
        throw new Error(response?.message || "上传失败");
      }
      const fileItem = fileListMap.value[category].find(item => item.raw === file);
      if (fileItem) {
        fileItem.url = response.data;
        fileItem.name = file.name;
      }
      onSuccess(response.data);
      await nextTick();
      attachmentDirty.value = true;
      message("上传成功，请保存资料", { type: "success" });
    } catch (error: any) {
      onError(error);
      message(error?.message || "上传失败", { type: "error" });
    }
  }

  function removeFile(category: CategoryCode, file: UploadFile) {
    fileListMap.value[category] = fileListMap.value[category].filter(item => item.uid !== file.uid);
    attachmentDirty.value = true;
  }

  function openFile(url?: string) {
    if (!url) return;
    window.open(url, "_blank");
  }

  async function saveAttachments() {
    if (!contractId.value) return;
    const attachmentGroupList: AttachmentGroup[] = categoryOptions
      .map(category => ({
        bizSubtype: category.value,
        attachmentUrls: successUrls(category.value)
      }))
      .filter(group => group.attachmentUrls.length > 0);
    const resp = await updateOwnerContractAttachments({
      contractId: contractId.value,
      attachmentGroupList
    } as OwnerContractAttachmentUpdateDto & { attachmentGroupList: AttachmentGroup[] });
    if (resp.code === 0) {
      message("资料附件已保存", { type: "success" });
      attachmentDirty.value = false;
      emit("updated");
      return;
    }
    message(resp.message || "保存资料附件失败", { type: "error" });
  }
</script>

<style scoped lang="scss">
  .owner-contract-attachment-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .attachment-section,
  .attachment-category-card {
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .attachment-section {
    padding: 14px 16px;
  }

  .section-head,
  .category-head {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .section-title,
  .category-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc,
  .category-desc,
  .attachment-card__status {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .section-desc,
  .category-desc {
    margin-top: 4px;
  }

  .category-summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .category-summary__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    padding: 10px 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: var(--el-color-primary);
    }
  }

  .attachment-category-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .attachment-category-card {
    min-width: 0;
    padding: 14px;
  }

  .attachment-card-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .attachment-card {
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .attachment-card__preview {
    height: 110px;
    background: var(--el-fill-color-light);

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }
  }

  .attachment-card__file {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    color: var(--el-color-primary);

    .el-icon {
      font-size: 32px;
    }
  }

  .attachment-card__body {
    padding: 9px 10px 4px;
  }

  .attachment-card__name {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attachment-card__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 10px 9px;
  }

  @media (max-width: 1280px) {
    .category-summary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .attachment-category-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 960px) {
    .section-head,
    .category-head {
      flex-direction: column;
    }

    .category-summary,
    .attachment-card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
