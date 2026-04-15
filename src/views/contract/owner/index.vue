<template>
  <div class="main owner-contract-page">
    <OwnerPageHeader>
      <template #search>
        <el-form :inline="true" :model="queryForm" class="owner-page-search-form">
          <el-form-item>
            <el-input v-model="queryForm.ownerName" placeholder="业主姓名/企业名称" clearable class="owner-filter-input" @keyup.enter="handleSearch" @clear="handleSearch">
              <template #prefix>
                <IconifyIconOffline :icon="User" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.ownerPhone" placeholder="联系电话" clearable class="owner-filter-input" @keyup.enter="handleSearch" @clear="handleSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Phone" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.ownerType" placeholder="业主类型" clearable class="owner-filter-select" @change="handleSearch">
              <el-option v-for="item in ownerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.cooperationMode" placeholder="委托模式" clearable class="owner-filter-select" @change="handleSearch">
              <el-option v-for="item in cooperationModeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.signStatus" placeholder="签署状态" clearable class="owner-filter-select-sm" @change="handleSearch">
              <el-option v-for="item in signStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.status" placeholder="合同状态" clearable class="owner-filter-select-sm" @change="handleSearch">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="handleSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #summary>
        <OwnerSummaryFilterTabs v-model="summaryFilter" :items="summaryCards" @update:model-value="handleSummaryFilterChange" />
      </template>

      <template #actions>
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openCreateDialog">添加业主合同</el-button>
      </template>
    </OwnerPageHeader>

    <el-row class="bg-bg_color w-full px-4 pb-4">
      <el-col :span="24">
        <el-table v-loading="loading" :data="tableData" border row-key="contractId">
          <el-table-column label="状态" width="100" align="center" fixed>
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ statusLabelMap[row.status || "ACTIVE"] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签署状态" width="100" align="center" fixed>
            <template #default="{ row }">
              <el-tag :type="row.signStatus === 'SIGNED' ? 'success' : 'info'">
                {{ signStatusLabelMap[row.signStatus || "PENDING"] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业主信息" min-width="180" align="center">
            <template #default="{ row }">
              <div class="owner-cell">
                <div class="owner-cell__name">{{ row.ownerName || "-" }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="业主标签" min-width="120" align="center">
            <template #default="{ row }">
              <span>{{ row.ownerTag || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="手机号" min-width="140" align="center">
            <template #default="{ row }">
              <span>{{ row.ownerPhone || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="委托模式" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.cooperationMode === 'MASTER_LEASE' ? 'warning' : 'success'">
                {{ cooperationModeLabelMap[row.cooperationMode || "LIGHT_MANAGED"] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contractNo" label="合同编号" min-width="220" />
          <el-table-column prop="contractTemplateName" label="合同模板" min-width="140" show-overflow-tooltip />
          <el-table-column label="合同房源" min-width="360">
            <template #default="{ row }">
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
          </el-table-column>
          <el-table-column label="总面积" width="110" align="center">
            <template #default="{ row }">
              <span>{{ formatArea(row.totalArea) }} m²</span>
            </template>
          </el-table-column>
          <el-table-column label="合同周期" min-width="220">
            <template #default="{ row }">
              <div class="date-range">{{ formatDate(row.contractStart) }} 至 {{ formatDate(row.contractEnd) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" min-width="170" />
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row.contractId)">查看</el-button>
              <el-button link type="primary" @click="handlePreview(row.contractId)">预览合同</el-button>
              <el-dropdown :hide-on-click="false" popper-class="action-dropdown">
                <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openEdit(row.contractId)">编辑合同</el-dropdown-item>
                    <el-dropdown-item @click="goOwnerBills(row)">{{ billEntryText(row) }}</el-dropdown-item>
                    <el-dropdown-item v-if="row.cooperationMode !== 'MASTER_LEASE'" @click="goOwnerWithdraws(row)">查看提现</el-dropdown-item>
                    <el-dropdown-item @click="handleToggleStatus(row)">
                      {{ row.status === "ACTIVE" ? "停用合同" : "启用合同" }}
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleDelete(row)">
                      <span class="text-danger">删除合同</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="queryForm.currentPage"
            v-model:page-size="queryForm.pageSize"
            :page-sizes="[10, 20, 30, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @current-change="loadList"
            @size-change="handlePageSizeChange"
          />
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import { ElMessageBox } from "element-plus";
  import { useRouter } from "vue-router";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { message } from "@/utils/message";
  import useOwnerContract from "@/views/contract/owner/utils/hook";
  import OwnerPageHeader from "@/shared/owner/OwnerPageHeader.vue";
  import OwnerSummaryFilterTabs from "@/shared/owner/OwnerSummaryFilterTabs.vue";
  import { deleteOwnerContract, getOwnerContractList, getOwnerContractTotal, previewOwnerContract, updateOwnerContractStatus } from "@/api/contract/owner";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import More from "~icons/ep/more-filled";
  import type { OwnerContractIdDto, OwnerContractStatusDto, OwnerCooperationModeEnum, OwnerListVo, OwnerQueryDto, OwnerSignStatusEnum, OwnerTypeEnum } from "@/types/generated";
  import { OwnerCooperationModeEnumMeta, OwnerSignStatusEnumMeta, OwnerTypeEnumMeta } from "@/types/generated/enum.meta";
  import "@/shared/owner/panel.scss";

  defineOptions({ name: "ContractOwner" });

  type QueryForm = {
    currentPage: number;
    pageSize: number;
    ownerName: string;
    ownerPhone: string;
    ownerType?: OwnerTypeEnum;
    cooperationMode?: OwnerCooperationModeEnum;
    signStatus?: OwnerSignStatusEnum;
    status?: "ACTIVE" | "DISABLED";
    expiringDaysWithin?: number;
  };

  type OwnerListRow = OwnerListVo & {
    subjectNames?: string;
    subjectCount?: number;
    totalArea?: number | string;
    configuredSubjectCount?: number;
    ownerTag?: string;
    updateTime?: string;
  };

  type OwnerContractTotal = {
    total?: number;
    activeTotal?: number;
    disabledTotal?: number;
    pendingSignTotal?: number;
    signedTotal?: number;
    expiring30DaysTotal?: number;
  };

  const router = useRouter();
  const { openOwnerDialog, openOwnerViewDialog } = useOwnerContract();
  const loading = ref(false);
  const tableData = ref<OwnerListRow[]>([]);
  const total = ref(0);
  const totalStats = reactive<OwnerContractTotal>({
    total: 0,
    activeTotal: 0,
    disabledTotal: 0,
    pendingSignTotal: 0,
    signedTotal: 0,
    expiring30DaysTotal: 0
  });

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerName: "",
    ownerPhone: ""
  });
  const summaryFilter = ref<"ALL" | "ACTIVE" | "DISABLED" | "PENDING" | "SIGNED" | "EXPIRING_30">("ALL");
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
  const statusLabelMap: Record<"ACTIVE" | "DISABLED", string> = {
    ACTIVE: "启用",
    DISABLED: "停用"
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
  const statusOptions = [
    { label: "启用", value: "ACTIVE" as const },
    { label: "停用", value: "DISABLED" as const }
  ];

  const summaryCards = computed(() => [
    { key: "ALL", label: "全部", total: totalStats.total || 0, color: "#6b7280" },
    { key: "ACTIVE", label: "启用中", total: totalStats.activeTotal || 0, color: "#16a34a" },
    { key: "DISABLED", label: "已停用", total: totalStats.disabledTotal || 0, color: "#94a3b8" },
    { key: "PENDING", label: "待签字", total: totalStats.pendingSignTotal || 0, color: "#f59e0b" },
    { key: "SIGNED", label: "已签字", total: totalStats.signedTotal || 0, color: "#2563eb" },
    { key: "EXPIRING_30", label: "30天内到期", total: totalStats.expiring30DaysTotal || 0, color: "#ef4444" }
  ]);

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
      status: queryForm.status,
      expiringDaysWithin: queryForm.expiringDaysWithin,
      currentPage: String(queryForm.currentPage),
      pageSize: String(queryForm.pageSize)
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
      total.value = Number(listResp.data?.total || 0);
      Object.assign(totalStats, (totalResp.data || {}) as OwnerContractTotal);
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    queryForm.currentPage = 1;
    loadList();
  }

  function handlePageSizeChange() {
    queryForm.currentPage = 1;
    loadList();
  }

  function resetQuery() {
    queryForm.currentPage = 1;
    queryForm.pageSize = 10;
    queryForm.ownerName = "";
    queryForm.ownerPhone = "";
    queryForm.ownerType = undefined;
    queryForm.cooperationMode = undefined;
    queryForm.signStatus = undefined;
    queryForm.status = undefined;
    queryForm.expiringDaysWithin = undefined;
    summaryFilter.value = "ALL";
    loadList();
  }

  function handleSummaryFilterChange(value: typeof summaryFilter.value) {
    summaryFilter.value = value;
    queryForm.status = undefined;
    queryForm.signStatus = undefined;
    queryForm.expiringDaysWithin = undefined;
    if (value === "ACTIVE") queryForm.status = "ACTIVE";
    if (value === "DISABLED") queryForm.status = "DISABLED";
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

  async function handleToggleStatus(row: OwnerListRow) {
    if (!row.contractId) return;
    const nextStatus = row.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await ElMessageBox.confirm(`确认将合同状态调整为“${statusLabelMap[nextStatus]}”吗？`, "更新状态", { type: "warning" });
    const resp = await updateOwnerContractStatus({ contractId: row.contractId, status: nextStatus } as OwnerContractStatusDto);
    if (resp.code === 0) {
      message(`业主合同已${statusLabelMap[nextStatus]}`, { type: "success" });
      loadList();
      return;
    }
    message(resp.message || "更新合同状态失败", { type: "error" });
  }

  async function handleDelete(row: OwnerListRow) {
    if (!row.contractId) return;
    await ElMessageBox.confirm("删除后合同将不再出现在列表中，确认继续吗？", "删除业主合同", {
      type: "warning",
      confirmButtonText: "删除",
      confirmButtonClass: "el-button--danger"
    });
    const resp = await deleteOwnerContract({ contractId: row.contractId } as OwnerContractIdDto);
    if (resp.code === 0) {
      message("业主合同已删除", { type: "success" });
      loadList();
      return;
    }
    message(resp.message || "删除业主合同失败", { type: "error" });
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

  function goOwnerBills(row?: OwnerListRow) {
    if (!row?.ownerId) return;
    router.push({
      path: row.cooperationMode === "MASTER_LEASE" ? "/finance/owner-payable-bill" : "/finance/owner-settlement-bill",
      query: {
        ownerId: String(row.ownerId),
        contractId: row.contractId ? String(row.contractId) : ""
      }
    });
  }

  function goOwnerWithdraws(row?: OwnerListRow) {
    if (!row?.ownerId) return;
    router.push({
      path: "/finance/owner-withdraw",
      query: {
        ownerId: String(row.ownerId),
        contractId: row.contractId ? String(row.contractId) : ""
      }
    });
  }

  function billEntryText(row?: OwnerListRow) {
    return row?.cooperationMode === "MASTER_LEASE" ? "查看应付单" : "查看结算单";
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
