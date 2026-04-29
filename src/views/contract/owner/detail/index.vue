<template>
  <div class="owner-detail-page pf-page contract-page">
    <el-page-header class="owner-detail-page__head" @back="goBack">
      <template #content>
        <div class="owner-detail-page__meta">
          <div class="owner-detail-page__title-row">
            <div class="owner-detail-page__title">{{ ownerName }}</div>
            <el-tag v-if="detail?.ownerContract?.status !== undefined" :type="statusType" effect="plain">
              {{ statusText }}
            </el-tag>
          </div>
          <div class="owner-detail-page__desc">查看业主、合同、房源和结算条款信息。</div>
        </div>
      </template>
      <template #extra>
        <div class="owner-detail-page__actions">
          <el-button plain :disabled="!contractId" @click="handlePreview">预览合同</el-button>
          <el-button plain type="primary" :disabled="!contractId" @click="handleEdit">修改合同</el-button>
          <el-button plain type="primary" :disabled="!contractId" @click="handleRenew">业主续约</el-button>
          <el-button plain type="warning" :disabled="!canCheckoutContract" @click="handleCheckout">业主退房</el-button>
          <el-button plain type="danger" :disabled="!canVoidContract" @click="handleVoidContract">作废合同</el-button>
        </div>
      </template>
    </el-page-header>

    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="!detail" description="未找到业主合同详情" />
    <OwnerContractDetailContent v-else :form-inline="detail" @updated="fetchDetail" />

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from "vue";
  import { ElMessageBox } from "element-plus";
  import { useRoute, useRouter } from "vue-router";
  import { getOwnerContractDetail, previewOwnerContract, voidOwnerContract } from "@/api/contract/owner";
  import { message } from "@/utils/message";
  import useOwnerContract from "@/views/contract/owner/utils/hook";
  import OwnerContractDetailContent from "@/views/contract/owner/view/OwnerContractDetailContent.vue";
  import { OwnerContractStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerDetailVo, OwnerListVo } from "@/types/generated";

  defineOptions({ name: "OwnerContractDetail" });

  const route = useRoute();
  const router = useRouter();
  const { openOwnerDialog, openOwnerRenewDialog, openOwnerCheckoutDialog } = useOwnerContract();
  const loading = ref(false);
  const detail = ref<OwnerDetailVo>();
  const previewVisible = ref(false);
  const pdfUrl = ref("");

  const ownerName = computed(() => {
    if (!detail.value) return "业主合同详情";
    return detail.value.ownerType === 1 ? detail.value.ownerCompany?.name || "业主合同详情" : detail.value.ownerPersonal?.name || "业主合同详情";
  });

  const statusLabelMap: Record<number, string> = {
    [OwnerContractStatusEnumMeta.PENDING_APPROVAL.code]: "待审核",
    [OwnerContractStatusEnumMeta.PENDING_SIGN.code]: "待签字",
    [OwnerContractStatusEnumMeta.SIGNED.code]: "已签字",
    [OwnerContractStatusEnumMeta.CHECKED_OUT.code]: "已退房",
    [OwnerContractStatusEnumMeta.VOIDED.code]: "已作废"
  };
  const statusTypeMap: Record<number, "success" | "info" | "warning" | "danger"> = {
    [OwnerContractStatusEnumMeta.PENDING_APPROVAL.code]: "warning",
    [OwnerContractStatusEnumMeta.PENDING_SIGN.code]: "info",
    [OwnerContractStatusEnumMeta.SIGNED.code]: "success",
    [OwnerContractStatusEnumMeta.CHECKED_OUT.code]: "warning",
    [OwnerContractStatusEnumMeta.VOIDED.code]: "danger"
  };
  const statusCode = computed(() => detail.value?.ownerContract?.status ?? OwnerContractStatusEnumMeta.PENDING_SIGN.code);
  const statusText = computed(() => statusLabelMap[statusCode.value] || "-");
  const statusType = computed(() => statusTypeMap[statusCode.value] || "info");
  const contractId = computed(() => detail.value?.ownerContract?.id || (route.params.contractId as string));
  const ownerPhone = computed(() => (detail.value?.ownerType === 1 ? detail.value.ownerCompany?.contactPhone : detail.value?.ownerPersonal?.phone) || "");
  const subjectNames = computed(() => (detail.value?.contractSubjectList || []).map(item => item.subjectName).filter(Boolean).join("，"));
  const ownerListRow = computed<OwnerListVo | null>(() => {
    if (!detail.value?.ownerContract?.id) return null;
    return {
      contractId: detail.value.ownerContract.id,
      ownerId: detail.value.ownerId,
      ownerType: detail.value.ownerType,
      ownerName: ownerName.value,
      ownerPhone: ownerPhone.value,
      contractNo: detail.value.ownerContract.contractNo,
      cooperationMode: detail.value.ownerContract.cooperationMode,
      contractTemplateName: detail.value.contractTemplateName,
      subjectNames: subjectNames.value,
      subjectCount: detail.value.subjectCount,
      totalArea: detail.value.totalArea,
      configuredSubjectCount: detail.value.configuredSubjectCount,
      contractStart: detail.value.ownerContract.contractStart,
      contractEnd: detail.value.ownerContract.contractEnd,
      signStatus: detail.value.ownerContract.signStatus,
      status: detail.value.ownerContract.status,
      contractNature: detail.value.ownerContract.contractNature,
      checkoutStatus: detail.value.ownerContract.checkoutStatus,
      checkoutDate: detail.value.ownerContract.checkoutDate,
      checkoutReason: detail.value.ownerContract.checkoutReason,
      createAt: detail.value.ownerContract.createAt,
      updateAt: detail.value.ownerContract.updateAt
    };
  });
  const canCheckoutContract = computed(() => {
    const disabledStatuses: number[] = [OwnerContractStatusEnumMeta.CHECKED_OUT.code, OwnerContractStatusEnumMeta.VOIDED.code];
    return !disabledStatuses.includes(statusCode.value);
  });
  const canVoidContract = computed(() => {
    const enabledStatuses: number[] = [OwnerContractStatusEnumMeta.PENDING_APPROVAL.code, OwnerContractStatusEnumMeta.PENDING_SIGN.code];
    return enabledStatuses.includes(statusCode.value);
  });

  async function fetchDetail() {
    const contractId = route.params.contractId as string;
    if (!contractId) return;

    loading.value = true;
    try {
      const resp = await getOwnerContractDetail({ contractId });
      if (resp.code === 0) {
        detail.value = resp.data;
      } else {
        message(resp.message || "获取业主合同详情失败", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  }

  function goBack() {
    router.push({
      path: "/contract/owner",
      query: route.query
    });
  }

  async function handlePreview() {
    if (!contractId.value) return;
    const resp = await previewOwnerContract({ contractId: contractId.value });
    const blob = new Blob([resp], { type: "application/pdf" });
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = URL.createObjectURL(blob);
    previewVisible.value = true;
  }

  function handleEdit() {
    if (!contractId.value) return;
    openOwnerDialog("编辑业主合同", { contractId: contractId.value, isEdit: true }, fetchDetail);
  }

  function handleRenew() {
    if (!contractId.value) return;
    openOwnerRenewDialog({ contractId: contractId.value }, fetchDetail);
  }

  function handleCheckout() {
    if (!ownerListRow.value) return;
    if (!canCheckoutContract.value) {
      message("当前合同状态不允许业主退房", { type: "warning" });
      return;
    }
    openOwnerCheckoutDialog(ownerListRow.value, fetchDetail);
  }

  async function handleVoidContract() {
    if (!contractId.value) return;
    if (!canVoidContract.value) {
      message("该合同已进入业务流程，请走业主退房", { type: "warning" });
      return;
    }
    const result = await ElMessageBox.prompt("作废后合同将不再进入业务流程。已签约、已生成账单或已有租客占用的合同不能作废，请走业主退房。", "作废业主合同", {
      type: "warning",
      confirmButtonText: "作废",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
      inputType: "textarea",
      inputPlaceholder: "请输入作废原因",
      inputValidator: value => {
        if (!String(value || "").trim()) return "请输入作废原因";
        if (String(value).trim().length > 500) return "作废原因不能超过 500 字";
        return true;
      }
    });
    const voidReason = String(result.value || "").trim();
    const resp = await voidOwnerContract({ contractId: contractId.value, voidReason });
    if (resp.code === 0) {
      message("业主合同已作废", { type: "success" });
      await fetchDetail();
      return;
    }
    message(resp.message || "作废业主合同失败", { type: "error" });
  }

  onMounted(fetchDetail);

  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });
</script>

<style scoped lang="scss">
  .owner-detail-page {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0;

    &__head {
      padding: 10px 14px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
    }

    :deep(.el-page-header__left) {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    :deep(.el-page-header__content) {
      min-width: 0;
    }

    :deep(.el-page-header__extra) {
      margin-left: auto;
    }

    &__meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__title-row {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    &__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
    }
  }
</style>
