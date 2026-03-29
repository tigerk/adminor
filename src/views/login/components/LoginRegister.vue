<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
  import { useI18n } from "vue-i18n";
  import type { FormInstance, FormRules } from "element-plus";
  import { isPhone } from "@pureadmin/utils";
  import { message } from "@/utils/message";
  import { updateRules, REGEXP_PWD } from "../utils/rule";
  import { useVerifyCode } from "../utils/verifyCode";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { baseUrlApi } from "@/api/utils";
  import { registerAccount, sendSmsCode } from "@/api/login";
  import Lock from "~icons/ri/lock-fill";
  import User from "~icons/ri/user-3-fill";
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";
  import Building from "~icons/ri/building-2-line";
  import Person from "~icons/ri/user-line";
  import CheckCircle from "~icons/ri/checkbox-circle-fill";
  import FileText from "~icons/ri/file-text-line";

  const { t } = useI18n();
  const emit = defineEmits<{
    (e: "switchPage", page: string): void;
  }>();

  const loading = ref(false);
  const agreementVisible = ref(false);
  const currentStep = ref(0);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const { isDisabled, text } = useVerifyCode();

  const stepList = [
    { title: "主体类型", subtitle: "选择注册主体" },
    { title: "主体信息", subtitle: "创建企业或个人档案" },
    { title: "登录信息", subtitle: "完成注册与协议确认" }
  ];

  const registerForm = reactive({
    nature: 1,
    companyName: "",
    companyAbbr: "",
    legalPerson: "",
    contactName: "",
    realName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    verifyCode: "",
    agreed: false
  });

  const isPersonal = computed(() => registerForm.nature === 2);
  const natureLabel = computed(() => (isPersonal.value ? "个人主体" : "企业主体"));
  const natureHint = computed(() =>
    isPersonal.value ? "适合个人房东、独立运营者。真实姓名会自动同步到法定代表人与联系人。" : "适合租赁公司、中介机构。注册后会按企业主体初始化公司档案。"
  );

  const entityFields = computed(() => (isPersonal.value ? ["companyName", "realName"] : ["companyName", "legalPerson"]));
  const loginFields = computed(() =>
    isPersonal.value ? ["phone", "verifyCode", "password", "confirmPassword", "agreed"] : ["contactName", "phone", "verifyCode", "password", "confirmPassword", "agreed"]
  );

  const entityStepDone = computed(() =>
    isPersonal.value ? Boolean(registerForm.companyName && registerForm.realName) : Boolean(registerForm.companyName && registerForm.legalPerson && registerForm.contactName)
  );

  const loginStepDone = computed(() =>
    Boolean(
      (isPersonal.value || registerForm.contactName) &&
      registerForm.phone &&
      registerForm.verifyCode &&
      registerForm.password &&
      registerForm.confirmPassword &&
      registerForm.agreed
    )
  );

  const passwordStrength = computed(() => {
    const pwd = registerForm.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  });

  const strengthMeta = computed(() => {
    if (!registerForm.password) return { text: "", level: "" };
    if (passwordStrength.value <= 2) return { text: "较弱", level: "weak" };
    if (passwordStrength.value <= 4) return { text: "中等", level: "medium" };
    return { text: "强", level: "strong" };
  });

  const strengthBars = computed(() => {
    const count = passwordStrength.value <= 2 ? (passwordStrength.value <= 1 ? 1 : 2) : passwordStrength.value <= 4 ? 3 : 4;
    return [0, 1, 2, 3].map(i => i < count);
  });

  const formRules = reactive<FormRules>({
    ...updateRules,
    companyName: [{ required: true, message: "名称为必填项", trigger: "blur" }],
    legalPerson: [
      {
        validator: (_, value, callback) => {
          const actualValue = isPersonal.value ? registerForm.realName : value;
          if (!actualValue) callback(new Error(isPersonal.value ? "真实姓名为必填项" : "法定代表人为必填项"));
          else callback();
        },
        trigger: "blur"
      }
    ],
    contactName: [
      {
        validator: (_, value, callback) => {
          const actualValue = isPersonal.value ? registerForm.realName : value;
          if (!actualValue) callback(new Error(isPersonal.value ? "真实姓名为必填项" : "联系人为必填项"));
          else callback();
        },
        trigger: "blur"
      }
    ],
    realName: [
      {
        validator: (_, value, callback) => {
          if (!isPersonal.value) {
            callback();
            return;
          }
          if (!value) callback(new Error("真实姓名为必填项"));
          else callback();
        },
        trigger: "blur"
      }
    ],
    phone: [
      {
        validator: (_, value, callback) => {
          if (!value) callback(new Error(transformI18n($t("login.purePhoneReg"))));
          else if (!isPhone(value)) callback(new Error(transformI18n($t("login.purePhoneCorrectReg"))));
          else callback();
        },
        trigger: "blur"
      }
    ],
    password: [
      {
        validator: (_, value, callback) => {
          if (!value) callback(new Error(transformI18n($t("login.purePassWordReg"))));
          else if (!REGEXP_PWD.test(value)) callback(new Error(transformI18n($t("login.purePassWordRuleReg"))));
          else callback();
        },
        trigger: "blur"
      }
    ],
    confirmPassword: [
      {
        validator: (_, value, callback) => {
          if (!value) callback(new Error(transformI18n($t("login.purePassWordSureReg"))));
          else if (registerForm.password !== value) callback(new Error(transformI18n($t("login.purePassWordDifferentReg"))));
          else callback();
        },
        trigger: "blur"
      }
    ],
    agreed: [
      {
        validator: (_, value, callback) => {
          if (!value) callback(new Error("请先同意平台使用协议"));
          else callback();
        },
        trigger: "change"
      }
    ]
  });

  const buildPayload = () => ({
    nature: registerForm.nature,
    companyName: registerForm.companyName,
    companyAbbr: isPersonal.value ? "" : registerForm.companyAbbr,
    legalPerson: isPersonal.value ? registerForm.realName : registerForm.legalPerson,
    contactName: isPersonal.value ? registerForm.realName : registerForm.contactName,
    phone: registerForm.phone,
    password: registerForm.password,
    verificationCode: registerForm.verifyCode
  });

  const hasValidPhone = computed(() => /^1\d{10}$/.test(registerForm.phone));

  const refreshCaptcha = () => {
    if (!hasValidPhone.value) {
      captchaImageUrl.value = "";
      return;
    }
    captchaImageUrl.value = `${baseUrlApi(`captcha/${registerForm.phone}`)}?t=${Date.now()}`;
  };

  watch(
    () => registerForm.phone,
    (phone, prevPhone) => {
      if (phone === prevPhone) return;
      registerForm.verifyCode = "";
      imageVerifyCode.value = "";
      if (phone.length === 11 && hasValidPhone.value) {
        refreshCaptcha();
        return;
      }
      captchaImageUrl.value = "";
    }
  );

  const validateFields = async (fields: string[]) => {
    if (!ruleFormRef.value) return false;
    try {
      await ruleFormRef.value.validateField(fields);
      return true;
    } catch {
      return false;
    }
  };

  const ensureStep = async (step: number) => {
    if (step === 0) return true;
    if (step === 1) return validateFields(entityFields.value);
    return validateFields(loginFields.value);
  };

  const nextStep = async () => {
    const valid = await ensureStep(currentStep.value);
    if (!valid) return;
    currentStep.value = Math.min(currentStep.value + 1, stepList.length - 1);
  };

  const prevStep = () => {
    currentStep.value = Math.max(currentStep.value - 1, 0);
  };

  const jumpStep = async (step: number) => {
    if (step <= currentStep.value) {
      currentStep.value = step;
      return;
    }
    const valid = await ensureStep(currentStep.value);
    if (valid) currentStep.value = step;
  };

  const onNatureChange = () => {
    registerForm.companyAbbr = "";
    registerForm.legalPerson = "";
    registerForm.contactName = "";
    registerForm.realName = "";
    ruleFormRef.value?.clearValidate(["legalPerson", "contactName", "realName"]);
  };

  const sendCode = async (formEl: FormInstance | undefined, field: string) => {
    if (!formEl) return;
    const valid = await validateFields([field]);
    if (!valid) return;
    if (!imageVerifyCode.value) {
      message("请输入图形验证码", { type: "warning" });
      if (!captchaImageUrl.value) refreshCaptcha();
      return;
    }
    sendSmsCode({ phone: registerForm.phone, captcha: imageVerifyCode.value })
      .then(() => {
        useVerifyCode().start(ruleFormRef.value, "phone", 60);
        message("验证码已发送", { type: "success" });
      })
      .catch(() => {
        refreshCaptcha();
      });
  };

  const onRegister = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    loading.value = true;
    try {
      const valid = await formEl.validate().catch(() => false);
      if (!valid) return;
      await registerAccount(buildPayload());
      message("注册成功，请使用手机号登录", { type: "success" });
      emit("switchPage", "login");
    } finally {
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <div class="rg-shell">
    <div class="register-card">
      <div class="register-card__head">
        <div>
          <h2>创建租住业务工作台</h2>
          <p>三步完成主体信息、联系人和安全设置</p>
        </div>
      </div>

      <div class="steps">
        <button
          v-for="(step, index) in stepList"
          :key="step.title"
          type="button"
          class="step"
          :class="{ 'is-active': index === currentStep, 'is-done': index < currentStep }"
          @click="jumpStep(index)"
        >
          <span class="step__num">
            <el-icon v-if="index < currentStep"><CheckCircle /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="step__label">{{ step.title }}</span>
        </button>
      </div>

      <div class="step-content">
        <el-form ref="ruleFormRef" :model="registerForm" :rules="formRules" label-position="top" class="rg-form">
          <div v-if="currentStep === 0" class="step-panel">
            <div class="nature-grid">
              <button
                type="button"
                class="nature-card"
                :class="{ selected: !isPersonal }"
                @click="
                  registerForm.nature = 1;
                  onNatureChange();
                "
              >
                <span class="nature-card__icon">
                  <el-icon><Building /></el-icon>
                </span>
                <span class="nature-card__main">
                  <strong>企业主体</strong>
                  <small>租赁公司、中介机构</small>
                </span>
                <span class="nature-card__check" :class="{ on: !isPersonal }" />
              </button>

              <button
                type="button"
                class="nature-card"
                :class="{ selected: isPersonal }"
                @click="
                  registerForm.nature = 2;
                  onNatureChange();
                "
              >
                <span class="nature-card__icon">
                  <el-icon><Person /></el-icon>
                </span>
                <span class="nature-card__main">
                  <strong>个人主体</strong>
                  <small>个人房东、独立运营</small>
                </span>
                <span class="nature-card__check" :class="{ on: isPersonal }" />
              </button>
            </div>

            <div class="note-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              {{ natureHint }}
            </div>

            <div class="btn-group">
              <button type="button" class="btn-next btn-full" @click="nextStep">
                下一步：填写主体信息
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 1" class="step-panel">
            <div class="form-group">
              <label class="form-label">
                <el-icon><Building /></el-icon>
                <em class="req">*</em>
                {{ isPersonal ? "名称" : "公司名称" }}
              </label>
              <el-form-item prop="companyName">
                <el-input v-model="registerForm.companyName" class="rg-input" size="large" clearable :placeholder="isPersonal ? '请输入名称' : '请输入公司全称'">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <template v-if="isPersonal">
              <div class="form-group">
                <label class="form-label">
                  <el-icon><User /></el-icon>
                  <em class="req">*</em>
                  真实姓名
                </label>
                <el-form-item prop="realName">
                  <el-input v-model="registerForm.realName" class="rg-input" size="large" clearable placeholder="请输入真实姓名">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </template>

            <div v-else class="two-col">
              <div class="form-group">
                <label class="form-label">
                  公司简称
                  <span class="optional-tag">选填</span>
                </label>
                <el-form-item prop="companyAbbr">
                  <el-input v-model="registerForm.companyAbbr" class="rg-input" size="large" clearable placeholder="请输入公司简称">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <el-icon><User /></el-icon>
                  <em class="req">*</em>
                  法定代表人
                </label>
                <el-form-item prop="legalPerson">
                  <el-input v-model="registerForm.legalPerson" class="rg-input" size="large" clearable placeholder="请输入法定代表人">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <div class="btn-group">
              <button type="button" class="btn-back" @click="prevStep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                上一步
              </button>
              <button type="button" class="btn-next" @click="nextStep">
                下一步：填写登录信息
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div v-if="currentStep === 2" class="step-panel">
            <div class="two-col">
              <div v-if="!isPersonal" class="form-group">
                <label class="form-label">
                  <el-icon><User /></el-icon>
                  <em class="req">*</em>
                  联系人
                </label>
                <el-form-item prop="contactName">
                  <el-input v-model="registerForm.contactName" class="rg-input" size="large" clearable placeholder="请输入联系人">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-group" :class="{ 'form-group--full': isPersonal }">
                <label class="form-label">
                  <el-icon><Phone /></el-icon>
                  <em class="req">*</em>
                  手机号
                </label>
                <el-form-item prop="phone">
                  <el-input v-model="registerForm.phone" class="rg-input" size="large" clearable placeholder="请输入手机号">
                    <template #prefix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <Transition name="expand">
              <div v-if="hasValidPhone" class="form-group">
                <label class="form-label">
                  <el-icon><Shield /></el-icon>
                  <em class="req">*</em>
                  图形验证码
                </label>
                <div class="verify-row verify-row--captcha">
                  <el-input v-model="imageVerifyCode" class="rg-input" size="large" clearable maxlength="4" placeholder="请输入图形验证码">
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
                <p class="field-hint">手机号输入完成后自动显示，点击图片可刷新</p>
              </div>
            </Transition>

            <div class="form-group">
              <label class="form-label">
                <el-icon><Shield /></el-icon>
                <em class="req">*</em>
                短信验证码
              </label>
              <el-form-item prop="verifyCode">
                <div class="verify-row">
                  <el-input v-model="registerForm.verifyCode" class="rg-input" size="large" clearable placeholder="请输入短信验证码">
                    <template #prefix>
                      <el-icon><Shield /></el-icon>
                    </template>
                  </el-input>
                  <button type="button" class="verify-btn" :class="{ waiting: isDisabled }" :disabled="isDisabled" @click="sendCode(ruleFormRef, 'phone')">
                    {{ isDisabled ? text + t("login.pureInfo") : "获取验证码" }}
                  </button>
                </div>
              </el-form-item>
            </div>

            <div class="two-col">
              <div class="form-group">
                <label class="form-label">
                  <el-icon><Lock /></el-icon>
                  <em class="req">*</em>
                  登录密码
                </label>
                <el-form-item prop="password">
                  <el-input v-model="registerForm.password" class="rg-input" size="large" type="password" show-password placeholder="8-18位，至少两种字符">
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <div v-if="registerForm.password" class="pwd-meter">
                  <div class="pwd-meter__bars">
                    <span v-for="(active, i) in strengthBars" :key="i" class="pwd-meter__bar" :class="{ active, [strengthMeta.level]: active }" />
                  </div>
                  <span class="pwd-meter__text" :class="strengthMeta.level">{{ strengthMeta.text }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <el-icon><Lock /></el-icon>
                  <em class="req">*</em>
                  确认密码
                </label>
                <el-form-item prop="confirmPassword">
                  <el-input v-model="registerForm.confirmPassword" class="rg-input" size="large" type="password" show-password placeholder="请再次输入密码">
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <div class="agreement-box">
              <el-form-item prop="agreed" class="agreement-item">
                <el-checkbox v-model="registerForm.agreed">
                  <span class="agreement-check-text">
                    我已阅读并同意
                    <button type="button" class="agreement-link" @click.stop="agreementVisible = true">《平台使用协议》</button>
                  </span>
                </el-checkbox>
              </el-form-item>
            </div>

            <div class="btn-group">
              <button type="button" class="btn-back" @click="prevStep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                上一步
              </button>
              <button type="button" class="btn-next" :disabled="loading" @click="onRegister(ruleFormRef)">
                {{ loading ? "正在注册…" : "立即注册" }}
                <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <div class="register-switch">
      <span>已有账户？</span>
      <button type="button" class="form-link" @click="emit('switchPage', 'login')">立即登录</button>
    </div>

    <el-dialog v-model="agreementVisible" title="平台使用协议" width="760px" destroy-on-close append-to-body align-center class="rg-dialog">
      <div class="rg-dialog__content">
        <iframe class="rg-dialog__frame" src="/agreement.html" title="平台使用协议" loading="lazy" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
  .rg-shell {
    --bg: #f6f3ee;
    --bg-warm: #ede8df;
    --surface-solid: #fff;
    --border: rgba(28, 25, 23, 0.08);
    --border-strong: rgba(28, 25, 23, 0.15);
    --text: #1c1917;
    --text-soft: #78716c;
    --text-faint: #a8a29e;
    --accent: var(--el-color-primary);
    --accent-warm: var(--el-color-primary-light-3);
    --accent-bg: var(--el-color-primary-light-9);
    --accent-border: var(--el-color-primary-light-7);
    --success: #15803d;
    --danger: #dc2626;
    --shadow-lg: 0 24px 64px rgba(28, 25, 23, 0.12);
    --shadow-sm: 0 1px 3px rgba(28, 25, 23, 0.06);
    --radius: 20px;
    --radius-sm: 14px;
    --radius-xs: 10px;
    --serif: "Instrument Serif", Georgia, serif;
    --sans: "DM Sans", -apple-system, sans-serif;
    --mono: "JetBrains Mono", monospace;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);

    font-family: var(--sans);
    color: var(--text);
  }

  :global(.lw-shell.dark) .rg-shell {
    --bg: #161412;
    --bg-warm: #1e1b18;
    --surface-solid: #1e1b18;
    --border: rgba(245, 245, 244, 0.08);
    --border-strong: rgba(245, 245, 244, 0.15);
    --text: #f5f5f4;
    --text-soft: #a8a29e;
    --text-faint: #78716c;
    --accent: var(--el-color-primary);
    --accent-warm: var(--el-color-primary-light-3);
    --accent-bg: var(--el-color-primary-light-9);
    --accent-border: var(--el-color-primary-light-7);
    --success: #4ade80;
    --danger: #f87171;
    --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.3);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .register-card {
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .register-card__head {
    padding: 14px 32px 10px;
    border-bottom: 1px solid var(--border);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent), var(--accent-warm), transparent);
      border-radius: var(--radius) var(--radius) 0 0;
    }

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
      color: var(--text-soft);
      line-height: 1.6;
    }
  }

  .steps {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
    padding: 14px 25px;
    background: var(--bg);
  }

  .step {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 8px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s var(--ease);
    border: 1px solid var(--border);
    background: transparent;
    text-align: left;

    &.is-active {
      background: var(--accent-bg);
      border-color: var(--accent-border);
    }

    &.is-done {
      background: rgb(74 222 128 / 10%);
      border-color: rgb(74 222 128 / 18%);
    }
  }

  .step__num {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--text-soft);
    background: var(--bg);
    border: 1px solid var(--border);
    flex-shrink: 0;
    transition: all 0.2s var(--ease);

    .step.is-active & {
      color: white;
      background: var(--accent);
      border-color: var(--accent);
    }

    .step.is-done & {
      color: white;
      background: var(--success);
      border-color: var(--success);
    }
  }

  .step__label {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    color: var(--text);
    white-space: nowrap;
  }

  .step-content {
    padding: 16px 32px 18px;
  }

  .rg-form {
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

    :deep(.el-form-item__label) {
      display: none;
    }
  }

  .step-panel {
    animation: fadeSlideIn 0.35s var(--ease) both;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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

    :deep(svg) {
      width: 14px;
      height: 14px;
      color: var(--accent);
      opacity: 0.75;
    }
  }

  .req {
    font-style: normal;
    color: var(--danger);
  }

  .optional-tag {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-faint);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-family: var(--sans);
    letter-spacing: 0;
    text-transform: none;
  }

  .rg-input {
    width: 100%;

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

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
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
    padding: 0 14px;
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

  .pwd-meter {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .pwd-meter__bars {
    display: flex;
    gap: 4px;
    flex: 1;
  }

  .pwd-meter__bar {
    flex: 1;
    height: 3px;
    border-radius: 999px;
    background: var(--border);
    transition: background 0.3s var(--ease);

    &.active {
      &.weak {
        background: var(--danger);
      }
      &.medium {
        background: var(--accent);
      }
      &.strong {
        background: var(--success);
      }
    }
  }

  .pwd-meter__text {
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 600;
    white-space: nowrap;

    &.weak {
      color: var(--danger);
    }
    &.medium {
      color: var(--accent);
    }
    &.strong {
      color: var(--success);
    }
  }

  .nature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .nature-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    min-height: 184px;
    padding: 22px 20px;
    text-align: left;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    transition: all 0.2s var(--ease);
    cursor: pointer;
    font-family: var(--sans);

    &.selected {
      background: var(--accent-bg);
      border-color: var(--accent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
    }

    &:hover:not(.selected) {
      border-color: var(--border-strong);
    }
  }

  .nature-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 20px;
    color: var(--accent);
    background: var(--accent);
    color: white;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .nature-card__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }

    small {
      font-size: 12px;
      color: var(--text-soft);
      line-height: 1.5;
    }
  }

  .nature-card__check {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 18px;
    height: 18px;
    background: transparent;
    border: 2px solid var(--border-strong);
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 0.2s var(--ease);

    &.on {
      background: var(--accent);
      border-color: var(--accent);
      box-shadow: inset 0 0 0 4px var(--surface-solid);
    }
  }

  .note-box {
    display: flex;
    gap: 10px;
    padding: 14px 16px;
    margin-bottom: 22px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-soft);
    background: var(--accent-bg);
    border: 1px dashed var(--accent-border);
    border-radius: var(--radius-xs);

    svg {
      color: var(--accent);
      flex-shrink: 0;
      margin-top: 1px;
    }
  }

  .agreement-box {
    padding: 14px 16px;
    margin-bottom: 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .agreement-item {
    :deep(.el-form-item__content) {
      line-height: 1.4;
    }

    :deep(.el-form-item__error) {
      padding-top: 6px;
    }
  }

  .agreement-check-text {
    font-size: 13px;
    color: var(--text);
  }

  .agreement-link {
    color: var(--accent);
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    font-weight: 700;
  }

  .form-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--sans);
    padding: 0;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.7;
    }
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
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.5s;
    }

    &:hover::before {
      transform: translateX(100%);
    }
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

  .btn-full {
    width: 100%;
    flex: none;
  }

  .register-switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 18px;
    font-size: 13px;
    color: var(--text-soft);
  }

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

  :deep(.rg-dialog .el-dialog) {
    border-radius: 24px;
    overflow: hidden;
  }

  :deep(.rg-dialog .el-dialog__header) {
    padding: 22px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid var(--border);
  }

  :deep(.rg-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
  }

  .rg-dialog__content {
    height: min(68vh, 760px);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  .rg-dialog__frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  @media (width <= 640px) {
    .register-card__head {
      padding: 20px 20px 16px;
    }
    .steps {
      padding: 10px 20px;
      flex-direction: column;
    }
    .step-content {
      padding: 20px 20px 24px;
    }
    .nature-grid,
    .two-col {
      grid-template-columns: 1fr;
    }
    .verify-row,
    .verify-row--captcha {
      grid-template-columns: 1fr;
    }
    .btn-group {
      flex-direction: column-reverse;
    }
    .btn-back {
      width: 100%;
    }
    .nature-card {
      min-height: 152px;
    }
  }
</style>
