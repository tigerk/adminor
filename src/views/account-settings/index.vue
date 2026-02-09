<script setup lang="ts">
  import { useRouter } from "vue-router";
  import { computed, onBeforeMount, ref } from "vue";
  import { ReText } from "@/components/ReText";
  import Profile from "./components/Profile.vue";
  import Preferences from "./components/Preferences.vue";
  import SecurityLog from "./components/SecurityLog.vue";
  import { deviceDetection, useGlobal } from "@pureadmin/utils";
  import AccountManagement from "./components/AccountManagement.vue";
  import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

  import leftLine from "~icons/ri/arrow-left-s-line";
  import { useUserStoreHook } from "@/store/modules/user";

  defineOptions({
    name: "AccountSettings"
  });

  const router = useRouter();
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  onBeforeMount(() => {
    useDataThemeChange().dataThemeChange($storage.layout?.themeMode);
  });

  const panes = [
    {
      key: "profile",
      label: "个人信息",
      icon: "ri-user-3-line",
      component: Profile,
      description: "管理个人资料和头像"
    },
    {
      key: "accountManagement",
      label: "账户管理",
      icon: "ri-lock-password-line",
      component: AccountManagement,
      description: "密码、手机、邮箱管理"
    },
    // {
    //   key: "preferences",
    //   label: "偏好设置",
    //   icon: "ri-settings-3-line",
    //   component: Preferences,
    //   description: "通知和显示偏好"
    // },
    {
      key: "securityLog",
      label: "安全日志",
      icon: "ri-shield-check-line",
      component: SecurityLog,
      description: "登录和操作记录"
    }
  ];

  const activeTab = ref("profile");
  const isMobile = deviceDetection();

  // 直接映射 Store 里的值，具有响应性
  const userAvatar = computed(() => useUserStoreHook().avatar);
  const userNickname = computed(() => useUserStoreHook().nickname);
  const userUsername = computed(() => useUserStoreHook().username);
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
        <el-avatar :size="48" :src="userAvatar">
          <i class="ri-user-3-line" />
        </el-avatar>
        <div class="user-info">
          <ReText class="username">{{ userNickname }}</ReText>
          <ReText class="user-account" type="info">{{ userUsername }}</ReText>
        </div>
      </div>
    </div>

    <!-- 左右布局内容区域 -->
    <div class="settings-content">
      <!-- 左侧导航 -->
      <div class="settings-sidebar">
        <div class="sidebar-title">设置导航</div>
        <div class="nav-list">
          <div v-for="pane in panes" :key="pane.key" class="nav-item" :class="{ active: activeTab === pane.key }" @click="activeTab = pane.key">
            <div class="nav-item-icon">
              <IconifyIconOnline :icon="pane.icon" />
            </div>
            <div class="nav-item-content">
              <div class="nav-item-label">{{ pane.label }}</div>
              <div class="nav-item-desc">{{ pane.description }}</div>
            </div>
            <div class="nav-item-indicator">
              <i class="ri-arrow-right-s-line" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="settings-main">
        <transition name="fade-slide" mode="out-in">
          <component :is="panes.find(p => p.key === activeTab)?.component" :key="activeTab" />
        </transition>
      </div>
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
      display: flex;
      gap: 24px;
      min-height: 600px;

      @media (max-width: 1024px) {
        flex-direction: column;
        gap: 16px;
      }

      .settings-sidebar {
        width: 280px;
        flex-shrink: 0;
        background: var(--el-bg-color);
        border-radius: 12px;
        box-shadow: var(--el-box-shadow-light);
        padding: 24px 0;
        height: fit-content;
        position: sticky;
        top: 20px;

        @media (max-width: 1024px) {
          width: 100%;
          position: static;
        }

        .sidebar-title {
          padding: 0 24px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--el-text-color-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--el-border-color-lighter);
        }

        .nav-list {
          padding: 8px 12px;

          @media (max-width: 1024px) {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
          }

          @media (max-width: 640px) {
            grid-template-columns: 1fr;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 12px;
            margin-bottom: 4px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;

            &::before {
              content: "";
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 3px;
              height: 0;
              background: var(--el-color-primary);
              border-radius: 0 3px 3px 0;
              transition: height 0.3s ease;
            }

            &:hover {
              background: var(--el-fill-color-light);

              .nav-item-icon {
                transform: scale(1.1);
                color: var(--el-color-primary);
              }

              .nav-item-indicator {
                transform: translateX(2px);
                opacity: 1;
              }
            }

            &.active {
              background: linear-gradient(90deg, var(--el-color-primary-light-9) 0%, transparent 100%);

              &::before {
                height: 60%;
              }

              .nav-item-icon {
                background: var(--el-color-primary);
                color: white;
              }

              .nav-item-label {
                color: var(--el-color-primary);
                font-weight: 600;
              }

              .nav-item-indicator {
                opacity: 1;
                color: var(--el-color-primary);
              }
            }

            .nav-item-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: var(--el-fill-color-light);
              color: var(--el-text-color-regular);
              flex-shrink: 0;
              transition: all 0.3s ease;

              i {
                font-size: 20px;
              }
            }

            .nav-item-content {
              flex: 1;
              min-width: 0;

              .nav-item-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 2px;
                transition: all 0.3s ease;
              }

              .nav-item-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .nav-item-indicator {
              font-size: 18px;
              color: var(--el-text-color-secondary);
              opacity: 0;
              transition: all 0.3s ease;
              flex-shrink: 0;
            }
          }
        }
      }

      .settings-main {
        flex: 1;
        background: var(--el-bg-color);
        border-radius: 12px;
        box-shadow: var(--el-box-shadow-light);
        padding: 32px;
        min-height: 600px;

        @media (max-width: 768px) {
          padding: 20px 16px;
        }
      }
    }
  }

  // 过渡动画
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.3s ease;
  }

  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
</style>
