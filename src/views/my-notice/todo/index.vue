<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { getTodoMyPage, handleTodo, markTodoRead, markTodoReadBatch } from "@/api/sys-notice";
  import { NOTICE_TODO_PRIORITY_HELPER, NOTICE_TODO_STATUS_HELPER, NOTICE_TODO_TYPE_HELPER } from "@/constants";
  import { message } from "@/utils/message";

  defineOptions({
    name: "MyNoticeTodo"
  });

  const loading = ref(false);
  const dataList = ref([]);
  const tableRef = ref();
  const selectedRows = ref([]);
  const selectedIds = computed(() => selectedRows.value.map(item => item?.id).filter(Boolean));

  const handleDialogVisible = ref(false);
  const handleDialogLoading = ref(false);
  const handleFormRef = ref();
  const handleForm = reactive({
    id: undefined as number | undefined,
    handleRemark: ""
  });
  const handleRules = {
    handleRemark: [{ required: true, message: "请输入处理备注", trigger: "blur" }]
  };

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left",
      width: 48
    },
    {
      label: "标题",
      prop: "title",
      minWidth: 200
    },
    {
      label: "内容",
      prop: "content",
      minWidth: 280,
      showOverflowTooltip: true
    },
    {
      label: "类型",
      prop: "todoType",
      minWidth: 140,
      formatter: ({ todoType }) => NOTICE_TODO_TYPE_HELPER.getNameByCode(todoType)
    },
    {
      label: "优先级",
      prop: "priority",
      minWidth: 100,
      formatter: ({ priority }) => NOTICE_TODO_PRIORITY_HELPER.getNameByCode(priority)
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      formatter: ({ status }) => NOTICE_TODO_STATUS_HELPER.getNameByCode(status)
    },
    {
      label: "时间",
      prop: "createTime",
      minWidth: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    {
      label: "已读",
      prop: "isRead",
      minWidth: 90,
      formatter: ({ isRead }) => (isRead ? "已读" : "未读")
    },
    {
      label: "操作",
      prop: "operation",
      width: 160,
      fixed: "right",
      slot: "operation"
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getTodoMyPage({
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      dataList.value = data?.list ?? [];
      pagination.total = Number(data?.total ?? 0);
      pagination.pageSize = Number(data?.pageSize ?? pagination.pageSize);
      pagination.currentPage = Number(data?.currentPage ?? pagination.currentPage);
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    fetchList();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    fetchList();
  }

  function handleSelectionChange(rows) {
    selectedRows.value = rows || [];
  }

  async function handleRead(row) {
    if (!row?.id || row?.isRead) return;
    const { code } = await markTodoRead({ id: row.id });
    if (code === 0) {
      message("已读确认成功", { type: "success" });
      fetchList();
    }
  }

  async function handleBatchRead() {
    if (selectedIds.value.length === 0) {
      message("请先选择需要已读确认的待办", { type: "warning" });
      return;
    }
    const { code } = await markTodoReadBatch({ ids: selectedIds.value });
    if (code === 0) {
      message("批量已读确认成功", { type: "success" });
      tableRef.value?.getTableRef()?.clearSelection();
      fetchList();
    }
  }

  function openHandleDialog(row) {
    handleForm.id = row?.id;
    handleForm.handleRemark = "";
    handleDialogVisible.value = true;
  }

  async function submitHandle() {
    if (!handleFormRef.value) return;
    await handleFormRef.value.validate();
    handleDialogLoading.value = true;
    try {
      const { code } = await handleTodo({
        id: handleForm.id as number,
        handleRemark: handleForm.handleRemark
      });
      if (code === 0) {
        message("已处理成功", { type: "success" });
        handleDialogVisible.value = false;
        fetchList();
      }
    } finally {
      handleDialogLoading.value = false;
    }
  }

  function handleDialogClosed() {
    handleFormRef.value?.resetFields();
  }

  onMounted(() => {
    fetchList();
  });
</script>

<template>
  <div class="main">
    <PureTableBar title="我的待办" :columns="columns" @refresh="fetchList">
      <template #buttons>
        <el-button type="primary" :disabled="selectedIds.length === 0" @click="handleBatchRead">批量已读</el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          row-key="id"
          :border="true"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 110 }"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <el-button link type="primary" :size="size" :disabled="row?.isRead" @click="handleRead(row)">已读</el-button>
            <el-button link type="success" :size="size" :disabled="row?.status !== 0" @click="openHandleDialog(row)">已处理</el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-dialog v-model="handleDialogVisible" title="已处理确认" :lock-scroll="true" :align-center="true" width="520px" @closed="handleDialogClosed">
      <el-form ref="handleFormRef" :model="handleForm" :rules="handleRules" label-width="90px" label-position="top">
        <el-form-item label="处理备注" prop="handleRemark">
          <el-input v-model="handleForm.handleRemark" type="textarea" :rows="4" placeholder="请输入处理备注" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleDialogLoading" @click="submitHandle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
