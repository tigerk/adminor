<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import Motion from "./utils/motion";
  import { useRouter } from "vue-router";
  import { message } from "@/utils/message";
  import { loginRules } from "./utils/rule";
  import { debounce } from "@pureadmin/utils";
  import { useNav } from "@/layout/hooks/useNav";
  import { useEventListener } from "@vueuse/core";
  import type { FormInstance } from "element-plus";
  import { useLayout } from "@/layout/hooks/useLayout";
  import { useUserStoreHook } from "@/store/modules/user";
  import { initRouter, getTopMenu } from "@/router/utils";
  import { ref, reactive, computed } from "vue";
  import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
  import { useTrialApplicationDialog } from "./components/useTrialApplicationDialog";

  import LoginRegister from "./components/LoginRegister.vue";
  import LoginUpdate from "./components/LoginUpdate.vue";

  import User from "~icons/ri/user-3-fill";
  import Lock from "~icons/ri/lock-fill";
  import Eye from "~icons/ri/eye-line";
  import EyeOff from "~icons/ri/eye-off-line";
  import dayIcon from "@/assets/svg/day.svg?component";
  import darkIcon from "@/assets/svg/dark.svg?component";

  defineOptions({ name: "Login" });

  const router = useRouter();
  const loading = ref(false);
  const showPassword = ref(false);
  const disabled = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const currentPage = ref("login");
  const agreementVisible = ref(false);
  const { openTrialApplicationDialog } = useTrialApplicationDialog();

  const { t } = useI18n();
  const { initStorage } = useLayout();
  initStorage();
  const { dataTheme, themeMode, dataThemeChange } = useDataThemeChange();
  dataThemeChange(themeMode.value);
  const { title, getLogo } = useNav();

  const loginForm = reactive({ username: "", password: "" });

  const heroContent = computed(() => {
    const map: Record<string, { eyebrow: string; title: string; desc: string }> = {
      login: {
        eyebrow: "Enterprise Platform",
        title: "租住业务<br/><em>智能工作台</em>",
        desc: "覆盖房源管理、合同签署、财务核算与审批流程，为企业管理员提供一站式租住业务协同平台。"
      },
      register: {
        eyebrow: "Create Workspace",
        title: "创建你的<br/><em>业务工作台</em>",
        desc: "按步骤完成主体信息、联系人和安全设置，系统会自动初始化公司档案与默认权限。"
      },
      forgot: {
        eyebrow: "Password Recovery",
        title: "安全重置<br/><em>登录密码</em>",
        desc: "使用手机号、图形校验和短信验证码完成身份确认，整个过程在当前页面内快速完成。"
      }
    };
    return map[currentPage.value] || map.login;
  });

  const onLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loading.value = true;
        useUserStoreHook()
          .loginByUsername({ username: loginForm.username, password: loginForm.password })
          .then(res => {
            if (res.code == 0) {
              return initRouter().then(() => {
                disabled.value = true;
                router
                  .push(getTopMenu(true).path)
                  .then(() => {
                    message(t("login.pureLoginSuccess"), { type: "success" });
                  })
                  .finally(() => (disabled.value = false));
              });
            } else {
              message(res.message, { type: "error" });
            }
          })
          .finally(() => (loading.value = false));
      }
    });
  };

  const switchPage = (page: string) => {
    currentPage.value = page;
  };

  const immediateDebounce: any = debounce(formRef => onLogin(formRef), 1000, true);

  useEventListener(document, "keydown", ({ code }) => {
    if (["Enter", "NumpadEnter"].includes(code) && !disabled.value && !loading.value && currentPage.value === "login") {
      immediateDebounce(ruleFormRef.value);
    }
  });
</script>

<template>
  <div :class="['lw-shell', dataTheme ? 'dark' : '']">
    <!-- ══ LEFT: BRAND PANEL ══ -->
    <div class="brand-panel">
      <div class="brand-panel__bg" />
      <div class="brand-panel__grid" />

      <!-- Top bar -->
      <div class="brand-top">
        <div class="brand-logo">
          <div class="brand-logo__mark">
            <img :src="getLogo()" alt="logo" />
          </div>
          <div class="brand-logo__text">
            <strong>{{ title }}</strong>
            <span>Management Suite</span>
          </div>
        </div>
        <button class="theme-toggle" @click="dataThemeChange(!dataTheme)">
          <component :is="dataTheme ? dayIcon : darkIcon" />
        </button>
      </div>

      <!-- Hero -->
      <div class="brand-hero">
        <div class="brand-hero__eyebrow">{{ heroContent.eyebrow }}</div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <h1 v-html="heroContent.title" />
        <p>{{ heroContent.desc }}</p>
      </div>

      <!-- Stats cards -->
      <div class="brand-cards">
        <div class="brand-card">
          <div class="brand-card__num">12k+</div>
          <div class="brand-card__label">活跃企业用户</div>
        </div>
        <div class="brand-card">
          <div class="brand-card__num">98%</div>
          <div class="brand-card__label">客户满意度</div>
        </div>
        <div class="brand-card">
          <div class="brand-card__num">5yr</div>
          <div class="brand-card__label">稳定运营时间</div>
        </div>
      </div>
    </div>

    <!-- ══ RIGHT: AUTH PANEL ══ -->
    <div class="auth-panel">
      <div class="auth-container" :class="{ 'auth-container--wide': currentPage === 'register' }">
        <!-- LOGIN PAGE -->
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'login'" key="login" class="auth-card">
            <div class="auth-card__accent" />
            <div class="auth-card__head">
              <h2>欢迎回来</h2>
              <p>登录您的账户以继续使用系统</p>
            </div>

            <div class="auth-card__body">
              <el-form ref="ruleFormRef" :model="loginForm" :rules="loginRules" class="lw-form">
                <el-form-item prop="username">
                  <div class="form-group">
                    <label class="form-label">账号</label>
                    <div class="form-input-wrap">
                      <el-input v-model="loginForm.username" class="lw-input" clearable placeholder="用户名 / 手机号 / 邮箱">
                        <template #prefix>
                          <el-icon class="lw-prefix-icon"><User /></el-icon>
                        </template>
                      </el-input>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item prop="password">
                  <div class="form-group">
                    <label class="form-label">密码</label>
                    <div class="form-input-wrap">
                      <el-input v-model="loginForm.password" class="lw-input" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码">
                        <template #prefix>
                          <el-icon class="lw-prefix-icon"><Lock /></el-icon>
                        </template>
                        <template #suffix>
                          <el-icon class="lw-suffix-icon" @click="showPassword = !showPassword">
                            <Eye v-if="showPassword" />
                            <EyeOff v-else />
                          </el-icon>
                        </template>
                      </el-input>
                    </div>
                  </div>
                </el-form-item>

                <div class="form-row">
                  <div class="form-security">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    SSL 加密传输
                  </div>
                  <button type="button" class="form-link" @click="currentPage = 'forgot'">忘记密码？</button>
                </div>

                <button type="button" class="btn-submit" :class="{ loading: loading }" :disabled="disabled || loading" @click="onLogin(ruleFormRef)">
                  <span v-if="!loading">登 录</span>
                  <span v-else>登录中…</span>
                  <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>

                <div class="agreement-line">
                  登录即表明您同意
                  <button type="button" class="agreement-link" @click="agreementVisible = true">《平台服务协议》</button>
                </div>
              </el-form>
            </div>

            <div class="auth-footer">
              <span>没有账户？</span>
              <div class="auth-footer__divider" />
              <button type="button" class="form-link" @click="currentPage = 'register'">免费注册</button>
              <div class="auth-footer__divider" />
              <button type="button" class="form-link" @click="openTrialApplicationDialog">申请试用</button>
            </div>
          </div>

          <!-- REGISTER PAGE -->
          <LoginRegister v-else-if="currentPage === 'register'" key="register" @switch-page="switchPage" />

          <!-- FORGOT PAGE -->
          <LoginUpdate v-else-if="currentPage === 'forgot'" key="forgot" @switch-page="switchPage" />
        </Transition>
      </div>
    </div>

    <!-- Agreement dialog -->
    <el-dialog v-model="agreementVisible" title="平台服务协议" width="760px" destroy-on-close append-to-body align-center class="lw-dialog">
      <div class="lw-dialog__content">
        <iframe class="lw-dialog__frame" src="/agreement.html" title="平台服务协议" loading="lazy" />
      </div>
    </el-dialog>

    <!-- Footer -->
    <div class="page-footer">
      <span>© 2025 {{ title }}</span>
      <span>Enterprise Rental Operations Suite</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap");

  .lw-shell {
    --bg: #f6f3ee;
    --bg-warm: #ede8df;
    --surface: rgba(255, 255, 255, 0.72);
    --surface-solid: #fff;
    --border: rgba(28, 25, 23, 0.08);
    --border-strong: rgba(28, 25, 23, 0.15);
    --text: #1c1917;
    --text-soft: #78716c;
    --text-faint: #a8a29e;
    --accent: #b45309;
    --accent-warm: #d97706;
    --accent-bg: rgba(180, 83, 9, 0.06);
    --accent-border: rgba(180, 83, 9, 0.18);
    --success: #15803d;
    --danger: #dc2626;
    --shadow-sm: 0 1px 3px rgba(28, 25, 23, 0.06);
    --shadow-md: 0 8px 32px rgba(28, 25, 23, 0.08);
    --shadow-lg: 0 24px 64px rgba(28, 25, 23, 0.12);
    --radius: 20px;
    --radius-sm: 14px;
    --radius-xs: 10px;
    --serif: "Instrument Serif", Georgia, serif;
    --sans: "DM Sans", -apple-system, sans-serif;
    --mono: "JetBrains Mono", monospace;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);

    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: var(--sans);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  .lw-shell.dark {
    --bg: #161412;
    --bg-warm: #1e1b18;
    --surface: rgba(30, 27, 24, 0.82);
    --surface-solid: #1e1b18;
    --border: rgba(245, 245, 244, 0.08);
    --border-strong: rgba(245, 245, 244, 0.15);
    --text: #f5f5f4;
    --text-soft: #a8a29e;
    --text-faint: #78716c;
    --accent: #f59e0b;
    --accent-warm: #fbbf24;
    --accent-bg: rgba(245, 158, 11, 0.08);
    --accent-border: rgba(245, 158, 11, 0.22);
    --success: #4ade80;
    --danger: #f87171;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.3);
  }

  /* ══ BRAND PANEL ══ */
  .brand-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 48px;
    background: var(--bg-warm);
    overflow: hidden;
  }

  .brand-panel__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;

    &::before {
      content: "";
      position: absolute;
      top: -20%;
      right: -30%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(180, 83, 9, 0.12), transparent 60%);
      filter: blur(60px);
      animation: drift 20s ease-in-out infinite;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: -10%;
      left: -20%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(217, 119, 6, 0.08), transparent 60%);
      filter: blur(80px);
      animation: drift 15s ease-in-out infinite reverse;
    }
  }

  @keyframes drift {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -20px) scale(1.05);
    }
    66% {
      transform: translate(-20px, 15px) scale(0.95);
    }
  }

  .brand-panel__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(28, 25, 23, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(28, 25, 23, 0.03) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse at 60% 40%, black 20%, transparent 70%);
    pointer-events: none;
  }

  .lw-shell.dark .brand-panel__grid {
    background-image: linear-gradient(rgba(245, 245, 244, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 245, 244, 0.03) 1px, transparent 1px);
  }

  .brand-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .brand-logo__mark {
    width: 48px;
    height: 48px;
    background: var(--accent);
    border-radius: 16px;
    display: grid;
    place-items: center;
    box-shadow: 0 8px 24px rgba(180, 83, 9, 0.25);
    padding: 8px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: brightness(10);
    }
  }

  .brand-logo__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    span {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-soft);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: var(--mono);
    }
  }

  .theme-toggle {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s var(--ease);
    font-size: 18px;
    backdrop-filter: blur(12px);
    color: var(--text);

    &:hover {
      border-color: var(--border-strong);
      transform: scale(1.05);
    }
  }

  .brand-hero {
    position: relative;
    z-index: 1;
    max-width: 520px;
  }

  .brand-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: 999px;
    margin-bottom: 24px;
    font-family: var(--mono);

    &::before {
      content: "";
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }
  }

  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.8);
    }
  }

  .brand-hero :deep(h1) {
    font-family: var(--serif);
    font-size: clamp(42px, 4vw, 64px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin-bottom: 20px;
    color: var(--text);

    em {
      font-style: italic;
      color: var(--accent);
    }
  }

  .brand-hero p {
    font-size: 15px;
    line-height: 1.75;
    color: var(--text-soft);
    max-width: 420px;
  }

  .brand-cards {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .brand-card {
    padding: 20px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    backdrop-filter: blur(20px);
    transition: all 0.3s var(--ease);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent-border);
    }
  }

  .brand-card__num {
    font-family: var(--serif);
    font-size: 32px;
    font-style: italic;
    color: var(--accent);
    line-height: 1;
    margin-bottom: 8px;
  }

  .brand-card__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-soft);
    line-height: 1.5;
  }

  /* ══ AUTH PANEL ══ */
  .auth-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow-y: auto;
    background: var(--bg);
    position: relative;
  }

  .auth-container {
    width: 100%;
    max-width: 440px;
    transition: max-width 0.4s var(--ease);

    &--wide {
      max-width: 600px;
    }
  }

  /* ══ AUTH CARD ══ */
  .auth-card {
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    position: relative;
  }

  .auth-card__accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-warm), transparent);
  }

  .auth-card__head {
    padding: 32px 32px 0;

    h2 {
      font-family: var(--serif);
      font-size: 28px;
      font-weight: 400;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      color: var(--text);
    }

    p {
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-soft);
    }
  }

  .auth-card__body {
    padding: 28px 32px 32px;
  }

  /* ══ FORM ══ */
  .lw-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__error) {
      position: static;
      padding: 4px 0 8px;
      font-size: 12px;
      color: var(--danger);
      font-family: var(--mono);
    }

    :deep(.el-input__wrapper) {
      width: 100%;
      height: 52px;
      padding: 0 16px;
      font-size: 15px;
      font-family: var(--sans);
      color: var(--text);
      background: var(--bg);
      border: 1.5px solid var(--border) !important;
      border-radius: var(--radius-sm) !important;
      box-shadow: none !important;
      transition: all 0.2s var(--ease);

      &:hover {
        border-color: var(--border-strong) !important;
      }

      &.is-focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-bg) !important;
        background: var(--surface-solid);
      }
    }

    :deep(.el-input__inner) {
      font-size: 15px;
      font-family: var(--sans);
      color: var(--text);
      background: transparent;

      &::placeholder {
        color: var(--text-faint);
      }
    }

    :deep(.el-input__prefix),
    :deep(.el-input__suffix) {
      color: var(--text-faint);
    }
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-soft);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: var(--mono);
  }

  .form-input-wrap {
    position: relative;
  }

  .lw-prefix-icon {
    color: var(--text-faint);
  }

  .lw-suffix-icon {
    color: var(--text-faint);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--text);
    }
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .form-security {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-faint);
    font-family: var(--mono);

    svg {
      width: 14px;
      height: 14px;
      color: var(--success);
    }
  }

  .form-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: var(--sans);
    padding: 0;

    &:hover {
      opacity: 0.7;
    }
  }

  .btn-submit {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    font-family: var(--sans);
    color: white;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.25s var(--ease);
    position: relative;
    overflow: hidden;
    margin-bottom: 0;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.6s;
    }

    &:hover::before {
      transform: translateX(100%);
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(180, 83, 9, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    svg {
      width: 18px;
      height: 18px;
      transition: transform 0.2s var(--ease);
    }

    &:hover svg {
      transform: translateX(3px);
    }
  }

  .agreement-line {
    margin-top: 18px;
    text-align: center;
    font-size: 12px;
    color: var(--text-faint);
    line-height: 1.7;
  }

  .agreement-link {
    color: var(--accent);
    cursor: pointer;
    font-weight: 600;
    background: none;
    border: none;
    font-size: 12px;
    text-decoration: underline;
    text-decoration-color: rgba(180, 83, 9, 0.3);
    text-underline-offset: 2px;
    font-family: var(--sans);
    padding: 0;
  }

  .auth-footer {
    padding: 18px 32px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-soft);
  }

  .auth-footer__divider {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--text-faint);
  }

  /* ══ PAGE TRANSITION ══ */
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: all 0.35s var(--ease);
  }

  .page-fade-enter-from {
    opacity: 0;
    transform: translateY(12px);
  }

  .page-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  /* ══ FOOTER ══ */
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 48px;
    font-size: 11px;
    font-family: var(--mono);
    color: var(--text-faint);
    pointer-events: none;
    z-index: 10;
  }

  /* ══ DIALOG ══ */
  :deep(.lw-dialog .el-dialog) {
    border-radius: 24px;
    overflow: hidden;
  }

  :deep(.lw-dialog .el-dialog__header) {
    padding: 22px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid var(--border);
  }

  :deep(.lw-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
  }

  .lw-dialog__content {
    height: min(68vh, 760px);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  .lw-dialog__frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  /* ══ RESPONSIVE ══ */
  @media (width <= 1024px) {
    .lw-shell {
      grid-template-columns: 1fr;
    }

    .brand-panel {
      display: none;
    }

    .auth-panel {
      padding: 24px 20px;
    }
  }

  @media (width <= 640px) {
    .auth-container {
      max-width: 100%;
    }

    .auth-card__head {
      padding: 24px 20px 0;
    }
    .auth-card__body {
      padding: 20px 20px 24px;
    }
    .auth-footer {
      padding: 14px 20px;
    }
  }
</style>
