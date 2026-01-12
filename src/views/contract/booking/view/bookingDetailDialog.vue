<template>
  <div class="booking-detail-view">
    <!-- 状态标签 -->
    <div class="status-banner">
      <el-tag
        :type="getStatusType(formInline.bookingStatus)"
        size="large"
        effect="dark"
      >
        {{ formInline.bookingStatusName }}
      </el-tag>
    </div>

    <!-- 基本信息 -->
    <div class="info-section">
      <el-descriptions title="预定信息" :column="2" border>
        <el-descriptions-item label="预定状态">
          <el-tag :type="getStatusType(formInline.bookingStatus)">
            {{ formInline.bookingStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预定金额">
          <span class="amount-text">¥{{ formInline.bookingAmount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="意向租金">
          <span class="amount-text">¥{{ formInline.expectedRentPrice }}/月</span>
        </el-descriptions-item>
        <el-descriptions-item label="预定时间">
          {{ formatDateTime(formInline.bookingTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="到期时间">
          <span :class="{ 'expired-text': isExpired }">
            {{ formatDateTime(formInline.expiryTime) }}
            <el-tag v-if="isExpired" type="danger" size="small" class="ml-2">已过期</el-tag>
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 租客信息 -->
    <div class="info-section">
      <el-descriptions title="租客信息" :column="2" border>
        <el-descriptions-item label="租客类型">
          <el-tag :type="formInline.tenantType === 0 ? 'success' : 'warning'">
            {{ formInline.tenantType === 0 ? "个人" : "企业" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="租客姓名">
          {{ formInline.tenantName }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ formInline.tenantPhone }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 租期信息 -->
    <div class="info-section">
      <el-descriptions title="预计租期信息" :column="2" border>
        <el-descriptions-item label="租赁开始时间">
          {{ formatDate(formInline.expectedLeaseStart) }}
        </el-descriptions-item>
        <el-descriptions-item label="租赁结束时间">
          {{ formatDate(formInline.expectedLeaseEnd) }}
        </el-descriptions-item>
        <el-descriptions-item label="租期时长" :span="2">
          <el-tag type="info">
            {{ calculateDuration(formInline.expectedLeaseStart, formInline.expectedLeaseEnd) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 房间信息 -->
    <div class="info-section">
      <div class="section-header">
        <span class="section-title">房间信息</span>
        <el-tag type="info" size="small">共 {{ formInline.roomIds?.length || 0 }} 间</el-tag>
      </div>
      <div class="room-tags">
        <el-tag
          v-for="(roomId, index) in formInline.roomIds"
          :key="index"
          type="primary"
          size="large"
          effect="light"
          class="room-tag"
        >
          房间ID: {{ roomId }}
        </el-tag>
      </div>
    </div>

    <!-- 备注信息 -->
    <div v-if="formInline.remark" class="info-section">
      <el-descriptions title="备注信息" :column="1" border>
        <el-descriptions-item label="备注">
          {{ formInline.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 时间信息 -->
    <div class="info-section">
      <el-descriptions title="操作记录" :column="2" border>
        <el-descriptions-item label="创建人">
          {{ formInline.createBy }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(formInline.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="formInline.updateBy" label="修改人">
          {{ formInline.updateBy }}
        </el-descriptions-item>
        <el-descriptions-item v-if="formInline.updateTime" label="修改时间">
          {{ formatDateTime(formInline.updateTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BookingListProps } from "@/types";

interface FormProps {
  formInline: BookingListProps;
}

const props = defineProps<FormProps>();

// 判断是否过期
const isExpired = computed(() => {
  return new Date(props.formInline.expiryTime) < new Date();
});

// 格式化日期时间
const formatDateTime = (dateTime: Date | string) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

// 格式化日期
const formatDate = (date: Date | string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

// 计算租期时长
const calculateDuration = (start: Date | string, end: Date | string) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (months > 0) {
    return `${months}个月${remainingDays > 0 ? ` ${remainingDays}天` : ""}`;
  }
  return `${days}天`;
};

// 获取状态类型
const getStatusType = (status: number) => {
  const typeMap: Record<number, string> = {
    1: "primary",  // 预定中
    2: "success",  // 已转合同
    3: "danger",   // 客户违约
    4: "warning",  // 业主违约
    5: "info"      // 已取消/过期
  };
  return typeMap[status] || "info";
};
</script>

<style scoped lang="scss">
.booking-detail-view {
  padding: 20px;

  .status-banner {
    margin-bottom: 24px;
    text-align: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .info-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e4e7ed;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .room-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .room-tag {
        padding: 10px 16px;
        font-size: 14px;
      }
    }
  }

  .amount-text {
    color: #f56c6c;
    font-weight: 600;
    font-size: 16px;
  }

  .expired-text {
    color: #f56c6c;
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: 500;
      color: #606266;
      background: #fafafa;
    }

    .el-descriptions__content {
      color: #303133;
    }
  }
}
</style>
