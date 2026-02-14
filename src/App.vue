<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReLockScreen />
    <ReDialog />
    <ReDrawer />
<!--    <ReFloatButton v-if="isLoggedIn" :floatBtns="floatBtns" />-->
  </el-config-provider>
</template>
<script lang="ts">
  import { defineComponent } from "vue";
  import { checkVersion } from "version-rocket";
  import { ElConfigProvider } from "element-plus";
  import { ReDialog } from "@/components/ReDialog";
  import { ReDrawer } from "@/components/ReDrawer";
  import { ReLockScreen } from "@/components/ReLockScreen";
  import en from "element-plus/es/locale/lang/en";
  import ja from "element-plus/es/locale/lang/ja";
  import ko from "element-plus/es/locale/lang/ko";
  import zhCn from "element-plus/es/locale/lang/zh-cn";
  import zhTw from "element-plus/es/locale/lang/zh-tw";
  import plusEn from "plus-pro-components/es/locale/lang/en";
  import plusZhCn from "plus-pro-components/es/locale/lang/zh-cn";
  import ReFloatButton from "@/components/ReFloatButton";
  import Book from "~icons/ri/book-open-line";
  import Max from "~icons/ri/vip-diamond-line";
  import { useUserStoreHook } from "@/store/modules/user";
  import { useLockStoreHook } from "@/store/modules/lock";

  export default defineComponent({
    name: "app",
    components: {
      [ElConfigProvider.name]: ElConfigProvider,
      ReDialog,
      ReDrawer,
      ReLockScreen,
      ReFloatButton
    },
    computed: {
      currentLocale() {
        switch (this.$storage.locale?.locale) {
          case "zh":
            return { ...zhCn, ...plusZhCn };
          case "en":
            return { ...en, ...plusEn };
          case "tw":
            return { ...zhTw, ...plusEn };
          case "ja":
            return { ...ja, ...plusEn };
          case "ko":
            return { ...ko, ...plusEn };
          default:
            return { ...zhCn, ...plusZhCn };
        }
      },
      floatBtns() {
        return [
          {
            tip: "产品说明书",
            icon: Book,
            link: "https://my.feishu.cn/wiki/Be2CwzRXjiCrzxkA8Facbkbxnpc?from=from_copylink",
            show: false
          },
          {
            tip: "问题反馈",
            link: "https://v.wjx.cn/vm/YiIVWFH.aspx#",
            icon: Max,
            show: false
          }
        ];
      },
      isLoggedIn() {
        const userStore = useUserStoreHook();
        return !!userStore.username || !!userStore.roles.length;
      }
    },
    mounted() {
      // 如果用户已登录，启动锁屏定时器
      if (this.isLoggedIn) {
        const lockStore = useLockStoreHook();
        lockStore.startLockTimer();
      }
    },
    beforeUnmount() {
      // 组件销毁时清除定时器
      const lockStore = useLockStoreHook();
      lockStore.clearLockTimer();
    },
    beforeCreate() {
      const { version, name: title } = __APP_INFO__.pkg;
      const { VITE_PUBLIC_PATH, MODE } = import.meta.env;
      if (MODE === "production") {
        checkVersion(
          {
            pollingTime: 300000,
            localPackageVersion: version,
            originVersionFileUrl: `${location.origin}${VITE_PUBLIC_PATH}version.json`
          },
          {
            title,
            description: "检测到新版本",
            buttonText: "立即更新"
          }
        );
      }
    }
  });
</script>
