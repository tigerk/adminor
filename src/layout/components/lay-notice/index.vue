<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { ref, computed, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import dayjs from "dayjs";
  import type { ListItem, TabItem } from "./data";
  import NoticeList from "./components/NoticeList.vue";
  import BellIcon from "~icons/ep/bell";
  import { getRecentNotice, markMessageRead, markNoticeRead } from "@/api/sys-notice";
  import { NOTICE_TODO_PRIORITY_HELPER, NOTICE_TODO_STATUS_HELPER } from "@/constants";

  const { t } = useI18n();
  const notices = ref<TabItem[]>([]);
  const activeKey = ref("1");
  const router = useRouter();
  const noticeCounts = ref({
    unreadNoticeCount: 0,
    unreadMessageCount: 0,
    pendingTodoCount: 0
  });

  const unreadNoticeCount = computed(() => {
    return Number(noticeCounts.value.unreadNoticeCount || 0);
  });

  const unreadMessageCount = computed(() => {
    return Number(noticeCounts.value.unreadMessageCount || 0);
  });

  const pendingTodoCount = computed(() => {
    return Number(noticeCounts.value.pendingTodoCount || 0);
  });

  const noticesNum = computed(() => unreadNoticeCount.value + unreadMessageCount.value + pendingTodoCount.value);

  const getLabel = computed(() => (item: TabItem) => {
    if (item.key === "1") {
      return t(item.name) + (unreadNoticeCount.value > 0 ? `(${unreadNoticeCount.value})` : "");
    }
    if (item.key === "2") {
      return t(item.name) + (unreadMessageCount.value > 0 ? `(${unreadMessageCount.value})` : "");
    }
    if (item.key === "3") {
      return t(item.name) + (pendingTodoCount.value > 0 ? `(${pendingTodoCount.value})` : "");
    }
    return t(item.name);
  });

  function formatTime(time?: string) {
    if (!time) return "";
    return dayjs(time).format("YYYY-MM-DD HH:mm");
  }

  function mapMessageList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      id: item?.id,
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.createTime),
      type: "2",
      isRead: item?.isRead ?? false
    }));
  }

  function mapNoticeList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      id: item?.id,
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.publishTime),
      type: "1",
      isRead: item?.isRead ?? false
    }));
  }

  function mapTodoList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      id: item?.id,
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.createTime),
      type: "3",
      status: item?.status,
      priority: item?.priority,
      todoStatus: item?.status,
      extra: NOTICE_TODO_STATUS_HELPER.getNameByCode(item?.status)
    }));
  }

  async function loadRecentNotices() {
    try {
      const { data, code } = await getRecentNotice({ days: 3 });
      if (code !== 0) {
        notices.value = [];
        return;
      }
      const messages = mapMessageList(data?.messages ?? []);
      const noticeList = mapNoticeList(data?.notices ?? []);
      const todoList = mapTodoList(data?.todos ?? []);
      noticeCounts.value = {
        unreadNoticeCount: Number(data?.unreadNoticeCount ?? 0),
        unreadMessageCount: Number(data?.unreadMessageCount ?? 0),
        pendingTodoCount: Number(data?.pendingTodoCount ?? 0)
      };

      notices.value = [
        {
          key: "1",
          name: "status.pureNotify",
          list: noticeList,
          emptyText: "status.pureNoNotify"
        },
        {
          key: "2",
          name: "status.pureMessage",
          list: messages,
          emptyText: "status.pureNoMessage"
        },
        {
          key: "3",
          name: "status.pureTodo",
          list: todoList,
          emptyText: "status.pureNoTodo"
        }
      ];
    } catch {
      notices.value = [];
    }
  }

  async function handleItemRead(item: ListItem) {
    if (!item?.id) return;
    if (item.type === "2") {
      const { code } = await markMessageRead({ id: item.id });
      if (code === 0) {
        const msgTab = notices.value.find(tab => tab.key === "2");
        const target = msgTab?.list?.find(msg => msg.id === item.id);
        if (target) {
          target.isRead = true;
        }
        if (noticeCounts.value.unreadMessageCount > 0) {
          noticeCounts.value.unreadMessageCount -= 1;
        }
      }
    } else if (item.type === "1") {
      const { code } = await markNoticeRead({ id: item.id });
      if (code === 0) {
        const noticeTab = notices.value.find(tab => tab.key === "1");
        const target = noticeTab?.list?.find(notice => notice.id === item.id);
        if (target) {
          target.isRead = true;
        }
        if (noticeCounts.value.unreadNoticeCount > 0) {
          noticeCounts.value.unreadNoticeCount -= 1;
        }
      }
    }
  }

  function handleViewAll(key: string) {
    const pathMap: Record<string, string> = {
      "1": "/sys-notice/notice",
      "2": "/sys-notice/message",
      "3": "/sys-notice/todo"
    };
    const target = pathMap[key];
    if (target) {
      router.push(target);
    }
  }

  onMounted(() => {
    loadRecentNotices();
  });
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end">
    <span :class="['dropdown-badge', 'navbar-bg-hover', 'select-none', Number(noticesNum) !== 0 && 'mr-[10px]']">
      <el-badge :value="Number(noticesNum) === 0 ? '' : noticesNum" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs v-model="activeKey" :stretch="true" class="dropdown-tabs" :style="{ width: notices.length === 0 ? '200px' : '330px' }">
          <el-empty v-if="notices.length === 0" :description="t('status.pureNoMessage')" :image-size="60" />
          <span v-else>
            <template v-for="item in notices" :key="item.key">
              <el-tab-pane :label="getLabel(item)" :name="`${item.key}`">
                <el-scrollbar max-height="330px">
                  <div class="noticeList-container">
                    <NoticeList :list="item.list" :emptyText="item.emptyText" @item-click="handleItemRead" />
                    <div class="noticeList-footer">
                      <el-button link type="primary" @click="handleViewAll(item.key)">查看全部消息</el-button>
                    </div>
                  </div>
                </el-scrollbar>
              </el-tab-pane>
            </template>
          </span>
        </el-tabs>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
  .dropdown-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 48px;
    cursor: pointer;

    .header-notice-icon {
      font-size: 18px;
    }
  }

  .dropdown-tabs {
    .noticeList-container {
      padding: 15px 24px 0;
    }
    .noticeList-footer {
      padding: 8px 0 12px;
      text-align: center;
    }

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap)::after {
      height: 1px;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0 36px;
    }
  }
</style>
