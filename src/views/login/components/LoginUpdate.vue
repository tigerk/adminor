<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { ref, reactive, onBeforeUnmount, computed, watch } from "vue";
  import { message } from "@/utils/message";
  import { updateRules } from "../utils/rule";
  import type { FormInstance } from "element-plus";
  import { useVerifyCode } from "../utils/verifyCode";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { baseUrlApi } from "@/api/utils";
  import { loginUpdate, sendSmsCode } from "@/api/login";

  import Lock from "~icons/ri/lock-fill";
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";

  const { t } = useI18n();
  const emit = defineEmits<{
    (e: "switchPage", page: string): void;
  }>();

  const loading = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const { isDisabled, text } = useVerifyCode();

  const forgotForm = reactive({
    phone: "",
    verifyCode: "",
    password: "",
    confirmPassword: ""
  });

  const hasValidPhone = computed(() => /^1\d{10}$/.test(forgotForm.phone));

  const refreshCaptcha = () => {
    if (!hasValidPhone.value) {
      captchaImageUrl.value = "";
      return;
    }
    captchaImageUrl.value = `${baseUrlApi(`captcha/${forgotForm.phone}`)}?t=${Date.now()}`;
  };

  watch(
    () => forgotForm.phone,
    (phone, prevPhone) => {
      if (phone === prevPhone) return;
      forgotForm.verifyCode = "";
      imageVerifyCode.value = "";
      if (phone.length === 11 && hasValidPhone.value) {
        refreshCaptcha();
        return;
      }
      captchaImageUrl.value = "";
    }
  );

  const repeatPasswordRule = [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === "") callback(new Error(transformI18n($t("login.purePassWordSureReg"))));
        else if (forgotForm.password !== value) callback(new Error(transformI18n($t("login.purePassWordDifferentReg"))));
        else callback();
      },
      trigger: "blur"
    }
  ];

  const onUpdate = async (formEl: FormInstance | undefined) => {
    loading.value = true;
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loginUpdate({ phone: forgotForm.phone, verifyCode: forgotForm.verifyCode, password: forgotForm.password }).then(() => {
          message(transformI18n($t("login.purePassWordUpdateReg")), { type: "success" });
          emit("switchPage", "login");
          loading.value = false;
        });
      } else {
        loading.value = false;
      }
    });
  };

  const sendVerificationCode = async (formEl: FormInstance | undefined, field: string) => {
    if (!formEl) return;
    await formEl.validateField(field, async (valid: boolean) => {
      if (!valid) return;
      if (!imageVerifyCode.value) {
        message("请输入图形验证码", { type: "warning" });
        if (!captchaImageUrl.value) refreshCaptcha();
        return;
      }
      sendSmsCode({ phone: forgotForm.phone, captcha: imageVerifyCode.value })
        .then(() => {
          useVerifyCode().start(ruleFormRef.value, "phone", 60);
          message("验证码已发送", { type: "success" });
        })
        .catch(() => {
          refreshCaptcha();
        });
    });
  };

  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <div class="forgot-card">
    <div class="forgot-card__accent" />
    <div class="forgot-card__head">
      <div>
        <h2>重置登录密码</h2>
        <p>通过手机验证完成安全重置</p>
      </div>
      <button type="button" class="back-link" @click="emit('switchPage', 'login')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回登录
      </button>
    </div>

    <div class="forgot-card__body">
      <!-- Security hints -->
      <div class="security-hints">
        <div class="security-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4" /></svg>
          手机号自动触发图形码
        </div>
        <div class="security-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4" /></svg>
          短信验证后立即生效
        </div>
        <div class="security-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4" /></svg>
          新密码仅在本次提交
        </div>
      </div>

      <el-form ref="ruleFormRef" :model="forgotForm" :rules="updateRules" class="fw-form">
        <!-- Phone -->
        <div class="form-group">
          <label class="form-label">手机号</label>
          <el-form-item prop="phone">
            <div class="form-input-wrap">
              <el-input v-model="forgotForm.phone" class="fw-input" clearable placeholder="请输入手机号">
                <template #prefix>
                  <el-icon><Phone /></el-icon>
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>

        <!-- Captcha (shown when phone is valid) -->
        <Transition name="expand">
          <div v-if="hasValidPhone" class="form-group">
            <label class="form-label">图形验证码</label>
            <div class="verify-row verify-row--captcha">
              <el-input v-model="imageVerifyCode" class="fw-input" clearable maxlength="4" placeholder="请输入图形验证码">
                <template #prefix>
                  <el-icon><Shield /></el-icon>
                </template>
              </el-input>
              <button type="button" class="captcha-box" @click="refreshCaptcha">
                <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" class="captcha-img" />
                <span v-else class="captcha-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  加载验证码
                </span>
              </button>
            </div>
            <p class="field-hint">点击图片可刷新</p>
          </div>
        </Transition>

        <!-- SMS Code -->
        <div class="form-group">
          <label class="form-label">短信验证码</label>
          <el-form-item prop="verifyCode">
            <div class="verify-row">
              <el-input v-model="forgotForm.verifyCode" class="fw-input" clearable placeholder="输入验证码">
                <template #prefix>
                  <el-icon><Shield /></el-icon>
                </template>
              </el-input>
              <button type="button" class="verify-btn" :class="{ waiting: isDisabled }" :disabled="isDisabled" @click="sendVerificationCode(ruleFormRef, 'phone')">
                {{ isDisabled ? text + t("login.pureInfo") : "获取验证码" }}
              </button>
            </div>
          </el-form-item>
        </div>

        <!-- Passwords -->
        <div class="two-col">
          <div class="form-group">
            <label class="form-label">新密码</label>
            <el-form-item prop="password">
              <el-input v-model="forgotForm.password" class="fw-input" type="password" show-password placeholder="8-18位，至少两种字符">
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <el-form-item :rules="repeatPasswordRule" prop="confirmPassword">
              <el-input v-model="forgotForm.confirmPassword" class="fw-input" type="password" show-password placeholder="请再次输入">
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </div>
        </div>

        <!-- Actions -->
        <div class="btn-group">
          <button type="button" class="btn-back" @click="emit('switchPage', 'login')">取消</button>
          <button type="button" class="btn-next" :disabled="loading" @click="onUpdate(ruleFormRef)">
            {{ loading ? "重置中…" : "重置密码" }}
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4" /></svg>
          </button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .forgot-card {
    --success: #15803d;
    --danger: #dc2626;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    position: relative;
    font-family: var(--sans);
    color: var(--text);
  }

  :global(.lw-shell.dark) .forgot-card,
  :global(.dark) .forgot-card {
    --success: #4ade80;
    --danger: #f87171;
  }

  :global(.lw-shell.dark) .forgot-card .security-hint,
  :global(.dark) .forgot-card .security-hint {
    background: var(--bg);
    border-color: var(--border);
    color: var(--text-soft);
  }

  :global(.lw-shell.dark) .forgot-card .btn-back,
  :global(.dark) .forgot-card .btn-back {
    background: var(--bg);
    color: var(--text);
    border-color: var(--border);
  }

  :global(.lw-shell.dark) .forgot-card .btn-back:hover,
  :global(.dark) .forgot-card .btn-back:hover {
    background: rgba(245, 245, 244, 0.08);
  }

  :global(.lw-shell.dark) .forgot-card .captcha-box,
  :global(.dark) .forgot-card .captcha-box {
    background: var(--bg);
    border-color: var(--border);
  }

  :global(.lw-shell.dark) .forgot-card .verify-btn.waiting,
  :global(.dark) .forgot-card .verify-btn.waiting {
    background: var(--bg);
    border-color: var(--border);
    color: var(--text-faint);
  }

  .forgot-card__accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-warm), transparent);
  }

  .forgot-card__head {
    padding: 28px 32px 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    h2 {
      font-family: var(--serif);
      font-size: 24px;
      font-weight: 400;
      letter-spacing: -0.02em;
      margin: 0 0 4px;
      color: var(--text);
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-soft);
    }
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    margin-top: 4px;
    font-family: var(--sans);
    padding: 0;
    transition: opacity 0.2s;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      opacity: 0.7;
    }
  }

  .forgot-card__body {
    padding: 24px 32px 28px;
  }

  .security-hints {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 22px;
  }

  .security-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 11px;
    color: var(--text-soft);
    font-family: var(--sans);

    svg {
      width: 14px;
      height: 14px;
      stroke: var(--success);
      flex-shrink: 0;
    }
  }

  .fw-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__content) {
      display: block;
      width: 100%;
    }

    :deep(.el-form-item__error) {
      position: static;
      padding: 4px 0 8px;
      font-size: 12px;
      color: var(--danger);
      font-family: var(--mono);
    }

    :deep(.el-input__wrapper) {
      height: 52px;
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
    width: 100%;
    margin-bottom: 18px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-soft);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-family: var(--mono);
  }

  .form-input-wrap {
    position: relative;
    width: 100%;
  }

  .verify-row {
    display: grid;
    grid-template-columns: 1fr 140px;
    gap: 10px;
    width: 100%;
  }

  .verify-row--captcha {
    grid-template-columns: 1fr 140px;
  }

  .captcha-box {
    height: 52px;
    overflow: hidden;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s var(--ease);

    &:hover {
      border-color: var(--accent);
    }
  }

  .captcha-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .captcha-placeholder {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-faint);
    font-family: var(--mono);

    svg {
      width: 13px;
      height: 13px;
    }
  }

  .field-hint {
    margin-top: 5px;
    font-size: 11px;
    color: var(--text-faint);
    font-family: var(--mono);
  }

  .verify-btn {
    height: 52px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1.5px solid var(--accent-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s var(--ease);
    font-family: var(--sans);

    &:not(.waiting):hover {
      background: var(--accent);
      color: white;
    }

    &.waiting {
      color: var(--text-faint);
      background: var(--bg);
      border-color: var(--border);
      cursor: not-allowed;
    }
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .btn-group {
    display: flex;
    gap: 10px;
    margin-top: 24px;
  }

  .btn-back,
  .btn-next {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s var(--ease);
    font-family: var(--sans);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .btn-back {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);

    &:hover {
      background: var(--border);
    }
  }

  .btn-next {
    flex: 1;
    font-weight: 700;
    color: white;
    background: var(--accent);
    border: none;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 25%, transparent);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  /* Expand transition */
  .expand-enter-active {
    transition: all 0.25s var(--ease);
  }
  .expand-leave-active {
    transition: all 0.18s var(--ease);
  }
  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  @media (width <= 640px) {
    .forgot-card__head {
      padding: 20px 20px 16px;
      flex-direction: column;
    }
    .forgot-card__body {
      padding: 20px 20px 24px;
    }
    .two-col {
      grid-template-columns: 1fr;
    }
    .verify-row {
      grid-template-columns: 1fr;
    }
    .btn-group {
      flex-direction: column-reverse;
    }
    .security-hints,
    .two-col,
    .verify-row,
    .verify-row--captcha {
      grid-template-columns: 1fr;
    }
  }
</style>
