<template>
  <div class="tab-content">
    <!-- 有合同信息时显示 -->
    <div v-if="tenantContract" class="contract-section">
      <!-- 操作按钮栏 -->
      <div class="contract-action-bar">
        <div class="action-left">
          <el-space :size="12">
            <el-button type="primary" :icon="Download" @click="handleDownloadContract">下载合同</el-button>
            <el-button type="primary" :icon="Document" @click="handleGenerateContract">重新生成</el-button>
            <el-popconfirm title="确认将合同状态改为已签约吗？" @confirm="handleSignContract">
              <template #reference>
                <el-button type="primary" :disabled="!allowChangeSignStatus" :icon="Checked">改为已签约</el-button>
              </template>
            </el-popconfirm>
          </el-space>
        </div>
        <div class="action-right">
          <el-space :size="16" alignment="flex-end">
            <div class="info-item">
              <span class="info-label">合同模板：</span>
              <span class="info-value">{{ tenantContract.contractTemplateName || "未设置" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">签约状态：</span>
              <el-tag :type="tenantContract.signStatus === 0 ? 'danger' : 'success'" size="small">
                {{ TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === tenantContract.signStatus)?.label || "未知" }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间：</span>
              <span class="info-value">{{ formattedCreateTime }}</span>
            </div>
          </el-space>
        </div>
      </div>
      <!-- 合同信息摘要 -->
      <div v-if="tenantContract.remark" class="mb-2">
        <el-descriptions :column="1" size="default">
          <el-descriptions-item label="合同备注" label-align="right">
            <span class="text-value">{{ tenantContract.remark }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 合同内容预览区域 -->
      <div v-if="tenantContract.contractContent" class="contract-content-section">
        <div class="contract-header">
          <span class="contract-title">合同内容</span>
          <el-tag type="info" size="small">预览模式</el-tag>
        </div>
        <div class="contract-preview-wrapper">
          <div class="contract-preview" v-html="tenantContract.contractContent" />
        </div>
      </div>

      <!-- 合同内容为空时 -->
      <div v-else class="no-content">
        <el-empty description="合同内容为空" :image-size="120">
          <el-button type="primary" :icon="Document" @click="handleGenerateContract">生成合同内容</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 没有合同信息时显示 -->
    <el-empty v-else description="暂无合同信息" :image-size="150">
      <el-button type="primary" :icon="Document" @click="handleGenerateContract">生成合同</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
  // 监听 props 变化更新本地状态
  import { computed, h, ref, watch } from "vue";
  import { Checked, Document, Download } from "@element-plus/icons-vue";
  import { TENANT_SIGN_STATUS_OPTIONS, TENANT_STATUS_ENUM } from "@/constants";
  import { message } from "@/utils/message";
  import { downloadTenantContract, generateTenantContract, updateTenantContractSignStatus } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/selectContractTemplateDialog.vue";
  import { TenantContractProps } from "@/types";

  interface Props {
    tenantContract: TenantContractProps | null;
    tenantId: string; // 租客ID，用于事件回调
    tenantStatus: number;
    createTime?: Date;
    readonly?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    readonly: false
  });

  const emit = defineEmits<{
    "contract-signed": [tenantId: string];
    "contract-updated": [contract: TenantContractProps];
  }>();

  const localContract = ref<TenantContractProps | null>(props.tenantContract ? { ...props.tenantContract } : null);

  // 格式化创建时间
  const formattedCreateTime = computed(() => {
    if (!props.createTime) return "";
    const date = new Date(props.createTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  });

  // 计算是否允许修改签约状态
  const allowChangeSignStatus = computed(() => {
    if (props.readonly) {
      return false;
    }
    return props.tenantStatus === TENANT_STATUS_ENUM.TO_SIGN.code;
  });

  // 下载合同
  const handleDownloadContract = () => {
    if (!localContract.value?.contractContent) {
      message("合同内容为空，无法下载", { type: "warning" });
      return;
    }
    downloadTenantContract({
      tenantId: props.tenantId
    }).then(res => {
      const blob = new Blob([res], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `租客合同_${props.tenantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  // 生成合同
  const handleGenerateContract = () => {
    if (!localContract.value?.id) {
      message("合同信息不完整", { type: "warning" });
      return;
    }

    const contractId = localContract.value.id;
    const formRef = ref();

    addDialog({
      title: `重新生成合同，请选择合同模板`,
      props: {
        formInline: {
          tenantId: props.tenantId
        }
      },
      top: "8%",
      width: "400px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, tenantId: props.tenantId }),
      beforeSure: (done, { options }) => {
        const selectedTemplate = formRef.value.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        generateTenantContract({
          tenantContractId: contractId,
          tenantId: props.tenantId,
          contractTemplateId: selectedTemplate
        }).then(resp => {
          if (resp.code == 0) {
            localContract.value = resp.data;
            emit("contract-updated", resp.data);
            message("合同生成成功", { type: "success" });
            done();
          }
        });
      }
    });
  };

  // 签约合同
  const handleSignContract = () => {
    if (!localContract.value?.id) {
      message("合同信息不完整", { type: "warning" });
      return;
    }
    if (localContract.value.signStatus === 1) {
      message("合同已签约，无需重复操作", { type: "warning" });
      return;
    }
    updateTenantContractSignStatus({
      tenantContractId: localContract.value.id,
      signStatus: 1
    }).then(resp => {
      if (resp.code == 0) {
        message("合同签约成功", { type: "success" });
        localContract.value!.signStatus = 1;
        emit("contract-signed", props.tenantId);
      } else {
        message(resp.message || "合同签约修改失败", { type: "warning" });
      }
    });
  };

  watch(
    () => props.tenantContract,
    newVal => {
      localContract.value = newVal ? { ...newVal } : null;
    },
    { deep: true }
  );
</script>

<style scoped lang="scss">
  .tab-content {
    min-height: 500px;
  }

  .contract-section {
    .contract-action-bar {
      margin-bottom: 20px;
      padding: 8px 5px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .action-left {
        flex: 0 0 auto;
      }

      .action-right {
        flex: 0 0 auto;
        text-align: right;

        .info-item {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          font-size: 14px;

          .info-label {
            color: var(--el-text-color-secondary);
            margin-right: 8px;
            font-weight: 500;
          }

          .info-value {
            color: var(--el-text-color-regular);
            font-weight: 600;
          }
        }
      }
    }

    .contract-content-section {
      .contract-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color);

        .contract-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .contract-preview-wrapper {
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        overflow: hidden;

        .contract-preview {
          overflow-y: auto;
          padding: 30px;
          line-height: 1.8;

          &::-webkit-scrollbar {
            width: 8px;
          }

          &::-webkit-scrollbar-track {
            background: var(--el-fill-color-light);
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--el-text-color-disabled);
            border-radius: 4px;

            &:hover {
              background: var(--el-text-color-secondary);
            }
          }

          :deep(h1),
          :deep(h2),
          :deep(h3),
          :deep(h4),
          :deep(h5),
          :deep(h6) {
            margin-top: 20px;
            margin-bottom: 12px;
            color: var(--el-text-color-primary);
            font-weight: 600;
          }

          :deep(h3) {
            font-size: 18px;
            text-align: center;
          }

          :deep(p) {
            margin-bottom: 12px;
            text-indent: 2em;
            color: var(--el-text-color-regular);
          }

          :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;

            th,
            td {
              border: 1px solid var(--el-border-color);
              padding: 8px 12px;
              text-align: left;
            }

            th {
              background: var(--el-fill-color-light);
              font-weight: 600;
              color: var(--el-text-color-primary);
            }
          }

          :deep(strong) {
            color: var(--el-text-color-primary);
            font-weight: 600;
          }

          :deep(code) {
            background: var(--el-fill-color-light);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Courier New", monospace;
          }
        }
      }
    }

    .no-content {
      padding: 40px 0;
    }
  }

  .text-value {
    color: var(--el-text-color-regular);
  }
</style>
