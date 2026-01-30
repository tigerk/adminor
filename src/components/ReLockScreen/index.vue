<template>
  <transition name="el-fade-in-linear">
    <div v-if="lockStore.isLocked" class="lock-screen">
      <!-- 背景装饰 -->
      <div class="lock-bg-pattern" />

      <div class="lock-card">
        <!-- 头部区域 -->
        <div class="lock-header">
          <div class="lock-icon-wrapper">
            <div class="icon-bg-circle" />
            <el-icon :size="48" class="lock-icon">
              <Lock />
            </el-icon>
          </div>
          <h2 class="lock-title">系统已锁定</h2>
          <div class="lock-user-info">
            <el-avatar :size="32" class="user-avatar" :src="userStore.avatar" />
            <p class="lock-user">{{ userStore.nickname }}</p>
          </div>
        </div>

        <!-- 主体内容 -->
        <div class="lock-body">
          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-wrapper">
              <el-input v-model="password" type="password" placeholder="请输入登录密码解锁" size="large" show-password class="password-input" @keyup.enter="onUnlock">
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>

            <el-button type="primary" size="large" class="unlock-btn" :loading="loading" @click="onUnlock">
              <el-icon v-if="!loading" class="mr-2"><Unlock /></el-icon>
              {{ loading ? "解锁中..." : "立即解锁" }}
            </el-button>

            <!-- 尝试次数提示 -->
            <div v-if="failedAttempts > 0" class="attempts-hint">
              <el-icon :size="14"><WarningFilled /></el-icon>
              <span>剩余尝试次数: {{ 3 - failedAttempts }}</span>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="lock-footer">
          <el-button link type="info" class="logout-btn" @click="toLogin">
            <el-icon class="mr-1"><SwitchButton /></el-icon>
            退出并重新登录
          </el-button>
        </div>
      </div>

      <!-- 时间显示 -->
      <div class="lock-time">
        {{ currentTime }}
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import { useLockStoreHook } from "@/store/modules/lock";
  import { useUserStoreHook } from "@/store/modules/user";
  import { message } from "@/utils/message";
  import { Key, Lock, SwitchButton, Unlock, WarningFilled } from "@element-plus/icons-vue";

  const lockStore = useLockStoreHook();
  const userStore = useUserStoreHook();
  const password = ref("");
  const loading = ref(false);
  const now = ref(Date.now());
  const failedAttempts = ref(0); // 本地统计错误次数

  let timer: any;
  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), 1000);
  });
  onUnmounted(() => clearInterval(timer));

  // 当前时间
  const currentTime = computed(() => {
    const date = new Date(now.value);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  });

  async function onUnlock() {
    if (!password.value) {
      message("请输入密码", { type: "warning" });
      return;
    }

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
        failedAttempts.value = 0; // 重置错误次数
        lockStore.startLockTimer();
      } else {
        failedAttempts.value++; // 累加错误次数

        // 检查是否已经达到3次
        if (failedAttempts.value >= 3) {
          message("密码错误次数过多，请重新登录", { type: "error" });
          // 延迟1秒后自动退出到登录页
          setTimeout(() => {
            failedAttempts.value = 0; // 重置错误次数
            toLogin();
          }, 1000);
        } else {
          message(`密码错误，剩余尝试次数: ${3 - failedAttempts.value}`, { type: "error" });
          password.value = "";
        }
      }
    } finally {
      loading.value = false;
    }
  }

  function toLogin() {
    lockStore.setLock(false);
    lockStore.clearLockTimer();
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
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
    backdrop-filter: blur(20px);
  }

  :deep(.dark) .lock-screen {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(20, 20, 30, 0.9) 100%);
  }

  /* 背景装饰图案 */
  .lock-bg-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image:
      radial-gradient(circle at 20% 50%, var(--el-color-primary) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--el-color-success) 0%, transparent 50%),
      radial-gradient(circle at 40% 20%, var(--el-color-warning) 0%, transparent 50%);
  }

  .lock-card {
    position: relative;
    width: 420px;
    padding: 48px 40px;
    border-radius: 16px;
    background: var(--el-bg-color);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04);
    text-align: center;
    animation: slideUp 0.4s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 头部样式 */
  .lock-header {
    margin-bottom: 36px;
  }

  .lock-icon-wrapper {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 96px;
    height: 96px;
    margin-bottom: 20px;
  }

  .icon-bg-circle {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  .lock-icon {
    position: relative;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .lock-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 16px 0;
    letter-spacing: 0.5px;
  }

  .lock-user-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }

  .user-avatar {
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    font-weight: 600;
  }

  .lock-user {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 16px;
    font-weight: 500;
  }

  /* 主体内容 */
  .lock-body {
    margin-bottom: 28px;
    min-height: 180px;
  }

  /* 输入区域 */
  .input-area {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 8px 0;
  }

  .input-wrapper {
    position: relative;
  }

  .input-wrapper::before {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: -1;
  }

  .input-wrapper:focus-within::before {
    opacity: 1;
  }

  .password-input {
    --el-input-focus-border-color: var(--el-color-primary);
  }

  .password-input :deep(.el-input__wrapper) {
    padding: 14px 18px;
    border-radius: 12px;
    background: var(--el-fill-color-light);
    border: 2px solid var(--el-border-color);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.06),
      inset 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
  }

  .password-input :deep(.el-input__wrapper:hover) {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-bg-color);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.08),
      inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .password-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--el-color-primary);
    background: var(--el-bg-color);
    box-shadow:
      0 4px 16px var(--el-color-primary-light-8),
      0 0 0 3px var(--el-color-primary-light-9);
  }

  .password-input :deep(.el-input__inner) {
    text-align: center; /* 核心代码：内容居中 */
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  /* 修正 placeholder 的居中（部分浏览器兼容性） */
  .password-input :deep(.el-input__inner::placeholder) {
    text-align: center;
  }

  .password-input :deep(.el-input__prefix) {
    position: absolute;
    left: 18px; /* 固定图标位置，不随文字居中而移动 */
    font-size: 18px;
    color: var(--el-text-color-secondary);
  }

  .password-input :deep(.el-input__wrapper.is-focus .el-input__prefix) {
    color: var(--el-color-primary);
  }

  .unlock-btn {
    width: 100%;
    height: 52px;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 1px;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border: none;
    box-shadow:
      0 6px 16px var(--el-color-primary-light-7),
      0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .unlock-btn::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .unlock-btn:hover {
    transform: translateY(-3px);
    box-shadow:
      0 8px 24px var(--el-color-primary-light-6),
      0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .unlock-btn:hover::before {
    left: 100%;
  }

  .unlock-btn:active {
    transform: translateY(-1px);
    box-shadow:
      0 4px 12px var(--el-color-primary-light-7),
      0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .unlock-btn:focus {
    outline: none;
    box-shadow:
      0 6px 16px var(--el-color-primary-light-7),
      0 0 0 3px var(--el-color-primary-light-9);
  }

  /* 深色模式下的按钮优化 */
  :deep(.dark) .unlock-btn {
    background: linear-gradient(135deg, var(--el-color-primary-light-1), var(--el-color-primary));
    box-shadow:
      0 6px 16px rgba(64, 158, 255, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3);
  }

  :deep(.dark) .unlock-btn:hover {
    box-shadow:
      0 8px 24px rgba(64, 158, 255, 0.5),
      0 4px 8px rgba(0, 0, 0, 0.4);
  }

  .attempts-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
    font-size: 13px;
  }

  /* 底部样式 */
  .lock-footer {
    margin-top: 24px;
  }

  .footer-divider {
    margin: 0 0 16px 0;
  }

  .logout-btn {
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .logout-btn:hover {
    transform: translateX(4px);
  }

  /* 时间显示 */
  .lock-time {
    position: absolute;
    top: 40px;
    right: 40px;
    font-size: 48px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    letter-spacing: 2px;
  }

  :deep(.dark) .lock-time {
    color: rgba(255, 255, 255, 0.7);
  }

  /* 响应式适配 */
  @media (max-width: 768px) {
    .lock-card {
      width: 90%;
      max-width: 380px;
      padding: 36px 28px;
    }

    .lock-time {
      top: 20px;
      right: 20px;
      font-size: 32px;
    }

    .lock-title {
      font-size: 24px;
    }
  }

  /* 工具类 */
  .mr-1 {
    margin-right: 4px;
  }

  .mr-2 {
    margin-right: 8px;
  }
</style>
