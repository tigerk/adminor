<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { ElMessage } from "element-plus";
  import ApprovalTimeline from "./components/ApprovalTimeline.vue";
  import ApprovalDialog from "./components/ApprovalDialog.vue";
  import { getApprovalInstanceDetail } from "@/api/approval";
  import { Refresh, View } from "@element-plus/icons-vue";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks"; // 导入各业务模块的 hook
  import useTenant from "@/views/contract/tenant/utils/hook";
  import { ApprovalInstanceProps } from "@/types";

  interface Props {
    instanceId: number;
    from?: string; // todo/done/apply
  }

  const props = defineProps<Props>();

  const loading = ref(false);
  const detail = ref<ApprovalInstanceProps>(null);
  const approvalDialogVisible = ref(false);

  // 导入业务模块的查看方法
  const { openTenantViewDialog } = useTenant();
  // const { openCheckoutViewDialog } = useTenantCheckout();
  // const { openHouseViewDialog } = useHouse();

  // 是否可以审批（从待办进入且状态为审批中）
  const canApprove = computed(() => {
    return props.from === "todo" && detail.value?.status === 1;
  });

  // 状态标签类型
  const statusTagType = computed(() => {
    const statusMap = {
      0: "info", // 待提交
      1: "warning", // 审批中
      2: "success", // 已通过
      3: "danger", // 已驳回
      4: "info", // 已撤回
      5: "info" // 已取消
    };
    return statusMap[detail.value?.status] || "info";
  });

  // 获取审批详情
  const fetchDetail = async () => {
    loading.value = true;
    try {
      const { data } = await getApprovalInstanceDetail(props.instanceId);
      detail.value = data;
    } finally {
      loading.value = false;
    }
  };

  // 刷新详情
  const handleRefresh = () => {
    fetchDetail();
  };

  // 查看业务详情（打开现有的业务详情弹窗）
  const handleViewBusinessDetail = () => {
    if (!detail.value) return;

    const { bizType, bizId } = detail.value;

    switch (bizType) {
      case "TENANT_CHECKIN":
        // 调用租客入住的查看弹窗
        openTenantViewDialog("查看", { id: bizId, tenantName: "" }, { readonly: true });
        break;

      case "TENANT_CHECKOUT":
        // 调用退租的查看弹窗
        // openCheckoutViewDialog("查看", { id: bizId }, { readonly: true });
        ElMessage.warning("退租详情功能开发中");
        break;

      case "HOUSE_CREATE":
        // 调用房源的查看弹窗
        // openHouseViewDialog("查看", { id: bizId }, { readonly: true });
        ElMessage.warning("房源详情功能开发中");
        break;

      case "CONTRACT_SIGN":
        // 调用合同的查看弹窗
        ElMessage.warning("合同详情功能开发中");
        break;

      default:
        ElMessage.warning("暂不支持该业务类型的详情查看");
    }
  };

  // 打开审批弹窗
  const handleApprove = () => {
    approvalDialogVisible.value = true;
  };

  // 审批成功回调
  const handleApprovalSuccess = () => {
    approvalDialogVisible.value = false;
    fetchDetail(); // 刷新详情
  };

  const displayRoomList = computed(() => {
    return detail.value?.tenantDetail?.roomList?.map(item => item?.houseName + "【" + item?.roomNumber + "】").join(", ") || "-";
  });

  onMounted(() => {
    if (!props.instanceId) {
      ElMessage.error("缺少审批实例ID");
      return;
    }
    fetchDetail();
  });
</script>

<template>
  <div v-loading="loading" class="approval-detail-dialog">
    <!-- 顶部操作栏 -->
    <div class="detail-actions">
      <div class="actions-left">
        <el-tag :type="statusTagType" size="large">
          {{ detail?.statusName }}
        </el-tag>
      </div>
      <div class="actions-right">
        <el-button :icon="useRenderIcon(Refresh)" circle @click="handleRefresh" />
        <el-button v-if="canApprove" type="primary" @click="handleApprove">立即审批</el-button>
      </div>
    </div>

    <div class="detail-content">
      <!-- 审批信息 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">审批信息</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审批单号">
            {{ detail?.instanceNo }}
          </el-descriptions-item>
          <el-descriptions-item label="业务类型">
            <el-tag>{{ detail?.bizTypeName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ detail?.applicantName }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ detail?.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="当前节点">
            <el-tag v-if="detail?.currentNodeName" type="warning">
              {{ detail?.currentNodeName }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ detail?.finishTime || "-" }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail?.resultRemark" label="最终意见" :span="2">
            <div class="result-remark">{{ detail?.resultRemark }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 关联业务 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">关联业务</span>
          <el-button type="primary" :icon="useRenderIcon(View)" size="small" @click="handleViewBusinessDetail">查看业务详情</el-button>
        </div>

        <div v-if="detail?.bizType === 'TENANT_CHECKIN'" class="business-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="租客姓名">
              {{ detail?.tenantDetail?.tenantName }}
            </el-descriptions-item>
            <el-descriptions-item label="租客手机号">
              {{ detail?.tenantDetail?.tenantPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="房间信息" :span="4">
              {{ displayRoomList }}
            </el-descriptions-item>
            <el-descriptions-item label="合同周期">
              <el-space :size="8">
                <el-tag type="primary">{{ detail?.tenantDetail?.leaseStart }}</el-tag>
                <span>至</span>
                <el-tag type="primary">{{ detail?.tenantDetail?.leaseEnd }}</el-tag>
              </el-space>
            </el-descriptions-item>
            <el-descriptions-item label="月租金">
              <span class="rent-price">¥ {{ detail?.tenantDetail?.rentPrice }}</span>
              <span class="rent-unit">元/月</span>
            </el-descriptions-item>

            <el-descriptions-item label="押付方式">
              <span class="text-value">押 {{ detail?.tenantDetail?.depositMonths }} 付 {{ detail?.tenantDetail?.paymentMonths }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 审批记录 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">审批记录</span>
        </div>
        <ApprovalTimeline :actions="detail?.actions || []" />
      </div>
    </div>

    <!-- 审批操作弹窗 -->
    <ApprovalDialog v-model:visible="approvalDialogVisible" :instance-id="instanceId" @success="handleApprovalSuccess" />
  </div>
</template>

<style scoped lang="scss">
  .approval-detail-dialog {
    .detail-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .actions-left {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .actions-right {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }

    .detail-content {
      .section {
        margin-bottom: 28px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &::before {
          display: inline-block;
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: var(--el-color-primary);
          border-radius: 2px;
          content: "";
          vertical-align: middle;
        }
      }

      .result-remark {
        padding: 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 4px;
        color: var(--el-text-color-regular);
        white-space: pre-wrap;
        word-break: break-all;
        line-height: 1.6;
      }

      .business-info {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .label {
          color: var(--el-text-color-secondary);
          margin-right: 8px;
        }

        .value {
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }
  }
</style>
