<template>
  <div class="tab-content">
    <el-skeleton v-if="loading" animated :rows="6" />
    <el-empty v-else-if="!checkoutDetail" description="暂无退租信息" :image-size="150" />
    <template v-else>
      <div class="info-section">
        <div class="section-header section-header--top">
          <div class="section-title">
            <span class="title-icon" />
            <span class="title-text">退租概览</span>
          </div>
          <div class="section-actions">
            <el-button type="primary" plain :disabled="!canEdit" @click="handleEditCheckout">修改退租单</el-button>
          </div>
        </div>
        <el-descriptions :column="3" class="info-descriptions" size="default">
          <el-descriptions-item label="退租单编号" label-align="right">
            <span class="text-value">{{ checkoutDetail.checkoutCode || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退租类型" label-align="right">
            <span class="text-value">{{ checkoutDetail.checkoutTypeName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退租状态" label-align="right">
            <span class="text-value">{{ checkoutDetail.statusName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="审批状态" label-align="right">
            <span class="text-value">{{ checkoutDetail.approvalStatusName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实际退租日" label-align="right">
            <span class="text-value">{{ checkoutDetail.actualCheckoutDate || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="合同到期日" label-align="right">
            <span class="text-value">{{ checkoutDetail.leaseEnd || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="押金金额" label-align="right">
            <span class="text-value">{{ checkoutDetail.depositAmount == null ? "-" : `¥${checkoutDetail.depositAmount}` }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="结算金额" label-align="right">
            <span class="text-value">{{ checkoutDetail.finalAmount == null ? "-" : `¥${checkoutDetail.finalAmount}` }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="房屋清洁费" label-align="right">
            <span class="text-value">
              {{ cleaningFeeText }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="结算方式" label-align="right">
            <span class="text-value">{{ checkoutDetail.settlementMethodName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="结算截止日" label-align="right">
            <span class="text-value">{{ checkoutDetail.dueDate || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态" label-align="right">
            <span class="text-value">{{ checkoutDetail.paymentStatusName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付时间" label-align="right">
            <span class="text-value">{{ checkoutDetail.payAt || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退租原因" label-align="right" :span="2">
            <span class="text-value">{{ checkoutDetail.remark || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="违约原因" label-align="right" :span="2">
            <span class="text-value">{{ checkoutDetail.breachReason || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" label-align="right" :span="3">
            <span class="text-value">{{ checkoutDetail.remark || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人" label-align="right">
            <span class="text-value">{{ checkoutDetail.createByName || checkoutDetail.createBy || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" label-align="right">
            <span class="text-value">{{ checkoutDetail.createAt || "-" }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="info-section">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon" />
            <span class="title-text">退租费用明细</span>
          </div>
        </div>
        <el-table v-if="checkoutDetail.feeList && checkoutDetail.feeList.length > 0" :data="checkoutDetail.feeList" border stripe class="fees-table">
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column prop="feeName" label="费用名称" align="center" min-width="140">
            <template #default="{ row }">
              <span class="text-value">{{ row.feeName || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="feeAmount" label="金额" align="center" min-width="110">
            <template #default="{ row }">
              <span class="fee-amount">{{ row.feeAmount == null ? "-" : `¥${row.feeAmount}` }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="feeStartDate" label="计费周期" align="center" min-width="180">
            <template #default="{ row }">
              <span class="text-value">{{ row.feeStartDate || "-" }} ~ {{ row.feeEndDate || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" align="center" min-width="160" show-overflow-tooltip />
        </el-table>
        <el-empty v-else description="暂无费用明细" :image-size="150" />
      </div>

      <div class="info-section">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon" />
            <span class="title-text">附件</span>
          </div>
        </div>
        <div v-if="checkoutDetail.attachmentUrls && checkoutDetail.attachmentUrls.length > 0" class="photo-wall">
          <div v-for="(url, index) in checkoutDetail.attachmentUrls" :key="url + index" class="photo-item">
            <el-image
              style="width: 100px; height: 100px; border-radius: 8px"
              :src="url"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              :preview-src-list="[url]"
              :initial-index="index"
              fit="cover"
              loading="lazy"
              preview-teleported
            />
          </div>
        </div>
        <div v-else class="empty-inline">暂无附件</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import type { LeaseCheckoutVo } from "@/types";
  import { useCheckoutDialog } from "@/views/contract/checkout/form/checkoutCreateForm/useCheckoutDialog";

  const props = defineProps<{
    loading: boolean;
    checkoutDetail: LeaseCheckoutVo | null;
  }>();

  const emit = defineEmits<{
    updated: [];
  }>();

  const { openLeaseCheckoutDialogByLeaseId } = useCheckoutDialog();

  const canEdit = computed(() => {
    return props.checkoutDetail;
  });

  const cleaningFeeText = computed(() => {
    if (!props.checkoutDetail) return "-";
    return props.checkoutDetail.addCleaningFee ? `¥${props.checkoutDetail.cleaningFeeAmount || 0}` : "未加收";
  });

  function handleEditCheckout() {
    if (!props.checkoutDetail?.leaseId) return;
    openLeaseCheckoutDialogByLeaseId(props.checkoutDetail.leaseId, () => emit("updated"));
  }
</script>

<style scoped lang="scss">
  .tab-content {
    min-height: 300px;
  }

  .info-section {
    margin-bottom: 28px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-title {
      display: flex;
      align-items: center;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .title-text {
        letter-spacing: 0.5px;
      }
    }
  }

  .section-header--top {
    margin-bottom: 12px;
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .fees-table {
    :deep(.el-table__header) {
      th {
        background: var(--el-fill-color-light);
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }

  .fee-amount {
    color: #f56c6c;
    font-weight: 600;
    font-size: 15px;
  }

  .photo-wall {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 10px 20px;
  }

  .photo-item {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
  }

  .photo-item:hover {
    transform: translateY(-5px);
  }

  .text-value {
    color: var(--el-text-color-regular);
  }

  html.dark {
    .photo-item {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
    }
  }

  .empty-inline {
    padding: 8px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
</style>
