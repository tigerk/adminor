<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { deleteMessage, getMessageAdminPage, sendMessage } from "@/api/sys-notice";
  import { NOTICE_MESSAGE_TYPE_HELPER, NOTICE_MESSAGE_TYPE_META } from "@/constants";
  import { message } from "@/utils/message";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Plus from "~icons/ep/plus";
  import Delete from "~icons/ep/delete";
  import { pageUserList } from "@/api/sys/user";

  defineOptions({
    name: "SysNoticeMessage"
  });

  const loading = ref(false);
  const dataList = ref([]);
  const dialogVisible = ref(false);
  const dialogLoading = ref(false);
  const formRef = ref();
  const userOptions = ref<Array<{ label: string; value: number }>>([]);
  const form = reactive({
    receiverId: undefined as number | undefined,
    title: "",
    content: "",
    msgType: NOTICE_MESSAGE_TYPE_META.SYSTEM.code
  });

  const rules = {
    receiverId: [{ required: true, message: "请选择接收人", trigger: "change" }],
    title: [{ required: true, message: "请输入消息标题", trigger: "blur" }],
    content: [{ required: true, message: "请输入消息内容", trigger: "blur" }],
    msgType: [{ required: true, message: "请选择消息类型", trigger: "change" }]
  };

  const msgTypeOptions = Object.values(NOTICE_MESSAGE_TYPE_META).map(item => ({
    label: item.name,
    value: item.code
  }));

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
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
      prop: "msgType",
      minWidth: 140,
      formatter: ({ msgType }) => NOTICE_MESSAGE_TYPE_HELPER.getNameByCode(msgType)
    },
    {
      label: "接收人",
      prop: "receiverName",
      minWidth: 140,
      formatter: ({ receiverName, receiverId }) => receiverName || receiverId || "-"
    },
    {
      label: "时间",
      prop: "createTime",
      minWidth: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    {
      label: "操作",
      prop: "operation",
      width: 120,
      fixed: "right",
      slot: "operation"
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getMessageAdminPage({
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

  function openSendDialog() {
    form.receiverId = undefined;
    form.title = "";
    form.content = "";
    form.msgType = NOTICE_MESSAGE_TYPE_META.SYSTEM.code;
    dialogVisible.value = true;
  }

  async function handleSubmit() {
    if (!formRef.value) return;
    await formRef.value.validate();
    dialogLoading.value = true;
    try {
      const { code } = await sendMessage({
        receiverId: form.receiverId as number,
        title: form.title,
        content: form.content,
        msgType: form.msgType
      });
      if (code === 0) {
        message("发送成功", { type: "success" });
        dialogVisible.value = false;
        fetchList();
      }
    } finally {
      dialogLoading.value = false;
    }
  }

  function handleDialogClosed() {
    formRef.value?.resetFields();
  }

  async function handleDelete(row) {
    const { code } = await deleteMessage({ id: row.id });
    if (code === 0) {
      message("删除成功", { type: "success" });
      fetchList();
    }
  }

  onMounted(() => {
    fetchList();
    pageUserList({ currentPage: 1, pageSize: 2000 }).then(({ data }) => {
      const list = data?.list ?? [];
      userOptions.value = list.map(item => ({
        label: item.nickname ?? item.username ?? item.name ?? item.label ?? item.phone ?? item.id,
        value: item.id ?? item.userId ?? item.value
      })).filter(item => item.value != null);
    });
  });
</script>

<template>
  <div class="main">
    <PureTableBar title="个人消息" :columns="columns" @refresh="fetchList">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openSendDialog">发送消息</el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          :border="true"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          adaptive
          :adaptiveConfig="{ offsetBottom: 82 }"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="{ ...pagination, size }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <el-popconfirm title="确定删除该消息吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" :size="size" :icon="useRenderIcon(Delete)">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-dialog v-model="dialogVisible" title="发送消息" :lock-scroll="true" :align-center="true" width="540px" @closed="handleDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="top">
        <el-form-item label="接收人" prop="receiverId">
          <el-select v-model="form.receiverId" filterable placeholder="请选择接收人" class="w-full">
            <el-option v-for="item in userOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="msgType">
          <el-select v-model="form.msgType" placeholder="请选择消息类型" class="w-full">
            <el-option v-for="item in msgTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入消息标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入消息内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
