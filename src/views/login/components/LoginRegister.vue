<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
  import { useI18n } from "vue-i18n";
  import type { FormInstance, FormRules } from "element-plus";
  import { isPhone } from "@pureadmin/utils";
  import Motion from "../utils/motion";
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
  import ArrowRight from "~icons/ri/arrow-right-line";
  import ArrowLeft from "~icons/ri/arrow-left-line";
  import InfoCircle from "~icons/ri/information-line";
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
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    return score;
  });

  const strengthMeta = computed(() => {
    if (!registerForm.password) return { text: "未设置", className: "" };
    if (passwordStrength.value <= 2) return { text: "强度较弱", className: "weak" };
    if (passwordStrength.value <= 4) return { text: "强度中等", className: "medium" };
    return { text: "强度较高", className: "strong" };
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
  <Motion key="register">
    <div class="rg-shell">
      <div class="rg-topbar">
        <div class="rg-badge">
          <el-icon><Building /></el-icon>
          <span>创建新账户</span>
        </div>
      </div>

      <div class="rg-hero">
        <h1 class="rg-title">开始使用租房管理系统</h1>
        <p class="rg-subtitle">按照 3 个步骤完成注册，系统会自动为你初始化默认套餐与公司档案。</p>
      </div>

      <div class="rg-progress">
        <button
          v-for="(step, index) in stepList"
          :key="step.title"
          type="button"
          class="pg-item"
          :class="{ 'is-active': index === currentStep, 'is-done': index < currentStep }"
          @click="jumpStep(index)"
        >
          <span class="pg-index">
            <el-icon v-if="index < currentStep"><CheckCircle /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="pg-text">
            <b>{{ step.title }}</b>
            <i>{{ step.subtitle }}</i>
          </span>
        </button>
      </div>

      <el-form ref="ruleFormRef" :model="registerForm" :rules="formRules" label-position="top" class="rg-form">
        <section class="rg-card" :class="{ 'is-active': currentStep === 0 }">
          <div class="rg-card__head">
            <div class="rg-card__title">
              <span class="card-no">01</span>
              <div>
                <h3>选择主体类型</h3>
                <p>先确认你是以个人还是企业身份使用系统</p>
              </div>
            </div>
            <div class="rg-chip">{{ natureLabel }}</div>
          </div>

          <div v-show="currentStep === 0" class="rg-card__body">
            <div class="nature-grid">
              <button
                type="button"
                class="nature-option"
                :class="{ 'is-selected': isPersonal }"
                @click="
                  registerForm.nature = 2;
                  onNatureChange();
                "
              >
                <span class="nature-icon">
                  <el-icon><Person /></el-icon>
                </span>
                <span class="nature-main">
                  <strong>个人主体</strong>
                  <small>个人房东、独立运营者</small>
                </span>
                <span class="nature-check" :class="{ 'is-on': isPersonal }" />
              </button>

              <button
                type="button"
                class="nature-option"
                :class="{ 'is-selected': !isPersonal }"
                @click="
                  registerForm.nature = 1;
                  onNatureChange();
                "
              >
                <span class="nature-icon">
                  <el-icon><Building /></el-icon>
                </span>
                <span class="nature-main">
                  <strong>企业主体</strong>
                  <small>租赁公司、中介机构</small>
                </span>
                <span class="nature-check" :class="{ 'is-on': !isPersonal }" />
              </button>
            </div>

            <div class="rg-note">
              <el-icon><InfoCircle /></el-icon>
              <span>{{ natureHint }}</span>
            </div>

            <div class="rg-actions">
              <button type="button" class="btn-primary btn-full" @click="nextStep">
                下一步：填写主体信息
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="rg-card" :class="{ 'is-active': currentStep === 1 }">
          <div class="rg-card__head">
            <div class="rg-card__title">
              <span class="card-no">02</span>
              <div>
                <h3>填写主体信息</h3>
                <p>{{ isPersonal ? "个人资料会自动映射到联系人与法定代表人" : "这些资料将用于初始化企业主体档案" }}</p>
              </div>
            </div>
            <div v-if="entityStepDone" class="rg-chip success">
              <el-icon><CheckCircle /></el-icon>
              已填写
            </div>
          </div>

          <div v-show="currentStep === 1" class="rg-card__body">
            <el-form-item prop="companyName">
              <template #label>
                <span class="field-label">
                  <em>*</em>
                  {{ isPersonal ? "名称" : "公司名称" }}
                </span>
              </template>
              <el-input v-model="registerForm.companyName" size="large" clearable :placeholder="isPersonal ? '请输入名称，将写入公司名称' : '请输入公司全称'">
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <template v-if="isPersonal">
              <el-form-item prop="realName">
                <template #label>
                  <span class="field-label">
                    <em>*</em>
                    真实姓名
                  </span>
                </template>
                <el-input v-model="registerForm.realName" size="large" clearable placeholder="请输入真实姓名">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </template>

            <div v-else class="two-col">
              <el-form-item v-if="!isPersonal" prop="companyAbbr">
                <template #label>
                  <span class="field-label optional">
                    公司简称
                    <span>选填</span>
                  </span>
                </template>
                <el-input v-model="registerForm.companyAbbr" size="large" clearable placeholder="请输入公司简称">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="legalPerson">
                <template #label>
                  <span class="field-label">
                    <em>*</em>
                    法定代表人
                  </span>
                </template>
                <el-input v-model="registerForm.legalPerson" size="large" clearable placeholder="请输入法定代表人">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <div class="rg-actions">
              <button type="button" class="btn-secondary" @click="prevStep">
                <el-icon><ArrowLeft /></el-icon>
                上一步
              </button>
              <button type="button" class="btn-primary" @click="nextStep">
                下一步：填写登录信息
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="rg-card" :class="{ 'is-active': currentStep === 2 }">
          <div class="rg-card__head">
            <div class="rg-card__title">
              <span class="card-no">03</span>
              <div>
                <h3>设置登录信息</h3>
                <p>手机号用于登录、短信验证和联系电话，密码用于管理员首次登录</p>
              </div>
            </div>
            <div v-if="loginStepDone" class="rg-chip success">
              <el-icon><CheckCircle /></el-icon>
              可提交
            </div>
          </div>

          <div v-show="currentStep === 2" class="rg-card__body">
            <el-form-item prop="contactName">
              <template #label>
                <span class="field-label">
                  <em>*</em>
                  联系人
                </span>
              </template>
              <el-input v-model="registerForm.contactName" size="large" clearable placeholder="请输入联系人">
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="phone">
              <template #label>
                <span class="field-label">
                  <em>*</em>
                  手机号
                </span>
              </template>
              <el-input v-model="registerForm.phone" size="large" clearable placeholder="请输入手机号">
                <template #prefix>
                  <el-icon><Phone /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="hasValidPhone" class="inline-captcha-item">
              <template #label>
                <span class="field-label">
                  <em>*</em>
                  图形验证码
                </span>
              </template>
              <div class="verify-row verify-row-captcha">
                <el-input v-model="imageVerifyCode" size="large" clearable maxlength="4" placeholder="请输入图形验证码">
                  <template #prefix>
                    <el-icon><Shield /></el-icon>
                  </template>
                </el-input>
                <button type="button" class="captcha-box" @click="refreshCaptcha">
                  <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" class="captcha-image" />
                  <span v-else>加载验证码</span>
                </button>
              </div>
              <p class="captcha-tip">手机号输入完成后自动显示，点击图片可刷新</p>
            </el-form-item>

            <el-form-item prop="verifyCode">
              <template #label>
                <span class="field-label">
                  <em>*</em>
                  短信验证码
                </span>
              </template>
              <div class="verify-row">
                <el-input v-model="registerForm.verifyCode" size="large" clearable placeholder="请输入短信验证码">
                  <template #prefix>
                    <el-icon><Shield /></el-icon>
                  </template>
                </el-input>
                <el-button class="verify-btn" :disabled="isDisabled" @click="sendCode(ruleFormRef, 'phone')">
                  {{ text.length > 0 ? text + t("login.pureInfo") : "获取验证码" }}
                </el-button>
              </div>
            </el-form-item>

            <div class="two-col">
              <el-form-item prop="password">
                <template #label>
                  <span class="field-label">
                    <em>*</em>
                    登录密码
                  </span>
                </template>
                <el-input v-model="registerForm.password" size="large" type="password" show-password placeholder="8-18位，至少两种字符组合">
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
                <div class="pwd-strength" :class="strengthMeta.className">
                  <span>{{ strengthMeta.text }}</span>
                </div>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <template #label>
                  <span class="field-label">
                    <em>*</em>
                    确认密码
                  </span>
                </template>
                <el-input v-model="registerForm.confirmPassword" size="large" type="password" show-password placeholder="请再次输入密码">
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <div class="agreement-box">
              <div class="agreement-box__head">
                <div class="agreement-box__title">
                  <el-icon><FileText /></el-icon>
                  <span>平台使用协议</span>
                </div>
                <button type="button" class="link-btn" @click="agreementVisible = true">
                  查看完整协议
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
              <p class="agreement-box__desc">注册即表示你将使用本系统开展租房业务管理，请先确认责任边界、合规要求与法律风险承担方式。</p>
              <el-form-item prop="agreed" class="agreement-item">
                <el-checkbox v-model="registerForm.agreed" class="agreement-check">
                  <span class="agreement-check-text">我已阅读并同意《平台使用协议》</span>
                </el-checkbox>
              </el-form-item>
            </div>

            <div class="rg-actions mt-3">
              <button type="button" class="btn-secondary" @click="prevStep">
                <el-icon><ArrowLeft /></el-icon>
                上一步
              </button>
              <button type="button" class="btn-primary" :disabled="loading" @click="onRegister(ruleFormRef)">
                {{ loading ? "正在注册..." : "立即注册" }}
                <el-icon v-if="!loading"><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </section>
      </el-form>

      <div class="switch-page">
        <span>已有账户？</span>
        <el-button link type="primary" @click="emit('switchPage', 'login')">立即登录</el-button>
      </div>

      <el-dialog v-model="agreementVisible" title="平台使用协议" width="760px" destroy-on-close append-to-body align-center class="agreement-dialog">
        <div class="agreement-content">
          <iframe class="agreement-frame" src="/agreement.html" title="平台使用协议" loading="lazy" />
        </div>
      </el-dialog>
    </div>
  </Motion>
</template>

<style scoped lang="scss">
  .rg-shell {
    --rg-text: #101828;
    --rg-text-soft: #667085;
    --rg-text-faint: #98a2b3;
    --rg-surface: rgb(255 255 255 / 84%);
    --rg-surface-strong: #fff;
    --rg-surface-soft: #f8fafc;
    --rg-border: #dbe3f3;
    --rg-border-strong: #c7d6f7;
    --rg-accent: #2563eb;
    --rg-accent-soft: rgb(37 99 235 / 10%);
    --rg-success: #067647;
    --rg-success-soft: #ecfdf3;
    --rg-shadow: 0 18px 50px rgb(15 23 42 / 10%);
    color: var(--rg-text);
  }

  :global(.login-wrapper.dark .rg-shell) {
    --rg-text: #f8fafc;
    --rg-text-soft: #94a3b8;
    --rg-text-faint: #64748b;
    --rg-surface: rgb(17 24 39 / 82%);
    --rg-surface-strong: #0f172a;
    --rg-surface-soft: #162033;
    --rg-border: #243047;
    --rg-border-strong: #3b5b92;
    --rg-accent: #60a5fa;
    --rg-accent-soft: rgb(96 165 250 / 14%);
    --rg-success: #86efac;
    --rg-success-soft: rgb(22 163 74 / 12%);
    --rg-shadow: 0 22px 60px rgb(0 0 0 / 28%);
  }

  .rg-topbar {
    margin-bottom: 14px;
  }

  .rg-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--rg-accent);
    background: var(--rg-accent-soft);
    border: 1px solid rgb(37 99 235 / 18%);
    border-radius: 999px;
  }

  .rg-hero {
    margin-bottom: 24px;
  }

  .rg-title {
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.15;
    color: var(--rg-text);
    letter-spacing: -0.03em;
  }

  .rg-subtitle {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--rg-text-soft);
  }

  .rg-progress {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 22px;
  }

  .pg-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    text-align: left;
    background: transparent;
    border: 1px solid var(--rg-border);
    border-radius: 16px;
    transition: 0.2s ease;
  }

  .pg-item.is-active {
    background: var(--rg-accent-soft);
    border-color: var(--rg-border-strong);
    box-shadow: inset 0 0 0 1px rgb(37 99 235 / 8%);
  }

  .pg-item.is-done {
    background: var(--rg-surface-soft);
  }

  .pg-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 13px;
    font-weight: 700;
    color: var(--rg-text);
    background: var(--rg-surface-strong);
    border: 1px solid var(--rg-border);
    border-radius: 999px;
  }

  .pg-item.is-active .pg-index,
  .pg-item.is-done .pg-index {
    color: #fff;
    background: var(--rg-accent);
    border-color: transparent;
  }

  .pg-text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      font-size: 13px;
      font-weight: 700;
      color: var(--rg-text);
    }

    i {
      overflow: hidden;
      font-size: 11px;
      font-style: normal;
      color: var(--rg-text-soft);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .rg-form {
    display: flex;
    flex-direction: column;
    gap: 14px;

    :deep(.el-form-item) {
      margin-bottom: 18px;
      width: 100%;
    }

    :deep(.el-form-item__label) {
      margin-bottom: 8px;
      line-height: 1.2;
      white-space: normal;
    }

    :deep(.el-form-item__content) {
      display: block;
      width: 100%;
      line-height: 1.4;
    }

    :deep(.el-input__wrapper) {
      min-height: 50px;
      background: var(--rg-surface-strong);
      border: 1px solid var(--rg-border);
      border-radius: 14px;
      box-shadow: none !important;
      transition: 0.2s ease;
    }

    :deep(.el-input__wrapper:hover) {
      border-color: var(--rg-border-strong);
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: var(--rg-accent);
      box-shadow: 0 0 0 4px rgb(37 99 235 / 10%) !important;
    }

    :deep(.el-input__inner) {
      height: 34px;
      font-size: 15px;
      color: var(--rg-text);
    }

    :deep(.el-input__inner::placeholder) {
      color: var(--rg-text-faint);
    }

    :deep(.el-input__prefix),
    :deep(.el-input__suffix) {
      color: var(--rg-text-faint);
    }

    :deep(.el-form-item__error) {
      position: static;
      padding-top: 6px;
      font-size: 12px;
      color: #ef4444;
    }

    :deep(.el-checkbox) {
      align-items: flex-start;
      white-space: normal;
    }

    :deep(.el-checkbox__label) {
      line-height: 1.6;
      color: var(--rg-text);
    }

    :deep(.el-button.is-disabled) {
      opacity: 0.7;
    }
  }

  .rg-card {
    overflow: hidden;
    background: var(--rg-surface);
    border: 1px solid var(--rg-border);
    border-radius: 22px;
    box-shadow: var(--rg-shadow);
    backdrop-filter: blur(12px);
  }

  .rg-card.is-active {
    border-color: var(--rg-border-strong);
    box-shadow:
      0 0 0 1px rgb(37 99 235 / 12%),
      var(--rg-shadow);
  }

  .rg-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px 18px;
    border-bottom: 1px solid var(--rg-border);
  }

  .rg-card__title {
    display: flex;
    gap: 14px;
    align-items: flex-start;

    h3 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 800;
      color: var(--rg-text);
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--rg-text-soft);
    }
  }

  .card-no {
    min-width: 32px;
    padding-top: 4px;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
    color: var(--rg-accent);
    letter-spacing: -0.03em;
  }

  .rg-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--rg-text);
    background: var(--rg-surface-soft);
    border-radius: 999px;
    white-space: nowrap;
  }

  .rg-chip.success {
    color: var(--rg-success);
    background: var(--rg-success-soft);
  }

  .rg-card__body {
    padding: 22px;
  }

  .nature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .nature-option {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 16px;
    text-align: left;
    background: var(--rg-surface-strong);
    border: 1px solid var(--rg-border);
    border-radius: 18px;
    transition: 0.2s ease;
  }

  .nature-option.is-selected {
    background: var(--rg-accent-soft);
    border-color: var(--rg-border-strong);
    box-shadow: inset 0 0 0 1px rgb(37 99 235 / 12%);
  }

  .nature-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    font-size: 22px;
    color: var(--rg-accent);
    background: var(--rg-surface-soft);
    border-radius: 14px;
  }

  .nature-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      margin-bottom: 3px;
      font-size: 17px;
      font-weight: 800;
      color: var(--rg-text);
    }

    small {
      font-size: 13px;
      line-height: 1.5;
      color: var(--rg-text-soft);
    }
  }

  .nature-check {
    width: 18px;
    height: 18px;
    background: transparent;
    border: 2px solid var(--rg-border-strong);
    border-radius: 999px;
  }

  .nature-check.is-on {
    background: var(--rg-accent);
    border-color: var(--rg-accent);
    box-shadow: inset 0 0 0 4px var(--rg-surface-strong);
  }

  .rg-note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    margin-bottom: 18px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--rg-text-soft);
    background: var(--rg-surface-soft);
    border: 1px dashed var(--rg-border-strong);
    border-radius: 14px;
  }

  .field-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--rg-text);

    em {
      font-style: normal;
      color: #ef4444;
    }
  }

  .field-label.optional span {
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--rg-text-soft);
    background: var(--rg-surface-soft);
    border-radius: 999px;
  }

  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .verify-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 148px;
    gap: 12px;
    width: 100%;
  }

  .verify-row-captcha {
    grid-template-columns: minmax(0, 1fr) 156px;
  }

  .inline-captcha-item {
    margin-top: -2px;
  }

  .captcha-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 0;
    overflow: hidden;
    color: var(--rg-text-soft);
    background: var(--rg-surface-strong);
    border: 1px solid var(--rg-border);
    border-radius: 14px;
    transition: 0.2s ease;
  }

  .captcha-box:hover {
    border-color: var(--rg-border-strong);
  }

  .captcha-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .captcha-tip {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--rg-text-soft);
  }

  .verify-btn {
    height: 50px;
    font-weight: 700;
    color: var(--rg-accent);
    background: var(--rg-accent-soft);
    border: 1px solid rgb(37 99 235 / 18%);
    border-radius: 14px;
  }

  .pwd-strength {
    margin-top: 8px;
    font-size: 12px;
    color: var(--rg-text-soft);
  }

  .pwd-strength.weak {
    color: #ef4444;
  }

  .pwd-strength.medium {
    color: #f59e0b;
  }

  .pwd-strength.strong {
    color: #10b981;
  }

  .agreement-box {
    padding: 16px 18px;
    margin-top: 4px;
    margin-bottom: 6px;
    background: linear-gradient(135deg, var(--rg-surface-soft) 0%, var(--rg-surface-strong) 100%);
    border: 1px solid var(--rg-border);
    border-radius: 18px;
  }

  .agreement-box__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .agreement-box__title {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    font-weight: 800;
    color: var(--rg-text);
  }

  .agreement-box__desc {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--rg-text-soft);
  }

  .agreement-item {
    margin-bottom: 0 !important;
  }

  .link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--rg-accent);
    background: var(--rg-accent-soft);
    border: 1px solid rgb(37 99 235 / 16%);
    border-radius: 999px;
    transition: 0.2s ease;
  }

  .link-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgb(37 99 235 / 12%);
  }

  .rg-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 6px;
  }

  .btn-primary,
  .btn-secondary {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 52px;
    padding: 0 20px;
    font-size: 15px;
    font-weight: 800;
    border-radius: 16px;
    border: none;
    outline: none;
    transition: 0.2s ease;
  }

  .btn-primary {
    flex: 1;
    color: #fff;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    box-shadow: 0 14px 26px rgb(37 99 235 / 24%);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 30px rgb(37 99 235 / 28%);
  }

  .btn-primary:focus-visible,
  .btn-secondary:focus-visible,
  .link-btn:focus-visible,
  .nature-option:focus-visible,
  .pg-item:focus-visible {
    outline: 2px solid var(--rg-accent);
    outline-offset: 2px;
  }

  .btn-primary.btn-full {
    width: 100%;
    flex: none;
  }

  .btn-primary:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: none;
  }

  .btn-secondary {
    min-width: 132px;
    color: var(--rg-text);
    background: var(--rg-surface-strong);
    border: 1px solid var(--rg-border);
  }

  .btn-secondary:hover {
    background: var(--rg-surface-soft);
  }

  .switch-page {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 18px;
    font-size: 14px;
    line-height: 1;
    color: var(--rg-text-soft);

    :deep(.el-button) {
      margin: 0;
      font-size: 14px;
      line-height: 1;
      vertical-align: middle;
    }

    span {
      line-height: 1;
    }
  }

  .agreement-content {
    height: min(68vh, 760px);
    overflow: hidden;
    border: 1px solid #eaecf0;
    border-radius: 18px;
    background: #fff;
  }

  .agreement-frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
  }

  :deep(.agreement-item .el-form-item__content) {
    display: flex;
    align-items: flex-start;
    line-height: 1.4;
  }

  :deep(.agreement-item .el-form-item__error) {
    padding-top: 8px;
  }

  :deep(.agreement-check) {
    display: inline-flex;
    align-items: flex-start;
    width: 100%;
    min-height: 24px;
    margin: 0;
  }

  :deep(.agreement-item .el-checkbox) {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }

  :deep(.agreement-item .el-checkbox__input) {
    flex: none;
    align-self: flex-start;
    margin-top: 2px;
  }

  :deep(.agreement-item .el-checkbox__label) {
    display: flex;
    align-items: flex-start;
    padding-left: 0;
    margin-top: 0;
    line-height: 1.45;
    white-space: normal;
  }

  .agreement-check-text {
    display: block;
    margin-top: -1px;
    padding-top: 0;
    line-height: 1.45;
  }

  :deep(.agreement-dialog .el-dialog) {
    border-radius: 24px;
    overflow: hidden;
  }

  :deep(.agreement-dialog .el-dialog__header) {
    padding: 22px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid #eaecf0;
  }

  :deep(.agreement-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
    background: #fff;
  }

  :global(.login-wrapper.dark .rg-card) {
    background: var(--rg-surface);
    border-color: var(--rg-border);
  }

  :global(.login-wrapper.dark .rg-card__head) {
    border-bottom-color: var(--rg-border);
  }

  :global(.login-wrapper.dark .pg-item) {
    background: rgb(15 23 42 / 45%);
  }

  :global(.login-wrapper.dark .pg-item.is-active) {
    background: var(--rg-accent-soft);
  }

  :global(.login-wrapper.dark .agreement-box) {
    background: linear-gradient(135deg, rgb(15 23 42 / 90%) 0%, rgb(22 32 51 / 96%) 100%);
  }

  :global(.login-wrapper.dark .link-btn) {
    border-color: rgb(96 165 250 / 22%);
  }

  :global(.login-wrapper.dark .agreement-dialog .el-dialog) {
    background: #0f172a;
  }

  :global(.login-wrapper.dark .agreement-dialog .el-dialog__header) {
    border-bottom-color: #243047;
  }

  :global(.login-wrapper.dark .agreement-dialog .el-dialog__title) {
    color: #f8fafc;
  }

  :global(.login-wrapper.dark .agreement-dialog .el-dialog__body) {
    background: #0f172a;
  }

  :global(.login-wrapper.dark .agreement-content) {
    border-color: #243047;
    background: #fff;
  }

  :global(.login-wrapper.dark .agreement-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: #94a3b8;
  }

  @media (width <= 768px) {
    .rg-progress {
      grid-template-columns: 1fr;
    }

    .nature-grid,
    .two-col,
    .verify-row {
      grid-template-columns: 1fr;
    }

    .rg-card__head,
    .agreement-box__head,
    .rg-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .btn-secondary {
      width: 100%;
    }
  }
</style>
