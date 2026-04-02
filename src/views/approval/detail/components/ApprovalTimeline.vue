<script setup lang="ts">
  import { computed } from "vue";
  import { ChatLineSquare, Check, Clock, Close, Document, DocumentDelete, Minus, User } from "@element-plus/icons-vue";
  import type { ApprovalActionVo } from "@/types";
  import { APPROVAL_ACTION_STATUS_META_HELPER, APPROVAL_ACTION_TYPE_META_HELPER } from "@/constants";

  // ====== Types ======

  interface GroupedNode {
    nodeOrder: number;
    nodeName: string;
    actions: ApprovalActionVo[];
    isOrSign: boolean;
    status: "done" | "reject" | "active" | "wait";
  }

  defineOptions({ name: "ApprovalTimeline" });

  interface Props {
    actions: ApprovalActionVo[];
  }

  const props = defineProps<Props>();

  // ====== Computed ======

  /** 获取分组状态 */
  const getGroupStatus = (actions: ApprovalActionVo[]): "done" | "reject" | "active" | "wait" => {
    if (actions.some(a => APPROVAL_ACTION_TYPE_META_HELPER.isApprove(a.action))) {
      return "done";
    }
    if (actions.some(a => APPROVAL_ACTION_TYPE_META_HELPER.isReject(a.action))) {
      return "reject";
    }
    if (actions.every(a => APPROVAL_ACTION_STATUS_META_HELPER.isSkipped(a.status))) {
      return "wait";
    }
    if (actions.some(a => APPROVAL_ACTION_STATUS_META_HELPER.isPending(a.status))) {
      return "active";
    }
    return "wait";
  };

  /** 将 actions 按 nodeOrder 分组 */
  const groupedNodes = computed<GroupedNode[]>(() => {
    if (!props.actions?.length) return [];

    const groups = new Map<number, ApprovalActionVo[]>();

    for (const action of props.actions) {
      const order = Number(action.nodeOrder);
      if (!groups.has(order)) {
        groups.set(order, []);
      }
      groups.get(order)!.push(action);
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([nodeOrder, actions]) => ({
        nodeOrder,
        nodeName: actions[0].nodeName,
        actions,
        isOrSign: actions.length > 1,
        status: getGroupStatus(actions)
      }));
  });

  const completedCount = computed(() => groupedNodes.value.filter(n => n.status === "done" || n.status === "reject").length);

  const activeNodeIndex = computed(() => groupedNodes.value.findIndex(n => n.status === "active"));

  const progressPercent = computed(() => {
    if (!groupedNodes.value.length) return 0;
    return Math.round((completedCount.value / groupedNodes.value.length) * 100);
  });

  /** 获取单个审批人的状态 */
  const getActionStatus = (action: ApprovalActionVo) => {
    if (APPROVAL_ACTION_STATUS_META_HELPER.isPending(action.status)) return "active";
    if (APPROVAL_ACTION_STATUS_META_HELPER.isSkipped(action.status)) return "wait";
    if (APPROVAL_ACTION_TYPE_META_HELPER.isApprove(action.action)) return "done";
    if (APPROVAL_ACTION_TYPE_META_HELPER.isReject(action.action)) return "reject";
    return "active";
  };

  const getTagClass = (s: string) =>
    ({
      done: "ad-tag--green",
      reject: "ad-tag--red",
      active: "ad-tag--amber",
      wait: "ad-tag--gray"
    })[s] || "ad-tag--gray";
</script>

<template>
  <section class="ad-sec">
    <div class="ad-sec__hd">
      <el-icon :size="14"><Document /></el-icon>
      <span class="ad-sec__label">审批流程</span>
      <span v-if="groupedNodes.length" class="ad-sec__badge">{{ completedCount }}/{{ groupedNodes.length }}</span>
    </div>

    <div v-if="groupedNodes.length" class="ad-bar">
      <div class="ad-bar__fill" :style="{ width: progressPercent + '%' }" />
    </div>

    <div v-if="!groupedNodes.length" class="ad-tl-empty">
      <el-icon :size="28"><DocumentDelete /></el-icon>
      <span>暂无审批记录</span>
    </div>

    <div v-else class="ad-tl">
      <div v-for="(node, idx) in groupedNodes" :key="node.nodeOrder" class="ad-tl__node" :data-s="node.status" :class="{ 'is-active': idx === activeNodeIndex }">
        <div class="ad-tl__rail">
          <span class="ad-tl__dot">
            <el-icon v-if="node.status === 'done'" :size="13"><Check /></el-icon>
            <el-icon v-else-if="node.status === 'reject'" :size="13"><Close /></el-icon>
            <el-icon v-else-if="node.status === 'wait'" :size="13"><Minus /></el-icon>
            <span v-else class="ad-tl__num">{{ idx + 1 }}</span>
          </span>
          <span v-if="idx < groupedNodes.length - 1" class="ad-tl__line" />
        </div>

        <div class="ad-tl__body">
          <div class="ad-tl__head">
            <span class="ad-tl__name">{{ node.nodeName }}</span>
            <span v-if="node.isOrSign" class="ad-tag ad-tag--blue">或签</span>
            <span class="ad-tag" :class="getTagClass(node.status)">
              {{ node.status === "done" ? "已通过" : node.status === "reject" ? "已驳回" : node.status === "active" ? "审批中" : "待审批" }}
            </span>
          </div>

          <!-- 审批人列表 -->
          <div class="ad-tl__approvers">
            <div v-for="act in node.actions" :key="act.id.toString()" class="ad-tl__approver" :data-s="getActionStatus(act)">
              <div class="ad-tl__approver-main">
                <span class="ad-tl__approver-avatar">
                  <el-icon :size="12"><User /></el-icon>
                </span>
                <span class="ad-tl__approver-name">
                  {{ act.approverName || "待分配" }}
                </span>
                <span class="ad-tl__approver-status" :class="getTagClass(getActionStatus(act))">
                  {{ act.statusName }}
                </span>
              </div>
              <div v-if="act.operateTime" class="ad-tl__approver-time">
                <el-icon :size="11"><Clock /></el-icon>
                {{ act.operateTime }}
              </div>
              <div v-if="act.remark" class="ad-tl__approver-remark">
                <el-icon :size="11"><ChatLineSquare /></el-icon>
                <span>{{ act.remark }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
  /* =============================================
   Tokens — 继承父组件 CSS 变量
   ============================================= */
  .ad-sec {
    --c-green: var(--el-color-success);
    --c-green-dim: var(--el-color-success-light-9);
    --c-red: var(--el-color-danger);
    --c-red-dim: var(--el-color-danger-light-9);
    --c-amber: var(--el-color-warning);
    --c-amber-dim: var(--el-color-warning-light-9);
    --c-blue: var(--el-color-primary);
    --c-blue-dim: var(--el-color-primary-light-9);

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

  .ad-sec__badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 99px;
    background: var(--c-green-dim);
    color: var(--c-green);
  }

  /* =============================================
   Progress Bar
   ============================================= */
  .ad-bar {
    height: 3px;
    border-radius: 2px;
    background: var(--el-fill-color);
    margin-bottom: 14px;
    overflow: hidden;

    &__fill {
      height: 100%;
      border-radius: 2px;
      background: var(--c-green);
      transition: width 0.4s ease;
    }
  }

  /* =============================================
   Tags
   ============================================= */
  .ad-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 600;

    &--amber {
      background: var(--c-amber-dim);
      color: var(--c-amber);
    }
    &--green {
      background: var(--c-green-dim);
      color: var(--c-green);
    }
    &--red {
      background: var(--c-red-dim);
      color: var(--c-red);
    }
    &--gray {
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
    }
    &--blue {
      background: var(--c-blue-dim);
      color: var(--c-blue);
    }
  }

  /* =============================================
   Timeline Empty
   ============================================= */
  .ad-tl-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 0;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  /* =============================================
   Timeline
   ============================================= */
  .ad-tl {
    display: flex;
    flex-direction: column;
  }

  .ad-tl__node {
    display: flex;
    gap: 14px;
    &:last-child .ad-tl__line {
      display: none;
    }
    &.is-active .ad-tl__dot {
      animation: ad-pulse 2.5s ease-in-out infinite;
    }
  }

  .ad-tl__rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 28px;
    flex-shrink: 0;
  }

  .ad-tl__dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 800;
    z-index: 1;
    transition: all 0.2s;
    border: 2px solid var(--el-fill-color);
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-placeholder);
  }

  .ad-tl__num {
    font-size: 11px;
  }

  .ad-tl__line {
    flex: 1;
    width: 2px;
    min-height: 10px;
    margin: 3px 0;
    background: var(--el-fill-color);
    transition: background 0.2s;
  }

  .ad-tl__node[data-s="done"] {
    .ad-tl__dot {
      border-color: var(--c-green);
      background: var(--c-green);
      color: #fff;
    }
    .ad-tl__line {
      background: var(--c-green);
      opacity: 0.25;
    }
  }
  .ad-tl__node[data-s="reject"] .ad-tl__dot {
    border-color: var(--c-red);
    background: var(--c-red);
    color: #fff;
  }
  .ad-tl__node[data-s="active"] .ad-tl__dot {
    border-color: var(--c-amber);
    background: var(--c-amber-dim);
    color: var(--c-amber);
  }
  .ad-tl__node[data-s="wait"] {
    .ad-tl__dot {
      border-style: dashed;
      border-color: var(--el-text-color-placeholder);
    }
    .ad-tl__line {
      border-left: 2px dashed var(--el-border-color-lighter);
      background: transparent;
      width: 0;
    }
  }

  .ad-tl__body {
    flex: 1;
    min-width: 0;
    padding-bottom: 16px;
  }

  .ad-tl__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .ad-tl__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* =============================================
   Approvers List
   ============================================= */
  .ad-tl__approvers {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ad-tl__approver {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    border-left: 3px solid var(--el-border-color);
    transition: all 0.15s;

    &[data-s="done"] {
      border-left-color: var(--c-green);
      background: var(--c-green-dim);
    }
    &[data-s="reject"] {
      border-left-color: var(--c-red);
      background: var(--c-red-dim);
    }
    &[data-s="active"] {
      border-left-color: var(--c-amber);
      background: var(--c-amber-dim);
    }
  }

  .ad-tl__approver-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ad-tl__approver-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--el-bg-color-overlay);
    display: grid;
    place-items: center;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  .ad-tl__approver-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex: 1;
  }

  .ad-tl__approver-status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .ad-tl__approver-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 6px;
    padding-left: 30px;

    .el-icon {
      opacity: 0.6;
    }
  }

  .ad-tl__approver-remark {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-top: 6px;
    padding: 6px 8px;
    margin-left: 30px;
    border-radius: 4px;
    background: var(--el-bg-color-overlay);
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
      opacity: 0.6;
    }
  }

  /* =============================================
   Animation
   ============================================= */
  @keyframes ad-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(var(--el-color-warning-rgb, 240, 180, 41), 0.25);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(var(--el-color-warning-rgb, 240, 180, 41), 0);
    }
  }
</style>
