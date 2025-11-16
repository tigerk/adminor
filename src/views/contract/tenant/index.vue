<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-row class="bg-bg_color w-full px-4 pb-3 pt-[12px]">
      <el-col :span="18">
        <el-form :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.name" placeholder="租客姓名" clearable class="!w-[180px]" @keyup.enter="onTenantSearch" @clear="onTenantSearch">
              <template #prefix>
                <IconifyIconOffline :icon="User" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input v-model="queryForm.phone" placeholder="联系电话" clearable class="!w-[180px]" @keyup.enter="onTenantSearch" @clear="onTenantSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Phone" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input v-model="queryForm.idNo" placeholder="证件号码" clearable class="!w-[200px]" @keyup.enter="onTenantSearch" @clear="onTenantSearch">
              <template #prefix>
                <IconifyIconOffline :icon="IdCard" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-select v-model="queryForm.tenantType" placeholder="租客类型" clearable class="!w-[140px]" @change="onTenantSearch">
              <el-option v-for="item in tenantTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-select v-model="queryForm.status" placeholder="状态" clearable class="!w-[120px]" @change="onTenantSearch">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" @click="onTenantSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>

      <el-col :span="6" class="text-right">
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openTenantDialog()">添加租客</el-button>
      </el-col>
    </el-row>

    <!-- 租客列表 -->
    <el-row class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <pure-table
        border
        row-key="id"
        alignWhole="center"
        showOverflowTooltip
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 108 }"
        :data="tenantList"
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
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(EditPen)" @click="openTenantDialog('修改', row)">修改</el-button>
          <el-popconfirm :title="`是否确认删除租客${row.name}?`" @confirm="handleDeleteTenant(row)">
            <template #reference>
              <el-button class="reset-margin" link type="danger" :icon="useRenderIcon(Delete)">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { TENANT_TYPE_OPTIONS, TENANT_STATUS_OPTIONS } from "@/constants";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import IdCard from "~icons/ep/postcard";

  defineOptions({
    name: "ContractTenant"
  });

  const { queryForm, openTenantDialog, onTenantSearch, handleDeleteTenant, tableSize, columns, loading, pagination, tenantList, handleSizeChange, handleCurrentChange, resetForm } =
    useTenant();

  const tenantTypeOptions = TENANT_TYPE_OPTIONS;
  const statusOptions = [{ label: "全部", value: undefined }, ...TENANT_STATUS_OPTIONS];
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
</style>
