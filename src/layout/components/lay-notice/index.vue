<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { ref, computed, onMounted } from "vue";
  import dayjs from "dayjs";
  import type { ListItem, TabItem } from "./data";
  import NoticeList from "./components/NoticeList.vue";
  import BellIcon from "~icons/ep/bell";
  import { getRecentNotice } from "@/api/sys-notice";

  const { t } = useI18n();
  const notices = ref<TabItem[]>([]);
  const activeKey = ref("1");

  const noticesNum = computed(() => notices.value.reduce((sum, item) => sum + item.list.length, 0));

  const getLabel = computed(() => (item: TabItem) => t(item.name) + (item.list.length > 0 ? `(${item.list.length})` : ""));

  function formatTime(time?: string) {
    if (!time) return "";
    return dayjs(time).format("YYYY-MM-DD HH:mm");
  }

  function mapMessageList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.createTime),
      type: "2"
    }));
  }

  function mapNoticeList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.publishTime),
      type: "1"
    }));
  }

  function mapTodoList(list: any[] = []): ListItem[] {
    return list.map(item => ({
      avatar: "",
      title: item?.title ?? "",
      description: item?.content ?? "",
      datetime: formatTime(item?.createTime),
      type: "3"
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
                    <NoticeList :list="item.list" :emptyText="item.emptyText" />
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
