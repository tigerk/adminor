<template>
  <div class="booking-detail-container p-1 bg-gray-50/50">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-5 gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-md">
          {{ formInline.tenantName?.charAt(0) || "租" }}
        </div>
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h2 class="text-xl font-bold text-gray-800 m-0">{{ formInline.tenantName }}</h2>
            <el-tag effect="light" round size="small" :type="formInline.tenantType === 0 ? 'success' : 'warning'">
              {{ formInline.tenantType === 0 ? "个人" : "企业" }}
            </el-tag>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span class="flex items-center gap-1">
              <el-icon><Iphone /></el-icon>
              {{ formInline.tenantPhone }}
            </span>
          </div>
        </div>
      </div>
      <div class="text-right flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1">
        <span class="text-xs text-gray-400 uppercase tracking-wider font-semibold">当前状态</span>
        <el-tag :type="getStatusType(formInline.bookingStatus)" effect="dark" class="px-5 !rounded-lg !h-8 text-sm">
          {{ formInline.bookingStatusName }}
        </el-tag>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-5">
        <el-card shadow="never" class="!rounded-xl !border-gray-100">
          <template #header>
            <div class="flex items-center gap-2 font-bold text-gray-700">
              <el-icon class="text-blue-500"><Wallet /></el-icon>
              <span>预定信息</span>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-y-6 py-2">
            <div>
              <div class="text-xs text-gray-400 mb-1">预定定金</div>
              <div class="text-2xl font-bold text-red-500">¥{{ formInline.bookingAmount }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400 mb-1">意向月租金</div>
              <div class="text-2xl font-semibold text-blue-600">
                ¥{{ formInline.expectedRentPrice }}
                <span class="text-sm font-normal text-gray-400 ml-1">/月</span>
              </div>
            </div>
            <div class="border-t border-gray-50 pt-4">
              <div class="text-xs text-gray-400 mb-1">预定发起时间</div>
              <div class="text-sm text-gray-700 font-medium">{{ formatDateTime(formInline.bookingTime) }}</div>
            </div>
            <div class="border-t border-gray-50 pt-4">
              <div class="text-xs text-gray-400 mb-1">最晚签约日期</div>
              <div class="flex items-center gap-2">
                <span :class="['text-sm font-medium', isExpired ? 'text-red-500' : 'text-gray-700']">
                  {{ formatDateTime(formInline.expiryTime) }}
                </span>
                <span v-if="isExpired" class="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded border border-red-100">已过期</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="!rounded-xl !border-gray-100">
          <template #header>
            <div class="flex items-center gap-2 font-bold text-gray-700">
              <el-icon class="text-indigo-500"><Calendar /></el-icon>
              <span>租期规划</span>
            </div>
          </template>
          <div class="flex items-center justify-between px-10 py-6 bg-gray-50/50 rounded-lg relative overflow-hidden">
            <div class="absolute h-1 bg-gray-200 left-20 right-20 top-1/2 -translate-y-1/2 z-0" />

            <div class="relative z-10 flex flex-col items-center bg-gray-50 p-2">
              <div class="w-3 h-3 bg-indigo-500 rounded-full mb-2 ring-4 ring-indigo-100" />
              <div class="text-xs text-gray-400">预计入驻</div>
              <div class="text-sm font-bold text-gray-700">{{ formatDate(formInline.expectedLeaseStart) }}</div>
            </div>

            <div class="relative z-10">
              <el-tag round effect="dark" type="info" class="!bg-gray-800 !border-none !px-4">
                {{ calculateDuration(formInline.expectedLeaseStart, formInline.expectedLeaseEnd) }}
              </el-tag>
            </div>

            <div class="relative z-10 flex flex-col items-center bg-gray-50 p-2">
              <div class="w-3 h-3 bg-gray-400 rounded-full mb-2 ring-4 ring-gray-100" />
              <div class="text-xs text-gray-400">预计退租</div>
              <div class="text-sm font-bold text-gray-700">{{ formatDate(formInline.expectedLeaseEnd) }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="space-y-5">
        <el-card shadow="never" class="!rounded-xl !border-gray-100">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2 font-bold text-gray-700">
                <el-icon class="text-green-500"><House /></el-icon>
                <span>预定房间</span>
              </div>
              <span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{{ formInline.roomIds?.length || 0 }} 间</span>
            </div>
          </template>
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="room in formInline.roomList"
              :key="index"
              class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all cursor-default"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded text-blue-500">
                  <el-icon><OfficeBuilding /></el-icon>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ room.communityName }} {{ room.doorNumber }}-{{ room.roomNumber }}</span>
                <span>{{ room.price ? room.price + "元/月" : "未设置" }}</span>
              </div>
              <el-icon class="text-gray-300"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="!rounded-xl !border-gray-100 bg-amber-50/30">
          <template #header>
            <div class="flex items-center gap-2 font-bold text-gray-700">
              <el-icon class="text-amber-500"><Memo /></el-icon>
              <span>备注信息</span>
            </div>
          </template>
          <div class="text-sm text-amber-900/80 leading-relaxed italic">
            {{ formInline.remark || "暂无备注信息" }}
          </div>
        </el-card>

        <div class="p-4 bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-400">录入人员</span>
              <span class="text-gray-600 font-medium">{{ formInline.salesmanName }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-400">录入时间</span>
              <span class="text-gray-600 font-medium">{{ formatDateTime(formInline.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { ArrowRight, Calendar, House, Iphone, Memo, OfficeBuilding, Wallet } from "@element-plus/icons-vue";
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
      1: "primary", // 预定中
      2: "success", // 已转合同
      3: "danger", // 客户违约
      4: "warning", // 业主违约
      5: "info" // 已取消/过期
    };
    return typeMap[status] || "info";
  };
</script>

<style scoped lang="scss">
  /* 使用 Tailwind 后，这里的 CSS 只需要处理 Element 内部无法通过 class 覆盖的样式 */
  :deep(.el-card) {
    .el-card__header {
      @apply border-b border-gray-50 px-5 py-4;
    }
  }
</style>
