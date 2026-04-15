<script setup lang="ts">
  /**
   * 通用审批面板组件
   * 嵌入业务详情页使用
   *
   * 使用示例：
   * <ApprovalPanel
   *   biz-type="TENANT_CHECKOUT"
   *   :biz-id="checkoutId"
   *   :biz-code="checkoutCode"
   *   :title="`退租审批 - ${tenantName}`"
   *   @status-change="handleStatusChange"
   * />
   */
  import { computed, onMounted, ref, watch } from "vue";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { Check, CircleCheck, CircleClose, Clock, Close, RefreshRight } from "@element-plus/icons-vue";
  import { checkNeedApproval, getApprovalInstance, handleApproval, submitApproval, withdrawApproval } from "@/api/approval";
  import { ApprovalActionVo, ApprovalInstanceVo } from "@/types"; // ==================== Props ====================

  // ==================== Props ====================
  interface Props {
    bizType: string;
    bizId: number;
    bizCode?: string;
    title?: string;
    showSubmit?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showSubmit: true
  });

  // ==================== Emits ====================
  const emit = defineEmits<{
    (e: "status-change", status: number): void;
    (e: "submitted", instanceId: string | number): void;
  }>();

  // ==================== 响应式数据 ====================
  const loading = ref(false);
  const instance = ref<ApprovalInstanceVo | null>(null);
  const needApprovalFlag = ref(false);
  const dialogVisible = ref(false);
  const handleForm = ref({
    action: 1,
    remark: ""
  });

  // ==================== 计算属性 ====================
  const statusConfig = computed(() => {
    const statusMap: Record<number, { label: string; type: string; icon: any }> = {
      0: { label: "待提交", type: "info", icon: Clock },
      1: { label: "审批中", type: "warning", icon: Clock },
      2: { label: "已通过", type: "success", icon: CircleCheck },
      3: { label: "已驳回", type: "danger", icon: CircleClose },
      4: { label: "已撤回", type: "info", icon: RefreshRight },
      5: { label: "已取消", type: "info", icon: Close }
    };
    return instance.value ? statusMap[instance.value.status] : statusMap[0];
  });

  const canApprove = computed(() => {
    if (!instance.value || instance.value.status !== 1) return false;
    return instance.value.actions?.some(a => a.status === 0);
  });

  const canWithdraw = computed(() => {
    if (!instance.value) return false;
    return instance.value.status === 1;
  });

  // ==================== 方法 ====================
  const loadApprovalInfo = async () => {
    if (!props.bizId) return;

    loading.value = true;
    try {
      const needRes = await checkNeedApproval({
        bizType: props.bizType
      });
      needApprovalFlag.value = needRes.data || false;

      if (!needApprovalFlag.value) return;

      const instanceRes = await getApprovalInstance(props.bizType, props.bizId);
      instance.value = instanceRes.data || null;
    } catch (error) {
      console.error("加载审批信息失败", error);
    } finally {
      loading.value = false;
    }
  };

  const doSubmitApproval = async () => {
    try {
      await ElMessageBox.confirm("确定要提交审批吗？", "提示", { type: "info" });

      const res = await submitApproval({
        bizType: props.bizType,
        bizId: props.bizId,
        bizCode: props.bizCode,
        title: props.title
      });

      if (res.code === 0) {
        ElMessage.success("提交成功");
        loadApprovalInfo();
        emit("status-change", 1);
        emit("submitted", res.data);
      } else {
        ElMessage.error(res.message || "提交失败");
      }
    } catch {
      // 取消
    }
  };

  const openHandleDialog = (action: number) => {
    handleForm.value = { action, remark: "" };
    dialogVisible.value = true;
  };

  const doHandleApproval = async () => {
    if (handleForm.value.action === 2 && !handleForm.value.remark) {
      ElMessage.warning("驳回时请填写审批意见");
      return;
    }

    try {
      const res = await handleApproval({
        instanceId: instance.value!.id,
        action: handleForm.value.action,
        remark: handleForm.value.remark
      });

      if (res.code === 0) {
        ElMessage.success(handleForm.value.action === 1 ? "审批通过" : "已驳回");
        dialogVisible.value = false;
        loadApprovalInfo();

        const newStatus = handleForm.value.action === 1 ? 2 : 3;
        emit("status-change", newStatus);
      } else {
        ElMessage.error(res.message || "操作失败");
      }
    } catch (error) {
      ElMessage.error("操作失败");
    }
  };

  const doWithdrawApproval = async () => {
    try {
      await ElMessageBox.confirm("确定要撤回审批吗？", "提示", { type: "warning" });

      const res = await withdrawApproval(Number(instance.value!.id));

      if (res.code === 0) {
        ElMessage.success("已撤回");
        loadApprovalInfo();
        emit("status-change", 4);
      } else {
        ElMessage.error(res.message || "撤回失败");
      }
    } catch {
      // 取消
    }
  };

  const getActionStatus = (action: ApprovalActionVo) => {
    if (action.status === 0) return { type: "info", text: "待审批" };
    if (action.status === 2) return { type: "info", text: "已跳过" };
    if (action.action === 1) return { type: "success", text: "已通过" };
    if (action.action === 2) return { type: "danger", text: "已驳回" };
    return { type: "info", text: "未知" };
  };

  onMounted(() => {
    loadApprovalInfo();
  });

  watch(
    () => props.bizId,
    () => {
      if (props.bizId) {
        loadApprovalInfo();
      }
    }
  );
</script>

<template>
  <div class="approval-panel" v-loading="loading">
    <template v-if="needApprovalFlag">
      <el-card class="approval-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>审批信息</span>
            <el-tag :type="statusConfig.type as any" effect="dark">
              <el-icon class="status-icon"><component :is="statusConfig.icon" /></el-icon>
              {{ statusConfig.label }}
            </el-tag>
          </div>
        </template>

        <!-- 未提交状态 -->
        <div v-if="!instance || instance.status === 0" class="no-instance">
          <el-empty description="暂未提交审批" :image-size="60">
            <el-button v-if="showSubmit" type="primary" @click="doSubmitApproval">提交审批</el-button>
          </el-empty>
        </div>

        <!-- 已提交状态 -->
        <template v-else>
          <div class="instance-info">
            <el-descriptions :column="2" size="small">
              <el-descriptions-item label="审批单号">
                {{ instance.instanceNo }}
              </el-descriptions-item>
              <el-descriptions-item label="申请人">
                {{ instance.applicantName }}
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">
                {{ instance.createAt }}
              </el-descriptions-item>
              <el-descriptions-item v-if="instance.finishAt" label="完成时间">
                {{ instance.finishAt }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 审批流程时间线 -->
          <el-timeline class="approval-timeline">
            <el-timeline-item v-for="action in instance.actions" :key="action.id" :type="getActionStatus(action).type as any" :hollow="action.status === 0">
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="node-name">{{ action.nodeName }}</span>
                  <el-tag size="small" :type="getActionStatus(action).type as any">
                    {{ getActionStatus(action).text }}
                  </el-tag>
                </div>
                <div class="timeline-body">
                  <span class="approver">审批人：{{ action.approverName }}</span>
                  <span v-if="action.operateAt" class="time">
                    {{ action.operateAt }}
                  </span>
                </div>
                <div v-if="action.remark" class="timeline-remark">意见：{{ action.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>

          <!-- 操作按钮 -->
          <div class="action-buttons" v-if="instance.status === 1">
            <template v-if="canApprove">
              <el-button type="success" :icon="Check" @click="openHandleDialog(1)">通过</el-button>
              <el-button type="danger" :icon="Close" @click="openHandleDialog(2)">驳回</el-button>
            </template>
            <el-button v-if="canWithdraw" plain @click="doWithdrawApproval">撤回</el-button>
          </div>

          <!-- 最终审批意见 -->
          <div v-if="instance.resultRemark && instance.status !== 1" class="result-remark">
            <el-alert
              :title="instance.status === 2 ? '审批通过' : '审批意见'"
              :type="instance.status === 2 ? 'success' : 'error'"
              :description="instance.resultRemark"
              :closable="false"
              show-icon
            />
          </div>
        </template>
      </el-card>
    </template>

    <!-- 审批弹窗 -->
    <el-dialog v-model="dialogVisible" :title="handleForm.action === 1 ? '审批通过' : '审批驳回'" width="500px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="审批意见" :required="handleForm.action === 2">
          <el-input v-model="handleForm.remark" type="textarea" :rows="4" :placeholder="handleForm.action === 1 ? '请输入审批意见（选填）' : '请输入驳回原因（必填）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :type="handleForm.action === 1 ? 'success' : 'danger'" @click="doHandleApproval">确定{{ handleForm.action === 1 ? "通过" : "驳回" }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
  .approval-panel {
    .approval-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .status-icon {
          margin-right: 4px;
        }
      }

      .no-instance {
        padding: 20px 0;
      }

      .instance-info {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px dashed var(--el-border-color-light);
      }

      .approval-timeline {
        padding-left: 4px;

        .timeline-content {
          .timeline-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .node-name {
              font-weight: 500;
            }
          }

          .timeline-body {
            display: flex;
            gap: 16px;
            color: var(--el-text-color-secondary);
            font-size: 13px;
          }

          .timeline-remark {
            margin-top: 4px;
            color: var(--el-text-color-regular);
            font-size: 13px;
            background: var(--el-fill-color-light);
            padding: 8px 12px;
            border-radius: 4px;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px dashed var(--el-border-color-light);
      }

      .result-remark {
        margin-top: 16px;
      }
    }
  }
</style>
