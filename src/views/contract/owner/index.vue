<template>
  <div class="pf-page owner-contract-page">
    <div class="filter-card -mb-2">
      <div class="filter-toolbar">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="业主名称">
            <el-input v-model="queryForm.ownerName" placeholder="请输入业主姓名/企业名称" clearable class="filter-input" @keyup.enter="handleSearch" @clear="handleSearch">
              <template #prefix>
                <IconifyIconOffline :icon="User" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="queryForm.ownerPhone" placeholder="请输入联系电话" clearable class="filter-input" @keyup.enter="handleSearch" @clear="handleSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Phone" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="业主类型">
            <el-select v-model="queryForm.ownerType" placeholder="请选择业主类型" clearable class="filter-input-sm" @change="handleSearch">
              <el-option v-for="item in ownerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="委托模式">
            <el-select v-model="queryForm.cooperationMode" placeholder="请选择委托模式" clearable class="filter-input-sm" @change="handleSearch">
              <el-option v-for="item in cooperationModeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="签署状态">
            <el-select v-model="queryForm.signStatus" placeholder="请选择签署状态" clearable class="filter-input-sm" @change="handleSearch">
              <el-option v-for="item in signStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="handleSearch">查询</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openCreateDialog">添加业主合同</el-button>
      </div>
    </div>

    <PureTableBar title="业主合同" :columns="columns" @refresh="loadList">
      <template #buttons>
        <div class="summary-block summary-block--toolbar">
          <OwnerSummaryFilterTabs v-model="summaryFilter" :items="summaryCards" @update:model-value="handleSummaryFilterChange" />
        </div>
      </template>
      <template #default="{ size, dynamicColumns }">
        <pure-table
          border
          row-key="contractId"
          alignWhole="center"
          class="pf-table"
          :show-overflow-tooltip="false"
          :loading="loading"
          :loading-config="{ background: 'transparent' }"
          adaptive
          :adaptiveConfig="{ offsetBottom: 82 }"
          :data="tableData"
          :size="size"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
          @page-size-change="handlePageSizeChange"
          @page-current-change="handlePageCurrentChange"
        >
          <template #signStatus="{ row }">
            <div class="table-cell-center">
              <el-tag :type="row.signStatus === 'SIGNED' ? 'success' : 'info'">
                {{ signStatusLabelMap[row.signStatus || "PENDING"] }}
              </el-tag>
            </div>
          </template>
          <template #ownerInfo="{ row }">
            <div class="owner-cell">
              <div class="owner-cell__name">{{ row.ownerName || "-" }}</div>
            </div>
          </template>
          <template #cooperationMode="{ row }">
            <div class="table-cell-center">
              <el-tag :type="row.cooperationMode === 'MASTER_LEASE' ? 'warning' : 'success'">
                {{ cooperationModeLabelMap[row.cooperationMode || "LIGHT_MANAGED"] }}
              </el-tag>
            </div>
          </template>
          <template #subjectNames="{ row }">
            <div class="house-summary house-summary--inline">
              <el-tooltip :content="row.subjectNames || '-'" placement="top" :show-after="200">
                <div class="house-summary__title">{{ row.subjectNames || "-" }}</div>
              </el-tooltip>
              <div class="house-summary__meta house-summary__meta--inline">
                <span>共 {{ row.subjectCount || 0 }} 套</span>
                <span>已配置 {{ row.configuredSubjectCount || 0 }} 套</span>
              </div>
            </div>
          </template>
          <template #totalArea="{ row }">
            <span>{{ formatArea(row.totalArea) }} m²</span>
          </template>
          <template #ownerPhone="{ row }">
            <span>{{ row.ownerPhone || "-" }}</span>
          </template>
          <template #contractPeriod="{ row }">
            <div class="date-range">{{ formatDate(row.contractStart) }} 至 {{ formatDate(row.contractEnd) }}</div>
          </template>
          <template #ownerTag="{ row }">
            <span>{{ row.ownerTag || "-" }}</span>
          </template>
          <template #operation="{ row }">
            <el-button link type="primary" @click="openDetail(row.contractId)">查看</el-button>
            <el-button link type="primary" @click="handlePreview(row.contractId)">预览合同</el-button>
            <el-dropdown :hide-on-click="false" popper-class="action-dropdown">
              <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openEdit(row.contractId)">编辑合同</el-dropdown-item>
                  <el-dropdown-item @click="handleOwnerRenew(row)">业主续约</el-dropdown-item>
                  <el-dropdown-item @click="handleOwnerCheckout(row)">业主退房</el-dropdown-item>
                  <el-dropdown-item v-if="canVoidContract(row)" divided @click="handleVoidContract(row)">
                    <span class="text-danger">作废合同</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import type { PaginationProps } from "@pureadmin/table";
  import { ElMessageBox } from "element-plus";
  import { useRouter } from "vue-router";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { message } from "@/utils/message";
  import useOwnerContract from "@/views/contract/owner/utils/hook";
  import OwnerSummaryFilterTabs from "@/shared/owner/OwnerSummaryFilterTabs.vue";
  import { getOwnerContractList, getOwnerContractTotal, previewOwnerContract, voidOwnerContract } from "@/api/contract/owner";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import More from "~icons/ep/more-filled";
  import type { OwnerContractIdDto, OwnerCooperationModeEnum, OwnerListVo, OwnerQueryDto, OwnerSignStatusEnum, OwnerTypeEnum } from "@/types/generated";
  import { OwnerCooperationModeEnumMeta, OwnerSignStatusEnumMeta, OwnerTypeEnumMeta } from "@/types/generated/enum.meta";
  import "@/shared/owner/panel.scss";
  import "@/shared/owner/financePage.scss";

  defineOptions({ name: "ContractOwner" });

  type QueryForm = {
    currentPage: number;
    pageSize: number;
    ownerName: string;
    ownerPhone: string;
    ownerType?: OwnerTypeEnum;
    cooperationMode?: OwnerCooperationModeEnum;
    signStatus?: OwnerSignStatusEnum;
    expiringDaysWithin?: number;
  };

  type OwnerListRow = OwnerListVo & {
    subjectNames?: string;
    subjectCount?: number;
    totalArea?: number | string;
    configuredSubjectCount?: number;
    ownerTag?: string;
    updateAt?: string;
  };

  type OwnerContractTotal = {
    total?: number;
    pendingSignTotal?: number;
    signedTotal?: number;
    expiring30DaysTotal?: number;
  };

  const router = useRouter();
  const { openOwnerDialog, openOwnerRenewDialog, openOwnerCheckoutDialog, openOwnerViewDialog } = useOwnerContract();
  const loading = ref(false);
  const tableData = ref<OwnerListRow[]>([]);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });
  const totalStats = reactive<OwnerContractTotal>({
    total: 0,
    pendingSignTotal: 0,
    signedTotal: 0,
    expiring30DaysTotal: 0
  });

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 15,
    ownerName: "",
    ownerPhone: ""
  });
  const summaryFilter = ref<"ALL" | "PENDING" | "SIGNED" | "EXPIRING_30">("ALL");
  const previewVisible = ref(false);
  const pdfUrl = ref("");

  const ownerTypeLabelMap: Record<OwnerTypeEnum, string> = {
    PERSONAL: "个人",
    COMPANY: "企业"
  };
  const cooperationModeLabelMap: Record<OwnerCooperationModeEnum, string> = {
    LIGHT_MANAGED: "轻托管",
    MASTER_LEASE: "包租"
  };
  const signStatusLabelMap: Record<OwnerSignStatusEnum, string> = {
    PENDING: "待签字",
    SIGNED: "已签字"
  };

  const ownerTypeOptions = [
    { label: ownerTypeLabelMap.PERSONAL, value: OwnerTypeEnumMeta.PERSONAL.value as OwnerTypeEnum },
    { label: ownerTypeLabelMap.COMPANY, value: OwnerTypeEnumMeta.COMPANY.value as OwnerTypeEnum }
  ];
  const cooperationModeOptions = [
    { label: cooperationModeLabelMap.LIGHT_MANAGED, value: OwnerCooperationModeEnumMeta.LIGHT_MANAGED.value as OwnerCooperationModeEnum },
    { label: cooperationModeLabelMap.MASTER_LEASE, value: OwnerCooperationModeEnumMeta.MASTER_LEASE.value as OwnerCooperationModeEnum }
  ];
  const signStatusOptions = [
    { label: signStatusLabelMap.PENDING, value: OwnerSignStatusEnumMeta.PENDING.value as OwnerSignStatusEnum },
    { label: signStatusLabelMap.SIGNED, value: OwnerSignStatusEnumMeta.SIGNED.value as OwnerSignStatusEnum }
  ];
  const summaryCards = computed(() => [
    { key: "ALL", label: "全部", total: totalStats.total || 0, color: "#6b7280" },
    { key: "PENDING", label: "待签字", total: totalStats.pendingSignTotal || 0, color: "#f59e0b" },
    { key: "SIGNED", label: "已签字", total: totalStats.signedTotal || 0, color: "#2563eb" },
    { key: "EXPIRING_30", label: "30天内到期", total: totalStats.expiring30DaysTotal || 0, color: "#ef4444" }
  ]);

  const columns: TableColumnList = [
    { label: "签署状态", width: 100, align: "center", fixed: "left", slot: "signStatus" },
    { label: "业主信息", minWidth: 180, align: "center", slot: "ownerInfo" },
    { label: "委托模式", width: 120, align: "center", slot: "cooperationMode" },
    { label: "合同编号", prop: "contractNo", minWidth: 220 },
    { label: "合同房源", minWidth: 360, slot: "subjectNames" },
    { label: "总面积", width: 110, align: "center", slot: "totalArea" },
    { label: "手机号", minWidth: 140, align: "center", slot: "ownerPhone" },
    { label: "合同模板", prop: "contractTemplateName", minWidth: 140, showOverflowTooltip: true },
    { label: "合同周期", minWidth: 220, slot: "contractPeriod" },
    { label: "业主标签", minWidth: 120, align: "center", slot: "ownerTag" },
    { label: "更新时间", prop: "updateAt", minWidth: 170 },
    { label: "操作", width: 200, align: "center", fixed: "right", slot: "operation" }
  ];

  function formatDate(value?: string | number | Date) {
    if (!value) return "-";
    if (typeof value === "string") return value.slice(0, 10);
    return String(value).slice(0, 10);
  }

  function formatArea(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "0";
    return Number(value).toFixed(2);
  }

  function buildListPayload(): OwnerQueryDto {
    return {
      ownerName: queryForm.ownerName || undefined,
      ownerPhone: queryForm.ownerPhone || undefined,
      ownerType: queryForm.ownerType,
      cooperationMode: queryForm.cooperationMode,
      signStatus: queryForm.signStatus,
      expiringDaysWithin: queryForm.expiringDaysWithin,
      currentPage: String(pagination.currentPage),
      pageSize: String(pagination.pageSize)
    };
  }

  function buildTotalPayload() {
    return {
      ownerName: queryForm.ownerName || undefined,
      ownerPhone: queryForm.ownerPhone || undefined,
      ownerType: queryForm.ownerType,
      cooperationMode: queryForm.cooperationMode
    };
  }

  async function loadList() {
    loading.value = true;
    try {
      const [listResp, totalResp] = await Promise.all([getOwnerContractList(buildListPayload()), getOwnerContractTotal(buildTotalPayload() as any)]);
      tableData.value = (listResp.data?.list || []) as OwnerListRow[];
      pagination.total = Number(listResp.data?.total || 0);
      pagination.currentPage = Number(listResp.data?.currentPage || pagination.currentPage);
      pagination.pageSize = Number(listResp.data?.pageSize || pagination.pageSize);
      queryForm.currentPage = pagination.currentPage;
      queryForm.pageSize = pagination.pageSize;
      Object.assign(totalStats, (totalResp.data || {}) as OwnerContractTotal);
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    pagination.currentPage = 1;
    queryForm.currentPage = 1;
    loadList();
  }

  function handlePageSizeChange(size: number) {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    queryForm.pageSize = size;
    queryForm.currentPage = 1;
    loadList();
  }

  function handlePageCurrentChange(page: number) {
    pagination.currentPage = page;
    queryForm.currentPage = page;
    loadList();
  }

  function resetQuery() {
    queryForm.currentPage = 1;
    queryForm.pageSize = 15;
    pagination.currentPage = 1;
    pagination.pageSize = 15;
    queryForm.ownerName = "";
    queryForm.ownerPhone = "";
    queryForm.ownerType = undefined;
    queryForm.cooperationMode = undefined;
    queryForm.signStatus = undefined;
    queryForm.expiringDaysWithin = undefined;
    summaryFilter.value = "ALL";
    loadList();
  }

  function handleSummaryFilterChange(value: typeof summaryFilter.value) {
    summaryFilter.value = value;
    queryForm.signStatus = undefined;
    queryForm.expiringDaysWithin = undefined;
    if (value === "PENDING") queryForm.signStatus = "PENDING";
    if (value === "SIGNED") queryForm.signStatus = "SIGNED";
    if (value === "EXPIRING_30") queryForm.expiringDaysWithin = 30;
    handleSearch();
  }

  function openCreateDialog() {
    openOwnerDialog("添加业主合同", null, loadList);
  }

  function openEdit(contractId?: string) {
    if (!contractId) return;
    openOwnerDialog("编辑业主合同", { contractId, isEdit: true }, loadList);
  }

  function openDetail(contractId?: string) {
    if (!contractId) return;
    openOwnerViewDialog("业主合同详情", { contractId });
  }

  function handleOwnerRenew(row: OwnerListRow) {
    if (!row.contractId) return;
    openOwnerRenewDialog({ contractId: row.contractId }, loadList);
  }

  function handleOwnerCheckout(row: OwnerListRow) {
    if (!row.contractId) return;
    openOwnerCheckoutDialog(row, loadList);
  }

  function canVoidContract(row: OwnerListRow) {
    return row.signStatus !== "SIGNED";
  }

  async function handleVoidContract(row: OwnerListRow) {
    if (!row.contractId) return;
    const result = await ElMessageBox.prompt("作废后合同将不再出现在列表中。已签约、已生成账单或已有租客占用的合同不能作废，请走业主退房。", "作废业主合同", {
      type: "warning",
      confirmButtonText: "作废",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
      inputType: "textarea",
      inputPlaceholder: "请输入作废原因",
      inputValidator: value => {
        if (!String(value || "").trim()) return "请输入作废原因";
        if (String(value).trim().length > 500) return "作废原因不能超过 500 字";
        return true;
      }
    });
    const voidReason = String(result.value || "").trim();
    const resp = await voidOwnerContract({ contractId: row.contractId, voidReason });
    if (resp.code === 0) {
      message("业主合同已作废", { type: "success" });
      loadList();
      return;
    }
    message(resp.message || "作废业主合同失败", { type: "error" });
  }

  async function handlePreview(contractId?: string) {
    if (!contractId) {
      message("合同未保存，暂不支持预览", { type: "warning" });
      return;
    }
    const resp = await previewOwnerContract({ contractId } as OwnerContractIdDto);
    const blob = new Blob([resp], { type: "application/pdf" });
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = URL.createObjectURL(blob);
    previewVisible.value = true;
  }

  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });

  onMounted(loadList);
</script>

<style lang="scss" scoped>
  .owner-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .owner-cell__name {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .owner-cell__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .house-summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .house-summary--inline {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .house-summary__title {
    color: var(--el-text-color-primary);
    line-height: 1.4;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .house-summary__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .house-summary__meta--inline {
    flex: 0 0 auto;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
</style>
