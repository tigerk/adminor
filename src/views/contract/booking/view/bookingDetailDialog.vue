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

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div class="lg:col-span-3 space-y-5">
        <el-card shadow="never" class="!rounded-xl !border-gray-100">
          <template #header>
            <div class="flex items-center gap-2 font-bold text-gray-700">
              <el-icon class="text-blue-500"><Wallet /></el-icon>
              <span>预定信息</span>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-8 py-2">
            <div class="space-y-6">
              <div>
                <div class="text-xs text-gray-400 mb-1">预定定金</div>
                <div class="text-3xl font-bold text-red-500">¥{{ formInline.bookingAmount }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-400 mb-1">预定发起时间</div>
                <div class="text-sm text-gray-700 font-medium">{{ formatDateTime(formInline.bookingTime) }}</div>
              </div>
            </div>
            <div class="space-y-6">
              <div>
                <div class="text-xs text-gray-400 mb-1">意向月租金</div>
                <div class="text-3xl font-semibold text-blue-600">
                  ¥{{ formInline.expectedRentPrice }}
                  <span class="text-sm font-normal text-gray-400">/月</span>
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-400 mb-1">最晚签约日期</div>
                <div class="flex items-center gap-2">
                  <span :class="['text-sm font-medium', isExpired ? 'text-red-500' : 'text-gray-700']">
                    {{ formatDateTime(formInline.expiryTime) }}
                  </span>
                  <span v-if="isExpired" class="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded border border-red-100">已过期</span>
                </div>
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
          <div class="flex items-center justify-between px-10 py-8 bg-gray-50/50 rounded-lg relative">
            <div class="absolute h-0.5 bg-gray-200 left-24 right-24 top-1/2 -translate-y-1/2 z-0" />
            <div class="relative z-10 text-center">
              <div class="w-3 h-3 bg-indigo-500 rounded-full mx-auto mb-2 ring-4 ring-indigo-100" />
              <div class="text-xs text-gray-400">预计入驻</div>
              <div class="text-sm font-bold text-gray-700">{{ formatDate(formInline.expectedLeaseStart) }}</div>
            </div>
            <div class="relative z-10">
              <el-tag round effect="dark" type="info" class="!bg-gray-800 !border-none !px-6">
                {{ calculateDuration(formInline.expectedLeaseStart, formInline.expectedLeaseEnd) }}
              </el-tag>
            </div>
            <div class="relative z-10 text-center">
              <div class="w-3 h-3 bg-gray-400 rounded-full mx-auto mb-2 ring-4 ring-gray-100" />
              <div class="text-xs text-gray-400">预计退租</div>
              <div class="text-sm font-bold text-gray-700">{{ formatDate(formInline.expectedLeaseEnd) }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="lg:col-span-2 space-y-5">
        <el-card shadow="never" class="!rounded-xl !border-gray-100">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2 font-bold text-gray-700">
                <el-icon class="text-green-500"><House /></el-icon>
                <span>预定房间</span>
              </div>
              <span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{{ formInline.roomList?.length || 0 }} 间</span>
            </div>
          </template>
          <div class="space-y-3">
            <div
              v-for="(room, index) in formInline.roomList"
              :key="index"
              class="p-3 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <el-tag size="small" :type="room.rentalType == 1 ? '' : 'warning'">
                    {{ room.rentalType == 1 ? "整" : "合" }}
                  </el-tag>
                  <span class="text-sm font-bold text-gray-700">{{ room.communityName }} {{ room.doorNumber }}{{ room.rentalType == 2 ? "-" + room.roomNumber : "" }}</span>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>面积：{{ room.area || "--" }} m²</span>
                  <span class="font-bold text-blue-600">¥{{ room.price || "--" }}/月</span>
                </div>
              </div>
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
  import { Calendar, House, Iphone, Memo, Wallet } from "@element-plus/icons-vue";
  import type { BookingListProps } from "@/types";

  const props = defineProps<{ formInline: BookingListProps }>();

  const isExpired = computed(() => {
    return props.formInline.expiryTime ? new Date(props.formInline.expiryTime) < new Date() : false;
  });

  const formatDateTime = (val: any) => {
    if (!val) return "-";
    const d = new Date(val);
    return d.toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");
  };

  const formatDate = (val: any) => {
    if (!val) return "-";
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const calculateDuration = (start: any, end: any) => {
    if (!start || !end) return "-";
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    return days >= 30 ? `${Math.floor(days / 30)}个月${days % 30 > 0 ? (days % 30) + "天" : ""}` : `${days}天`;
  };

  const getStatusType = (status: number) => {
    const types: Record<number, string> = { 1: "primary", 2: "success", 3: "danger", 4: "warning" };
    return types[status] || "info";
  };
</script>

<style scoped lang="scss">
  :deep(.el-card) {
    border: none;
    .el-card__header {
      @apply border-b border-gray-50 px-5 py-4;
    }
  }
</style>
