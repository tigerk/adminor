import { defineStore } from "pinia";
import { store } from "@/store";
import { ACTIVE_TIMEOUT } from "@/utils/auth";

interface LockState {
  isLocked: boolean;
  errorCount: number;
  lockUntil: number;
  lockTimer: number | null; // 添加定时器ID
}

export const useLockStore = defineStore("pure-lock", {
  state: (): LockState => ({
    isLocked: localStorage.getItem("isLocked") === "true",
    errorCount: 0,
    lockUntil: 0,
    lockTimer: null
  }),
  actions: {
    setLock(status: boolean) {
      this.isLocked = status;
      localStorage.setItem("isLocked", String(status));
      if (!status) {
        this.errorCount = 0;
        this.lockUntil = 0;
      }
    },
    handleError() {
      this.errorCount++;
      if (this.errorCount >= 3) {
        this.lockUntil = Date.now() + 60 * 1000;
      }
    },
    // 启动自动锁屏定时器
    startLockTimer() {
      // 清除旧的定时器
      this.clearLockTimer();

      // 设置新的定时器
      this.lockTimer = window.setTimeout(() => {
        console.log("自动锁屏触发");
        this.setLock(true);
      }, ACTIVE_TIMEOUT);
    },
    // 清除定时器
    clearLockTimer() {
      if (this.lockTimer) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }
    },
    // 重置定时器（每次请求时调用）
    resetLockTimer() {
      if (!this.isLocked) {
        this.startLockTimer();
      }
    }
  }
});

export function useLockStoreHook() {
  return useLockStore(store);
}
