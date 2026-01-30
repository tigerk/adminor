<template>
  <transition name="el-fade-in-linear">
    <div v-if="lockStore.isLocked" class="lock-screen">
      <div class="lock-card">
        <div class="lock-header">
          <div class="lock-icon-wrapper">
            <el-icon :size="40" class="lock-icon"><Lock /></el-icon>
          </div>
          <h2 class="lock-title">系统已锁定</h2>
          <p class="lock-user">{{ userStore.username }}</p>
        </div>

        <div class="lock-body">
          <transition name="el-zoom-in-top">
            <div v-if="isWaiting" class="waiting-alert">
              <el-alert :title="`尝试次数过多，请在 ${waitTime} 秒后重试`" type="warning" :closable="false" show-icon center />
            </div>
          </transition>

          <div v-if="!isWaiting" class="input-area">
            <el-input v-model="password" type="password" placeholder="请输入登录密码解锁" show-password clearable @keyup.enter="onUnlock">
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>

            <el-button type="primary" class="w-full mt-4" :loading="loading" @click="onUnlock">立即解锁</el-button>
          </div>
        </div>

        <div class="lock-footer">
          <el-button link type="info" @click="toLogin">
            <el-icon class="mr-1"><SwitchButton /></el-icon>
            退出并重新登录
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import { useLockStoreHook } from "@/store/modules/lock";
  import { useUserStoreHook } from "@/store/modules/user";
  import { message } from "@/utils/message";
  import { Key, Lock, SwitchButton } from "@element-plus/icons-vue";

  const lockStore = useLockStoreHook();
  const userStore = useUserStoreHook();
  const password = ref("");
  const loading = ref(false);
  const now = ref(Date.now());

  let timer: any;
  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), 1000);
  });
  onUnmounted(() => clearInterval(timer));

  const waitTime = computed(() => {
    const diff = Math.ceil((lockStore.lockUntil - now.value) / 1000);
    return Math.max(diff, 0);
  });

  const isWaiting = computed(() => waitTime.value > 0);

  async function onUnlock() {
    if (!password.value) return;
    loading.value = true;
    try {
      const res = await userStore.loginByUsername({
        username: userStore.username,
        password: password.value
      });

      if (res.code === 0) {
        message("解锁成功", { type: "success" });
        lockStore.setLock(false);
        password.value = "";
      } else {
        lockStore.handleError();
        message("密码错误", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  }

  function toLogin() {
    lockStore.setLock(false);
    userStore.logOut();
  }
</script>

<style scoped>
  .lock-screen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    /* 使用 Element Plus 的背景变量，适配深浅色 */
    background-color: var(--el-bg-color-overlay);
    /* 增加毛玻璃效果 */
    backdrop-filter: blur(10px);
  }

  /* 适配深色模式的背景微调 */
  :deep(.dark) .lock-screen {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .lock-card {
    width: 360px;
    padding: 40px;
    border-radius: 12px;
    background: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);
    text-align: center;
  }

  .lock-header {
    margin-bottom: 30px;
  }

  .lock-icon-wrapper {
    margin-bottom: 16px;
    color: var(--el-color-primary);
  }

  .lock-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  .lock-user {
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  .lock-body {
    margin-bottom: 24px;
  }

  .waiting-alert {
    margin-bottom: 20px;
  }

  .lock-footer {
    margin-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 16px;
  }

  .w-full {
    width: 100%;
  }
</style>
