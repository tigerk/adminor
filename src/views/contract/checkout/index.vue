<template>
  <div class="main">
    <el-row class="bg-bg_color w-full px-4 pt-[12px]">
      <el-col :span="24">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.checkoutCode" placeholder="退租单编号" clearable class="!w-[180px]" @keyup.enter="onSearch" @clear="onSearch" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.tenantName" placeholder="租客姓名" clearable class="!w-[160px]" @keyup.enter="onSearch" @clear="onSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.checkoutType" placeholder="退租类型" clearable class="!w-[140px]" @change="onSearch">
              <el-option v-for="item in CHECKOUT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.status" placeholder="退租状态" clearable class="!w-[140px]" @change="onSearch">
              <el-option v-for="item in CHECKOUT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.approvalStatus" placeholder="审批状态" clearable class="!w-[140px]" @change="onSearch">
              <el-option v-for="item in approvalOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="onSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <el-row class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <pure-table
        border
        row-key="id"
        alignWhole="center"
        :show-overflow-tooltip="true"
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 73 }"
        :data="tableData"
        :size="tableSize as any"
        :columns="columns"
        :pagination="pagination"
        :header-cell-style="{ background: 'var(--el-fill-color-light)', color: 'var(--el-text-color-primary)' }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <el-button link type="primary" :icon="useRenderIcon(View)" @click="openDetail(row)">查看</el-button>
        </template>
      </pure-table>
    </el-row>
    <el-dialog v-model="detailVisible" title="退租详情" width="60%" top="5vh" :destroy-on-close="true" align-center lock-scroll>
      <ViewCheckoutTab :loading="detailLoading" :checkout-detail="detailData" @updated="handleDetailUpdated" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Search from "~icons/ep/search";
  import Refresh from "~icons/ep/refresh";
  import View from "~icons/ep/view";
  import { APPROVAL_STATUS_META, CHECKOUT_STATUS_OPTIONS, CHECKOUT_TYPE_OPTIONS } from "@/constants";
  import { getCheckoutDetail, queryCheckoutList } from "@/api/contract/checkout";
  import type { LeaseCheckoutVo, LeaseCheckoutQueryDto } from "@/types";
  import ViewCheckoutTab from "@/views/contract/checkout/view/ViewCheckoutTab.vue";

  defineOptions({
    name: "LeaseCheckoutList"
  });

  const queryFormRef = ref();
  const loading = ref(false);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<LeaseCheckoutVo | null>(null);

  const tableSize = ref("default");
  const tableData = ref<LeaseCheckoutVo[]>([]);

  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    pageSizes: [10, 20, 30, 50]
  });

  const queryForm = reactive<LeaseCheckoutQueryDto>({
    checkoutCode: "",
    tenantName: "",
    checkoutType: undefined,
    status: undefined,
    approvalStatus: undefined,
    currentPage: "1",
    pageSize: "10"
  });

  const approvalOptions = [
    { label: "审批中", value: APPROVAL_STATUS_META.PENDING.code },
    { label: "已通过", value: APPROVAL_STATUS_META.APPROVED.code },
    { label: "已驳回", value: APPROVAL_STATUS_META.REJECTED.code },
    { label: "已撤回", value: APPROVAL_STATUS_META.WITHDRAWN.code }
  ];

  const columns = [
    { label: "退租单编号", prop: "checkoutCode", minWidth: 150 },
    { label: "租客姓名", prop: "tenantName", minWidth: 120 },
    { label: "联系电话", prop: "tenantPhone", minWidth: 130 },
    { label: "房源地址", prop: "roomAddress", minWidth: 220 },
    {
      label: "合同到期日",
      prop: "leaseEnd",
      minWidth: 120,
      formatter: (row: LeaseCheckoutVo) => (row.leaseEnd ? dayjs(row.leaseEnd).format("YYYY-MM-DD") : "-")
    },
    {
      label: "实际退租日",
      prop: "actualCheckoutDate",
      minWidth: 120,
      formatter: (row: LeaseCheckoutVo) => (row.actualCheckoutDate ? dayjs(row.actualCheckoutDate).format("YYYY-MM-DD") : "-")
    },
    {
      label: "押金金额",
      prop: "depositAmount",
      minWidth: 110,
      formatter: (row: LeaseCheckoutVo) => (row.depositAmount == null ? "-" : `¥${row.depositAmount}`)
    },
    {
      label: "结算金额",
      prop: "finalAmount",
      minWidth: 110,
      formatter: (row: LeaseCheckoutVo) => (row.finalAmount == null ? "-" : `¥${row.finalAmount}`)
    },
    { label: "退租状态", prop: "statusName", minWidth: 110 },
    { label: "审批状态", prop: "approvalStatusName", minWidth: 110 },
    { label: "操作", prop: "operation", minWidth: 120, slot: "operation" }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const res = await queryCheckoutList({
        ...queryForm,
        currentPage: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString()
      });

      if (res.code === 0) {
        const data = res.data as any;
        tableData.value = data?.list || [];
        pagination.total = Number(data?.total || 0);
        pagination.currentPage = Number(data?.currentPage || pagination.currentPage);
        pagination.pageSize = Number(data?.pageSize || pagination.pageSize);
      }
    } finally {
      loading.value = false;
    }
  }

  function onSearch() {
    pagination.currentPage = 1;
    fetchList();
  }

  function resetQuery() {
    queryForm.checkoutCode = "";
    queryForm.tenantName = "";
    queryForm.checkoutType = undefined;
    queryForm.status = undefined;
    queryForm.approvalStatus = undefined;
    pagination.currentPage = 1;
    fetchList();
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    fetchList();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    fetchList();
  }

  async function openDetail(row: LeaseCheckoutVo) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const res = await getCheckoutDetail(row.id);
      if (res.code === 0) {
        detailData.value = res.data || null;
      } else {
        detailData.value = null;
      }
    } finally {
      detailLoading.value = false;
    }
  }

  async function handleDetailUpdated() {
    await fetchList();
    if (!detailData.value?.id) return;
    await openDetail({ id: detailData.value.id } as LeaseCheckoutVo);
  }

  onMounted(fetchList);
</script>

<style scoped lang="scss"></style>
