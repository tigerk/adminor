<template>
  <div class="tenant-detail-page pf-page contract-page">
    <el-page-header class="tenant-detail-page__head" @back="goBack">
      <template #content>
        <div class="tenant-detail-page__meta">
          <div class="tenant-detail-page__title-row">
            <div class="tenant-detail-page__title">{{ detail?.tenantName || "租客详情" }}</div>
            <span
              v-if="leaseStatus"
              class="tenant-detail-page__status"
              :style="{ color: leaseStatus.color, borderColor: leaseStatus.color, backgroundColor: `${leaseStatus.color}1a` }"
            >
              {{ leaseStatus.name }}
            </span>
          </div>
          <div class="tenant-detail-page__desc">按房间查看租金和费用配置，支持在详情页继续编辑租约和合同。</div>
          <div v-if="cancelInfo" class="tenant-detail-page__cancel-info">
            <span>作废原因：{{ cancelInfo.reason }}</span>
            <span>作废人：{{ cancelInfo.operator }}</span>
            <span>作废时间：{{ cancelInfo.time }}</span>
          </div>
        </div>
      </template>
      <template #extra>
        <div class="tenant-detail-page__actions">
          <el-button type="primary" plain @click="detailContentRef?.editTenantInfo(detail!)">修改租客信息</el-button>
          <el-button type="primary" :disabled="!canEdit" @click="detailContentRef?.editLease(detail!)">修改租约</el-button>
        </div>
      </template>
    </el-page-header>

    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="!detail" description="未找到租客详情" />
    <TenantDetailContent
      v-else
      ref="detailContentRef"
      :form-inline="detail"
      :readonly="readonly"
      @lease-updated="handleLeaseUpdated"
      @contract-signed="handleLeaseUpdated"
      @contract-updated="handleLeaseUpdated"
    />
  </div>
</template>

<script setup lang="ts">
  import dayjs from "dayjs";
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { getLeaseDetail } from "@/api/contract/tenant";
  import type { LeaseDetailVo } from "@/types";
  import { message } from "@/utils/message";
  import TenantDetailContent from "@/views/contract/tenant/view/TenantDetailContent.vue";
  import { markTenantListRefresh } from "@/views/contract/tenant/utils/listRefresh";
  import { LEASE_STATUS_MAP, LEASE_STATUS_META } from "@/constants";

  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const detail = ref<LeaseDetailVo>();
  const detailContentRef = ref<InstanceType<typeof TenantDetailContent>>();
  const readonly = computed(() => route.query.readonly === "1");
  const leaseStatus = computed(() => Object.values(LEASE_STATUS_META).find(item => item.code === detail.value?.status));
  type LeaseDetailCancelInfo = LeaseDetailVo & {
    cancelReason?: string;
    cancelBy?: string;
    cancelByName?: string;
    cancelAt?: string;
  };
  const cancelInfo = computed(() => {
    if (detail.value?.status !== LEASE_STATUS_MAP.VOIDED.code) return null;
    const lease = detail.value as LeaseDetailCancelInfo;
    return {
      reason: lease.cancelReason || "-",
      operator: lease.cancelByName || lease.cancelBy || "-",
      time: lease.cancelAt ? dayjs(lease.cancelAt).format("YYYY-MM-DD HH:mm:ss") : "-"
    };
  });
  const canEdit = computed(() => {
    if (readonly.value || !detail.value) return false;
    return !(detail.value.status === LEASE_STATUS_MAP.TERMINATED.code || detail.value.status === LEASE_STATUS_MAP.EFFECTIVE.code);
  });

  const fetchDetail = async () => {
    const leaseId = route.params.leaseId as string;
    if (!leaseId) return;

    loading.value = true;
    try {
      const resp = await getLeaseDetail({ leaseId });
      if (resp.code === 0) {
        detail.value = resp.data;
      } else {
        message(resp.message || "获取租客详情失败", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  };

  const goBack = () => {
    const { readonly: _readonly, ...listQuery } = route.query;
    router.push({
      path: "/contract/tenant",
      query: listQuery
    });
  };

  const handleLeaseUpdated = async () => {
    markTenantListRefresh();
    await fetchDetail();
  };

  onMounted(fetchDetail);
</script>

<style scoped lang="scss">
  .tenant-detail-page {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: calc(100vh - 126px);
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

    &__status {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 0 8px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      border: 1px solid;
      border-radius: 999px;
      white-space: nowrap;
    }

    &__desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &__cancel-info {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      align-items: center;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-color-danger);
    }

    &__actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    :deep(.tenant-detail-view) {
      flex: 1 1 auto;
      min-height: 0;
    }
  }
</style>
