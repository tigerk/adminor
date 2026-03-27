<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import { useI18n } from "vue-i18n";
  import { useRouter } from "vue-router";
  import { debounce } from "@pureadmin/utils";
  import { useEventListener } from "@vueuse/core";
  import type { FormInstance } from "element-plus";
  import { message } from "@/utils/message";
  import { useNav } from "@/layout/hooks/useNav";
  import { useLayout } from "@/layout/hooks/useLayout";
  import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
  import { useUserStoreHook } from "@/store/modules/user";
  import { initRouter, getTopMenu } from "@/router/utils";
  import { loginRules } from "./utils/rule";
  import { useTrialApplicationDialog } from "./components/useTrialApplicationDialog";
  import Motion from "./utils/motion";
  import LoginPhone from "./components/LoginPhone.vue";
  import LoginQrCode from "./components/LoginQrCode.vue";
  import LoginRegister from "./components/LoginRegister.vue";
  import LoginUpdate from "./components/LoginUpdate.vue";
  import Phone from "~icons/ri/smartphone-line";
  import Lock from "~icons/ri/lock-fill";
  import Eye from "~icons/ri/eye-line";
  import EyeOff from "~icons/ri/eye-off-line";
  import QrCode from "~icons/ri/qr-code-line";
  import ShieldCheck from "~icons/ri/shield-check-line";
  import ArrowRight from "~icons/ri/arrow-right-line";
  import DayIcon from "~icons/ri/sun-fill";
  import DarkIcon from "~icons/ri/moon-fill";

  defineOptions({ name: "Login" });

  type PageType = "login" | "register" | "forgot";
  type LoginMode = "account" | "phone" | "qrcode";

  const router = useRouter();
  const loading = ref(false);
  const showPassword = ref(false);
  const disabled = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const currentPage = ref<PageType>("login");
  const currentLoginMode = ref<LoginMode>("account");
  const agreementVisible = ref(false);
  const { openTrialApplicationDialog } = useTrialApplicationDialog();

  const { t } = useI18n();
  const { initStorage } = useLayout();
  initStorage();
  const { dataTheme, themeMode, dataThemeChange } = useDataThemeChange();
  dataThemeChange(themeMode.value);
  const { title, getLogo } = useNav();

  const loginForm = reactive({
    username: "",
    password: ""
  });

  const loginModeList = [
    { key: "account", label: "账号密码", icon: Lock },
    { key: "phone", label: "短信验证", icon: Phone },
    { key: "qrcode", label: "扫码登录", icon: QrCode }
  ] as const;

  const heroContent = computed(() => {
    const map: Record<PageType, { eyebrow: string; title: string; desc: string }> = {
      login: {
        eyebrow: "Enterprise Platform",
        title: "租住业务\n智能工作台",
        desc: "覆盖房源管理、合同签署、财务核算与审批流程，为企业管理员提供一站式租住业务协同平台。"
      },
      register: {
        eyebrow: "Create Workspace",
        title: "创建你的\n业务工作台",
        desc: "按步骤完成主体信息、联系人和安全设置，系统会自动初始化公司档案与默认权限。"
      },
      forgot: {
        eyebrow: "Password Recovery",
        title: "安全重置\n登录密码",
        desc: "使用手机号、图形校验和短信验证码完成身份确认，整个过程在当前页面内快速完成。"
      }
    };
    return map[currentPage.value];
  });

  const systemTitle = computed(() => title.value || "System");
  const systemLogo = computed(() => getLogo());
  const systemMark = computed(() => systemTitle.value.trim().slice(0, 2).toUpperCase());

  const onLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (!valid) return;
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: loginForm.username,
          password: loginForm.password
        })
        .then(res => {
          if (res.code !== 0) {
            message(res.message, { type: "error" });
            return;
          }
          return initRouter().then(() => {
            disabled.value = true;
            router
              .push(getTopMenu(true).path)
              .then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              })
              .finally(() => (disabled.value = false));
          });
        })
        .finally(() => (loading.value = false));
    });
  };

  const switchPage = (page: string) => {
    currentPage.value = page as PageType;
  };

  const switchLoginMode = (mode: LoginMode) => {
    currentPage.value = "login";
    currentLoginMode.value = mode;
  };

  const toggleTheme = () => {
    dataTheme.value = !dataTheme.value;
    dataThemeChange(themeMode.value || "light");
  };

  const immediateDebounce: any = debounce(formRef => onLogin(formRef), 1000, true);

  useEventListener(document, "keydown", ({ code }) => {
    if (["Enter", "NumpadEnter"].includes(code) && !disabled.value && !loading.value && currentPage.value === "login" && currentLoginMode.value === "account") {
      immediateDebounce(ruleFormRef.value);
    }
  });
</script>

<template>
  <div :class="['lw-shell', dataTheme ? 'dark' : '']">
    <div class="brand-panel">
      <div class="brand-panel__bg" />
      <div class="brand-panel__grid" />

      <div class="brand-top">
        <div class="brand-logo">
          <div class="brand-logo__mark">
            <img v-if="systemLogo" :src="systemLogo" :alt="systemTitle" class="brand-logo__image" />
            <span v-else>{{ systemMark }}</span>
          </div>
          <div class="brand-logo__text">
            <strong>{{ systemTitle }}</strong>
          </div>
        </div>

        <button class="theme-toggle" @click="toggleTheme">
          <IconifyIconOffline :icon="dataTheme ? DarkIcon : DayIcon" />
        </button>
      </div>

      <Motion class="brand-hero" :delay="80">
        <div class="brand-hero__eyebrow">{{ heroContent.eyebrow }}</div>
        <h1>
          {{ heroContent.title.split("\n")[0] }}
          <em>{{ heroContent.title.split("\n")[1] }}</em>
        </h1>
        <p>{{ heroContent.desc }}</p>
      </Motion>

      <div class="brand-cards">
        <div class="brand-card">
          <div class="brand-card__num">24h</div>
          <div class="brand-card__label">
            在线服务
            <br />
            全天响应
          </div>
        </div>
        <div class="brand-card">
          <div class="brand-card__num">3m</div>
          <div class="brand-card__label">
            管理员
            <br />
            快速开通
          </div>
        </div>
        <div class="brand-card">
          <div class="brand-card__num">100%</div>
          <div class="brand-card__label">
            统一链路
            <br />
            安全校验
          </div>
        </div>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-container" :class="{ 'auth-container--wide': currentPage === 'register' }">
        <Transition name="page-fade" mode="out-in">
          <div v-if="currentPage === 'login'" key="login">
            <div class="auth-card">
              <div class="auth-card__accent" />

              <div class="auth-card__head">
                <h2>欢迎回来</h2>
                <p>使用手机号和密码进入你的工作台</p>
              </div>

              <div class="auth-card__body">
                <Motion v-if="currentLoginMode === 'account'" key="account-login">
                  <el-form ref="ruleFormRef" :model="loginForm" :rules="loginRules" class="lw-form">
                    <el-form-item prop="username">
                      <div class="form-group">
                        <label class="form-label">手机号</label>
                        <div class="form-input-wrap">
                          <el-input v-model="loginForm.username" class="lw-input" clearable placeholder="请输入手机号">
                            <template #prefix>
                              <el-icon class="lw-prefix-icon"><Phone /></el-icon>
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
                        <el-icon><ShieldCheck /></el-icon>
                        安全链路已启用
                      </div>
                      <button type="button" class="form-link" @click="currentPage = 'forgot'">忘记密码？</button>
                    </div>

                    <button type="button" class="btn-submit" :disabled="disabled || loading" @click="onLogin(ruleFormRef)">
                      <span>{{ loading ? "登录中…" : "登录工作台" }}</span>
                      <el-icon v-if="!loading"><ArrowRight /></el-icon>
                    </button>

                    <div class="agreement-line">
                      登录即表示您已阅读并同意
                      <button type="button" class="agreement-link" @click="agreementVisible = true">《平台服务协议》</button>
                    </div>
                  </el-form>
                </Motion>

                <LoginPhone v-else-if="currentLoginMode === 'phone'" @switch-mode="switchLoginMode" @open-forgot="currentPage = 'forgot'" />

                <LoginQrCode v-else-if="currentLoginMode === 'qrcode'" @switch-mode="switchLoginMode" />
              </div>

              <div class="auth-footer">
                <span>还没有账户？</span>
                <button type="button" class="form-link" @click="openTrialApplicationDialog">申请试用</button>
              </div>
            </div>

            <button type="button" class="trial-badge" @click="openTrialApplicationDialog">
              <div class="trial-badge__text">
                <strong>申请免费试用</strong>
                <span>留下手机号，1-2 个工作日审核开通</span>
              </div>
              <div class="trial-badge__arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </button>
          </div>

          <LoginRegister v-else-if="currentPage === 'register'" key="register" @switch-page="switchPage" />

          <LoginUpdate v-else-if="currentPage === 'forgot'" key="forgot" @switch-page="switchPage" />
        </Transition>
      </div>
    </div>

    <el-dialog v-model="agreementVisible" title="平台服务协议" width="760px" destroy-on-close append-to-body align-center class="lw-dialog">
      <div class="lw-dialog__content">
        <iframe class="lw-dialog__frame" src="/agreement.html" title="平台服务协议" loading="lazy" />
      </div>
    </el-dialog>

    <div class="page-footer">
      <span>© {{ new Date().getFullYear() }} {{ systemTitle }}</span>
      <span>Enterprise Rental Operations Suite</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap");

  .lw-shell {
    --bg: #f7f3ec;
    --bg-warm: #efe8dc;
    --surface: rgba(255, 255, 255, 0.7);
    --surface-solid: #fff;
    --border: rgba(145, 89, 39, 0.12);
    --border-strong: rgba(145, 89, 39, 0.22);
    --text: #241f1b;
    --text-soft: #827873;
    --text-faint: #ab9f98;
    --accent: #ba6a28;
    --accent-warm: #d8832f;
    --accent-bg: rgba(186, 106, 40, 0.08);
    --accent-border: rgba(186, 106, 40, 0.18);
    --success: #70a66b;
    --shadow-sm: 0 1px 3px rgba(32, 24, 19, 0.06);
    --shadow-md: 0 12px 30px rgba(32, 24, 19, 0.08);
    --shadow-lg: 0 26px 70px rgba(32, 24, 19, 0.12);
    --radius: 22px;
    --radius-sm: 14px;
    --radius-xs: 10px;
    --serif: "Instrument Serif", Georgia, serif;
    --sans: "DM Sans", -apple-system, sans-serif;
    --mono: "JetBrains Mono", ui-monospace, monospace;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    overflow-y: auto;
    font-family: var(--sans);
    color: var(--text);
    background: var(--bg);
  }

  .lw-shell.dark {
    --bg: #191513;
    --bg-warm: #221c18;
    --surface: rgba(33, 28, 24, 0.78);
    --surface-solid: #241f1b;
    --border: rgba(250, 242, 236, 0.08);
    --border-strong: rgba(250, 242, 236, 0.15);
    --text: #f7f2ed;
    --text-soft: #afa29a;
    --text-faint: #7f7269;
    --accent: #f2ac3b;
    --accent-warm: #f6c05b;
    --accent-bg: rgba(242, 172, 59, 0.08);
    --accent-border: rgba(242, 172, 59, 0.2);
    --success: #7ec47b;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.18);
    --shadow-md: 0 10px 28px rgba(0, 0, 0, 0.26);
    --shadow-lg: 0 28px 80px rgba(0, 0, 0, 0.34);
  }

  .brand-panel {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    height: 100vh;
    padding: 34px 42px 30px;
    overflow: hidden;
    background: var(--bg-warm);
  }

  .brand-panel__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;

    &::before {
      position: absolute;
      top: -18%;
      right: -26%;
      width: 520px;
      height: 520px;
      background: radial-gradient(circle, rgba(186, 106, 40, 0.12), transparent 60%);
      filter: blur(54px);
      content: "";
    }
  }

  .brand-panel__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(145, 89, 39, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(145, 89, 39, 0.04) 1px, transparent 1px);
    background-size: 70px 70px;
    pointer-events: none;
  }

  .lw-shell.dark .brand-panel__grid {
    background-image: linear-gradient(rgba(250, 242, 236, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 242, 236, 0.035) 1px, transparent 1px);
  }

  .brand-top,
  .brand-hero,
  .brand-cards {
    position: relative;
    z-index: 1;
  }

  .brand-top {
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
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    color: #fff;
    background: var(--accent);
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    font-family: var(--mono);
    box-shadow: 0 8px 24px rgba(186, 106, 40, 0.22);
  }

  .brand-logo__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 14px;
  }

  .brand-logo__text {
    display: flex;
    flex-direction: column;

    strong {
      font-size: 18px;
      font-weight: 700;
    }
  }

  .theme-toggle {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    color: var(--accent);
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s var(--ease);
  }

  .theme-toggle:hover {
    transform: translateY(-1px);
    border-color: var(--accent-border);
  }

  .brand-hero {
    max-width: 430px;
  }

  .brand-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    margin-bottom: 22px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: 999px;
  }

  .brand-hero__eyebrow::before {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    content: "";
  }

  .brand-hero h1 {
    margin: 0 0 18px;
    font-family: var(--serif);
    font-size: clamp(48px, 5vw, 70px);
    font-weight: 400;
    line-height: 0.98;
    letter-spacing: -0.04em;
    white-space: pre-line;
  }

  .brand-hero h1 em {
    display: block;
    font-style: italic;
    color: var(--accent);
  }

  .brand-hero p {
    max-width: 400px;
    font-size: 15px;
    line-height: 1.85;
    color: var(--text-soft);
  }

  .brand-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    align-items: end;
  }

  .brand-card {
    padding: 18px 18px 16px;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: 16px;
  }

  .lw-shell.dark .brand-card {
    background: transparent;
  }

  .brand-card__num {
    margin-bottom: 8px;
    font-family: var(--serif);
    font-size: 30px;
    font-style: italic;
    color: var(--accent);
    line-height: 1;
  }

  .brand-card__label {
    font-size: 12px;
    line-height: 1.65;
    color: var(--text-soft);
  }

  .auth-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 40px 28px;
    background: var(--bg);
  }

  .auth-container {
    width: 100%;
    max-width: 430px;
  }

  .auth-container--wide {
    max-width: 440px;
  }

  .auth-card {
    position: relative;
    overflow: hidden;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }

  .auth-card__accent {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-warm), transparent);
  }

  .auth-card__head {
    padding: 28px 28px 0;

    h2 {
      margin: 0 0 8px;
      font-family: var(--serif);
      font-size: 28px;
      font-weight: 400;
      color: var(--text);
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-soft);
    }
  }

  .auth-card__body {
    padding: 28px 32px 32px;
  }

  .auth-tabs {
    display: flex;
    gap: 2px;
    padding: 4px;
    margin-bottom: 24px;
    background: var(--bg);
    border-radius: var(--radius-xs);
  }

  .auth-tab {
    display: flex;
    flex: 1;
    gap: 6px;
    align-items: center;
    justify-content: center;
    height: 42px;
    color: var(--text-soft);
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s var(--ease);
  }

  .auth-tab:hover {
    color: var(--text);
  }

  .auth-tab.active {
    color: var(--text);
    background: var(--surface-solid);
    box-shadow: var(--shadow-sm);
  }

  .lw-form :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .lw-form :deep(.el-form-item__content) {
    display: block;
    width: 100%;
  }

  .lw-form :deep(.el-form-item__error) {
    position: static;
    padding: 6px 0 0;
    font-size: 11px;
    color: var(--danger);
    font-family: var(--mono);
  }

  .form-group {
    width: 100%;
    margin-bottom: 18px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--text-soft);
    text-transform: uppercase;
    font-family: var(--mono);
  }

  .form-input-wrap {
    position: relative;
    width: 100%;
  }

  .lw-input {
    width: 100%;
  }

  .lw-form :deep(.el-input__wrapper) {
    height: 52px;
    padding: 0 16px;
    background: var(--bg);
    border: 1.5px solid var(--border) !important;
    border-radius: var(--radius-sm) !important;
    box-shadow: none !important;
    transition: all 0.2s var(--ease);
  }

  .lw-form :deep(.el-input__wrapper:hover) {
    border-color: var(--border-strong) !important;
  }

  .lw-form :deep(.el-input__wrapper.is-focus) {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px var(--accent-bg) !important;
    background: var(--surface-solid);
  }

  .lw-form :deep(.el-input__inner) {
    font-size: 15px;
    color: var(--text);

    &::placeholder {
      color: var(--text-faint);
    }
  }

  .lw-prefix-icon,
  .lw-suffix-icon {
    color: var(--text-faint);
  }

  .lw-suffix-icon {
    cursor: pointer;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .form-security {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--text-faint);
    font-family: var(--mono);
  }

  .form-link {
    border: none;
    background: none;
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
  }

  .btn-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 52px;
    margin-bottom: 16px;
    color: #fff;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    font-size: 15px;
    font-weight: 700;
    transition: all 0.25s var(--ease);
  }

  .btn-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(180, 83, 9, 0.3);
  }

  .agreement-line {
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-faint);
    text-align: center;
  }

  .agreement-link {
    margin-left: 4px;
    color: var(--accent);
    background: none;
    border: none;
    font-size: 12px;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(186, 106, 40, 0.3);
    text-underline-offset: 2px;
  }

  .auth-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 28px;
    font-size: 13px;
    color: var(--text-soft);
    border-top: 1px solid var(--border);
  }

  .auth-footer__divider {
    width: 3px;
    height: 3px;
    background: var(--text-faint);
    border-radius: 50%;
  }

  .trial-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    margin-top: 18px;
    padding: 16px 18px;
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm);
  }

  .trial-badge__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;

    strong {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
    }

    span {
      font-size: 11px;
      color: var(--text-soft);
    }
  }

  .trial-badge__arrow {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 28px;
    height: 28px;
    color: #fff;
    background: var(--accent);
    border-radius: 8px;
  }

  .page-footer {
    position: absolute;
    right: 24px;
    bottom: 14px;
    display: flex;
    gap: 28px;
    font-size: 12px;
    color: var(--text-faint);
  }

  .lw-dialog__content {
    height: min(68vh, 720px);
  }

  .lw-dialog__frame {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 16px;
  }

  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: 0.24s ease;
  }

  .page-fade-enter-from,
  .page-fade-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  @media (width <= 1180px) {
    .lw-shell {
      grid-template-columns: 1fr;
    }

    .brand-panel {
      position: relative;
      top: auto;
      min-height: 420px;
      height: auto;
    }

    .auth-panel {
      min-height: auto;
      padding-top: 24px;
    }

    .page-footer {
      position: static;
      justify-content: center;
      padding: 0 0 18px;
    }
  }
</style>
