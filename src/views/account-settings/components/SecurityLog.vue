<script setup lang="tsx">
  import dayjs from "dayjs";
  import { getMineLogs } from "@/api/login";
  import { onMounted, reactive, ref } from "vue";
  import type { PaginationProps } from "@pureadmin/table";
  import { Refresh } from "@element-plus/icons-vue";
  import { IconifyIconOnline } from "@/components/ReIcon";

  defineOptions({
    name: "SecurityLog"
  });

  const loading = ref(true);
  const fetching = ref(false);
  const dataList = ref([]);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
    layout: "total, prev, pager, next, jumper"
  });

  const columns: TableColumnList = [
    {
      label: "操作详情",
      prop: "title",
      minWidth: 200,
      cellRenderer: ({ row }) => (
        <div class="log-summary">
          <div class="summary-main">{row.title || row.requestUrl}</div>
        </div>
      )
    },
    {
      label: "IP 地址",
      prop: "ipAddress",
      minWidth: 140,
      cellRenderer: ({ row }) => (
        <el-space>
          <IconifyIconOnline icon="ri-global-line" />
          <span>{row.ipAddress}</span>
        </el-space>
      )
    },
    {
      label: "地理位置",
      prop: "location",
      minWidth: 160,
      cellRenderer: ({ row }) => (
        <el-space>
          <IconifyIconOnline icon="ri-map-pin-line" />
          <span>{row.location || "未知"}</span>
        </el-space>
      )
    },
    {
      label: "设备信息",
      prop: "os",
      minWidth: 180,
      cellRenderer: ({ row }) => (
        <el-space>
          <IconifyIconOnline icon="ri-computer-line" />
          <span>{row.os || "未知"}</span>
          <IconifyIconOnline icon="ri-window-line" />
          <span>{row.browser || "未知"}</span>
        </el-space>
      )
    },
    {
      label: "操作时间",
      prop: "requestAt",
      minWidth: 180,
      cellRenderer: ({ row }) => (
        <el-space>
          <IconifyIconOnline icon="ri-time-line" />
          <span>{dayjs(row.requestAt).format("YYYY-MM-DD HH:mm:ss")}</span>
        </el-space>
      )
    }
  ];

  async function onSearch() {
    if (fetching.value) return;
    fetching.value = true;
    loading.value = true;
    try {
      const { data } = await getMineLogs({
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      dataList.value = data?.list ?? [];
      pagination.total = Number(data?.total ?? 0);
      pagination.pageSize = Number(data?.pageSize ?? pagination.pageSize);
      pagination.currentPage = Number(data?.currentPage ?? pagination.currentPage);
    } catch (error) {
      console.error("获取日志失败", error);
    } finally {
      loading.value = false;
      fetching.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });
</script>

<template>
  <div class="security-log-container">
    <div class="page-header">
      <div class="header-left">
        <h3>安全日志</h3>
        <p class="description">查看您的账户登录和操作记录，保障账户安全</p>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" :loading="loading" @click="onSearch">刷新</el-button>
      </div>
    </div>

    <!-- 安全提示卡片 -->
    <el-card class="security-tip-card" shadow="hover">
      <div class="tip-content">
        <div class="tip-icon">
          <el-icon><IconifyIconOnline icon="ri-shield-check-line" /></el-icon>
        </div>
        <div class="tip-info">
          <h4>安全提醒</h4>
          <p>如发现异常登录记录，请立即修改密码并联系管理员。定期检查登录日志有助于及时发现账户安全问题。</p>
        </div>
      </div>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="log-table-card" shadow="never">
      <pure-table
        row-key="id"
        border
        table-layout="auto"
        :loading="loading"
        :data="dataList"
        :columns="columns"
        :pagination="{ ...pagination, hideOnSinglePage: false }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #empty>
          <el-empty description="暂无日志记录" :image-size="120" />
        </template>
      </pure-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
  .security-log-container {
    max-width: 1200px;
    margin: 0 auto;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .header-left {
        h3 {
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .description {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin: 0;
        }
      }

      .header-right {
        @media (max-width: 768px) {
          width: 100%;

          .el-button {
            width: 100%;
          }
        }
      }
    }

    .security-tip-card {
      margin-bottom: 24px;
      border-radius: 8px;
      border: 1px solid var(--el-color-warning-light-7);
      background: var(--el-color-warning-light-9);

      .tip-content {
        display: flex;
        gap: 16px;

        .tip-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: var(--el-color-warning-light-8);
          color: var(--el-color-warning);
          flex-shrink: 0;

          .el-icon {
            font-size: 24px;
          }
        }

        .tip-info {
          flex: 1;

          h4 {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 6px 0;
          }

          p {
            font-size: 13px;
            color: var(--el-text-color-regular);
            margin: 0;
            line-height: 1.6;
          }
        }
      }
    }

    .log-table-card {
      border-radius: 8px;
      border: 1px solid var(--el-card-border-color);

      :deep(.el-card__body) {
        padding: 0;
      }

      :deep(.el-table) {
        --el-table-border-color: var(--el-border-color-lighter);

        .el-table__header {
          th {
            background: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
            font-weight: 600;
          }
        }

        .el-table__body {
          tr {
            &:hover {
              background: var(--el-fill-color-lighter);
            }
          }
        }
      }

      :deep(.el-pagination) {
        padding: 16px;
        justify-content: flex-end;
      }
    }
  }

  // 表格内容样式
  .log-summary {
    .summary-main {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
  }
</style>
