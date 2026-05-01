<template>
  <div class="owner-contract-file-tab">
    <section class="contract-section contract-list-section">
      <div class="section-head">
        <div>
          <div class="section-title">
            <span>签约合同列表</span>
            <el-tag type="info" size="small" effect="plain">{{ contractList.length }} 份</el-tag>
          </div>
          <div class="section-desc">业主可能存在多份签约合同；预览、下载、重新生成、线下签约都针对选中的单份合同执行。</div>
        </div>
        <el-button type="primary" plain :disabled="!canAddContractDoc" @click="openCreateContractDocDialog">添加新合同</el-button>
      </div>

      <div v-if="contractList.length" class="contract-list">
        <article
          v-for="item in contractList"
          :key="contractKey(item)"
          class="contract-row"
          :class="{ 'is-active': isSelected(item) }"
          @click="selectContract(item)"
        >
          <div class="contract-row__main">
            <div class="contract-row__title">
              <strong>{{ contractDocNo(item) || `合同 ${contractKey(item)}` }}</strong>
              <el-tag :type="signStatusTagType(item)" effect="light">{{ signStatusText(item) }}</el-tag>
            </div>
            <div class="contract-row__meta">
              <span class="contract-meta-item">
                <span class="contract-meta-label">合同周期</span>
                <strong>{{ formatDate(item.contractStart) }} 至 {{ formatDate(item.contractEnd) }}</strong>
              </span>
              <span class="contract-meta-item">
                <span class="contract-meta-label">合同模板</span>
                <strong>{{ contractTemplateText(item) }}</strong>
              </span>
              <span class="contract-meta-item">
                <span class="contract-meta-label">合同介质</span>
                <strong>{{ contractMediumText(item) }}</strong>
              </span>
              <span class="contract-meta-item">
                <span class="contract-meta-label">更新时间</span>
                <strong>{{ item.updateAt || "-" }}</strong>
              </span>
            </div>
          </div>
          <div class="contract-row__actions" @click.stop>
            <el-button link type="primary" :disabled="!item.id" @click="handlePreviewContract(item)">预览</el-button>
            <el-button link type="primary" :disabled="!item.id || !item.contractContent" @click="handleDownloadContract(item)">下载</el-button>
            <el-button link type="primary" :disabled="!item.id || isReadonlyContract(item)" @click="handleGenerateContract(item)">重新生成</el-button>
            <el-button link type="primary" :disabled="!canSignContract(item)" @click="openOfflineSignDialog(item)">线下签约</el-button>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无签约合同" :image-size="90" />
    </section>

    <el-dialog v-model="previewVisible" top="10px" :title="previewTitle" width="80%" destroy-on-close append-to-body>
      <iframe v-if="previewPdfUrl" title="业主合同预览" :src="previewPdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>

    <el-dialog v-model="offlineSignVisible" :title="offlineSignDialogTitle" width="860px" destroy-on-close>
      <div class="offline-sign-dialog">
        <div class="offline-sign-hero">
          <div class="offline-sign-hero__icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="offline-sign-hero__body">
            <div class="offline-sign-hero__title">上传已完成线下签字的合同资料</div>
            <div class="offline-sign-hero__desc">支持图片、PDF、Word；确认后资料会归档到当前签约合同，并将合同状态改为已签约。</div>
          </div>
        </div>

        <div class="offline-sign-layout">
          <div class="offline-sign-panel offline-sign-panel--upload">
            <div class="offline-sign-panel__head">
              <span>上传文件</span>
              <small>至少 1 个，单个 ≤ 20MB</small>
            </div>
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
              <div class="offline-upload-box">
                <el-icon class="offline-upload-box__icon"><UploadFilled /></el-icon>
                <strong>拖拽文件到这里</strong>
                <span>或点击选择合同照片、扫描件、PDF、Word</span>
              </div>
            </el-upload>
          </div>

          <div class="offline-sign-panel offline-sign-panel--files">
            <div class="offline-sign-panel__head">
              <span>已上传资料</span>
              <el-tag size="small" effect="plain">{{ offlineSignDisplayFileList.length }} 个</el-tag>
            </div>
            <div v-if="offlineSignDisplayFileList.length" class="offline-file-list">
              <div v-for="file in offlineSignDisplayFileList" :key="file.uid || file.url || file.name" class="offline-file-card">
                <div class="offline-file-card__preview">
                  <el-image
                    v-if="file.url && isImageFile(file.url)"
                    :src="file.url"
                    :preview-src-list="offlineSignImagePreviewUrls"
                    fit="cover"
                    preview-teleported
                  />
                  <div v-else class="offline-file-card__file">
                    <el-icon><Document /></el-icon>
                    <span>{{ fileExt(file.name || file.url || "") }}</span>
                  </div>
                </div>
                <div class="offline-file-card__main">
                  <div class="offline-file-card__name" :title="file.name">{{ file.name || fileName(file.url || "") }}</div>
                  <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage || 0" :show-text="false" />
                  <span v-else class="offline-file-card__status">{{ file.status === "success" ? "已上传" : "待上传" }}</span>
                </div>
                <div class="offline-file-card__actions">
                  <el-button link type="primary" :disabled="!file.url" @click="openFile(file.url)">查看</el-button>
                  <el-button link type="danger" @click="removeOfflineSignFile(file)">删除</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无上传资料" :image-size="72" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="offlineSignVisible = false">取消</el-button>
        <el-button type="primary" :loading="offlineSigning" :disabled="offlineSignUploading" @click="confirmOfflineSign">确认线下签约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, nextTick, ref, watch, type Ref } from "vue";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";
  import { Document, UploadFilled } from "@element-plus/icons-vue";
  import { addDialog } from "@/components/ReDialog";
  import { createOwnerContractDoc, generateOwnerContract, offlineSignOwnerContract, previewOwnerContract } from "@/api/contract/owner";
  import { uploadFile } from "@/api/upload";
  import { message } from "@/utils/message";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/SelectContractTemplateDialog.vue";
  import { OwnerContractMediumEnumMeta, OwnerContractStatusEnumMeta, OwnerSignStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { FileAttachSubtypeEnum, OwnerContractDocDto, OwnerDetailVo } from "@/types/generated";

  type OwnerContractListItem = OwnerContractDocDto;

  const signedContractSubtype: FileAttachSubtypeEnum = "SIGNED_CONTRACT";

  const props = defineProps<{
    detailData?: OwnerDetailVo | null;
  }>();

  const emit = defineEmits<{
    updated: [];
  }>();

  const selectedContractId = ref<string>();
  const previewVisible = ref(false);
  const previewPdfUrl = ref("");
  const previewTitle = ref("业主合同预览");
  const offlineSignFileList = ref<UploadFile[]>([]);
  const offlineSignVisible = ref(false);
  const offlineSigning = ref(false);
  const offlineSignContract = ref<OwnerContractListItem | null>(null);

  const contractList = computed<OwnerContractListItem[]>(() => {
    return (props.detailData?.ownerContractDocList || []).filter(item => item?.id);
  });
  const canAddContractDoc = computed(() => {
    const contract = props.detailData?.ownerContract;
    if (!contract?.id) return false;
    return contract.status !== OwnerContractStatusEnumMeta.CHECKED_OUT.code && contract.status !== OwnerContractStatusEnumMeta.VOIDED.code;
  });

  const offlineSignDialogTitle = computed(() => `线下签约 - ${contractDocNo(offlineSignContract.value) || offlineSignContract.value?.id || "合同"}`);
  const offlineSignDisplayFileList = computed(() => offlineSignFileList.value.filter(file => file.status !== "fail"));
  const offlineSignSuccessUrls = computed(() => offlineSignFileList.value.filter(file => file.status === "success" && file.url).map(file => file.url!));
  const offlineSignImagePreviewUrls = computed(() => offlineSignSuccessUrls.value.filter(url => isImageFile(url)));
  const offlineSignUploading = computed(() => offlineSignFileList.value.some(file => file.status === "uploading"));

  watch(
    contractList,
    list => {
      if (!list.length) {
        selectedContractId.value = undefined;
        return;
      }
      const exists = list.some(item => String(item.id) === selectedContractId.value);
      if (!exists) {
        selectedContractId.value = String(list[0].id);
      }
    },
    { immediate: true }
  );

  watch(previewVisible, value => {
    if (!value && previewPdfUrl.value) {
      URL.revokeObjectURL(previewPdfUrl.value);
      previewPdfUrl.value = "";
    }
  });

  function contractKey(item: OwnerContractListItem) {
    return String(item.id || contractDocNo(item) || "");
  }

  function contractDocNo(item?: OwnerContractListItem | null) {
    return item?.docNo || "";
  }

  function selectContract(item: OwnerContractListItem) {
    if (!item.id) return;
    selectedContractId.value = String(item.id);
  }

  function isSelected(item: OwnerContractListItem) {
    return String(item.id) === selectedContractId.value;
  }

  function isReadonlyContract(item?: OwnerContractListItem) {
    const status = item?.status;
    return status === OwnerContractStatusEnumMeta.CHECKED_OUT.code || status === OwnerContractStatusEnumMeta.VOIDED.code;
  }

  function canSignContract(item?: OwnerContractListItem) {
    if (!item?.id || isReadonlyContract(item)) return false;
    if (item.status === OwnerContractStatusEnumMeta.PENDING_APPROVAL.code) return false;
    return item.signStatus !== OwnerSignStatusEnumMeta.SIGNED.code;
  }

  function signStatusText(item?: OwnerContractListItem) {
    return item?.signStatus === OwnerSignStatusEnumMeta.SIGNED.code ? OwnerSignStatusEnumMeta.SIGNED.name : OwnerSignStatusEnumMeta.PENDING.name;
  }

  function signStatusTagType(item?: OwnerContractListItem) {
    return item?.signStatus === OwnerSignStatusEnumMeta.SIGNED.code ? "success" : "warning";
  }

  function contractStatusText(item?: OwnerContractListItem) {
    const meta = Object.values(OwnerContractStatusEnumMeta).find(option => option.code === item?.status);
    return meta?.name || "-";
  }

  function contractStatusTagType(item?: OwnerContractListItem) {
    const status = item?.status;
    if (status === OwnerContractStatusEnumMeta.SIGNED.code) return "success";
    if (status === OwnerContractStatusEnumMeta.CHECKED_OUT.code) return "warning";
    if (status === OwnerContractStatusEnumMeta.VOIDED.code) return "danger";
    return "info";
  }

  function contractMediumText(item?: OwnerContractListItem) {
    const meta = Object.values(OwnerContractMediumEnumMeta).find(option => option.code === item?.contractMedium);
    return meta?.name || item?.contractMedium || "-";
  }

  function contractTemplateText(item?: OwnerContractListItem) {
    return item?.contractTemplateName || props.detailData?.contractTemplateName || item?.contractTemplateId || "-";
  }

  function signedContractAttachmentUrls(item?: OwnerContractListItem) {
    const group = item?.contractAttachmentGroupList?.find(attachGroup => attachGroup.bizSubtype === signedContractSubtype);
    return (group?.attachmentUrls || []).filter(Boolean);
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

  async function handlePreviewContract(item?: OwnerContractListItem) {
    if (!item?.id) return;
    const resp = await previewOwnerContract({ ownerContractDocId: item.id });
    const blob = new Blob([resp], { type: "application/pdf" });
    if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value);
    previewPdfUrl.value = URL.createObjectURL(blob);
    previewTitle.value = `业主合同预览 - ${contractDocNo(item) || item.id}`;
    previewVisible.value = true;
  }

  async function handleDownloadContract(item?: OwnerContractListItem) {
    if (!item?.id) return;
    const resp = await previewOwnerContract({ ownerContractDocId: item.id });
    const blob = new Blob([resp], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `业主合同_${contractDocNo(item) || item.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleGenerateContract(item?: OwnerContractListItem) {
    if (!item?.id) return;
    const formRef = ref();
    addDialog({
      title: `重新生成业主合同 - ${contractDocNo(item) || item.id}`,
      top: "8%",
      width: "420px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, contractType: 2 }),
      beforeSure: done => {
        const selectedTemplate = formRef.value?.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        generateOwnerContract({
          ownerContractDocId: item.id!,
          contractTemplateId: String(selectedTemplate)
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

  function openCreateContractDocDialog() {
    const ownerContractId = props.detailData?.ownerContract?.id;
    if (!ownerContractId) return;
    const formRef = ref();
    addDialog({
      title: "添加新合同",
      top: "8%",
      width: "420px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, contractType: 2 }),
      beforeSure: done => {
        const selectedTemplate = formRef.value?.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        createOwnerContractDoc({
          ownerContractId,
          contractTemplateId: String(selectedTemplate),
          contractMedium: OwnerContractMediumEnumMeta.ELECTRONIC.code
        }).then(resp => {
          if (resp.code === 0) {
            message("新合同已添加", { type: "success" });
            emit("updated");
            done();
            return;
          }
          message(resp.message || "添加新合同失败", { type: "error" });
        });
      }
    });
  }

  function openOfflineSignDialog(item?: OwnerContractListItem) {
    if (!item?.id) return;
    offlineSignContract.value = item;
    offlineSignFileList.value = signedContractAttachmentUrls(item).map((url, index) => toUploadFile(url, index));
    offlineSignVisible.value = true;
  }

  async function confirmOfflineSign() {
    if (!offlineSignContract.value?.id) return;
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
        ownerContractDocId: offlineSignContract.value.id,
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
    padding: 16px 18px 18px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 6px 18px rgb(31 45 61 / 5%);
  }

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .section-desc {
    margin-top: 6px;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  .section-head--compact {
    margin-bottom: 10px;
  }

  .contract-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .contract-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    position: relative;
    padding: 16px 18px;
    cursor: pointer;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgb(31 45 61 / 4%);
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

    &::before {
      position: absolute;
      top: 14px;
      bottom: 14px;
      left: 0;
      width: 3px;
      content: "";
      background: transparent;
      border-radius: 0 4px 4px 0;
      transition: background 0.18s ease;
    }

    &:hover {
      background: var(--el-fill-color-extra-light);
      border-color: var(--el-border-color);
      box-shadow: 0 8px 22px rgb(31 45 61 / 8%);
    }

    &.is-active {
      background: var(--el-bg-color-overlay);
      border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color));
      box-shadow: 0 10px 24px rgb(31 45 61 / 8%);
    }

    &:hover,
    &.is-active {
      transform: translateY(-1px);
    }

    &.is-active::before {
      background: var(--el-color-primary);
    }
  }

  .contract-row__main {
    min-width: 0;
  }

  .contract-row__title {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-width: 0;

    strong {
      overflow: hidden;
      font-size: 17px;
      font-weight: 800;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .contract-row__meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(150px, 1fr));
    gap: 8px;
    margin-top: 12px;
  }

  .contract-meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 8px 10px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    strong {
      overflow: hidden;
      font-size: 13px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .contract-meta-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .contract-row__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding-left: 18px;
    border-left: 1px solid var(--el-border-color-lighter);

    :deep(.el-button.is-link) {
      min-height: 30px;
      padding: 4px 8px;
      font-weight: 700;
      color: var(--el-text-color-regular);
      border-radius: 6px;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-fill-color-light);
      }
    }
  }

  .attachment-uploader {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 228px;
      padding: 18px;
      background: var(--el-fill-color-extra-light);
      border-color: var(--el-border-color-lighter);
      border-radius: 12px;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .offline-sign-dialog {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .offline-sign-hero {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .offline-sign-hero__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    .el-icon {
      font-size: 22px;
    }
  }

  .offline-sign-hero__body {
    min-width: 0;
  }

  .offline-sign-hero__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .offline-sign-hero__desc {
    margin-top: 5px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
  }

  .offline-sign-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 14px;
  }

  .offline-sign-panel {
    padding: 14px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .offline-sign-panel--files {
    min-height: 308px;
  }

  .offline-sign-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);

    small {
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
    }
  }

  .offline-sign-uploader {
    :deep(.el-upload-dragger) {
      min-height: 238px;
    }
  }

  .offline-upload-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    color: var(--el-text-color-regular);

    strong {
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    span {
      max-width: 210px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
      text-align: center;
    }
  }

  .offline-upload-box__icon {
    padding: 12px;
    font-size: 40px;
    color: var(--el-text-color-secondary);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
  }

  .offline-file-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 280px;
    overflow: auto;
    padding-right: 2px;
  }

  .offline-file-card {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .offline-file-card__preview {
    width: 76px;
    height: 58px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }
  }

  .offline-file-card__file {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    color: var(--el-color-primary);

    .el-icon {
      font-size: 22px;
    }
  }

  .offline-file-card__main {
    min-width: 0;
  }

  .offline-file-card__name {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .offline-file-card__status {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-color-success);
  }

  .offline-file-card__actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  @media (max-width: 960px) {
    .section-head,
    .contract-row {
      align-items: flex-start;
      grid-template-columns: 1fr;
    }

    .section-head {
      flex-direction: column;
    }

    .contract-row__actions {
      justify-content: flex-start;
      padding-left: 0;
      border-left: 0;
    }

    .contract-row__meta {
      grid-template-columns: 1fr;
    }

    .offline-sign-layout,
    .offline-file-card {
      grid-template-columns: 1fr;
    }

    .offline-file-card__actions {
      justify-content: flex-start;
    }
  }
</style>
