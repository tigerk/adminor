<template>
  <div class="lease-contract-doc-tab">
    <section class="contract-section">
      <div class="section-head">
        <div>
          <div class="section-title">
            <span>签约合同列表</span>
            <el-tag type="info" size="small" effect="plain">{{ contractList.length }} 份</el-tag>
          </div>
          <div class="section-desc">租客可能存在多份签约合同；预览、下载、线下签约、作废都针对单份合同执行。</div>
        </div>
        <el-button type="primary" plain :disabled="readonly || !leaseId" @click="openCreateContractDocDialog">添加新合同</el-button>
      </div>

      <div v-if="contractList.length" class="contract-list">
        <article v-for="item in contractList" :key="contractKey(item)" class="contract-row" :class="{ 'is-active': isSelected(item) }" @click="selectContract(item)">
          <div class="contract-row__main">
            <div class="contract-row__title">
              <div class="contract-row__title-main">
                <strong>{{ contractDocNo(item) || `合同 ${contractKey(item)}` }}</strong>
                <el-tag :type="signStatusTagType(item)" effect="light">{{ signStatusText(item) }}</el-tag>
              </div>
              <div class="contract-row__actions" @click.stop>
                <el-button plain size="small" type="primary" :disabled="!item.id" @click="handlePreviewContract(item)">预览</el-button>
                <el-button plain size="small" type="primary" :disabled="!item.id || !item.contractContent" @click="handleDownloadContract(item)">下载</el-button>
                <el-button plain size="small" type="primary" :disabled="!canSignContract(item)" @click="openOfflineSignDialog(item)">线下签约</el-button>
                <el-button v-if="isVoidedContractDoc(item)" plain size="small" type="success" :disabled="!canRestoreContractDoc(item)" @click="handleRestoreContractDoc(item)">还原</el-button>
                <el-button plain size="small" type="danger" :disabled="!canVoidContractDoc(item)" @click="handleVoidContractDoc(item)">作废</el-button>
              </div>
            </div>

            <div class="contract-row__meta">
              <span class="contract-meta-item">
                <span class="contract-meta-label">合同周期</span>
                <strong>{{ formatDate(item.contractStart) }} 至 {{ formatDate(item.contractEnd) }}</strong>
              </span>
              <span class="contract-meta-item">
                <span class="contract-meta-label">合同模板</span>
                <strong>{{ item.contractTemplateName || item.contractTemplateId || "-" }}</strong>
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

            <div v-if="signedContractAttachmentUrls(item).length" class="contract-signed-files" @click.stop>
              <div class="contract-signed-files__head">
                <span class="contract-signed-files__title">线下签约资料</span>
                <el-tag size="small" effect="plain">{{ signedContractAttachmentUrls(item).length }} 个</el-tag>
              </div>
              <div class="contract-signed-files__list">
                <div
                  v-for="(url, index) in signedContractAttachmentUrls(item)"
                  :key="`${contractKey(item)}-${url}-${index}`"
                  class="contract-signed-file"
                  :class="{ 'is-image': isImageFile(url), 'is-file': !isImageFile(url) }"
                >
                  <el-image
                    v-if="isImageFile(url)"
                    class="contract-signed-file__image"
                    :src="url"
                    :preview-src-list="signedContractImageUrls(item)"
                    :initial-index="signedContractImageUrls(item).indexOf(url)"
                    fit="cover"
                    preview-teleported
                  />
                  <button v-else type="button" class="contract-signed-file__doc" @click="previewAttachment(url)">
                    <el-icon><Document /></el-icon>
                    <span>{{ fileExt(url) }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="isVoidedContractDoc(item)" class="contract-row__void" @click.stop>
              <div class="contract-row__void-item">
                <span>作废人</span>
                <strong>{{ item.voidByName || item.voidBy || "-" }}</strong>
              </div>
              <div class="contract-row__void-item">
                <span>作废时间</span>
                <strong>{{ item.voidAt || "-" }}</strong>
              </div>
              <div class="contract-row__void-item contract-row__void-item--full">
                <span>作废原因</span>
                <strong>{{ item.voidReason || "-" }}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无签约合同" :image-size="90">
        <el-button type="primary" plain :disabled="readonly || !leaseId" @click="openCreateContractDocDialog">添加新合同</el-button>
      </el-empty>
    </section>

    <el-dialog v-model="previewVisible" top="10px" :title="previewTitle" width="80%" destroy-on-close append-to-body>
      <iframe v-if="previewPdfUrl" title="租客合同预览" :src="previewPdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>

    <el-dialog v-model="attachmentPreviewVisible" :title="attachmentPreviewTitle" fullscreen destroy-on-close append-to-body class="contract-attachment-preview-dialog">
      <el-image
        v-if="attachmentPreviewUrl && isImageFile(attachmentPreviewUrl)"
        class="attachment-preview-image"
        :src="attachmentPreviewUrl"
        fit="contain"
        :preview-src-list="[attachmentPreviewUrl]"
        preview-teleported
      />
      <iframe
        v-else-if="attachmentPreviewUrl && isPdfFile(attachmentPreviewUrl)"
        title="线下签约资料预览"
        :src="attachmentPreviewUrl"
        class="attachment-preview-frame"
      />
      <div v-else class="attachment-preview-fallback">
        <el-icon><Document /></el-icon>
        <div>当前文件类型暂不支持内嵌预览</div>
        <el-button type="primary" plain :disabled="!attachmentPreviewUrl" @click="downloadAttachment(attachmentPreviewUrl)">下载文件</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="offlineSignVisible" :title="offlineSignDialogTitle" width="860px" destroy-on-close append-to-body>
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
                  <el-image v-if="file.url && isImageFile(file.url)" :src="file.url" :preview-src-list="offlineSignImagePreviewUrls" fit="cover" preview-teleported />
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
                  <el-button link type="primary" :disabled="!file.url" @click="previewAttachment(file.url)">查看</el-button>
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
  import { ElMessageBox } from "element-plus";
  import type { UploadFile, UploadProgressEvent, UploadRequestOptions } from "element-plus";
  import { Document, UploadFilled } from "@element-plus/icons-vue";
  import { addDialog } from "@/components/ReDialog";
  import { createLeaseContractDoc, downloadLeaseContract, generateLeaseContract, offlineSignLeaseContract, previewLeaseContract, restoreLeaseContractDoc, voidLeaseContractDoc } from "@/api/contract/tenant";
  import { uploadFile } from "@/api/upload";
  import { LEASE_SIGN_STATUS_OPTIONS, LEASE_STATUS_MAP } from "@/constants";
  import { message } from "@/utils/message";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/SelectContractTemplateDialog.vue";
  import { FileAttachSubtypeEnumMeta, LeaseContractDocStatusEnumMeta, type FileAttachSubtypeEnum, type LeaseContractVo } from "@/types";

  const DOC_STATUS_VOIDED = LeaseContractDocStatusEnumMeta.VOIDED.code;
  const signedContractSubtype: FileAttachSubtypeEnum = FileAttachSubtypeEnumMeta.SIGNED_CONTRACT.value;

  const props = withDefaults(
    defineProps<{
      leaseContract?: LeaseContractVo | null;
      leaseContractDocList?: LeaseContractVo[];
      leaseId: string;
      tenantStatus: number;
      readonly?: boolean;
    }>(),
    {
      readonly: false,
      leaseContractDocList: () => []
    }
  );

  const emit = defineEmits<{
    updated: [];
    "contract-updated": [contract: LeaseContractVo];
    "contract-signed": [leaseId: string];
  }>();

  const selectedContractId = ref<string>();
  const previewVisible = ref(false);
  const previewPdfUrl = ref("");
  const previewTitle = ref("租客合同预览");
  const attachmentPreviewVisible = ref(false);
  const attachmentPreviewUrl = ref("");
  const attachmentPreviewTitle = ref("资料预览");
  const offlineSignFileList = ref<UploadFile[]>([]);
  const offlineSignVisible = ref(false);
  const offlineSigning = ref(false);
  const offlineSignContract = ref<LeaseContractVo | null>(null);
  const localSignedAttachmentMap = ref<Record<string, string[]>>({});

  const contractList = computed<LeaseContractVo[]>(() => {
    const list = props.leaseContractDocList?.length ? props.leaseContractDocList : props.leaseContract ? [props.leaseContract] : [];
    return list.filter(item => item?.id);
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

  function contractKey(item: LeaseContractVo) {
    return String(item.id || contractDocNo(item) || "");
  }

  function contractDocNo(item?: LeaseContractVo | null) {
    return item?.docNo || "";
  }

  function selectContract(item: LeaseContractVo) {
    if (!item.id) return;
    selectedContractId.value = String(item.id);
  }

  function isSelected(item: LeaseContractVo) {
    return String(item.id) === selectedContractId.value;
  }

  function isReadonlyContract() {
    return props.readonly || props.tenantStatus === LEASE_STATUS_MAP.TERMINATED.code || props.tenantStatus === LEASE_STATUS_MAP.VOIDED.code;
  }

  function isVoidedContractDoc(item?: LeaseContractVo) {
    return item?.docStatus === DOC_STATUS_VOIDED;
  }

  function canSignContract(item?: LeaseContractVo) {
    if (!item?.id || isReadonlyContract() || isVoidedContractDoc(item)) return false;
    return item.signStatus !== 1;
  }

  function canVoidContractDoc(item?: LeaseContractVo) {
    return Boolean(item?.id) && !isReadonlyContract() && !isVoidedContractDoc(item);
  }

  function canRestoreContractDoc(item?: LeaseContractVo) {
    return Boolean(item?.id) && !isReadonlyContract() && isVoidedContractDoc(item);
  }

  function signStatusText(item?: LeaseContractVo) {
    if (isVoidedContractDoc(item)) return "已作废";
    return LEASE_SIGN_STATUS_OPTIONS.find(option => option.value === item?.signStatus)?.label || "待签字";
  }

  function signStatusTagType(item?: LeaseContractVo) {
    if (isVoidedContractDoc(item)) return "danger";
    return item?.signStatus === 1 ? "success" : "warning";
  }

  function contractMediumText(item?: LeaseContractVo) {
    if (item?.contractMedium === "PAPER") return "纸质合同";
    if (item?.contractMedium === "ELECTRONIC") return "电子合同";
    return item?.contractMedium || "-";
  }

  function signedContractAttachmentUrls(item?: LeaseContractVo) {
    const group = item?.contractAttachmentGroupList?.find(attachGroup => attachGroup.bizSubtype === signedContractSubtype);
    const persistedUrls = (group?.attachmentUrls || []).filter(Boolean);
    const localUrls = item?.id ? localSignedAttachmentMap.value[String(item.id)] || [] : [];
    return Array.from(new Set([...persistedUrls, ...localUrls]));
  }

  function signedContractImageUrls(item?: LeaseContractVo) {
    return signedContractAttachmentUrls(item).filter(url => isImageFile(url));
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

  function isPdfFile(value?: string) {
    if (!value) return false;
    return /\.pdf$/i.test(value.split("?")[0]);
  }

  function beforeUpload(file: File) {
    const allowTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
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

  function previewAttachment(url?: string) {
    if (!url) return;
    attachmentPreviewUrl.value = url;
    attachmentPreviewTitle.value = `资料预览 - ${fileExt(url)}`;
    attachmentPreviewVisible.value = true;
  }

  function downloadAttachment(url?: string) {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handlePreviewContract(item?: LeaseContractVo) {
    if (!item?.id) return;
    const resp = await previewLeaseContract({ leaseContractDocId: item.id });
    const blob = new Blob([resp], { type: "application/pdf" });
    if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value);
    previewPdfUrl.value = URL.createObjectURL(blob);
    previewTitle.value = `租客合同预览 - ${contractDocNo(item) || item.id}`;
    previewVisible.value = true;
  }

  async function handleDownloadContract(item?: LeaseContractVo) {
    if (!item?.id) return;
    const resp = await downloadLeaseContract({ leaseContractDocId: item.id });
    const blob = new Blob([resp], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `租客合同_${contractDocNo(item) || item.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleGenerateContract(item?: LeaseContractVo) {
    if (!item?.id) return;
    const formRef = ref();
    addDialog({
      title: `重新生成租客合同 - ${contractDocNo(item) || item.id}`,
      top: "8%",
      width: "420px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, contractType: 1 }),
      beforeSure: done => {
        const selectedTemplate = formRef.value?.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        generateLeaseContract({
          leaseContractDocId: item.id,
          leaseId: props.leaseId,
          contractTemplateId: String(selectedTemplate)
        }).then(resp => {
          if (resp.code === 0) {
            message("合同已重新生成", { type: "success" });
            emit("contract-updated", resp.data as LeaseContractVo);
            emit("updated");
            done();
            return;
          }
          message(resp.message || "重新生成合同失败", { type: "error" });
        });
      }
    });
  }

  async function handleVoidContractDoc(item?: LeaseContractVo) {
    if (!item?.id) return;
    let voidReason = "";
    try {
      const { value } = await ElMessageBox.prompt("请输入作废原因，提交后该签约合同不可继续签约或重新生成。", `作废签约合同 - ${contractDocNo(item) || item.id}`, {
        confirmButtonText: "确认作废",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputPlaceholder: "请输入作废原因",
        inputPattern: /\S+/,
        inputErrorMessage: "作废原因不能为空",
        confirmButtonClass: "el-button--danger"
      });
      voidReason = String(value || "").trim();
    } catch {
      return;
    }
    const resp = await voidLeaseContractDoc({
      leaseContractDocId: item.id,
      voidReason
    });
    if (resp.code === 0) {
      message("签约合同已作废", { type: "success" });
      emit("updated");
      return;
    }
    message(resp.message || "作废签约合同失败", { type: "error" });
  }

  async function handleRestoreContractDoc(item?: LeaseContractVo) {
    if (!item?.id) return;
    try {
      await ElMessageBox.confirm(`确认将签约合同「${contractDocNo(item) || item.id}」还原为有效？`, "还原签约合同", {
        confirmButtonText: "确认还原",
        cancelButtonText: "取消",
        type: "warning"
      });
    } catch {
      return;
    }
    const resp = await restoreLeaseContractDoc({ leaseContractDocId: item.id });
    if (resp.code === 0) {
      message("签约合同已还原", { type: "success" });
      emit("updated");
      return;
    }
    message(resp.message || "还原签约合同失败", { type: "error" });
  }

  function openCreateContractDocDialog() {
    const formRef = ref();
    addDialog({
      title: "添加新合同",
      top: "8%",
      width: "420px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, contractType: 1 }),
      beforeSure: done => {
        const selectedTemplate = formRef.value?.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        createLeaseContractDoc({
          leaseId: props.leaseId,
          contractTemplateId: String(selectedTemplate),
          contractMedium: "ELECTRONIC"
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

  function openOfflineSignDialog(item?: LeaseContractVo) {
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
      const resp = await offlineSignLeaseContract({
        leaseContractDocId: offlineSignContract.value.id,
        attachmentUrls: offlineSignSuccessUrls.value
      });
      if (resp.code === 0) {
        localSignedAttachmentMap.value = {
          ...localSignedAttachmentMap.value,
          [String(offlineSignContract.value.id)]: offlineSignSuccessUrls.value
        };
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
  .lease-contract-doc-tab {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .contract-section {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    padding: 16px 18px 18px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 6px 18px rgb(31 45 61 / 5%);
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

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .contract-list {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 10px;
  }

  .contract-row {
    position: relative;
    padding: 16px 18px;
    cursor: pointer;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgb(31 45 61 / 4%);
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

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

  .contract-row__title {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
  }

  .contract-row__title-main {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
    min-height: 28px;

    strong {
      overflow: hidden;
      font-size: 17px;
      font-weight: 800;
      line-height: 24px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.el-tag) {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      height: 24px;
      line-height: 22px;
    }
  }

  .contract-row__actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
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

  .contract-row__void {
    display: grid;
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    gap: 8px;
    padding: 10px 12px;
    margin-top: 12px;
    background: color-mix(in srgb, var(--el-color-danger) 7%, var(--el-bg-color));
    border: 1px solid color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
    border-radius: 10px;
  }

  .contract-row__void-item {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
    font-size: 13px;

    span {
      flex: 0 0 auto;
      color: var(--el-text-color-secondary);
    }

    strong {
      min-width: 0;
      overflow: hidden;
      font-weight: 700;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .contract-row__void-item--full {
    grid-column: 1 / -1;
  }

  .contract-signed-files {
    padding: 12px;
    margin-top: 12px;
    background: color-mix(in srgb, var(--el-fill-color-extra-light) 70%, var(--el-bg-color));
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .contract-signed-files__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .contract-signed-files__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .contract-signed-files__list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .contract-signed-file {
    width: 150px;
    height: 150px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .contract-signed-file__image {
    display: block;
    width: 150px;
    height: 150px;
    cursor: zoom-in;
  }

  .contract-signed-file__doc,
  .attachment-preview-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    color: var(--el-text-color-primary);
    cursor: pointer;
    background: var(--el-fill-color-extra-light);
    border: 0;
  }

  .attachment-preview-fallback {
    height: 100%;
    min-height: 360px;
    cursor: default;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;

    .el-icon {
      font-size: 44px;
      color: var(--el-text-color-secondary);
    }
  }

  .attachment-preview-image {
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .attachment-preview-frame {
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  :deep(.contract-attachment-preview-dialog .el-dialog__body) {
    height: calc(100vh - 58px);
    padding: 12px 16px 16px;
    overflow: hidden;
    box-sizing: border-box;
  }

  .offline-sign-dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .offline-sign-hero {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .offline-sign-hero__icon {
    display: grid;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    color: var(--el-color-primary);
    place-items: center;
    background: var(--el-color-primary-light-9);
    border-radius: 10px;
  }

  .offline-sign-hero__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .offline-sign-hero__desc {
    margin-top: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .offline-sign-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 14px;
  }

  .offline-sign-panel {
    min-height: 320px;
    padding: 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .offline-sign-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);

    small {
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }
  }

  .offline-sign-uploader {
    :deep(.el-upload),
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 252px;
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
      color: var(--el-text-color-primary);
    }
  }

  .offline-upload-box__icon {
    font-size: 42px;
    color: var(--el-text-color-secondary);
  }

  .offline-file-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, 136px);
    gap: 12px;
    align-content: flex-start;
    max-height: 260px;
    overflow: auto;
  }

  .offline-file-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 136px;
    padding: 8px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .offline-file-card__preview {
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    :deep(.el-image),
    :deep(img) {
      width: 100%;
      height: 100%;
    }
  }

  .offline-file-card__file {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--el-text-color-secondary);

    .el-icon {
      font-size: 26px;
    }

    span {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }

  .offline-file-card__name {
    overflow: hidden;
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .offline-file-card__status {
    display: block;
    margin-top: 3px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .offline-file-card__actions {
    display: flex;
    gap: 6px;
    justify-content: center;
    padding-top: 2px;
    border-top: 1px solid var(--el-border-color-extra-light);
  }
</style>
