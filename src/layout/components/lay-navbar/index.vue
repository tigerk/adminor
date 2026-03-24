<script setup lang="ts">
  import LaySidebarThemeMode from "../lay-sidebar/components/SidebarThemeMode.vue";
  import { useNav } from "@/layout/hooks/useNav";
  import LaySearch from "../lay-search/index.vue";
  import LayNotice from "../lay-notice/index.vue";
  import LayNavMix from "../lay-sidebar/NavMix.vue";
  import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
  import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
  import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
  import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";
  import { useRouter } from "vue-router";

  import GlobalizationIcon from "@/assets/svg/globalization.svg?component";
  import AccountSettingsIcon from "~icons/ri/user-settings-line";
  import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
  import Setting from "~icons/ri/settings-3-line";
  import Check from "~icons/ep/check";
  import ShoppingCartIcon from "~icons/ri/shopping-cart-line";

  import CompanySwitcher from "./components/CompanySwitcher.vue"; // 引入公司切换组件
  import FunctionMenu from "./components/FunctionMenu.vue";

  const { layout, device, logout, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, toAccountSettings, getDropdownItemStyle, getDropdownItemClass } = useNav();

  const { t, locale, translationCh, translationTw, translationEn, translationJa, translationKo } = useTranslationLang();
  const router = useRouter();

  function goToOrder() {
    router.push("/company/order");
  }
</script>

<template>
  <div class="navbar bg-[#fff] shadow-xs shadow-[rgba(0,21,41,0.08)]">
    <LaySidebarTopCollapse v-if="device === 'mobile'" class="hamburger-container" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />

    <LaySidebarBreadCrumb v-if="layout !== 'mix' && device !== 'mobile'" class="breadcrumb-container" />

    <LayNavMix v-if="layout === 'mix'" />

    <div v-if="/vertical|double/.test(layout)" class="vertical-header-right">
      <!-- 公司切换组件 -->
      <CompanySwitcher />

      <!-- 功能菜单 -->
      <FunctionMenu :style="{ marginLeft: '15px' }" />
      <!-- 菜单搜索 -->
      <LaySearch v-if="false" id="header-search" />
      <!-- 国际化 -->
      <el-dropdown v-if="false" id="header-translation" trigger="click">
        <GlobalizationIcon class="navbar-bg-hover w-[40px] h-[48px] p-[11px] cursor-pointer outline-hidden" />
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'zh')" :class="['dark:text-white!', getDropdownItemClass(locale, 'zh')]" @click="translationCh">
              <IconifyIconOffline v-show="locale === 'zh'" class="check-btn" :icon="Check" />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'tw')" :class="['dark:text-white!', getDropdownItemClass(locale, 'tw')]" @click="translationTw">
              <IconifyIconOffline v-show="locale === 'tw'" class="check-btn" :icon="Check" />
              繁體中文
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'en')" :class="['dark:text-white!', getDropdownItemClass(locale, 'en')]" @click="translationEn">
              <span v-show="locale === 'en'" class="check-btn">
                <IconifyIconOffline :icon="Check" />
              </span>
              English
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'ja')" :class="['dark:text-white!', getDropdownItemClass(locale, 'ja')]" @click="translationJa">
              <span v-show="locale === 'ja'" class="check-btn">
                <IconifyIconOffline :icon="Check" />
              </span>
              日本語
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'ko')" :class="['dark:text-white!', getDropdownItemClass(locale, 'ko')]" @click="translationKo">
              <span v-show="locale === 'ko'" class="check-btn">
                <IconifyIconOffline :icon="Check" />
              </span>
              한국어
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 全屏 -->
      <LaySidebarFullScreen id="full-screen" />
      <!-- 主题模式 -->
      <LaySidebarThemeMode id="header-theme-mode" />
      <!-- 消息通知 -->
      <LayNotice id="header-notice" />
      <!-- 退出登录 -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <p v-if="username" class="dark:text-white">{{ username }}</p>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <!-- 立即订购 -->
            <el-dropdown-item class="order-menu-item" @click="goToOrder">
              <IconifyIconOffline :icon="ShoppingCartIcon" style="margin: 5px" />
              服务订购
            </el-dropdown-item>
            <el-divider style="margin: 4px 0" />
            <el-dropdown-item @click="toAccountSettings">
              <IconifyIconOffline :icon="AccountSettingsIcon" style="margin: 5px" />
              {{ t("buttons.pureAccountSettings") }}
            </el-dropdown-item>
            <el-dropdown-item class="logout-item" @click="logout">
              <IconifyIconOffline :icon="LogoutCircleRLine" style="margin: 5px" />
              {{ t("buttons.pureLoginOut") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span class="set-icon navbar-bg-hover" :title="t('buttons.pureOpenSystemSet')" @click="onPanel">
        <IconifyIconOffline :icon="Setting" />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .navbar {
    width: 100%;
    height: 48px;
    overflow: hidden;

    .hamburger-container {
      float: left;
      height: 100%;
      line-height: 48px;
      cursor: pointer;
    }

    .vertical-header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 280px;
      height: 48px;
      color: #000000d9;

      .el-dropdown-link {
        display: flex;
        align-items: center;
        justify-content: space-around;
        height: 48px;
        padding: 10px;
        color: #000000d9;
        cursor: pointer;

        p {
          font-size: 14px;
        }

        img {
          width: 22px;
          height: 22px;
          border-radius: 50%;
        }
      }
    }

    .breadcrumb-container {
      float: left;
      margin-left: 16px;
    }

    .order-btn {
      position: relative;
      height: 28px;
      padding: 0 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #fff !important;
      border: none !important;
      border-radius: 16px;
      background: linear-gradient(90deg, #ff4757, #ff6b81) !important;
      box-shadow: 0 2px 10px rgba(255, 71, 87, 0.5);
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s ease;

      // 流光扫过动画
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shine 2.5s infinite;
      }

      &:hover {
        transform: translateY(-1px) scale(1.03);
        box-shadow: 0 5px 16px rgba(255, 71, 87, 0.6);
        background: linear-gradient(90deg, #ff3347, #ff5a73) !important;
      }

      &:active {
        transform: scale(0.97);
      }
    }

    @keyframes shine {
      0% {
        left: -100%;
      }
      50% {
        left: 150%;
      }
      100% {
        left: 150%;
      }
    }
  }

  .translation {
    ::v-deep(.el-dropdown-menu__item) {
      padding: 5px 40px;
    }

    .check-btn {
      position: absolute;
      left: 20px;
    }
  }

  .logout {
    width: 120px;
    padding: 6px !important;
    border-radius: 10px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    overflow: hidden;

    ::v-deep(.el-dropdown-menu__item) {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      min-width: 100%;
      height: 38px;
      padding: 0 10px;
      border-radius: 6px;
      font-size: 13px;
      transition:
        background 0.18s ease,
        color 0.18s ease;

      &:hover {
        background: #f5f5f5 !important;
        color: #111 !important;
      }
    }

    // 分割线
    ::v-deep(.el-divider) {
      margin: 4px 0;
      border-color: rgba(0, 0, 0, 0.06);
    }

    // 订购项 — 移植 order-btn 流光渐变风格
    ::v-deep(.order-menu-item) {
      position: relative;
      margin-bottom: 2px;
      border-radius: 6px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #fff !important;
      background: linear-gradient(90deg, #ff4757, #ff6b81) !important;
      box-shadow: 0 2px 10px rgba(255, 71, 87, 0.4);
      overflow: hidden;
      transition: all 0.3s ease;

      // 流光动画
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shine 2.5s infinite;
      }

      &:hover {
        background: linear-gradient(90deg, #ff3347, #ff5a73) !important;
        box-shadow: 0 4px 14px rgba(255, 71, 87, 0.55) !important;
        color: #fff !important;
        transform: translateY(-1px);
      }

      &:active {
        transform: scale(0.97);
        box-shadow: none !important;
      }
    }

    // 退出登录项
    .logout-item {
      color: #999;

      &:hover {
        color: #ff4d4f !important;
        background: rgba(255, 77, 79, 0.06) !important;
      }
    }
  }
</style>
