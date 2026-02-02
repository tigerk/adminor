<script setup lang="ts">
  import { computed } from "vue";
  import { ApprovalActionProps } from "@/types";
  import { APPROVAL_ACTION_STATUS_HELPER, APPROVAL_ACTION_TYPE_HELPER } from "@/constants";

  interface Props {
    actions: ApprovalActionProps[];
  }

  const props = defineProps<Props>();

  const getTimelineType = (action: ApprovalActionProps) => {
    if (APPROVAL_ACTION_STATUS_HELPER.isPending(action.status)) return "";
    if (APPROVAL_ACTION_STATUS_HELPER.isSkipped(action.status)) return "info";
    if (APPROVAL_ACTION_TYPE_HELPER.isApprove(action.action)) return "success";
    if (APPROVAL_ACTION_TYPE_HELPER.isReject(action.action)) return "danger";
    return "";
  };

  const getTimelineIcon = (action: ApprovalActionProps) => {
    if (APPROVAL_ACTION_STATUS_HELPER.isPending(action.status)) return "ep:clock";
    if (APPROVAL_ACTION_STATUS_HELPER.isSkipped(action.status)) return "ep:minus";
    if (APPROVAL_ACTION_TYPE_HELPER.isApprove(action.action)) return "ep:success-filled";
    if (APPROVAL_ACTION_TYPE_HELPER.isReject(action.action)) return "ep:circle-close-filled";
    return "ep:clock";
  };

  const getDotClass = (action: ApprovalActionProps) => {
    if (APPROVAL_ACTION_STATUS_HELPER.isPending(action.status)) return "at-dot--pending";
    if (APPROVAL_ACTION_STATUS_HELPER.isSkipped(action.status)) return "at-dot--skipped";
    if (APPROVAL_ACTION_TYPE_HELPER.isApprove(action.action)) return "at-dot--success";
    if (APPROVAL_ACTION_TYPE_HELPER.isReject(action.action)) return "at-dot--danger";
    return "at-dot--pending";
  };

  const sortedActions = computed(() => {
    return [...props.actions].sort((a, b) => a.nodeOrder - b.nodeOrder);
  });

  const isEmpty = computed(() => !props.actions || props.actions.length === 0);
</script>

<template>
  <div class="at">
    <el-empty v-if="isEmpty" description="暂无审批记录" :image-size="80" />

    <el-timeline v-else>
      <el-timeline-item
        v-for="action in sortedActions"
        :key="action.id.toString()"
        :type="getTimelineType(action)"
        :size="APPROVAL_ACTION_STATUS_HELPER.isPending(action.status) ? 'large' : 'normal'"
        :hollow="APPROVAL_ACTION_STATUS_HELPER.isPending(action.status)"
      >
        <template #dot>
          <div class="at-dot" :class="getDotClass(action)">
            <iconify-icon :icon="getTimelineIcon(action)" />
          </div>
        </template>

        <div class="at-card">
          <div class="at-card__head">
            <div class="at-card__head-left">
              <el-tag size="small" effect="plain">第{{ action.nodeOrder }}级</el-tag>
              <span class="at-card__name">{{ action.nodeName }}</span>
            </div>
            <el-tag :type="getTimelineType(action)" size="small" effect="light">
              {{ action.statusName }}
            </el-tag>
          </div>

          <div class="at-card__body">
            <div class="at-card__row">
              <span class="at-card__label">审批人</span>
              <span class="at-card__value">{{ action.approverName || "待分配" }}</span>
            </div>
            <div v-if="action.operateTime" class="at-card__row">
              <span class="at-card__label">操作时间</span>
              <span class="at-card__value">{{ action.operateTime }}</span>
            </div>
            <div v-if="action.action" class="at-card__row">
              <span class="at-card__label">审批结果</span>
              <el-tag :type="APPROVAL_ACTION_TYPE_HELPER.isApprove(action.action) ? 'success' : 'danger'" size="small">
                {{ action.actionName }}
              </el-tag>
            </div>
            <div v-if="action.remark" class="at-card__remark">
              <span class="at-card__label">审批意见</span>
              <div class="at-card__remark-text">{{ action.remark }}</div>
            </div>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
  $radius: 8px;
  $transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  .at {
    --at-bg: var(--el-bg-color);
    --at-bg-soft: var(--el-fill-color-lighter);
    --at-border: var(--el-border-color-lighter);
    --at-text: var(--el-text-color-primary);
    --at-text-2: var(--el-text-color-secondary);
  }

  /* ===== 时间线节点 ===== */
  .at-dot {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 15px;
    border: 2px solid;
    transition: all $transition;

    &--pending {
      background: var(--at-bg);
      border-color: var(--el-border-color);
      color: var(--at-text-2);
    }

    &--success {
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success);
      color: var(--el-color-success);
    }

    &--danger {
      background: var(--el-color-danger-light-9);
      border-color: var(--el-color-danger);
      color: var(--el-color-danger);
    }

    &--skipped {
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
      color: var(--at-text-2);
    }
  }

  /* ===== 内容卡片 ===== */
  .at-card {
    padding: 12px 14px;
    border-radius: $radius;
    border: 1px solid var(--at-border);
    background: var(--at-bg-soft);
    transition:
      border-color $transition,
      box-shadow $transition;

    &:hover {
      border-color: var(--el-border-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;

      &-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    &__name {
      font-weight: 500;
      color: var(--at-text);
      font-size: 14px;
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
    }

    &__row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__label {
      flex-shrink: 0;
      width: 56px;
      color: var(--at-text-2);
      font-size: 12px;
    }

    &__value {
      color: var(--at-text);
    }

    &__remark {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;

      &-text {
        padding: 8px 10px;
        border-radius: 6px;
        background: var(--el-fill-color-light);
        color: var(--at-text);
        line-height: 1.5;
        font-size: 13px;
      }
    }
  }

  /* ===== Element 覆盖 ===== */
  :deep(.el-timeline-item__wrapper) {
    padding-left: 24px;
  }

  :deep(.el-timeline-item__tail) {
    border-left: 2px solid var(--at-border);
  }
</style>
