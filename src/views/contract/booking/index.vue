<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-row class="bg-bg_color w-full px-4 pb-3 pt-[12px]">
      <el-col :span="24">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.tenantName" placeholder="租客姓名" clearable class="!w-[180px]" @keyup.enter="onBookingSearch" @clear="onBookingSearch">
              <template #prefix>
                <IconifyIconOffline :icon="User" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.tenantPhone" placeholder="联系电话" clearable class="!w-[180px]" @keyup.enter="onBookingSearch" @clear="onBookingSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Phone" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="onBookingSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQueryForm(queryFormRef)">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <!-- 状态筛选和操作按钮 -->
    <el-row class="bg-bg_color w-full px-4">
      <el-col :span="18">
        <div class="grid-content ep-bg-purple" style="align-items: flex-start">
          <el-space>
            <el-form-item>
              <el-radio-group v-model="queryForm.bookingStatus" @change="onBookingSearch">
                <el-radio-button v-for="item in bookingStatusTotal" :key="item.status" :value="item.status" :class="['booking-status-button', `status-${item.status || 'all'}`]">
                  <span class="status-content">
                    <span class="status-dot" :style="{ backgroundColor: getStatusColor(item.status) }" />
                    {{ item.statusName }}（{{ item.total }}）
                  </span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-space>
        </div>
      </el-col>
      <el-col :span="6" class="text-right">
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openBookingDialog()">添加预定</el-button>
      </el-col>
    </el-row>

    <!-- 预定列表 -->
    <el-row class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <pure-table
        border
        row-key="id"
        alignWhole="center"
        :show-overflow-tooltip="false"
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 108 }"
        :data="bookingList"
        :size="tableSize as any"
        :columns="columns"
        :pagination="pagination"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(View)" @click="handleViewBooking(row)">查看</el-button>
          <el-dropdown :hide-on-click="false">
            <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleConvertToTenant(row)">
                  <el-button :disabled="row.bookingStatus !== 1" link type="primary" :icon="useRenderIcon(CircleCheck)">转为租客</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click="handleCancelBooking(row)">
                  <el-button :disabled="row.bookingStatus !== 1" link :icon="useRenderIcon(Delete)">取消预定</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </pure-table>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import useBooking from "./utils/hook";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import Delete from "~icons/ep/delete";
  import More from "~icons/ep/more-filled";
  import View from "~icons/ep/view";
  import CircleCheck from "~icons/ep/circle-check";

  defineOptions({
    name: "ContractBooking"
  });

  const queryFormRef = ref();

  const {
    queryForm,
    openBookingDialog,
    onBookingSearch,
    handleViewBooking,
    handleConvertToTenant,
    handleCancelBooking,
    tableSize,
    columns,
    loading,
    pagination,
    bookingStatusTotal,
    bookingList,
    handleSizeChange,
    handleCurrentChange,
    resetQueryForm,
    getStatusColor
  } = useBooking();
</script>

<style lang="scss" scoped>
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }

  .status-content {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .status-dot {
    display: inline-block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .booking-status-button {
    position: relative;

    :deep(.el-radio-button__inner) {
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }
  }
</style>
