<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import Motion from "./utils/motion";
  import { useRouter } from "vue-router";
  import { message } from "@/utils/message";
  import { loginRules, updateRules } from "./utils/rule";
  import { debounce } from "@pureadmin/utils";
  import { useNav } from "@/layout/hooks/useNav";
  import { useEventListener } from "@vueuse/core";
  import type { FormInstance } from "element-plus";
  import { useLayout } from "@/layout/hooks/useLayout";
  import { useUserStoreHook } from "@/store/modules/user";
  import { initRouter, getTopMenu } from "@/router/utils";
  import { ref, reactive, watch, computed } from "vue";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
  import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
  import { useVerifyCode } from "./utils/verifyCode";
  import { avatar } from "./utils/static";

  import dayIcon from "@/assets/svg/day.svg?component";
  import darkIcon from "@/assets/svg/dark.svg?component";
  import globalization from "@/assets/svg/globalization.svg?component";
  import Lock from "~icons/ri/lock-fill";
  import User from "~icons/ri/user-3-fill";
  import Eye from "~icons/ri/eye-line";
  import EyeOff from "~icons/ri/eye-off-line";
  import Phone from "~icons/ri/phone-fill";
  import Mail from "~icons/ri/mail-fill";
  import Shield from "~icons/ri/shield-keyhole-line";
  import Wechat from "~icons/ri/wechat-fill";
  import QQ from "~icons/ri/qq-fill";
  import Alipay from "~icons/ri/alipay-fill";

  defineOptions({
    name: "Login"
  });

  const router = useRouter();
  const loading = ref(false);
  const showPassword = ref(false);
  const disabled = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const currentPage = ref("login"); // login | register | forgot

  const { t } = useI18n();
  const { initStorage } = useLayout();
  initStorage();
  const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
  dataThemeChange(overallStyle.value);
  const { title, getLogo } = useNav();
  const { locale, translationCh, translationEn } = useTranslationLang();
  const { isDisabled, text, start } = useVerifyCode();

  // 登录表单
  const loginForm = reactive({
    username: "kimi",
    password: "test0214"
  });

  // 注册表单
  const registerForm = reactive({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    verifyCode: ""
  });

  // 忘记密码表单
  const forgotForm = reactive({
    phone: "",
    verifyCode: "",
    password: "",
    confirmPassword: ""
  });

  // 登录处理
  const onLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loading.value = true;
        useUserStoreHook()
          .loginByUsername({
            username: loginForm.username,
            password: loginForm.password
          })
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

  // 注册处理
  const onRegister = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loading.value = true;
        // 模拟注册请求
        setTimeout(() => {
          message("注册成功", { type: "success" });
          currentPage.value = "login";
          loading.value = false;
        }, 1500);
      }
    });
  };

  // 重置密码处理
  const onResetPassword = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loading.value = true;
        // 模拟重置密码请求
        setTimeout(() => {
          message("密码重置成功", { type: "success" });
          currentPage.value = "login";
          loading.value = false;
        }, 1500);
      }
    });
  };

  // 发送验证码
  const sendVerificationCode = async (formEl: FormInstance | undefined, field: string) => {
    start(formEl, field, 60);
    // 模拟发送验证码
    message("验证码已发送", { type: "success" });
  };

  const immediateDebounce: any = debounce(formRef => onLogin(formRef), 1000, true);

  useEventListener(document, "keydown", ({ code }) => {
    if (["Enter", "NumpadEnter"].includes(code) && !disabled.value && !loading.value && currentPage.value === "login") {
      immediateDebounce(ruleFormRef.value);
    }
  });
</script>

<template>
  <div class="login-wrapper">
    <!-- 左侧区域 -->
    <div class="left-section">
      <!-- 背景装饰 -->
      <div class="background-pattern">
        <div class="circle circle-1" />
        <div class="circle circle-2" />
        <div class="circle circle-3" />
      </div>

      <!-- 顶部操作栏 -->
      <div class="header-bar">
        <div class="logo-section">
          <img :src="getLogo()" alt="logo" />
          <span class="logo-title">{{ title }}</span>
        </div>
      </div>

      <!-- 表单容器 -->
      <div class="form-container">
        <div class="form-section">
          <div class="form-card">
            <!-- 登录页面 -->
            <Motion v-if="currentPage === 'login'" key="login">
              <div class="form-header">
                <h1 class="form-title">欢迎使用{{ title }}</h1>
                <p class="form-subtitle">登录您的账户以继续</p>
              </div>

              <el-form ref="ruleFormRef" :model="loginForm" :rules="loginRules" class="auth-form">
                <el-form-item prop="username">
                  <el-input v-model="loginForm.username" size="large" clearable placeholder="用户名 / 手机号 / 邮箱">
                    <template #prefix>
                      <el-icon>
                        <User />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="password">
                  <el-input v-model="loginForm.password" size="large" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码">
                    <template #prefix>
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </template>
                    <template #suffix>
                      <el-icon class="cursor-pointer" @click="showPassword = !showPassword">
                        <Eye v-if="showPassword" />
                        <EyeOff v-else />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <div class="form-actions">
                  <el-button link type="primary" @click="currentPage = 'forgot'">忘记密码？</el-button>
                </div>

                <el-button type="primary" size="large" class="submit-btn" :loading="loading" :disabled="disabled" @click="onLogin(ruleFormRef)">登 录</el-button>

                <div class="switch-page">
                  没有账户？
                  <el-button link type="primary" @click="currentPage = 'register'">立即注册</el-button>
                </div>
              </el-form>
            </Motion>

            <!-- 注册页面 -->
            <Motion v-if="currentPage === 'register'" key="register">
              <div class="form-header">
                <h1 class="form-title">创建账户</h1>
                <p class="form-subtitle">注册新账户开始使用</p>
              </div>

              <el-form :model="registerForm" :rules="loginRules" class="auth-form">
                <el-form-item prop="username">
                  <el-input v-model="registerForm.username" size="large" clearable placeholder="用户名">
                    <template #prefix>
                      <el-icon>
                        <User />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="phone">
                  <el-input v-model="registerForm.phone" size="large" clearable placeholder="手机号">
                    <template #prefix>
                      <el-icon>
                        <Phone />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="email">
                  <el-input v-model="registerForm.email" size="large" clearable placeholder="邮箱地址">
                    <template #prefix>
                      <el-icon>
                        <Mail />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="verifyCode">
                  <div class="verify-code-wrapper">
                    <el-input v-model="registerForm.verifyCode" size="large" clearable placeholder="验证码">
                      <template #prefix>
                        <el-icon>
                          <Shield />
                        </el-icon>
                      </template>
                    </el-input>
                    <el-button class="verify-btn" :disabled="isDisabled" @click="sendVerificationCode(ruleFormRef, 'phone')">
                      {{ text || "获取验证码" }}
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item prop="password">
                  <el-input v-model="registerForm.password" size="large" type="password" placeholder="设置密码">
                    <template #prefix>
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="confirmPassword">
                  <el-input v-model="registerForm.confirmPassword" size="large" type="password" placeholder="确认密码">
                    <template #prefix>
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="onRegister(ruleFormRef)">注 册</el-button>

                <div class="switch-page">
                  已有账户？
                  <el-button link type="primary" @click="currentPage = 'login'">立即登录</el-button>
                </div>
              </el-form>
            </Motion>

            <!-- 忘记密码页面 -->
            <Motion v-if="currentPage === 'forgot'" key="forgot">
              <div class="form-header">
                <h1 class="form-title">重置密码</h1>
                <p class="form-subtitle">输入您的手机号重置密码</p>
              </div>

              <el-form :model="forgotForm" :rules="updateRules" class="auth-form">
                <el-form-item prop="phone">
                  <el-input v-model="forgotForm.phone" size="large" clearable placeholder="手机号">
                    <template #prefix>
                      <el-icon>
                        <Phone />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="verifyCode">
                  <div class="verify-code-wrapper">
                    <el-input v-model="forgotForm.verifyCode" size="large" clearable placeholder="验证码">
                      <template #prefix>
                        <el-icon>
                          <Shield />
                        </el-icon>
                      </template>
                    </el-input>
                    <el-button class="verify-btn" :disabled="isDisabled" @click="sendVerificationCode(ruleFormRef, 'phone')">
                      {{ text || "获取验证码" }}
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item prop="password">
                  <el-input v-model="forgotForm.password" size="large" type="password" placeholder="新密码">
                    <template #prefix>
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item prop="confirmPassword">
                  <el-input v-model="forgotForm.confirmPassword" size="large" type="password" placeholder="确认新密码">
                    <template #prefix>
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="onResetPassword(ruleFormRef)">重置密码</el-button>

                <div class="switch-page">
                  想起密码了？
                  <el-button link type="primary" @click="currentPage = 'login'">返回登录</el-button>
                </div>
              </el-form>
            </Motion>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <footer class="footer">
        <p>© 2025 {{ title }}. All rights reserved.</p>
      </footer>
    </div>

    <!-- 右侧展示区域 -->
    <div class="display-section">
      <div class="display-content">
        <!-- 动态插画 -->
        <div class="illustration-wrapper">
          <svg class="illustration" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #ef4444; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #dc2626; stop-opacity: 1" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #f87171; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #ef4444; stop-opacity: 1" />
              </linearGradient>
            </defs>

            <!-- 主圆圈 -->
            <circle cx="250" cy="200" r="80" fill="url(#grad1)" opacity="0.1">
              <animate attributeName="r" values="80;90;80" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="200" r="60" fill="url(#grad1)" opacity="0.2">
              <animate attributeName="r" values="60;70;60" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="200" r="40" fill="url(#grad1)" opacity="0.3">
              <animate attributeName="r" values="40;45;40" dur="4s" repeatCount="indefinite" />
            </circle>

            <!-- 数据点 -->
            <circle cx="180" cy="150" r="4" fill="#EF4444">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="320" cy="170" r="4" fill="#DC2626">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="290" cy="250" r="4" fill="#F87171">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="210" cy="240" r="4" fill="#B91C1C">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite" />
            </circle>

            <!-- 连线 -->
            <path d="M180,150 Q250,120 320,170" stroke="url(#grad1)" stroke-width="2" fill="none" opacity="0.3">
              <animate attributeName="stroke-dasharray" values="0,300;300,0" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M320,170 Q350,200 290,250" stroke="url(#grad2)" stroke-width="2" fill="none" opacity="0.3">
              <animate attributeName="stroke-dasharray" values="0,300;300,0" dur="3s" begin="1s" repeatCount="indefinite" />
            </path>

            <!-- 装饰性元素 -->
            <rect x="100" y="300" width="60" height="4" rx="2" fill="url(#grad1)" opacity="0.5" />
            <rect x="100" y="310" width="100" height="4" rx="2" fill="url(#grad2)" opacity="0.3" />
            <rect x="100" y="320" width="80" height="4" rx="2" fill="url(#grad1)" opacity="0.4" />

            <rect x="320" y="300" width="80" height="4" rx="2" fill="url(#grad2)" opacity="0.4" />
            <rect x="300" y="310" width="100" height="4" rx="2" fill="url(#grad1)" opacity="0.5" />
            <rect x="340" y="320" width="60" height="4" rx="2" fill="url(#grad2)" opacity="0.3" />
          </svg>
        </div>
        <p class="display-description">构建高效、安全、智能的企业管理生态系统</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* 响应式设计 */
  @media (width <= 1024px) {
    .display-section {
      display: none;
    }

    .left-section {
      width: 100%;
    }
  }

  @media (width <= 640px) {
    .header-bar {
      padding: 16px 20px;
    }

    .form-container {
      padding: 20px;
    }

    .form-card {
      padding: 32px 24px;
    }

    .form-title {
      font-size: 24px;
    }
  }

  .login-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  /* 左侧区域 - 包含 header、form、footer */
  .left-section {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  /* 背景装饰 */
  .background-pattern {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  .circle {
    position: absolute;
    background: white;
    border-radius: 50%;
    opacity: 0.1;
  }

  .circle-1 {
    top: -200px;
    left: -200px;
    width: 400px;
    height: 400px;
  }

  .circle-2 {
    right: -300px;
    bottom: -300px;
    width: 600px;
    height: 600px;
  }

  .circle-3 {
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
  }

  /* 顶部栏 */
  .header-bar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 40px;
    background: transparent;
  }

  .logo-section {
    display: flex;
    gap: 12px;
    align-items: center;

    img {
      display: inline-block;
      height: 32px;
    }
  }

  .logo {
    width: 36px;
    height: 36px;
  }

  .logo-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  .header-actions {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .lang-icon {
    width: 20px;
    height: 20px;
    color: #666;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: #ef4444;
    }
  }

  /* 表单容器 */
  .form-container {
    position: relative;
    z-index: 10;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  /* 表单区域 */
  .form-section {
    width: 100%;
    max-width: 420px;
  }

  .form-card {
    padding: 48px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 8%);
  }

  .form-header {
    margin-bottom: 36px;
    text-align: center;
  }

  .form-title {
    margin-bottom: 8px;
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .form-subtitle {
    font-size: 14px;
    color: #666;
  }

  .auth-form {
    :deep(.el-form-item) {
      margin-bottom: 20px;
    }

    :deep(.el-input__wrapper) {
      padding: 4px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      box-shadow: none !important;
      transition: all 0.3s;

      &:hover {
        border-color: #c0c0c0;
      }

      &.is-focus {
        border-color: #ef4444;
      }
    }

    :deep(.el-input__inner) {
      height: 40px;
      font-size: 15px;

      &::placeholder {
        color: #999;
      }
    }

    :deep(.el-input__prefix) {
      color: #999;
    }
  }

  .verify-code-wrapper {
    display: flex;
    gap: 12px;

    .verify-btn {
      flex-shrink: 0;
      height: 48px;
      padding: 0 20px;
      border-radius: 10px;
    }
  }

  .form-actions {
    margin-bottom: 20px;
    text-align: right;

    .el-button {
      font-size: 14px;
    }
  }

  .submit-btn {
    width: 100%;
    height: 48px;
    margin-bottom: 24px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    border-radius: 10px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 8px 20px rgb(239 68 68 / 30%);
      transform: translateY(-2px);
    }
  }

  .divider {
    position: relative;
    margin: 24px 0;
    text-align: center;

    &::before,
    &::after {
      position: absolute;
      top: 50%;
      width: calc(50% - 20px);
      height: 1px;
      content: "";
      background: #e0e0e0;
    }

    &::before {
      left: 0;
    }

    &::after {
      right: 0;
    }

    span {
      position: relative;
      padding: 0 10px;
      font-size: 14px;
      color: #999;
      background: white;
    }
  }

  .social-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-bottom: 24px;
  }

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    cursor: pointer;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }

    &.wechat:hover {
      color: #07c160;
      border-color: #07c160;
    }

    &.qq:hover {
      color: #1890ff;
      border-color: #1890ff;
    }

    &.alipay:hover {
      color: #00a1e9;
      border-color: #00a1e9;
    }

    :deep(.el-icon) {
      color: inherit;
    }
  }

  .switch-page {
    font-size: 14px;
    color: #666;
    text-align: center;

    .el-button {
      font-size: 14px;
    }
  }

  /* 右侧展示区域 - 固定520px宽度，独立区域 */
  .display-section {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 600px;
    height: 100vh;
    padding: 40px;
    overflow-y: auto;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .display-content {
    width: 100%;
    max-width: 440px;
    text-align: center;
  }

  .illustration-wrapper {
    margin-bottom: 40px;
  }

  .illustration {
    width: 100%;
    max-width: 400px;
    height: auto;
  }

  .display-title {
    margin-bottom: 16px;
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .display-description {
    margin-bottom: 40px;
    font-size: 16px;
    line-height: 1.6;
    color: #666;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 20px;
    text-align: left;
  }

  .feature-item {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
      transform: translateX(5px);
    }
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 10px;

    svg {
      width: 20px;
      height: 20px;
      color: white;
    }
  }

  /* 底部 - 只在左侧显示 */
  .footer {
    position: relative;
    z-index: 10;
    padding: 20px;
    text-align: center;
    background: transparent;

    p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  }

  /* 深色模式适配 */
  :global(.dark) {
    .left-section {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    }

    .logo-title {
      color: #f0f0f0;
    }

    .form-card {
      background: #1e1e1e;
      box-shadow: 0 10px 40px rgb(0 0 0 / 30%);
    }

    .form-title {
      color: #f0f0f0;
    }

    .form-subtitle {
      color: #999;
    }

    .auth-form {
      :deep(.el-input__wrapper) {
        background: #2a2a2a;
        border-color: #3a3a3a;

        &:hover {
          border-color: #4a4a4a;
        }
      }

      :deep(.el-input__inner) {
        color: #f0f0f0;
      }
    }

    .divider {
      span {
        background: #1e1e1e;
      }
    }

    .social-btn {
      background: #2a2a2a;
      border-color: #3a3a3a;
    }

    .display-section {
      background: linear-gradient(135deg, #2a1a1a 0%, #3a2020 100%);
    }

    .display-title {
      color: #f0f0f0;
    }

    .display-description {
      color: #999;
    }

    .feature-item {
      background: #1e1e1e;
    }

    .footer p {
      color: #999;
    }
  }
</style>
