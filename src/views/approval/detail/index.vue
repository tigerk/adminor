<script setup lang="ts">
  import { computed, nextTick, onMounted, ref } from "vue";
  import { ElMessage, type FormInstance, type FormRules } from "element-plus";
  import {
    Calendar,
    Check,
    CircleCloseFilled,
    Close,
    Document,
    Edit,
    House,
    Loading as IconLoading,
    Money,
    Phone,
    RefreshLeft,
    SuccessFilled,
    User,
    UserFilled,
    Wallet
  } from "@element-plus/icons-vue";
  import { getApprovalInstanceDetail, handleApproval } from "@/api/approval";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import type { ApprovalInstanceVo } from "@/types";
  import { APPROVAL_ACTION_TYPE_ENUM, APPROVAL_ACTION_TYPE_HELPER, APPROVAL_BIZ_TYPE_HELPER, APPROVAL_INSTANCE_STATUS_HELPER } from "@/constants";
  import ApprovalTimeline from "@/views/approval/detail/components/ApprovalTimeline.vue";

  // ====== Types ======
  interface ApprovalForm {
    action: number;
    remark: string;
  }

  defineOptions({ name: "ApprovalDetailDialog" });

  interface Props {
    instanceId: number;
    from?: string;
  }

  const props = defineProps<Props>();

  const loading = ref(false);
  const detail = ref<ApprovalInstanceVo>(null);

  const showApprovalPanel = ref(false);
  const approvalFormRef = ref<FormInstance>();
  const submitting = ref(false);
  const approvalForm = ref<ApprovalForm>({
    action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code,
    remark: ""
  });
  const showConfirmDialog = ref(false);

  const { openTenantViewDialog } = useTenant();

  // ====== Computed ======
  const canApprove = computed(() => props.from === "todo" && APPROVAL_INSTANCE_STATUS_HELPER.isPending(detail.value?.status));

  const isRejectAction = computed(() => APPROVAL_ACTION_TYPE_HELPER.isReject(approvalForm.value.action));

  const approvalFormRules = computed<FormRules>(() => ({
    action: [{ required: true, message: "请选择审批结果", trigger: "change" }],
    remark: [
      {
        required: isRejectAction.value,
        message: "驳回时必须填写原因",
        trigger: "blur"
      }
    ]
  }));

  const displayRoomList = computed(() => detail.value?.tenantDetail?.roomList?.map(i => i?.houseName + "【" + i?.roomNumber + "】").join("、") || "-");

  // ====== Status ======
  type StatusKey = "pending" | "approved" | "rejected" | "withdrawn" | "cancelled";

  const getStatusKey = (status: number): StatusKey => {
    if (APPROVAL_INSTANCE_STATUS_HELPER.isPending(status)) return "pending";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isApproved(status)) return "approved";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isRejected(status)) return "rejected";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isWithdrawn(status)) return "withdrawn";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isCancelled(status)) return "cancelled";
    return "pending";
  };

  const statusTheme = computed(() => getStatusKey(detail.value?.status));

  // ====== API ======
  const fetchDetail = async () => {
    loading.value = true;
    try {
      const { data } = await getApprovalInstanceDetail(props.instanceId);
      detail.value = data;
    } finally {
      loading.value = false;
    }
  };

  const handleViewBusinessDetail = () => {
    if (!detail.value) return;
    const { bizType, bizId } = detail.value;
    if (APPROVAL_BIZ_TYPE_HELPER.isTenantCheckin(bizType)) {
      openTenantViewDialog("查看", { id: bizId, tenantName: "" }, { readonly: true });
    } else if (APPROVAL_BIZ_TYPE_HELPER.isTenantCheckout(bizType)) {
      ElMessage.warning("退租详情功能开发中");
    } else if (APPROVAL_BIZ_TYPE_HELPER.isHouseCreate(bizType)) {
      ElMessage.warning("房源详情功能开发中");
    } else {
      ElMessage.warning("暂不支持该业务类型的详情查看");
    }
  };

  // ====== Approval Actions ======
  const handleShowApprovalPanel = () => {
    showApprovalPanel.value = true;
    approvalForm.value = {
      action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code,
      remark: ""
    };
    nextTick(() => approvalFormRef.value?.clearValidate());
  };

  const handleCancelApproval = () => {
    showApprovalPanel.value = false;
    approvalForm.value = {
      action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code,
      remark: ""
    };
    approvalFormRef.value?.clearValidate();
  };

  const handleActionChange = () => {
    approvalForm.value.remark = "";
    nextTick(() => approvalFormRef.value?.clearValidate("remark"));
  };

  const handlePreSubmit = () => {
    approvalFormRef.value?.validate(valid => {
      if (valid) showConfirmDialog.value = true;
    });
  };

  const handleSubmitApproval = async () => {
    showConfirmDialog.value = false;
    submitting.value = true;
    try {
      await handleApproval({
        instanceId: props.instanceId,
        action: approvalForm.value.action,
        remark: approvalForm.value.remark || undefined
      });
      ElMessage.success(
        APPROVAL_ACTION_TYPE_HELPER.isApprove(approvalForm.value.action) ? "审批通过成功" : `已${APPROVAL_ACTION_TYPE_HELPER.getNameByCode(approvalForm.value.action)}该审批`
      );
      showApprovalPanel.value = false;
      fetchDetail().then();
    } catch (error: any) {
      ElMessage.error(error?.message || "审批操作失败");
    } finally {
      submitting.value = false;
    }
  };

  onMounted(() => {
    if (!props.instanceId) {
      ElMessage.error("缺少审批实例ID");
      return;
    }
    fetchDetail();
  });
</script>

<template>
  <div v-loading="loading" class="ad">
    <!-- ===== Status Banner ===== -->
    <div class="ad-banner" :data-s="statusTheme">
      <span class="ad-banner__ico">
        <el-icon :size="18">
          <IconLoading v-if="statusTheme === 'pending'" />
          <SuccessFilled v-else-if="statusTheme === 'approved'" />
          <CircleCloseFilled v-else-if="statusTheme === 'rejected'" />
          <RefreshLeft v-else-if="statusTheme === 'withdrawn'" />
          <Close v-else />
        </el-icon>
      </span>
      <span class="ad-banner__body">
        <span class="ad-banner__title">
          {{ APPROVAL_INSTANCE_STATUS_HELPER.getNameByCode(detail?.status) }}
        </span>
        <span class="ad-banner__sub">{{ detail?.bizTypeName }} · {{ detail?.instanceNo }}</span>
      </span>
      <button v-if="canApprove && !showApprovalPanel" class="ad-banner__btn" @click="handleShowApprovalPanel">
        <el-icon :size="14"><Edit /></el-icon>
        审批
      </button>
    </div>

    <!-- ===== Inline Approval Panel ===== -->
    <div class="ad-panel" :class="{ 'is-open': showApprovalPanel && canApprove }">
      <div class="ad-panel__inner">
        <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalFormRules" label-position="top">
          <el-form-item prop="action" class="ad-panel__pick-item">
            <div class="ad-panel__picks">
              <div
                class="ad-pick ad-pick--pass"
                :class="{ 'is-on': approvalForm.action === APPROVAL_ACTION_TYPE_ENUM.APPROVE.code }"
                @click="
                  approvalForm.action = APPROVAL_ACTION_TYPE_ENUM.APPROVE.code;
                  handleActionChange();
                "
              >
                <span class="ad-pick__dot" />
                <el-icon :size="18"><SuccessFilled /></el-icon>
                <span class="ad-pick__body">
                  <span class="ad-pick__label">通过</span>
                  <span class="ad-pick__hint">同意此审批申请</span>
                </span>
              </div>
              <div
                class="ad-pick ad-pick--deny"
                :class="{ 'is-on': approvalForm.action === APPROVAL_ACTION_TYPE_ENUM.REJECT.code }"
                @click="
                  approvalForm.action = APPROVAL_ACTION_TYPE_ENUM.REJECT.code;
                  handleActionChange();
                "
              >
                <span class="ad-pick__dot" />
                <el-icon :size="18"><CircleCloseFilled /></el-icon>
                <span class="ad-pick__body">
                  <span class="ad-pick__label">驳回</span>
                  <span class="ad-pick__hint">退回给申请人修改</span>
                </span>
              </div>
            </div>
          </el-form-item>

          <el-form-item :label="isRejectAction ? '驳回原因（必填）' : '审批意见（选填）'" prop="remark">
            <el-input
              v-model="approvalForm.remark"
              type="textarea"
              :rows="2"
              :placeholder="isRejectAction ? '请输入驳回原因…' : '请输入审批意见…'"
              maxlength="500"
              show-word-limit
              resize="none"
            />
          </el-form-item>

          <div class="ad-panel__bar">
            <el-button @click="handleCancelApproval">取消</el-button>
            <el-button :type="isRejectAction ? 'danger' : 'success'" :loading="submitting" @click="handlePreSubmit">
              <el-icon style="margin-right: 4px">
                <Close v-if="isRejectAction" />
                <Check v-else />
              </el-icon>
              {{ isRejectAction ? "确认驳回" : "确认通过" }}
            </el-button>
          </div>
        </el-form>
      </div>
    </div>

    <!-- ===== Confirm Dialog ===== -->
    <el-dialog v-model="showConfirmDialog" :title="isRejectAction ? '确认驳回' : '确认通过'" width="400px" append-to-body destroy-on-close :close-on-click-modal="false">
      <div class="ad-cfm">
        <div class="ad-cfm__ico" :class="isRejectAction ? 'ad-cfm__ico--d' : 'ad-cfm__ico--p'">
          <el-icon :size="22">
            <Close v-if="isRejectAction" />
            <Check v-else />
          </el-icon>
        </div>
        <p>
          {{ isRejectAction ? "确认驳回此审批？驳回后申请人需重新提交。" : "确认通过此审批？通过后将进入下一审批节点或直接完成。" }}
        </p>
        <div v-if="approvalForm.remark" class="ad-cfm__note">
          <span class="ad-cfm__note-lbl">审批意见</span>
          {{ approvalForm.remark }}
        </div>
      </div>
      <template #footer>
        <el-button @click="showConfirmDialog = false">再想想</el-button>
        <el-button :type="isRejectAction ? 'danger' : 'success'" :loading="submitting" @click="handleSubmitApproval">
          {{ isRejectAction ? "确认驳回" : "确认通过" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 申请信息 ===== -->
    <section class="ad-sec">
      <div class="ad-sec__hd">
        <el-icon :size="14"><User /></el-icon>
        <span class="ad-sec__label">申请信息</span>
      </div>
      <div class="ad-grid">
        <div class="ad-grid__cell">
          <span class="ad-grid__k">申请人</span>
          <span class="ad-grid__v">{{ detail?.applicantName || "-" }}</span>
        </div>
        <div class="ad-grid__cell">
          <span class="ad-grid__k">申请时间</span>
          <span class="ad-grid__v">{{ detail?.createTime || "-" }}</span>
        </div>
        <div class="ad-grid__cell">
          <span class="ad-grid__k">当前节点</span>
          <span class="ad-grid__v">
            <el-tag v-if="detail?.currentNodeName" type="warning" size="small" effect="light">
              {{ detail?.currentNodeName }}
            </el-tag>
            <span v-else class="ad-grid__muted">-</span>
          </span>
        </div>
        <div class="ad-grid__cell">
          <span class="ad-grid__k">完成时间</span>
          <span class="ad-grid__v" :class="{ 'ad-grid__muted': !detail?.finishTime }">
            {{ detail?.finishTime || "-" }}
          </span>
        </div>
      </div>
    </section>

    <!-- 最终意见 -->
    <div v-if="detail?.resultRemark" class="ad-final">
      <span class="ad-final__lbl">最终意见</span>
      <span class="ad-final__txt">{{ detail.resultRemark }}</span>
    </div>

    <div class="ad-div" />

    <!-- ===== 业务详情 ===== -->
    <section class="ad-sec">
      <div class="ad-sec__hd">
        <el-icon :size="14"><Document /></el-icon>
        <span class="ad-sec__label">业务详情</span>
        <el-button type="primary" link size="small" class="ad-sec__link" @click="handleViewBusinessDetail">查看完整信息 →</el-button>
      </div>

      <template v-if="APPROVAL_BIZ_TYPE_HELPER.isTenantCheckin(detail?.bizType)">
        <div class="ad-tenant">
          <span class="ad-tenant__av">
            <el-icon :size="17"><UserFilled /></el-icon>
          </span>
          <span class="ad-tenant__meta">
            <span class="ad-tenant__name">{{ detail?.tenantDetail?.tenantName }}</span>
            <span class="ad-tenant__phone">
              <el-icon :size="12"><Phone /></el-icon>
              {{ detail?.tenantDetail?.tenantPhone }}
            </span>
          </span>
        </div>

        <div class="ad-rows">
          <div class="ad-row">
            <span class="ad-row__ico">
              <el-icon :size="14"><House /></el-icon>
            </span>
            <span class="ad-row__k">入住房间</span>
            <span class="ad-row__v">{{ displayRoomList }}</span>
          </div>
          <div class="ad-row">
            <span class="ad-row__ico">
              <el-icon :size="14"><Calendar /></el-icon>
            </span>
            <span class="ad-row__k">租赁周期</span>
            <span class="ad-row__v">{{ detail?.tenantDetail?.leaseStart }} 至 {{ detail?.tenantDetail?.leaseEnd }}</span>
          </div>
          <div class="ad-row ad-row--hl">
            <span class="ad-row__ico">
              <el-icon :size="14"><Money /></el-icon>
            </span>
            <span class="ad-row__k">月租金</span>
            <span class="ad-row__v">
              <span class="ad-price">
                ¥{{ detail?.tenantDetail?.rentPrice }}
                <small>/月</small>
              </span>
            </span>
          </div>
          <div class="ad-row">
            <span class="ad-row__ico">
              <el-icon :size="14"><Wallet /></el-icon>
            </span>
            <span class="ad-row__k">押付方式</span>
            <span class="ad-row__v">押{{ detail?.tenantDetail?.depositMonths }}付{{ detail?.tenantDetail?.paymentMonths }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <el-empty description="暂无业务详情" :image-size="48" />
      </template>
    </section>

    <div class="ad-div" />

    <!-- ===== 审批流程 ===== -->
    <ApprovalTimeline :actions="detail?.actions ?? []" />
  </div>
</template>

<style scoped lang="scss">
  /* ==============Tokens============== */
  .ad {
    --c-green: var(--el-color-success);
    --c-green-dim: var(--el-color-success-light-9);
    --c-red: var(--el-color-danger);
    --c-red-dim: var(--el-color-danger-light-9);
    --c-amber: var(--el-color-warning);
    --c-amber-dim: var(--el-color-warning-light-9);
    --c-blue: var(--el-color-primary);
    --c-blue-dim: var(--el-color-primary-light-9);
    --r: 10px;

    font-size: 14px;
    color: var(--el-text-color-primary);
    padding: 20px;
    padding-bottom: 8px;
  }

  /* ==============Status Banner============== */
  .ad-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    border-radius: var(--r);
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: 0.12;
      border-radius: inherit;
    }

    &[data-s="pending"] {
      background: var(--c-amber-dim);
      &::before {
        background: linear-gradient(135deg, var(--c-amber) 0%, transparent 60%);
      }
      .ad-banner__ico {
        background: var(--c-amber-dim);
        color: var(--c-amber);
      }
      .ad-banner__title {
        color: var(--c-amber);
      }
    }
    &[data-s="approved"] {
      background: var(--c-green-dim);
      &::before {
        background: linear-gradient(135deg, var(--c-green) 0%, transparent 60%);
      }
      .ad-banner__ico {
        background: var(--c-green-dim);
        color: var(--c-green);
      }
      .ad-banner__title {
        color: var(--c-green);
      }
    }
    &[data-s="rejected"] {
      background: var(--c-red-dim);
      &::before {
        background: linear-gradient(135deg, var(--c-red) 0%, transparent 60%);
      }
      .ad-banner__ico {
        background: var(--c-red-dim);
        color: var(--c-red);
      }
      .ad-banner__title {
        color: var(--c-red);
      }
    }
    &[data-s="withdrawn"],
    &[data-s="cancelled"] {
      background: var(--el-fill-color-light);
      .ad-banner__ico {
        background: var(--el-fill-color);
        color: var(--el-text-color-secondary);
      }
      .ad-banner__title {
        color: var(--el-text-color-secondary);
      }
    }

    &__ico {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    &__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    &__title {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    &__sub {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__btn {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s;
      background: var(--c-amber);
      color: #000;

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
    }
  }

  /* ==============Approval Panel============== */
  .ad-panel {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    margin-bottom: 0;
    transition:
      max-height 0.4s ease,
      opacity 0.3s ease,
      margin 0.3s ease;

    &.is-open {
      max-height: 500px;
      opacity: 1;
      margin-bottom: 20px;
    }

    &__inner {
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--r);
      padding: 18px 20px;
    }

    &__pick-item {
      margin-bottom: 12px;
      :deep(.el-form-item__content) {
        line-height: 1;
      }
    }

    &__picks {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    &__bar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 4px;
    }
  }

  .ad-pick {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 2px solid var(--el-border-color);
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;

    &:hover {
      border-color: var(--el-border-color-darker);
    }

    &__dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid var(--el-text-color-placeholder);
      flex-shrink: 0;
      position: relative;
      transition: all 0.15s;

      &::after {
        content: "";
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        transition: background 0.15s;
      }
    }

    &__body {
      display: flex;
      flex-direction: column;
    }
    &__label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    &__hint {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-top: 1px;
    }

    &--pass {
      color: var(--c-green);
    }
    &--pass.is-on {
      border-color: var(--c-green);
      background: var(--c-green-dim);
      .ad-pick__dot {
        border-color: var(--c-green);
        &::after {
          background: var(--c-green);
        }
      }
    }

    &--deny {
      color: var(--c-red);
    }
    &--deny.is-on {
      border-color: var(--c-red);
      background: var(--c-red-dim);
      .ad-pick__dot {
        border-color: var(--c-red);
        &::after {
          background: var(--c-red);
        }
      }
    }
  }

  /* ==============Confirm Dialog============== */
  .ad-cfm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;

    &__ico {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      &--p {
        background: var(--c-green-dim);
        color: var(--c-green);
      }
      &--d {
        background: var(--c-red-dim);
        color: var(--c-red);
      }
    }

    &__note {
      width: 100%;
      padding: 10px 12px;
      border-radius: 6px;
      background: var(--el-fill-color-light);
      font-size: 13px;
      color: var(--el-text-color-secondary);
      text-align: left;
      &-lbl {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--el-text-color-placeholder);
        margin-bottom: 2px;
      }
    }
  }

  /* ==============Section============== */
  .ad-sec {
    margin-bottom: 4px;
  }

  .ad-sec__hd {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;

    > .el-icon {
      color: var(--el-text-color-placeholder);
    }
  }

  .ad-sec__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .ad-sec__link {
    margin-left: auto;
    font-size: 12px;
  }

  /* ==============Info Grid============== */
  .ad-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--el-border-color-lighter);
    border-radius: var(--r);
    overflow: hidden;
    margin-bottom: 16px;

    &__cell {
      padding: 12px 16px;
      background: var(--el-bg-color-overlay);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    &__k {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
    &__v {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
    &__muted {
      color: var(--el-text-color-placeholder);
    }
  }

  /* ==============Final Remark / Divider============== */
  .ad-final {
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--el-bg-color-overlay);
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 3px;

    &__lbl {
      font-size: 11px;
      font-weight: 600;
      color: var(--el-text-color-placeholder);
    }
    &__txt {
      font-size: 13px;
      color: var(--el-text-color-primary);
      line-height: 1.6;
    }
  }

  .ad-div {
    height: 1px;
    background: var(--el-border-color-extra-light);
    margin: 16px 0;
  }

  /* ==============Tenant============== */
  .ad-tenant {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--el-bg-color-overlay);
    border-radius: var(--r);
    margin-bottom: 10px;

    &__av {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--c-blue-dim);
      color: var(--c-blue);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    &__meta {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    &__name {
      font-size: 15px;
      font-weight: 600;
    }
    &__phone {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 2px;
    }
  }

  /* ==============Data Rows============== */
  .ad-rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 16px;
  }

  .ad-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 8px;
    background: var(--el-bg-color-overlay);
    transition: background 0.12s;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &__ico {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--el-fill-color);
      display: grid;
      place-items: center;
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }

    &__k {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      min-width: 55px;
      white-space: nowrap;
    }
    &__v {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      word-break: break-all;
    }

    &--hl {
      background: var(--c-red-dim);
      border: 1px solid rgba(239, 91, 91, 0.08);
      .ad-row__ico {
        background: rgba(239, 91, 91, 0.12);
        color: var(--c-red);
      }
      &:hover {
        background: var(--c-red-dim);
        filter: brightness(1.05);
      }
    }
  }

  .ad-price {
    font-size: 22px;
    font-weight: 800;
    color: var(--c-red);
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;

    small {
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-placeholder);
      letter-spacing: 0;
    }
  }
</style>
