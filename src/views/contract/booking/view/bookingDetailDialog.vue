<template>
  <div class="booking-detail-container p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 min-h-screen">
    <!-- 顶部面包屑导航 -->
    <div class="mb-6">
      <el-breadcrumb separator="/" class="text-sm">
        <el-breadcrumb-item>预定管理</el-breadcrumb-item>
        <el-breadcrumb-item>预定详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 租户信息卡片 - 增强版 -->
    <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 border border-gray-100 dark:border-gray-700">
      <!-- 背景装饰 -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -z-0" />

      <div class="relative z-10 p-8">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <!-- 左侧：租户信息 -->
          <div class="flex items-start gap-5 flex-1">
            <!-- 头像 -->
            <div class="relative">
              <div
                class="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl transform hover:scale-105 transition-transform"
              >
                {{ formInline.tenantName?.charAt(0) || "租" }}
              </div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full" />
            </div>

            <!-- 信息 -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 m-0">{{ formInline.tenantName }}</h1>
                <el-tag effect="light" round size="default" :type="formInline.tenantType === 0 ? 'success' : 'warning'" class="!px-4">
                  <span class="flex items-center gap-1">
                    <el-icon><User /></el-icon>
                    {{ formInline.tenantType === 0 ? "个人租户" : "企业租户" }}
                  </span>
                </el-tag>
              </div>

              <div class="flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg">
                  <el-icon class="text-blue-500"><Iphone /></el-icon>
                  <span class="font-medium">{{ formInline.tenantPhone }}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <el-icon><Clock /></el-icon>
                  <span>预定于 {{ formatDateTime(formInline.bookingTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：状态标签 -->
          <div class="flex flex-col items-end gap-3">
            <el-tag
              :type="getStatusType(formInline.bookingStatus)"
              effect="dark"
              class="!px-8 !py-3 !text-base !font-bold !rounded-xl shadow-lg transform hover:scale-105 transition-transform"
              size="large"
            >
              <span class="flex items-center gap-2">
                <el-icon><InfoFilled /></el-icon>
                {{ formInline.bookingStatusName }}
              </span>
            </el-tag>

            <!-- 过期提示 -->
            <div
              v-if="isExpired"
              class="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>已超过最晚签约日期</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 左侧两列：预定信息和租期规划 -->
      <div class="xl:col-span-2 space-y-6">
        <!-- 预定信息 - 数据卡片网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 预定定金卡片 -->
          <div
            class="group relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-white/90 mb-3">
                <el-icon class="text-xl"><Wallet /></el-icon>
                <span class="text-sm font-medium">预定定金</span>
              </div>
              <div class="text-4xl font-bold text-white mb-2">¥{{ formInline.bookingAmount }}</div>
              <div class="text-xs text-white/70">&nbsp;</div>
            </div>
          </div>

          <!-- 意向月租金卡片 -->
          <div
            class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-white/90 mb-3">
                <el-icon class="text-xl"><Money /></el-icon>
                <span class="text-sm font-medium">意向月租金</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-bold text-white">¥{{ formInline.expectedRentPrice }}</span>
                <span class="text-sm text-white/70">/月</span>
              </div>
              <div class="text-xs text-white/70 mt-2">预计租金标准</div>
            </div>
          </div>

          <!-- 预定时间卡片 -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
              <el-icon class="text-lg"><Clock /></el-icon>
              <span class="text-sm font-medium">预定发起时间</span>
            </div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-200">
              {{ formatDateTime(formInline.bookingTime) }}
            </div>
          </div>

          <!-- 签约截止时间卡片 -->
          <div
            :class="[
              'rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md',
              isExpired ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
            ]"
          >
            <div class="flex items-center gap-2 mb-3" :class="isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
              <el-icon class="text-lg"><Timer /></el-icon>
              <span class="text-sm font-medium">最晚签约日期</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-xl font-bold" :class="isExpired ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'">
                {{ formatDateTime(formInline.expiryTime) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 租期规划 - 时间轴 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <el-icon class="text-indigo-600 dark:text-indigo-400 text-xl"><Calendar /></el-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">租期规划</h3>
          </div>

          <!-- 时间轴可视化 -->
          <div class="relative px-4 py-12">
            <!-- 连接线 -->
            <div class="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-gray-300 dark:to-gray-600 rounded-full transform -translate-y-1/2" />

            <div class="relative flex justify-between items-center">
              <!-- 开始日期 -->
              <div class="flex flex-col items-center gap-3 z-10">
                <div class="relative">
                  <div
                    class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                  >
                    <el-icon class="text-white text-2xl"><House /></el-icon>
                  </div>
                  <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full animate-pulse" />
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 min-w-[140px]">
                  <div class="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">预计入驻</div>
                  <div class="text-sm font-bold text-gray-800 dark:text-gray-200 text-center">
                    {{ formatDate(formInline.expectedLeaseStart) }}
                  </div>
                </div>
              </div>

              <!-- 租期时长 -->
              <div class="flex flex-col items-center gap-2 z-10 -mt-2">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg">
                  <div class="text-xs opacity-90 text-center mb-1">租期时长</div>
                  <div class="text-lg font-bold text-center">
                    {{ calculateDuration(formInline.expectedLeaseStart, formInline.expectedLeaseEnd) }}
                  </div>
                </div>
              </div>

              <!-- 结束日期 -->
              <div class="flex flex-col items-center gap-3 z-10">
                <div class="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <el-icon class="text-white text-2xl"><FolderOpened /></el-icon>
                </div>
                <div class="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 min-w-[140px]">
                  <div class="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">预计退租</div>
                  <div class="text-sm font-bold text-gray-800 dark:text-gray-200 text-center">
                    {{ formatDate(formInline.expectedLeaseEnd) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧一列：预定房间和其他信息 -->
      <div class="xl:col-span-1 space-y-6">
        <!-- 预定房间 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <!-- 头部 -->
          <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <el-icon class="text-white text-xl"><House /></el-icon>
                </div>
                <div>
                  <h3 class="text-white font-bold text-lg">预定房间</h3>
                  <p class="text-white/80 text-xs mt-1">已选择 {{ formInline.roomList?.length || 0 }} 间房源</p>
                </div>
              </div>
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span class="text-2xl font-bold text-green-600">{{ formInline.roomList?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 房间列表 -->
          <div class="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            <div
              v-for="(room, index) in formInline.roomList"
              :key="index"
              class="group relative bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border-2 border-transparent hover:border-green-200 dark:hover:border-green-700 hover:shadow-md transition-all"
            >
              <!-- 房间类型标签 -->
              <div class="absolute -top-2 -right-2 z-10">
                <el-tag size="small" :type="room.rentalType == 1 ? 'success' : 'warning'" effect="dark" round class="!font-bold">
                  {{ room.rentalType == 1 ? "整租" : "合租" }}
                </el-tag>
              </div>

              <!-- 房间信息 -->
              <div class="space-y-3">
                <!-- 房间名称 -->
                <div class="font-bold text-gray-800 dark:text-gray-200 text-base pr-12">
                  {{ room.communityName }} {{ room.doorNumber }}{{ room.rentalType == 2 ? "-" + room.roomNumber : "" }}
                </div>

                <!-- 房间详情 -->
                <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex items-center gap-4 text-lg text-gray-500 dark:text-gray-400">
                    <span class="flex items-center gap-1">
                      <el-icon><Grid /></el-icon>
                      {{ room.area || "--" }} m²
                    </span>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-gray-400 dark:text-gray-500 mb-1">月租金</div>
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">¥{{ room.price || "--" }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!formInline.roomList || formInline.roomList.length === 0" class="text-center py-12 text-gray-400">
              <el-icon class="text-4xl mb-2"><House /></el-icon>
              <div class="text-sm">暂无预定房间</div>
            </div>
          </div>
        </div>

        <!-- 备注信息 -->
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <el-icon class="text-amber-600 dark:text-amber-400 text-xl"><Memo /></el-icon>
            </div>
            <h3 class="text-base font-bold text-amber-900 dark:text-amber-200">备注信息</h3>
          </div>
          <div class="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed min-h-[80px]">
            {{ formInline.remark || "暂无备注信息" }}
          </div>
        </div>

        <!-- 录入信息 -->
        <div class="bg-gray-100 dark:bg-gray-700/30 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-600">
          <div class="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300">
            <el-icon class="text-lg"><User /></el-icon>
            <span class="text-sm font-bold">录入信息</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">录入人员</span>
              <span class="text-sm text-gray-800 dark:text-gray-200 font-bold">{{ formInline.salesmanName }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">录入时间</span>
              <span class="text-sm text-gray-800 dark:text-gray-200 font-medium">{{ formatDateTime(formInline.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { Calendar, Clock, FolderOpened, Grid, House, InfoFilled, Iphone, Memo, Money, Timer, User, Wallet, WarningFilled } from "@element-plus/icons-vue";
  import type { BookingListVo } from "@/types";

  const props = defineProps<{ formInline: BookingListVo }>();

  const isExpired = computed(() => {
    if (props.formInline.bookingStatus === 2) {
      return false;
    }

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
  .booking-detail-container {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .dark ::-webkit-scrollbar-thumb {
    background: #475569;
  }

  .dark ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
</style>
