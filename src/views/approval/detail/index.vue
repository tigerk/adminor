<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { ElMessage, FormInstance, FormRules } from "element-plus";
  import { getApprovalInstanceDetail, handleApproval } from "@/api/approval";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import { ApprovalActionProps, ApprovalInstanceProps } from "@/types";
  import { useUserStoreHook } from "@/store/modules/user";
  import { APPROVAL_ACTION_STATUS_HELPER, APPROVAL_ACTION_TYPE_ENUM, APPROVAL_ACTION_TYPE_HELPER, APPROVAL_BIZ_TYPE_HELPER, APPROVAL_INSTANCE_STATUS_HELPER } from "@/constants";

  defineOptions({
    name: "ApprovalDetailDialog"
  });

  interface Props {
    instanceId: number;
    from?: string; // todo/done/apply
  }

  const props = defineProps<Props>();

  const loading = ref(false);
  const detail = ref<ApprovalInstanceProps>(null);
  const userStore = useUserStoreHook();

  // 审批表单相关
  const showApprovalPanel = ref(false);
  const approvalFormRef = ref<FormInstance>();
  const submitting = ref(false);
  const approvalForm = ref({
    action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code,
    remark: ""
  });

  const { openTenantViewDialog } = useTenant();

  const canApprove = computed(() => {
    return props.from === "todo" && APPROVAL_INSTANCE_STATUS_HELPER.isPending(detail.value?.status);
  });

  const isRejectAction = computed(() => APPROVAL_ACTION_TYPE_HELPER.isReject(approvalForm.value.action));

  const approvalFormRules = computed<FormRules>(() => ({
    action: [{ required: true, message: "请选择审批结果", trigger: "change" }],
    remark: [
      {
        required: isRejectAction.value,
        message: "驳回时必须填写驳回原因",
        trigger: "blur"
      }
    ]
  }));

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

  const handleShowApprovalPanel = () => {
    showApprovalPanel.value = true;
    approvalForm.value = { action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code, remark: "" };
    approvalFormRef.value?.clearValidate();
  };

  const handleCancelApproval = () => {
    showApprovalPanel.value = false;
    approvalForm.value = { action: APPROVAL_ACTION_TYPE_ENUM.APPROVE.code, remark: "" };
    approvalFormRef.value?.clearValidate();
  };

  const handleActionChange = () => {
    approvalForm.value.remark = "";
    approvalFormRef.value?.clearValidate("remark");
  };

  const handleSubmitApproval = async () => {
    if (!approvalFormRef.value) return;
    approvalFormRef.value.validate(async valid => {
      if (!valid) return;
      submitting.value = true;
      try {
        await handleApproval({
          instanceId: props.instanceId,
          approverId: userStore.id,
          action: approvalForm.value.action,
          remark: approvalForm.value.remark || undefined
        });
        const actionName = APPROVAL_ACTION_TYPE_HELPER.getNameByCode(approvalForm.value.action);
        ElMessage.success(APPROVAL_ACTION_TYPE_HELPER.isApprove(approvalForm.value.action) ? "审批通过成功" : `已${actionName}该审批`);
        showApprovalPanel.value = false;
        fetchDetail();
      } catch (error: any) {
        ElMessage.error(error?.message || "审批操作失败");
      } finally {
        submitting.value = false;
      }
    });
  };

  const displayRoomList = computed(() => {
    return detail.value?.tenantDetail?.roomList?.map(item => item?.houseName + "【" + item?.roomNumber + "】").join("、") || "-";
  });

  const sortedActions = computed(() => {
    if (!detail.value?.actions) return [];
    return [...detail.value.actions].sort((a, b) => a.nodeOrder - b.nodeOrder);
  });

  // 已完成的节点数
  const completedCount = computed(() => {
    return sortedActions.value.filter(a => !APPROVAL_ACTION_STATUS_HELPER.isPending(a.status) && !APPROVAL_ACTION_STATUS_HELPER.isSkipped(a.status)).length;
  });

  const getStatusIcon = (status: number) => {
    if (APPROVAL_INSTANCE_STATUS_HELPER.isPending(status)) return "ep:loading";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isApproved(status)) return "ep:success-filled";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isRejected(status)) return "ep:circle-close-filled";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isWithdrawn(status)) return "ep:refresh-left";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isCancelled(status)) return "ep:close";
    return "ep:document";
  };

  const getStatusTheme = (status: number) => {
    if (APPROVAL_INSTANCE_STATUS_HELPER.isPending(status)) return "pending";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isApproved(status)) return "approved";
    if (APPROVAL_INSTANCE_STATUS_HELPER.isRejected(status)) return "rejected";
    return "default";
  };

  const getTimelineStatus = (action: ApprovalActionProps) => {
    if (APPROVAL_ACTION_STATUS_HELPER.isPending(action.status)) return "pending";
    if (APPROVAL_ACTION_STATUS_HELPER.isSkipped(action.status)) return "skipped";
    if (APPROVAL_ACTION_TYPE_HELPER.isApprove(action.action)) return "approved";
    if (APPROVAL_ACTION_TYPE_HELPER.isReject(action.action)) return "rejected";
    return "pending";
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
    <!-- ====== 顶部状态栏 ====== -->
    <div class="ad-header" :data-theme="getStatusTheme(detail?.status)">
      <div class="ad-header__icon">
        <iconify-icon :icon="getStatusIcon(detail?.status)" />
      </div>
      <div class="ad-header__body">
        <span class="ad-header__title">{{ APPROVAL_INSTANCE_STATUS_HELPER.getNameByCode(detail?.status) }}</span>
        <span class="ad-header__sub">{{ detail?.bizTypeName }} · {{ detail?.instanceNo }}</span>
      </div>
      <el-button v-if="canApprove && !showApprovalPanel" type="primary" round @click="handleShowApprovalPanel" class="ad-header__action">
        <iconify-icon icon="ep:edit" style="margin-right: 6px" />
        立即审批
      </el-button>
    </div>

    <!-- ====== 审批操作面板 ====== -->
    <transition name="slide-down">
      <div v-if="showApprovalPanel && canApprove" class="ad-panel">
        <div class="ad-panel__head">
          <iconify-icon icon="ep:edit-pen" />
          <span>审批操作</span>
        </div>

        <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalFormRules" label-position="top">
          <el-form-item prop="action" class="ad-panel__selector">
            <div class="ad-panel__cards">
              <div
                class="ad-panel__card ad-panel__card--approve"
                :class="{ 'is-active': approvalForm.action === APPROVAL_ACTION_TYPE_ENUM.APPROVE.code }"
                @click="
                  approvalForm.action = APPROVAL_ACTION_TYPE_ENUM.APPROVE.code;
                  handleActionChange();
                "
              >
                <iconify-icon icon="ep:success-filled" class="ad-panel__card-icon" />
                <span>通过</span>
              </div>
              <div
                class="ad-panel__card ad-panel__card--reject"
                :class="{ 'is-active': approvalForm.action === APPROVAL_ACTION_TYPE_ENUM.REJECT.code }"
                @click="
                  approvalForm.action = APPROVAL_ACTION_TYPE_ENUM.REJECT.code;
                  handleActionChange();
                "
              >
                <iconify-icon icon="ep:circle-close-filled" class="ad-panel__card-icon" />
                <span>驳回</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item :label="isRejectAction ? '驳回原因' : '审批意见（选填）'" prop="remark">
            <el-input
              v-model="approvalForm.remark"
              type="textarea"
              :rows="3"
              :placeholder="isRejectAction ? '请输入驳回原因...' : '请输入审批意见...'"
              maxlength="500"
              show-word-limit
              resize="none"
            />
          </el-form-item>

          <div class="ad-panel__foot">
            <el-button @click="handleCancelApproval">取消</el-button>
            <el-button :type="isRejectAction ? 'danger' : 'primary'" :loading="submitting" @click="handleSubmitApproval">
              {{ isRejectAction ? "确认驳回" : "确认通过" }}
            </el-button>
          </div>
        </el-form>
      </div>
    </transition>

    <!-- ====== 主体双栏 ====== -->
    <div class="ad-body">
      <!-- 左栏：业务信息 -->
      <div class="ad-main">
        <!-- 申请信息 -->
        <section class="ad-card">
          <div class="ad-card__head">
            <iconify-icon icon="ep:user" class="ad-card__head-icon" />
            <span>申请信息</span>
          </div>
          <div class="ad-card__grid">
            <div class="ad-field">
              <span class="ad-field__label">申请人</span>
              <span class="ad-field__value">{{ detail?.applicantName || "-" }}</span>
            </div>
            <div class="ad-field">
              <span class="ad-field__label">申请时间</span>
              <span class="ad-field__value">{{ detail?.createTime || "-" }}</span>
            </div>
            <div class="ad-field">
              <span class="ad-field__label">当前节点</span>
              <span class="ad-field__value">
                <el-tag v-if="detail?.currentNodeName" type="warning" size="small" effect="light">
                  {{ detail?.currentNodeName }}
                </el-tag>
                <span v-else class="ad-field__placeholder">-</span>
              </span>
            </div>
            <div class="ad-field">
              <span class="ad-field__label">完成时间</span>
              <span class="ad-field__value">{{ detail?.finishTime || "-" }}</span>
            </div>
          </div>
          <div v-if="detail?.resultRemark" class="ad-card__remark">
            <span class="ad-card__remark-label">最终意见</span>
            <span class="ad-card__remark-text">{{ detail?.resultRemark }}</span>
          </div>
        </section>

        <!-- 业务详情 -->
        <section class="ad-card">
          <div class="ad-card__head">
            <iconify-icon icon="ep:document" class="ad-card__head-icon" />
            <span>业务详情</span>
            <el-button type="primary" link size="small" class="ad-card__head-extra" @click="handleViewBusinessDetail">
              <iconify-icon icon="ep:view" style="margin-right: 4px" />
              查看完整信息
            </el-button>
          </div>

          <!-- 租客入住 -->
          <template v-if="APPROVAL_BIZ_TYPE_HELPER.isTenantCheckin(detail?.bizType)">
            <div class="ad-tenant">
              <div class="ad-tenant__avatar">
                <iconify-icon icon="ep:user-filled" />
              </div>
              <div class="ad-tenant__info">
                <div class="ad-tenant__name">{{ detail?.tenantDetail?.tenantName }}</div>
                <div class="ad-tenant__phone">
                  <iconify-icon icon="ep:phone" />
                  {{ detail?.tenantDetail?.tenantPhone }}
                </div>
              </div>
            </div>

            <div class="ad-biz-list">
              <div class="ad-biz-item">
                <iconify-icon icon="ep:house" class="ad-biz-item__icon" />
                <div class="ad-biz-item__body">
                  <span class="ad-biz-item__label">入住房间</span>
                  <span class="ad-biz-item__value">{{ displayRoomList }}</span>
                </div>
              </div>
              <div class="ad-biz-item">
                <iconify-icon icon="ep:calendar" class="ad-biz-item__icon" />
                <div class="ad-biz-item__body">
                  <span class="ad-biz-item__label">租赁周期</span>
                  <span class="ad-biz-item__value">{{ detail?.tenantDetail?.leaseStart }} 至 {{ detail?.tenantDetail?.leaseEnd }}</span>
                </div>
              </div>
              <div class="ad-biz-item ad-biz-item--highlight">
                <iconify-icon icon="ep:money" class="ad-biz-item__icon" />
                <div class="ad-biz-item__body">
                  <span class="ad-biz-item__label">月租金</span>
                  <span class="ad-biz-item__value ad-biz-item__price">
                    ¥{{ detail?.tenantDetail?.rentPrice }}
                    <small>/月</small>
                  </span>
                </div>
              </div>
              <div class="ad-biz-item">
                <iconify-icon icon="ep:wallet" class="ad-biz-item__icon" />
                <div class="ad-biz-item__body">
                  <span class="ad-biz-item__label">押付方式</span>
                  <span class="ad-biz-item__value">押{{ detail?.tenantDetail?.depositMonths }}付{{ detail?.tenantDetail?.paymentMonths }}</span>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>

      <!-- 右栏：审批流程 -->
      <aside class="ad-aside">
        <div class="ad-card ad-card--sticky">
          <div class="ad-card__head">
            <iconify-icon icon="ep:list" class="ad-card__head-icon" />
            <span>审批流程</span>
            <span v-if="sortedActions.length" class="ad-card__head-badge">{{ completedCount }}/{{ sortedActions.length }}</span>
          </div>

          <!-- 空状态 -->
          <div v-if="sortedActions.length === 0" class="ad-timeline-empty">
            <iconify-icon icon="ep:document-delete" />
            <span>暂无审批记录</span>
          </div>

          <!-- 时间线 -->
          <div v-else class="ad-timeline">
            <div v-for="(action, idx) in sortedActions" :key="action.id.toString()" class="ad-timeline__item" :data-status="getTimelineStatus(action)">
              <!-- 节点 -->
              <div class="ad-timeline__rail">
                <div class="ad-timeline__dot">
                  <iconify-icon v-if="getTimelineStatus(action) === 'approved'" icon="ep:check" />
                  <iconify-icon v-else-if="getTimelineStatus(action) === 'rejected'" icon="ep:close" />
                  <iconify-icon v-else-if="getTimelineStatus(action) === 'skipped'" icon="ep:minus" />
                  <span v-else class="ad-timeline__dot-num">{{ idx + 1 }}</span>
                </div>
                <div v-if="idx < sortedActions.length - 1" class="ad-timeline__line" />
              </div>

              <!-- 内容 -->
              <div class="ad-timeline__card">
                <div class="ad-timeline__card-head">
                  <span class="ad-timeline__node-name">{{ action.nodeName }}</span>
                  <el-tag
                    :type="
                      getTimelineStatus(action) === 'approved'
                        ? 'success'
                        : getTimelineStatus(action) === 'rejected'
                          ? 'danger'
                          : getTimelineStatus(action) === 'skipped'
                            ? 'info'
                            : 'warning'
                    "
                    size="small"
                    effect="light"
                  >
                    {{ action.statusName }}
                  </el-tag>
                </div>
                <div class="ad-timeline__card-body">
                  <div class="ad-timeline__meta">
                    <iconify-icon icon="ep:user" />
                    <span>{{ action.approverName || "待分配" }}</span>
                  </div>
                  <div v-if="action.operateTime" class="ad-timeline__meta">
                    <iconify-icon icon="ep:clock" />
                    <span>{{ action.operateTime }}</span>
                  </div>
                  <div v-if="action.remark" class="ad-timeline__remark">
                    <iconify-icon icon="ep:chat-line-square" />
                    <span>{{ action.remark }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* ===== 变量 ===== */
  $radius-sm: 6px;
  $radius-md: 10px;
  $radius-lg: 14px;
  $gap: 16px;
  $transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* ===== 根容器 ===== */
  .ad {
    --ad-bg: var(--el-bg-color);
    --ad-bg-soft: var(--el-fill-color-lighter);
    --ad-border: var(--el-border-color-lighter);
    --ad-text: var(--el-text-color-primary);
    --ad-text-2: var(--el-text-color-secondary);
    --ad-text-3: var(--el-text-color-placeholder);

    color: var(--ad-text);
    font-size: 14px;
  }

  /* ===== 状态头 ===== */
  .ad-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    margin: -20px -20px 20px;
    border-radius: 4px 4px 0 0;
    color: #fff;
    /* 默认渐变 */
    background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);

    &[data-theme="pending"] {
      background: linear-gradient(135deg, var(--el-color-warning-light-3) 0%, var(--el-color-warning) 100%);
    }
    &[data-theme="approved"] {
      background: linear-gradient(135deg, var(--el-color-success-light-3) 0%, var(--el-color-success) 100%);
    }
    &[data-theme="rejected"] {
      background: linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%);
    }

    &__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      font-size: 24px;
      flex-shrink: 0;
    }

    &__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__title {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.3;
    }

    &__sub {
      font-size: 13px;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__action {
      flex-shrink: 0;

      &.el-button {
        --el-button-bg-color: rgba(255, 255, 255, 0.92);
        --el-button-text-color: var(--el-color-primary);
        --el-button-hover-bg-color: #fff;
        --el-button-hover-text-color: var(--el-color-primary);
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  /* ===== 审批面板 ===== */
  .ad-panel {
    padding: 18px 20px;
    margin-bottom: 20px;
    border-radius: $radius-md;
    border: 1px solid var(--ad-border);
    background: var(--ad-bg-soft);

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--ad-text);
    }

    &__selector {
      margin-bottom: 16px;
      :deep(.el-form-item__content) {
        line-height: 1;
      }
    }

    &__cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    &__card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 12px;
      border-radius: $radius-sm;
      border: 2px solid var(--ad-border);
      background: var(--ad-bg);
      cursor: pointer;
      transition: all $transition;
      font-size: 14px;
      font-weight: 500;

      &:hover {
        border-color: var(--el-border-color-darker);
      }

      &-icon {
        font-size: 28px;
      }

      &--approve {
        .ad-panel__card-icon {
          color: var(--el-color-success-light-3);
        }
        &.is-active {
          border-color: var(--el-color-success);
          background: var(--el-color-success-light-9);
          .ad-panel__card-icon {
            color: var(--el-color-success);
          }
        }
      }

      &--reject {
        .ad-panel__card-icon {
          color: var(--el-color-danger-light-3);
        }
        &.is-active {
          border-color: var(--el-color-danger);
          background: var(--el-color-danger-light-9);
          .ad-panel__card-icon {
            color: var(--el-color-danger);
          }
        }
      }
    }

    &__foot {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
  }

  /* ===== 双栏布局 ===== */
  .ad-body {
    display: flex;
    gap: 20px;
    align-items: flex-start;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .ad-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ad-aside {
    width: 290px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  /* ===== 通用卡片 ===== */
  .ad-card {
    padding: 16px;
    border-radius: $radius-md;
    border: 1px solid var(--ad-border);
    background: var(--ad-bg);

    &--sticky {
      position: sticky;
      top: 0;
      max-height: calc(100vh - 240px);
      overflow-y: auto;
      scrollbar-width: thin;
    }

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--ad-text);

      &-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      &-extra {
        margin-left: auto;
      }

      &-badge {
        margin-left: auto;
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 10px;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px 24px;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    &__remark {
      margin-top: 14px;
      padding: 10px 14px;
      border-radius: $radius-sm;
      background: var(--ad-bg-soft);
      font-size: 13px;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      gap: 4px;

      &-label {
        font-size: 12px;
        color: var(--ad-text-2);
        font-weight: 500;
      }
      &-text {
        color: var(--ad-text);
      }
    }
  }

  /* ===== 字段 ===== */
  .ad-field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__label {
      font-size: 12px;
      color: var(--ad-text-2);
      line-height: 1.4;
    }
    &__value {
      font-size: 14px;
      color: var(--ad-text);
      line-height: 1.4;
    }
    &__placeholder {
      color: var(--ad-text-3);
    }
  }

  /* ===== 租客头像卡 ===== */
  .ad-tenant {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    margin-bottom: 14px;
    border-radius: $radius-sm;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--ad-bg-soft));

    &__avatar {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--el-color-primary-light-7);
      color: var(--el-color-primary);
      font-size: 22px;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 15px;
      font-weight: 600;
      color: var(--ad-text);
      line-height: 1.3;
    }

    &__phone {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--ad-text-2);
      margin-top: 2px;
    }
  }

  /* ===== 业务条目 ===== */
  .ad-biz-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ad-biz-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border-radius: $radius-sm;
    background: var(--ad-bg-soft);
    transition: background $transition;

    &--highlight {
      background: linear-gradient(135deg, var(--el-color-danger-light-9), var(--ad-bg-soft));
    }

    &__icon {
      flex-shrink: 0;
      font-size: 18px;
      color: var(--ad-text-2);
      margin-top: 2px;
    }

    &__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    &__label {
      font-size: 12px;
      color: var(--ad-text-2);
    }

    &__value {
      font-size: 14px;
      color: var(--ad-text);
      word-break: break-all;
    }

    &__price {
      font-size: 20px;
      font-weight: 700;
      color: var(--el-color-danger);
      letter-spacing: -0.5px;

      small {
        font-size: 12px;
        font-weight: 400;
        color: var(--ad-text-2);
        letter-spacing: 0;
      }
    }
  }

  /* ===== 时间线 ===== */
  .ad-timeline-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 0;
    color: var(--ad-text-3);
    font-size: 13px;

    .iconify-icon {
      font-size: 36px;
      opacity: 0.4;
    }
  }

  .ad-timeline {
    display: flex;
    flex-direction: column;
  }

  .ad-timeline__item {
    display: flex;
    gap: 12px;

    &:last-child .ad-timeline__line {
      display: none;
    }

    /* --- 节点轨道 --- */
    .ad-timeline__rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 26px;
      flex-shrink: 0;
    }

    .ad-timeline__dot {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid var(--el-border-color);
      background: var(--ad-bg);
      color: var(--ad-text-3);
      transition: all $transition;
    }

    .ad-timeline__dot-num {
      font-size: 11px;
    }

    .ad-timeline__line {
      flex: 1;
      width: 2px;
      min-height: 12px;
      margin: 4px 0;
      background: var(--ad-border);
      transition: background $transition;
    }

    /* --- 状态变体 --- */
    &[data-status="approved"] {
      .ad-timeline__dot {
        border-color: var(--el-color-success);
        background: var(--el-color-success);
        color: #fff;
      }
      .ad-timeline__line {
        background: var(--el-color-success-light-5);
      }
    }

    &[data-status="rejected"] {
      .ad-timeline__dot {
        border-color: var(--el-color-danger);
        background: var(--el-color-danger);
        color: #fff;
      }
    }

    &[data-status="pending"] {
      .ad-timeline__dot {
        border-color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }
    }

    &[data-status="skipped"] {
      .ad-timeline__dot {
        border-color: var(--el-border-color);
        background: var(--el-fill-color);
        color: var(--ad-text-3);
      }
      .ad-timeline__line {
        background: transparent;
        border-left: 2px dashed var(--el-border-color);
      }
    }

    /* --- 内容卡片 --- */
    .ad-timeline__card {
      flex: 1;
      padding: 10px 12px;
      margin-bottom: 10px;
      border-radius: $radius-sm;
      border: 1px solid var(--ad-border);
      background: var(--ad-bg-soft);
      transition:
        border-color $transition,
        box-shadow $transition;

      &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      }

      &-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }

      &-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        color: var(--ad-text-2);
      }
    }

    .ad-timeline__node-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--ad-text);
    }

    .ad-timeline__meta {
      display: flex;
      align-items: center;
      gap: 6px;

      .iconify-icon {
        flex-shrink: 0;
        font-size: 13px;
      }
    }

    .ad-timeline__remark {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-top: 4px;
      padding: 6px 8px;
      border-radius: 4px;
      background: var(--el-fill-color-light);
      color: var(--ad-text);
      line-height: 1.5;

      .iconify-icon {
        flex-shrink: 0;
        margin-top: 2px;
        font-size: 13px;
        color: var(--ad-text-2);
      }
    }
  }

  /* ===== 过渡动画 ===== */
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top;
  }
  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px) scaleY(0.96);
  }
</style>
