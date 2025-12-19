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

  import GlobalizationIcon from "@/assets/svg/globalization.svg?component";
  import AccountSettingsIcon from "~icons/ri/user-settings-line";
  import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
  import Setting from "~icons/ri/settings-3-line";
  import Check from "~icons/ep/check";
  import { ref } from "vue";

  import { setToken } from "@/utils/auth";
  import { switchCompany } from "@/api/login";
  import { ElMessage } from "element-plus";

  import FunctionMenu from "../../../components/Business/FunctionMenu.vue";
  import { message } from "@/utils/message"; // 导入功能菜单组件

  const {
    layout,
    device,
    logout,
    onPanel,
    pureApp,
    username,
    userAvatar,
    avatarsStyle,
    toggleSideBar,
    toAccountSettings,
    getDropdownItemStyle,
    getDropdownItemClass,
    getCurCompanyId,
    getCompanyList
  } = useNav();
  const selectedCompanyId = ref<any>(getCurCompanyId);
  console.log("current login companyId:" + selectedCompanyId.value);

  const currentCompanyName = getCompanyList.value.find(item => item.companyId === selectedCompanyId.value)?.companyName || "";

  const { t, locale, translationCh, translationTw, translationEn, translationJa, translationKo } = useTranslationLang();

  // 处理公司切换事件
  const handleCompanyChange = (companyId: string) => {
    if (companyId) {
      // 实现切换公司的逻辑，比如调用API等
      console.log("Switching to company:", companyId);
      // 示例：调用API切换公司
      switchCompany({ companyId: companyId }).then(r => {
        if (r.code == 0) {
          setToken(r.data);
          message("正在切换公司，请稍后...", {
            duration: 2000
          });
          window.location.reload();
        } else {
          ElMessage.error(r.message);
        }
      });
    }
  };
</script>

<template>
  <div class="navbar bg-[#fff] shadow-xs shadow-[rgba(0,21,41,0.08)]">
    <LaySidebarTopCollapse v-if="device === 'mobile'" class="hamburger-container" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />

    <LaySidebarBreadCrumb v-if="layout !== 'mix' && device !== 'mobile'" class="breadcrumb-container" />

    <LayNavMix v-if="layout === 'mix'" />

    <div v-if="/vertical|double/.test(layout)" class="vertical-header-right">
      <!-- 公司切换下拉菜单 -->
      <el-dropdown trigger="click" split-button class="company-dropdown">
        {{ currentCompanyName }}
        <template #dropdown>
          <el-dropdown-menu class="company-menu">
            <el-dropdown-item
              v-for="item in getCompanyList"
              :key="item.companyId"
              :class="{ 'is-selected': item.companyId === selectedCompanyId }"
              @click="handleCompanyChange(item.companyId)"
            >
              <div class="company-item">
                <span class="company-name">{{ item.companyName }}</span>
                <el-icon v-if="item.companyId === selectedCompanyId" class="check-icon" color="#409EFF">
                  <Check />
                </el-icon>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

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
            <el-dropdown-item @click="toAccountSettings">
              <IconifyIconOffline :icon="AccountSettingsIcon" style="margin: 5px" />
              {{ t("buttons.pureAccountSettings") }}
            </el-dropdown-item>
            <el-dropdown-item @click="logout">
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

    ::v-deep(.el-dropdown-menu__item) {
      display: inline-flex;
      flex-wrap: wrap;
      min-width: 100%;
    }
  }

  .company-dropdown {
    .company-selector {
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      background: #f5f7fa;
      min-width: 200px;

      .company-title {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }

      .company-current {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        color: #333;

        .arrow-icon {
          margin-left: 8px;
          transition: transform 0.3s;
        }
      }

      &:hover {
        background: #e6f7ff;

        .arrow-icon {
          transform: rotate(180deg);
        }
      }
    }
  }

  .company-menu {
    min-width: 150px;

    ::v-deep(.el-dropdown-menu__item) {
      padding: 0;

      &.is-selected {
        background: #e6f7ff;
        color: #409eff;
      }

      .company-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 16px;

        .company-name {
          flex: 1;
          font-size: 14px;
        }

        .check-icon {
          font-size: 16px;
        }

        .forbidden-btn {
          font-size: 12px;
          padding: 2px 8px;
          height: 24px;
          border-color: #d9d9d9;
          color: #666;
        }
      }
    }
  }
</style>
