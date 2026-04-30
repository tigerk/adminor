<template>
  <div class="owner-contract-file-tab">
    <section class="contract-section contract-summary-section">
      <div class="section-head">
        <div>
          <div class="section-title">合同摘要</div>
          <div class="section-desc">查看线上合同内容，支持下载、重新生成或确认线下签约。</div>
        </div>
        <el-space wrap>
          <el-button :icon="Download" :disabled="!contractId || !contract?.contractContent" @click="handleDownloadContract">下载合同</el-button>
          <el-button :icon="Document" :disabled="!contractId || readonlyContract" @click="handleGenerateContract">重新生成合同</el-button>
          <el-button type="primary" :icon="Checked" :disabled="!canSignContract" @click="openOfflineSignDialog">线下签约</el-button>
        </el-space>
      </div>

      <div class="contract-summary-grid">
        <div class="summary-item summary-item--wide">
          <span class="summary-item__label">合同编号</span>
          <strong class="summary-item__value">{{ contract?.contractNo || "-" }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">签署状态</span>
          <el-tag :type="signStatusTagType" effect="light">{{ signStatusText }}</el-tag>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">合同介质</span>
          <strong class="summary-item__value">{{ contractMediumText }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">合同周期</span>
          <strong class="summary-item__value">{{ formatDate(contract?.contractStart) }} 至 {{ formatDate(contract?.contractEnd) }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">合同模板</span>
          <strong class="summary-item__value">{{ detailData?.contractTemplateName || contract?.contractTemplateId || "-" }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">更新时间</span>
          <strong class="summary-item__value">{{ contract?.updateAt || "-" }}</strong>
        </div>
      </div>
    </section>

    <section class="contract-section contract-content-section">
      <div class="section-head section-head--compact">
        <div>
          <div class="section-title">合同内容预览</div>
          <div class="section-desc">系统生成的合同内容快照，可重新选择模板生成；正文较长时在预览区内滚动查看。</div>
        </div>
      </div>
      <div v-if="contract?.contractContent" class="contract-preview" v-html="contract.contractContent" />
      <el-empty v-else description="暂无合同内容" :image-size="96">
        <el-button type="primary" :icon="Document" :disabled="!contractId || readonlyContract" @click="handleGenerateContract">生成合同内容</el-button>
      </el-empty>
    </section>

    <el-dialog v-model="offlineSignVisible" title="线下签约" width="760px" destroy-on-close>
      <div class="offline-sign-dialog">
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          title="请上传已完成线下签字的纸质合同照片、扫描件或 PDF。确认后，系统会保存这些资料并将合同状态改为已签约。"
        />
        <el-upload
          v-model:file-list="offlineSignFileList"
          class="attachment-uploader offline-sign-uploader"
          drag
          multiple
          :show-file-list="false"
          :http-request="offlineSignUpload"
          :before-upload="beforeUpload"
          accept="image/*,.pdf,.doc,.docx"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽线下合同文件到这里，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">至少上传 1 个文件；支持图片、PDF、Word，单个文件不超过 20MB。</div>
          </template>
        </el-upload>

        <div v-if="offlineSignDisplayFileList.length" class="attachment-grid attachment-grid--dialog">
          <div v-for="file in offlineSignDisplayFileList" :key="file.uid || file.url || file.name" class="attachment-card">
            <div class="attachment-card__preview">
              <el-image
                v-if="file.url && isImageFile(file.url)"
                :src="file.url"
                :preview-src-list="offlineSignImagePreviewUrls"
                fit="cover"
                preview-teleported
              />
              <div v-else class="attachment-card__file">
                <el-icon><Document /></el-icon>
                <span>{{ fileExt(file.name || file.url || "") }}</span>
              </div>
            </div>
            <div class="attachment-card__body">
              <div class="attachment-card__name" :title="file.name">{{ file.name || fileName(file.url || "") }}</div>
              <div class="attachment-card__status">
                <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage || 0" :show-text="false" />
                <span v-else>{{ file.status === "success" ? "已上传" : "待上传" }}</span>
              </div>
            </div>
            <div class="attachment-card__actions">
              <el-button link type="primary" :disabled="!file.url" @click="openFile(file.url)">查看</el-button>
              <el-button link type="danger" @click="removeOfflineSignFile(file)">删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="请先上传线下合同资料" :image-size="72" />
      </div>
      <template #footer>
        <el-button @click="offlineSignVisible = false">取消</el-button>
        <el-button type="primary" :loading="offlineSigning" :disabled="offlineSignUploading" @click="confirmOfflineSign">确认线下签约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, nextTick, ref, type Ref } from "vue";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";
  import { Checked, Document, Download, UploadFilled } from "@element-plus/icons-vue";
  import { addDialog } from "@/components/ReDialog";
  import { generateOwnerContract, offlineSignOwnerContract, previewOwnerContract } from "@/api/contract/owner";
  import { uploadFile } from "@/api/upload";
  import { message } from "@/utils/message";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/SelectContractTemplateDialog.vue";
  import { OwnerContractStatusEnumMeta, OwnerSignStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerContractDto, OwnerDetailVo } from "@/types/generated";

  type OwnerContractWithAttachments = OwnerContractDto & {
    contractAttachmentList?: string[];
    contractAttachmentGroupList?: AttachmentGroup[];
  };

  type AttachmentGroup = {
    bizSubtype?: string;
    attachmentUrls?: string[];
  };

  type OwnerDetailWithContractFiles = OwnerDetailVo & {
    contractTemplateName?: string;
    ownerContract?: OwnerContractWithAttachments;
  };

  const props = defineProps<{
    detailData?: OwnerDetailWithContractFiles | null;
  }>();

  const emit = defineEmits<{
    updated: [];
  }>();

  const offlineSignFileList = ref<UploadFile[]>([]);
  const offlineSignVisible = ref(false);
  const offlineSigning = ref(false);

  const contract = computed(() => props.detailData?.ownerContract);
  const contractId = computed(() => contract.value?.id);
  const readonlyContract = computed(() => {
    const status = contract.value?.status;
    return status === OwnerContractStatusEnumMeta.CHECKED_OUT.code || status === OwnerContractStatusEnumMeta.VOIDED.code;
  });
  const canSignContract = computed(() => {
    if (!contractId.value || readonlyContract.value) return false;
    if (contract.value?.status === OwnerContractStatusEnumMeta.PENDING_APPROVAL.code) return false;
    return contract.value?.signStatus !== OwnerSignStatusEnumMeta.SIGNED.code;
  });
  const signStatusText = computed(() => (contract.value?.signStatus === OwnerSignStatusEnumMeta.SIGNED.code ? "已签字" : "待签字"));
  const signStatusTagType = computed(() => (contract.value?.signStatus === OwnerSignStatusEnumMeta.SIGNED.code ? "success" : "warning"));
  const contractMediumText = computed(() => {
    const value = contract.value?.contractMedium;
    if (value === "ELECTRONIC") return "电子合同";
    if (value === "PAPER") return "纸质合同";
    return value || "-";
  });
  const signedContractAttachmentUrls = computed(() => {
    const group = contract.value?.contractAttachmentGroupList?.find(item => item.bizSubtype === "SIGNED_CONTRACT");
    return (group?.attachmentUrls || []).filter(Boolean);
  });
  const offlineSignDisplayFileList = computed(() => offlineSignFileList.value.filter(file => file.status !== "fail"));
  const offlineSignSuccessUrls = computed(() => offlineSignFileList.value.filter(file => file.status === "success" && file.url).map(file => file.url!));
  const offlineSignImagePreviewUrls = computed(() => offlineSignSuccessUrls.value.filter(url => isImageFile(url)));
  const offlineSignUploading = computed(() => offlineSignFileList.value.some(file => file.status === "uploading"));

  function toUploadFile(url: string, index: number): UploadFile {
    return {
      uid: -(Date.now() + index),
      name: fileName(url),
      status: "success",
      url,
      percentage: 100
    } as UploadFile;
  }

  function formatDate(value?: string | Date) {
    if (!value) return "-";
    return String(value).slice(0, 10);
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

  async function uploadToList(options: UploadRequestOptions, targetFileList: Ref<UploadFile[]>, afterSuccess: () => void) {
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
      const fileItem = targetFileList.value.find(item => item.raw === file);
      if (fileItem) {
        fileItem.url = response.data;
        fileItem.name = file.name;
      }
      onSuccess(response.data);
      await nextTick();
      afterSuccess();
    } catch (error: any) {
      onError(error);
      message(error?.message || "上传失败", { type: "error" });
    }
  }

  function offlineSignUpload(options: UploadRequestOptions) {
    return uploadToList(options, offlineSignFileList, () => {
      message("上传成功", { type: "success" });
    });
  }

  function removeOfflineSignFile(file: UploadFile) {
    offlineSignFileList.value = offlineSignFileList.value.filter(item => item.uid !== file.uid);
  }

  function openFile(url?: string) {
    if (!url) return;
    window.open(url, "_blank");
  }

  async function handleDownloadContract() {
    if (!contractId.value) return;
    const resp = await previewOwnerContract({ contractId: contractId.value });
    const blob = new Blob([resp], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `业主合同_${contract.value?.contractNo || contractId.value}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleGenerateContract() {
    if (!contractId.value) return;
    const formRef = ref();
    addDialog({
      title: "重新生成业主合同",
      top: "8%",
      width: "420px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, contractType: 2 }),
      beforeSure: (done) => {
        const selectedTemplate = formRef.value?.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        generateOwnerContract({
          contractId: contractId.value!,
          contractTemplateId: selectedTemplate
        }).then(resp => {
          if (resp.code === 0) {
            message("合同已重新生成", { type: "success" });
            emit("updated");
            done();
            return;
          }
          message(resp.message || "重新生成合同失败", { type: "error" });
        });
      }
    });
  }

  function openOfflineSignDialog() {
    if (!contractId.value) return;
    offlineSignFileList.value = signedContractAttachmentUrls.value.map((url, index) => toUploadFile(url, index));
    offlineSignVisible.value = true;
  }

  async function confirmOfflineSign() {
    if (!contractId.value) return;
    if (offlineSignUploading.value) {
      message("文件上传中，请稍后确认", { type: "warning" });
      return;
    }
    if (!offlineSignSuccessUrls.value.length) {
      message("线下签约需要上传合同资料", { type: "warning" });
      return;
    }
    offlineSigning.value = true;
    try {
      const resp = await offlineSignOwnerContract({
        contractId: contractId.value,
        attachmentUrls: offlineSignSuccessUrls.value
      });
      if (resp.code === 0) {
        message("线下签约已确认", { type: "success" });
        offlineSignVisible.value = false;
        emit("updated");
        return;
      }
      message(resp.message || "线下签约失败", { type: "error" });
    } finally {
      offlineSigning.value = false;
    }
  }
</script>

<style scoped lang="scss">
  .owner-contract-file-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .contract-section {
    padding: 14px 16px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc,
  .summary-item__label,
  .attachment-card__status {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .section-desc {
    margin-top: 4px;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .section-head--compact {
    margin-bottom: 10px;
  }

  .contract-summary-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1.2fr) repeat(3, minmax(160px, 1fr));
    gap: 10px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
    padding: 12px 14px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .summary-item--wide {
    grid-column: span 1;
  }

  .summary-item__value {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contract-preview {
    max-height: 460px;
    overflow: auto;
    padding: 18px;
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .attachment-layout {
    display: grid;
    grid-template-columns: minmax(300px, 0.42fr) minmax(0, 1fr);
    gap: 14px;
    align-items: stretch;
  }

  .attachment-list-panel {
    min-width: 0;
    min-height: 188px;
    padding: 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .attachment-list-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .attachment-uploader {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 188px;
      padding: 18px;
      background: var(--el-fill-color-extra-light);
      border-color: var(--el-border-color);
    }
  }

  .offline-sign-dialog {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .offline-sign-uploader {
    margin-top: 2px;
  }

  .attachment-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .attachment-grid--dialog {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 420px;
    overflow: auto;
    padding-right: 4px;
  }

  .attachment-card {
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .attachment-card__preview {
    height: 116px;
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
      font-size: 34px;
    }
  }

  .attachment-card__body {
    padding: 10px 12px 4px;
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
    padding: 0 10px 10px;
  }

  @media (max-width: 1280px) {
    .contract-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .attachment-layout {
      grid-template-columns: 1fr;
    }

    .attachment-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 960px) {
    .section-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .contract-summary-grid,
    .attachment-grid,
    .attachment-grid--dialog {
      grid-template-columns: 1fr;
    }
  }
</style>
