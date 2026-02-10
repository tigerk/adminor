<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import dayjs from "dayjs";
  import type { PaginationProps } from "@pureadmin/table";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { deleteNotice, getNoticeDetail, getNoticePage, saveNotice } from "@/api/sys-notice";
  import { NOTICE_NOTICE_TYPE_ENUM, NOTICE_NOTICE_TYPE_HELPER, NOTICE_TARGET_SCOPE_ENUM, NOTICE_TARGET_SCOPE_HELPER } from "@/constants";
  import { message } from "@/utils/message";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { getSimpleRoleList } from "@/api/sys/user";
  import Plus from "~icons/ep/plus";
  import EditPen from "~icons/ep/edit-pen";
  import Delete from "~icons/ep/delete";

  defineOptions({
    name: "SysNoticeNotice"
  });

  const loading = ref(false);
  const dataList = ref([]);
  const dialogVisible = ref(false);
  const dialogLoading = ref(false);
  const formRef = ref();
  const editMeta = reactive({
    createByName: "" as string,
    publishTime: "" as string
  });

  const form = reactive({
    id: undefined as number | undefined,
    title: "",
    content: "",
    noticeType: 1,
    targetScope: 1,
    roleIds: [] as number[]
  });

  const rules = {
    title: [{ required: true, message: "请输入公告标题", trigger: "blur" }],
    content: [{ required: true, message: "请输入公告内容", trigger: "blur" }],
    noticeType: [{ required: true, message: "请选择公告类型", trigger: "change" }],
    roleIds: [
      {
        validator: (_rule, value, callback) => {
          if (form.targetScope === 4 && (!value || value.length === 0)) {
            callback(new Error("请选择指定角色"));
            return;
          }
          callback();
        },
        trigger: "change"
      }
    ]
  };

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const noticeTypeOptions = Object.values(NOTICE_NOTICE_TYPE_ENUM).map(item => ({
    label: item.name,
    value: item.code
  }));

  const targetScopeOptions = Object.values(NOTICE_TARGET_SCOPE_ENUM).map(item => ({
    label: item.name,
    value: item.code
  }));

  const roleOptions = ref<Array<{ label: string; value: number }>>([]);

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
      prop: "noticeType",
      minWidth: 140,
      formatter: ({ noticeType }) => NOTICE_NOTICE_TYPE_HELPER.getNameByCode(noticeType)
    },
    {
      label: "发送范围",
      prop: "targetScope",
      minWidth: 140,
      formatter: ({ targetScope }) => NOTICE_TARGET_SCOPE_HELPER.getNameByCode(targetScope)
    },
    {
      label: "发布时间",
      prop: "publishTime",
      minWidth: 180,
      formatter: ({ publishTime }) => (publishTime ? dayjs(publishTime).format("YYYY-MM-DD HH:mm:ss") : "-")
    },
    {
      label: "操作",
      prop: "operation",
      width: 150,
      fixed: "right",
      slot: "operation"
    }
  ];

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getNoticePage({
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

  function openCreateDialog() {
    form.id = undefined;
    form.title = "";
    form.content = "";
    form.noticeType = 1;
    form.targetScope = 1;
    form.roleIds = [];
    editMeta.createByName = "";
    editMeta.publishTime = "";
    dialogVisible.value = true;
  }

  async function openEditDialog(row) {
    dialogLoading.value = true;
    try {
      const { data, code } = await getNoticeDetail({ id: row.id });
      if (code !== 0) return;
      const notice = data?.notice ?? row;
      form.id = notice.id;
      form.title = notice.title || "";
      form.content = notice.content || "";
      form.noticeType = notice.noticeType ?? 1;
      form.targetScope = notice.targetScope ?? 1;
      form.roleIds = (data?.roleIds ?? []).map(id => String(id));
      editMeta.createByName = notice.createByName || "-";
      editMeta.publishTime = notice.publishTime ? dayjs(notice.publishTime).format("YYYY-MM-DD HH:mm:ss") : "-";
      dialogVisible.value = true;
    } finally {
      dialogLoading.value = false;
    }
  }

  async function handleSubmit() {
    if (!formRef.value) return;
    if (form.targetScope === 4 && (!form.roleIds || form.roleIds.length === 0)) {
      message("请选择指定角色", { type: "warning" });
      return;
    }
    await formRef.value.validate();
    dialogLoading.value = true;
    try {
      const { code } = await saveNotice({
        id: form.id,
        title: form.title,
        content: form.content,
        noticeType: form.noticeType,
        targetScope: form.targetScope,
        roleIds: form.targetScope === 4 ? form.roleIds : []
      });
      if (code === 0) {
        message(form.id ? "修改成功" : "发布成功", { type: "success" });
        dialogVisible.value = false;
        fetchList();
      }
    } finally {
      dialogLoading.value = false;
    }
  }

  async function handleDelete(row) {
    const { code } = await deleteNotice({ id: row.id });
    if (code === 0) {
      message("删除成功", { type: "success" });
      fetchList();
    }
  }

  function handleDialogClosed() {
    formRef.value?.resetFields();
  }

  onMounted(() => {
    fetchList();
    getSimpleRoleList().then(({ data }) => {
      roleOptions.value = (data || []).map(item => ({
        label: item.roleName ?? item.name ?? item.label ?? item.code,
        value: String(item.id ?? item.value)
      }));
    });
  });

  watch(
    () => form.targetScope,
    value => {
      if (value !== 4) {
        form.roleIds = [];
      }
    }
  );
</script>

<template>
  <div class="main">
    <PureTableBar title="系统公告" :columns="columns" @refresh="fetchList">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openCreateDialog">发布公告</el-button>
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
          :adaptiveConfig="{ offsetBottom: 110 }"
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
            <el-button link type="primary" :size="size" :icon="useRenderIcon(EditPen)" @click="openEditDialog(row)">修改</el-button>
            <el-popconfirm title="确定删除该公告吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" :size="size" :icon="useRenderIcon(Delete)">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-dialog v-model="dialogVisible" :title="form.id ? '修改公告' : '发布公告'" :lock-scroll="true" :align-center="true" width="540px" @closed="handleDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="top">
        <el-form-item v-if="form.id" label="发布人">
          <el-input :model-value="editMeta.createByName" disabled />
        </el-form-item>
        <el-form-item v-if="form.id" label="发布时间">
          <el-input :model-value="editMeta.publishTime" disabled />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="noticeType">
          <el-select v-model="form.noticeType" placeholder="请选择公告类型" class="w-full">
            <el-option v-for="item in noticeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="范围">
          <el-select v-model="form.targetScope" placeholder="请选择发布范围" class="w-full">
            <el-option v-for="item in targetScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 4" label="指定角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple filterable clearable placeholder="请选择角色" class="w-full">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
