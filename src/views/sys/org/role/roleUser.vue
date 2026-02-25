<script setup lang="ts">
  import { ref, watch, computed } from "vue";
  import { message } from "@/utils/message";
  import { ElMessageBox } from "element-plus";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Delete from "~icons/ep/delete";
  import { UserVo } from "@/types";
  import { unbindRoleCompanyUser } from "@/api/sys/user";

  interface Props {
    visible?: boolean;
    roleInfo?: {
      id: number | string;
      name: string;
    } | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    roleInfo: null
  });

  const emit = defineEmits<{
    (e: "update:visible", value: boolean): void;
    (e: "refresh"): void;
  }>();

  const drawerVisible = computed({
    get: () => props.visible,
    set: val => emit("update:visible", val)
  });

  const loading = ref(false);
  const dataList = ref<UserVo[]>([]);

  // 表格列配置
  const columns: TableColumnList = [
    {
      label: "用户账号",
      prop: "username",
      minWidth: 120
    },
    {
      label: "用户昵称",
      prop: "nickname",
      minWidth: 120
    },
    {
      label: "手机号码",
      prop: "phone",
      minWidth: 130
    },
    {
      label: "邮箱",
      prop: "email",
      minWidth: 180
    },
    {
      label: "部门",
      prop: "dept.name",
      minWidth: 150
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  // 加载用户列表数据
  const loadUserList = async () => {
    if (!props.roleInfo?.id) return;

    loading.value = true;
    try {
      const { getUserByRoleId } = await import("@/api/sys/user");
      const resp = await getUserByRoleId({ id: props.roleInfo.id });

      if (resp.code === 0) {
        dataList.value = resp.data || [];
      } else {
        message(resp.message, { type: "error" });
      }
    } catch (error) {
      console.error("加载用户列表失败:", error);
      message("加载用户列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  // 解绑用户
  const handleUnbind = (row: UserVo) => {
    ElMessageBox.confirm(
      `确认要将用户 <strong style='color:var(--el-color-primary)'>${row.nickname || row.username}</strong> 从角色 <strong style='color:var(--el-color-primary)'>${props.roleInfo?.name}</strong> 中移除吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        try {
          const resp = await unbindRoleCompanyUser({
            roleId: props.roleInfo.id,
            companyUserId: row.companyUserId
          });

          if (resp.code === 0) {
            message(`已将用户 ${row.nickname || row.username} 从角色中移除`, {
              type: "success"
            });
            // 重新加载列表
            loadUserList().then();
            // 通知父组件刷新（如果需要）
            emit("refresh");
          } else {
            message(resp.message, { type: "error" });
          }
        } catch (error) {
          console.error("移除用户失败:", error);
          message("移除用户失败", { type: "error" });
        }
      })
      .catch(() => {
        // 用户取消操作
      });
  };

  // 监听抽屉打开，加载数据
  watch(
    () => props.visible,
    val => {
      if (val && props.roleInfo) {
        loadUserList();
      }
    }
  );
</script>

<template>
  <el-drawer v-model="drawerVisible" :title="`《${props.roleInfo?.name || ''}》的分配用户列表`" direction="rtl" size="60%">
    <template #default>
      <div class="drawer-content">
        <pure-table
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          adaptive
          border
          :adaptiveConfig="{ offsetBottom: 20 }"
          :data="dataList"
          :columns="columns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row, size }">
            <el-button class="reset-margin" link type="danger" :size="size" :icon="useRenderIcon(Delete)" @click="handleUnbind(row)">移除</el-button>
          </template>
        </pure-table>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
  .drawer-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
