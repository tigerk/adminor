<script setup lang="ts">
  import { computed } from "vue";
  import { Check, Clock, Close, Minus } from "@element-plus/icons-vue";

  interface ApprovalAction {
    id: number;
    nodeName: string;
    nodeOrder: number;
    approverId: number;
    approverName: string;
    action: number | null; // 1=通过, 2=驳回, null=待审批
    remark: string;
    operateTime: string;
    status: number; // 0=待审批, 1=已审批, 2=已跳过
    statusName: string;
    actionName: string;
  }

  interface Props {
    actions: ApprovalAction[];
  }

  const props = defineProps<Props>();

  // 获取时间线项的颜色
  const getTimelineColor = (action: ApprovalAction) => {
    if (action.status === 0) return ""; // 待审批 - 灰色
    if (action.status === 2) return "info"; // 已跳过
    if (action.action === 1) return "success"; // 通过
    if (action.action === 2) return "danger"; // 驳回
    return "";
  };

  // 获取图标
  const getTimelineIcon = (action: ApprovalAction) => {
    if (action.status === 0) return Clock; // 待审批
    if (action.status === 2) return Minus; // 已跳过
    if (action.action === 1) return Check; // 通过
    if (action.action === 2) return Close; // 驳回
    return Clock;
  };

  // 按节点顺序排序
  const sortedActions = computed(() => {
    return [...props.actions].sort((a, b) => a.nodeOrder - b.nodeOrder);
  });

  // 是否为空
  const isEmpty = computed(() => {
    return !props.actions || props.actions.length === 0;
  });
</script>

<template>
  <div class="approval-timeline">
    <el-empty v-if="isEmpty" description="暂无审批记录" :image-size="120" />

    <el-timeline v-else>
      <el-timeline-item
        v-for="action in sortedActions"
        :key="action.id"
        :type="getTimelineColor(action)"
        :icon="getTimelineIcon(action)"
        :size="action.status === 0 ? 'large' : 'normal'"
        :hollow="action.status === 0"
      >
        <div class="timeline-content">
          <!-- 节点头部 -->
          <div class="timeline-header">
            <div class="header-left">
              <span class="node-order">第{{ action.nodeOrder }}级</span>
              <span class="node-name">{{ action.nodeName }}</span>
            </div>
            <el-tag :type="getTimelineColor(action)" size="small" :effect="action.status === 0 ? 'plain' : 'light'">
              {{ action.statusName }}
            </el-tag>
          </div>

          <!-- 节点内容 -->
          <div class="timeline-body">
            <div class="info-row">
              <span class="label">审批人：</span>
              <span class="value">{{ action.approverName || "待分配" }}</span>
            </div>

            <div v-if="action.operateTime" class="info-row">
              <span class="label">操作时间：</span>
              <span class="value">{{ action.operateTime }}</span>
            </div>

            <div v-if="action.action" class="info-row">
              <span class="label">审批结果：</span>
              <el-tag :type="action.action === 1 ? 'success' : 'danger'" size="small">
                {{ action.actionName }}
              </el-tag>
            </div>

            <div v-if="action.remark" class="remark-row">
              <span class="label">审批意见：</span>
              <div class="remark-content">{{ action.remark }}</div>
            </div>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
  .approval-timeline {
    min-height: 200px;

    .timeline-content {
      padding-bottom: 8px;

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .header-left {
          display: flex;
          gap: 8px;
          align-items: center;

          .node-order {
            padding: 2px 8px;
            background-color: var(--el-fill-color);
            border-radius: 4px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .node-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }

      .timeline-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-left: 4px;

        .info-row {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 14px;
          line-height: 1.5;
        }

        .remark-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;

          .remark-content {
            padding: 12px;
            background-color: var(--el-fill-color-light);
            border-left: 3px solid var(--el-color-primary);
            border-radius: 4px;
            color: var(--el-text-color-regular);
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.6;
          }
        }

        .label {
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }

        .value {
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  // 自定义时间线样式
  :deep(.el-timeline-item__wrapper) {
    padding-left: 32px;
  }

  :deep(.el-timeline-item__node) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
