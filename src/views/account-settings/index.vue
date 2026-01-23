<script setup lang="ts">
  import { useRouter } from "vue-router";
  import { onBeforeMount, ref } from "vue";
  import { ReText } from "@/components/ReText";
  import Profile from "./components/Profile.vue";
  import Preferences from "./components/Preferences.vue";
  import SecurityLog from "./components/SecurityLog.vue";
  import { deviceDetection, useGlobal } from "@pureadmin/utils";
  import AccountManagement from "./components/AccountManagement.vue";
  import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

  import leftLine from "~icons/ri/arrow-left-s-line";
  import ProfileIcon from "~icons/ri/user-3-line";
  import PreferencesIcon from "~icons/ri/settings-3-line";
  import SecurityLogIcon from "~icons/ri/shield-check-line";
  import AccountManagementIcon from "~icons/ri/lock-password-line";
  import { getUserProfile } from "@/api/login";

  defineOptions({
    name: "AccountSettings"
  });

  const router = useRouter();
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  onBeforeMount(() => {
    useDataThemeChange().dataThemeChange($storage.layout?.themeMode);
  });

  const userInfo = ref({
    avatar: "",
    username: "",
    nickname: ""
  });

  const panes = [
    {
      key: "profile",
      label: "个人信息",
      icon: ProfileIcon,
      component: Profile
    },
    {
      key: "accountManagement",
      label: "账户管理",
      icon: AccountManagementIcon,
      component: AccountManagement
    },
    {
      key: "preferences",
      label: "偏好设置",
      icon: PreferencesIcon,
      component: Preferences
    },
    {
      key: "securityLog",
      label: "安全日志",
      icon: SecurityLogIcon,
      component: SecurityLog
    }
  ];

  const activeTab = ref("profile");

  getUserProfile().then(res => {
    userInfo.value = res.data;
  });
</script>

<template>
  <div class="account-settings-wrapper">
    <!-- 页面头部 -->
    <div class="settings-header">
      <div class="header-left">
        <el-button text class="back-button" @click="router.go(-1)">
          <IconifyIconOffline :icon="leftLine" class="back-icon" />
          <span>返回</span>
        </el-button>
        <div class="header-divider" />
        <div class="header-title">
          <h2>账户设置</h2>
          <p class="subtitle">管理您的账户信息与偏好设置</p>
        </div>
      </div>
      <div class="header-right">
        <el-avatar :size="48" :src="userInfo.avatar">
          <IconifyIconOffline :icon="ProfileIcon" />
        </el-avatar>
        <div class="user-info">
          <ReText class="username">{{ userInfo.nickname }}</ReText>
          <ReText class="user-account" type="info">{{ userInfo.username }}</ReText>
        </div>
      </div>
    </div>

    <!-- Tab 导航和内容区域 -->
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs" :stretch="deviceDetection()">
        <el-tab-pane v-for="pane in panes" :key="pane.key" :name="pane.key">
          <template #label>
            <div class="tab-label">
              <el-icon><IconifyIconOffline :icon="pane.icon" /></el-icon>
              <span>{{ pane.label }}</span>
            </div>
          </template>
          <div class="tab-content">
            <component :is="pane.component" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .account-settings-wrapper {
    min-height: 100vh;
    background-color: var(--el-bg-color-page);
    padding: 20px;

    @media (max-width: 768px) {
      padding: 12px;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: var(--el-bg-color);
      border-radius: 12px;
      box-shadow: var(--el-box-shadow-light);

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        @media (max-width: 768px) {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: var(--el-text-color-regular);
          transition: all 0.3s;

          &:hover {
            color: var(--el-color-primary);
            transform: translateX(-2px);
          }

          .back-icon {
            font-size: 18px;
          }
        }

        .header-divider {
          width: 1px;
          height: 32px;
          background: var(--el-border-color);

          @media (max-width: 768px) {
            display: none;
          }
        }

        .header-title {
          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1.2;
          }

          .subtitle {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;

        @media (max-width: 768px) {
          width: 100%;
          padding-top: 12px;
          border-top: 1px solid var(--el-border-color-lighter);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .username {
            font-size: 15px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .user-account {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .settings-content {
      background: var(--el-bg-color);
      border-radius: 12px;
      box-shadow: var(--el-box-shadow-light);
      overflow: hidden;

      .settings-tabs {
        :deep(.el-tabs__header) {
          margin: 0;
          border-bottom: 1px solid var(--el-border-color-lighter);
          background: var(--el-bg-color);
        }

        :deep(.el-tabs__nav-wrap) {
          padding: 0 24px;

          @media (max-width: 768px) {
            padding: 0 12px;
          }
        }

        :deep(.el-tabs__item) {
          height: 56px;
          line-height: 56px;
          font-size: 14px;
          color: var(--el-text-color-regular);
          transition: all 0.3s;

          &:hover {
            color: var(--el-color-primary);
          }

          &.is-active {
            color: var(--el-color-primary);
            font-weight: 500;
          }
        }

        :deep(.el-tabs__active-bar) {
          height: 3px;
          background: var(--el-color-primary);
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;

          .el-icon {
            font-size: 16px;
          }
        }

        .tab-content {
          padding: 32px 24px;
          min-height: 500px;

          @media (max-width: 768px) {
            padding: 20px 12px;
          }
        }
      }
    }
  }
</style>
