<script setup lang="ts">
  import { type EventType, type ButtonProps, type DialogOptions, closeDialog, dialogStore } from "./index";
  import { ref, computed, h } from "vue";
  import { isFunction } from "@pureadmin/utils";
  import Fullscreen from "~icons/ri/fullscreen-fill";
  import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
  import { IconifyIconOffline } from "@/components/ReIcon";

  defineOptions({
    name: "ReDialog"
  });

  const sureBtnMap = ref({});
  const fullscreen = ref(false);

  const footerButtons = computed(() => {
    return (options: DialogOptions) => {
      return options?.footerButtons?.length > 0
        ? options.footerButtons
        : ([
            {
              label: "取消",
              text: true,
              bg: true,
              btnClick: ({ dialog: { options, index } }) => {
                const done = () => closeDialog(options, index, { command: "cancel" });
                if (options?.beforeCancel && isFunction(options?.beforeCancel)) {
                  options.beforeCancel(done, { options, index });
                } else {
                  done();
                }
              }
            },
            {
              label: "确定",
              type: "primary",
              text: true,
              bg: true,
              popconfirm: options?.popconfirm,
              btnClick: ({ dialog: { options, index } }) => {
                if (options?.sureBtnLoading) {
                  sureBtnMap.value[index] = Object.assign({}, sureBtnMap.value[index], {
                    loading: true
                  });
                }
                const closeLoading = () => {
                  if (options?.sureBtnLoading) {
                    sureBtnMap.value[index].loading = false;
                  }
                };
                const done = () => {
                  closeLoading();
                  closeDialog(options, index, { command: "sure" });
                };
                if (options?.beforeSure && isFunction(options?.beforeSure)) {
                  options.beforeSure(done, { options, index, closeLoading });
                } else {
                  done();
                }
              }
            }
          ] as Array<ButtonProps>);
    };
  });

  const fullscreenClass = computed(() => {
    return ["el-icon", "el-dialog__close", "-translate-x-2", "cursor-pointer", "hover:text-[red]!"];
  });

  // 全屏图标组件，复用原有 Iconify 图标
  const FullscreenIconComp = computed(() => h(IconifyIconOffline, { class: "pure-dialog-svg", icon: Fullscreen }));
  const ExitFullscreenIconComp = computed(() => h(IconifyIconOffline, { class: "pure-dialog-svg", icon: ExitFullscreen }));

  function eventsCallBack(event: EventType, options: DialogOptions, index: number, isClickFullScreen = false) {
    if (!isClickFullScreen) fullscreen.value = options?.fullscreen ?? false;
    if (options?.[event] && isFunction(options?.[event])) {
      return options?.[event]({ options, index });
    }
  }

  function handleClose(options: DialogOptions, index: number, args = { command: "close" }) {
    closeDialog(options, index, args);
    eventsCallBack("close", options, index);
  }
</script>

<template>
  <el-dialog
    v-for="(options, index) in dialogStore"
    :key="index"
    v-bind="options"
    v-model="options.visible"
    class="pure-dialog"
    :fullscreen="fullscreen ? true : options?.fullscreen ? true : false"
    @closed="handleClose(options, index)"
    @opened="eventsCallBack('open', options, index)"
    @openAutoFocus="eventsCallBack('openAutoFocus', options, index)"
    @closeAutoFocus="eventsCallBack('closeAutoFocus', options, index)"
  >
    <!-- header -->
    <template v-if="options?.fullscreenIcon || options?.headerRenderer" #header="{ close, titleId, titleClass }">
      <!-- 全屏图标模式：改造为新样式 -->
      <div v-if="options?.fullscreenIcon" class="dialog-header">
        <div class="header-left">
          <span class="header-mark" aria-hidden="true">
            <IconifyIconOffline icon="ri/window-line" />
          </span>
          <span :id="titleId" class="header-title">{{ options?.title }}</span>
        </div>
        <!-- 全屏切换按钮，保留原有功能，仅样式换成 el-button circle -->
        <el-button
          v-if="!options?.fullscreen"
          class="close-btn"
          circle
          size="small"
          @click="
            () => {
              fullscreen = !fullscreen;
              eventsCallBack('fullscreenCallBack', { ...options, fullscreen }, index, true);
            }
          "
        >
          <IconifyIconOffline class="pure-dialog-svg" :icon="options?.fullscreen ? ExitFullscreen : fullscreen ? ExitFullscreen : Fullscreen" />
        </el-button>
      </div>
      <!-- 自定义 headerRenderer 模式，不改变 -->
      <component :is="options?.headerRenderer({ close, titleId, titleClass })" v-else />
    </template>

    <component v-bind="options?.props" :is="options.contentRenderer({ options, index })" @close="args => handleClose(options, index, args)" />

    <!-- footer -->
    <template v-if="!options?.hideFooter" #footer>
      <template v-if="options?.footerRenderer">
        <component :is="options?.footerRenderer({ options, index })" />
      </template>
      <span v-else>
        <template v-for="(btn, key) in footerButtons(options)" :key="key">
          <el-popconfirm
            v-if="btn.popconfirm"
            v-bind="btn.popconfirm"
            @confirm="
              btn.btnClick({
                dialog: { options, index },
                button: { btn, index: key }
              })
            "
          >
            <template #reference>
              <el-button v-bind="btn">{{ btn?.label }}</el-button>
            </template>
          </el-popconfirm>
          <el-button
            v-else
            v-bind="btn"
            :loading="key === 1 && sureBtnMap[index]?.loading"
            @click="
              btn.btnClick({
                dialog: { options, index },
                button: { btn, index: key }
              })
            "
          >
            {{ btn?.label }}
          </el-button>
        </template>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
  /* ===== 改造后的 Dialog Header 样式 ===== */
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-mark {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    flex-shrink: 0;
  }

  .header-mark :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .close-btn {
    border: none;
    background: transparent;
  }
</style>
