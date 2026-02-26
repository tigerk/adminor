<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-row class="bg-bg_color w-full px-4 pb-1 pt-[12px]">
      <el-col :span="24">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.name" placeholder="租客姓名/企业名称" clearable class="!w-[180px]" @keyup.enter="onTenantSearch" @clear="onTenantSearch">
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
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="onTenantSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="() => resetQueryForm(queryFormRef)">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <el-row class="bg-bg_color w-full px-4">
      <el-col :span="18">
        <div class="grid-content ep-bg-purple" style="align-items: flex-start">
          <el-space>
            <el-form-item>
              <el-radio-group v-model="queryForm.status" @change="onTenantSearch">
                <el-radio-button v-for="item in tenantStatusTotal" :key="item.status" :value="item.status" :class="['tenant-status-button', `status-${item.status || 'all'}`]">
                  <span class="status-content">
                    <span class="status-dot" :style="{ backgroundColor: item.statusColor }" />
                    {{ item.statusName }}（{{ item.total }}）
                  </span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-space>
        </div>
      </el-col>
      <el-col :span="6" class="text-right">
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openTenantDialog()">添加租客</el-button>
      </el-col>
    </el-row>

    <!-- 租客列表 -->
    <el-row class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <pure-table
        border
        row-key="leaseId"
        alignWhole="center"
        :show-overflow-tooltip="false"
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 120 }"
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
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(View)" @click="openTenantViewDialog('查看租客', row)">查看</el-button>
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(Printer)" @click="handlePreview(row)">预览合同</el-button>
          <el-dropdown :hide-on-click="false" popper-class="action-dropdown">
            <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleTenantRenew(row)">
                  <el-button link :icon="useRenderIcon(EpCollection)">租客续约</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click="handleTenantCheckout(row)">
                  <el-button link :icon="useRenderIcon(EpRemove)">租客退租</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click="handleConfirmDelete(row)">
                  <el-button link :icon="useRenderIcon(Delete)">作废</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </pure-table>
    </el-row>
    <!-- 合同预览对话框 -->
    <el-dialog v-model="previewVisible" top="10px" title="租客合同预览" width="80%" height="100vh" :destroy-on-close="true" align-center :lock-scroll="true">
      <iframe title="租客合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>

    <!-- 退租对话框 -->
    <CheckoutDialog ref="checkoutDialogRef" @success="onCheckoutSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import { LEASE_STATUS_ENUM, LEAST_STATUS_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import View from "~icons/ep/view";
  import Printer from "~icons/ep/printer";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import Delete from "~icons/ep/delete";
  import EpCollection from "~icons/ep/collection";
  import EpRemove from "~icons/ep/remove";
  import More from "~icons/ep/more-filled";
  import { LeaseListVo, TenantsCreateFormProps } from "@/types";
  import { cancelTenant, getTenantDetail, previewLeaseContract } from "@/api/contract/tenant";
  import { message } from "@/utils/message";
  import { ElMessageBox } from "element-plus";
  import { hideLoading, showLoading } from "@/utils/yeah";
  import CheckoutDialog from "@/views/contract/checkout/components/CheckoutDialog.vue";
  import { addDays, addMonth } from "@/utils/date";

  defineOptions({
    name: "ContractTenant"
  });

  const queryFormRef = ref();
  const checkoutDialogRef = ref<InstanceType<typeof CheckoutDialog>>();

  const {
    queryForm,
    openTenantDialog,
    openTenantViewDialog,
    onTenantSearch,
    handleDeleteTenant,
    tableSize,
    columns,
    loading,
    pagination,
    tenantStatusTotal,
    tenantList,
    handleSizeChange,
    handleCurrentChange,
    resetQueryForm
  } = useTenant();

  const tenantTypeOptions = TENANT_TYPE_OPTIONS;
  const statusOptions = [{ label: "全部", value: undefined }, ...LEAST_STATUS_OPTIONS];

  const handleConfirmDelete = row => {
    ElMessageBox.confirm("确认作废该租客吗？", "作废", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        handleCancelTenant(row);
      })
      .catch(() => {
        // 取消操作
      });
  };

  const handleCancelTenant = (row: LeaseListVo) => {
    cancelTenant({ leaseId: row.leaseId })
      .then(resp => {
        if (resp.code == 0) {
          message("作废租客成功");
          row.status = resp.data;
        } else {
          message(resp.message || "作废租客失败", { type: "error" });
        }
      })
      .catch(() => {
        message("作废租客失败", { type: "error" });
      });
  };

  /** 可退租的状态：待签字(1)、在租中(2) */
  const canCheckoutStatus: number[] = [LEASE_STATUS_ENUM.TO_SIGN.code, LEASE_STATUS_ENUM.EFFECTIVE.code];

  /** 租客退租 */
  const handleTenantCheckout = (row: LeaseListVo) => {
    // 检查租客状态是否允许退租（状态1=待签字 或 2=在租中）
    if (!canCheckoutStatus.includes(row.status)) {
      message("当前租客状态不允许退租，只有待签字或在租中的租客才能退租", { type: "warning" });
      return;
    }

    // 打开退租对话框
    checkoutDialogRef.value?.open(row.tenantId, row.leaseId);
  };

  /** 退租成功回调 */
  const onCheckoutSuccess = () => {
    // 刷新列表
    onTenantSearch();
    message("退租提交成功");
  };

  /** 租客续约 */
  const handleTenantRenew = (row: LeaseListVo) => {
    if (!row?.leaseId || !row?.tenantId) {
      message("租约信息不完整，无法续约", { type: "warning" });
      return;
    }
    getTenantDetail({ leaseId: row.leaseId })
      .then(resp => {
        if (resp.code !== 0) {
          message(resp.message || "获取租约详情失败", { type: "error" });
          return;
        }

        // 续约时过滤掉预定租金
        resp.data.otherFees = resp.data.otherFees?.filter(fee => fee.dictDataId !== "0") || [];

        const detail = resp.data;
        // 续约开始时间默认是当前租约结束时间的后一天
        const renewStart = addDays(detail.leaseEnd, 1);
        const renewEnd = addMonth(detail.leaseEnd, 12);

        const renewData: TenantsCreateFormProps = {
          tenantPersonal: detail.tenantPersonal,
          tenantCompany: detail.tenantCompany,
          tenantMateList: detail.tenantMateList || [],
          lease: {
            ...detail,
            id: undefined,
            tenantId: detail.tenantId,
            parentLeaseId: detail.leaseId,
            contractNature: 2, // 续约
            leaseStart: renewStart,
            leaseEnd: renewEnd,
            leaseDate: [renewStart, renewEnd],
            checkDate: detail.checkOutTime ? [detail.checkOutTime, null] : undefined
          },
          otherFees: detail.otherFees || []
        };
        openTenantDialog("续签租约 " + detail.tenantName, renewData);
      })
      .catch(() => {
        message("获取租约详情失败", { type: "error" });
      });
  };

  const previewVisible = ref(false);
  const pdfUrl = ref("");
  function handlePreview(row: any) {
    showLoading();
    previewLeaseContract({ leaseId: row.leaseId })
      .then(resp => {
        const blob = new Blob([resp], { type: "application/pdf" });
        pdfUrl.value = URL.createObjectURL(blob);
        previewVisible.value = true;
        hideLoading();
      })
      .catch(error => {
        message("预览失败", { type: "error" });
        hideLoading();
      });
  }
  // 关闭弹窗时释放 URL
  watch(previewVisible, newVal => {
    if (!newVal && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });
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
</style>
