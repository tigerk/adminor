<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from "vue";
  import { useI18n } from "vue-i18n";
  import type { FormInstance, FormRules } from "element-plus";
  import { isPhone } from "@pureadmin/utils";
  import Motion from "../utils/motion";
  import { message } from "@/utils/message";
  import { updateRules, REGEXP_PWD } from "../utils/rule";
  import { useVerifyCode } from "../utils/verifyCode";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { registerAccount, sendSmsCode } from "@/api/login";
  import Lock from "~icons/ri/lock-fill";
  import User from "~icons/ri/user-3-fill";
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";

  const { t } = useI18n();
  const emit = defineEmits<{
    (e: "switchPage", page: string): void;
    (e: "showImageVerify", callback: (captcha: string) => void): void;
  }>();

  const loading = ref(false);
  const agreementVisible = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const { isDisabled, text } = useVerifyCode();

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
  const identityHint = computed(() =>
    isPersonal.value ? "个人注册时，真实姓名会自动写入法定代表人和联系人，手机号会写入联系电话。" : "企业注册需填写公司主体信息，后续将以该信息初始化公司档案。"
  );

  const formRules = reactive<FormRules>({
    ...updateRules,
    companyName: [
      {
        required: true,
        message: "名称为必填项",
        trigger: "blur"
      }
    ],
    legalPerson: [
      {
        validator: (_, value, callback) => {
          const actualValue = isPersonal.value ? registerForm.realName : value;
          if (!actualValue) {
            callback(new Error(isPersonal.value ? "真实姓名为必填项" : "法定代表人为必填项"));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    contactName: [
      {
        validator: (_, value, callback) => {
          const actualValue = isPersonal.value ? registerForm.realName : value;
          if (!actualValue) {
            callback(new Error(isPersonal.value ? "真实姓名为必填项" : "联系人为必填项"));
          } else {
            callback();
          }
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
          if (!value) {
            callback(new Error("真实姓名为必填项"));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    phone: [
      {
        validator: (_, value, callback) => {
          if (!value) {
            callback(new Error(transformI18n($t("login.purePhoneReg"))));
          } else if (!isPhone(value)) {
            callback(new Error(transformI18n($t("login.purePhoneCorrectReg"))));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    password: [
      {
        validator: (_, value, callback) => {
          if (!value) {
            callback(new Error(transformI18n($t("login.purePassWordReg"))));
          } else if (!REGEXP_PWD.test(value)) {
            callback(new Error(transformI18n($t("login.purePassWordRuleReg"))));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    confirmPassword: [
      {
        validator: (_, value, callback) => {
          if (!value) {
            callback(new Error(transformI18n($t("login.purePassWordSureReg"))));
          } else if (registerForm.password !== value) {
            callback(new Error(transformI18n($t("login.purePassWordDifferentReg"))));
          } else {
            callback();
          }
        },
        trigger: "blur"
      }
    ],
    agreed: [
      {
        validator: (_, value, callback) => {
          if (!value) {
            callback(new Error("请先同意平台使用协议"));
          } else {
            callback();
          }
        },
        trigger: "change"
      }
    ]
  });

  const buildRegisterPayload = () => {
    const legalPerson = isPersonal.value ? registerForm.realName : registerForm.legalPerson;
    const contactName = isPersonal.value ? registerForm.realName : registerForm.contactName;

    return {
      nature: registerForm.nature,
      companyName: registerForm.companyName,
      companyAbbr: isPersonal.value ? "" : registerForm.companyAbbr,
      legalPerson,
      contactName,
      phone: registerForm.phone,
      password: registerForm.password,
      verificationCode: registerForm.verifyCode
    };
  };

  const onRegister = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    loading.value = true;
    try {
      const valid = await formEl.validate().catch(() => false);
      if (!valid) return;

      await registerAccount(buildRegisterPayload());
      message("注册成功，请使用手机号登录", { type: "success" });
      emit("switchPage", "login");
    } finally {
      loading.value = false;
    }
  };

  const sendVerificationCode = async (formEl: FormInstance | undefined, field: string) => {
    if (!formEl) return;

    await formEl.validateField(field, async valid => {
      if (!valid) return;

      emit("showImageVerify", (captcha: string) => {
        sendSmsCode({
          phone: registerForm.phone,
          captcha
        }).then(() => {
          useVerifyCode().start(ruleFormRef.value, "phone", 60);
          message("验证码已发送", { type: "success" });
        });
      });
    });
  };

  const onNatureChange = () => {
    registerForm.companyAbbr = isPersonal.value ? "" : registerForm.companyAbbr;
    registerForm.legalPerson = "";
    registerForm.contactName = "";
    registerForm.realName = "";
    ruleFormRef.value?.clearValidate(["legalPerson", "contactName", "realName"]);
  };

  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <Motion key="register">
    <div class="form-header">
      <h1 class="form-title">创建账户</h1>
      <p class="form-subtitle">先完成主体信息和登录信息，带 * 的字段必须填写</p>
    </div>

    <el-form ref="ruleFormRef" :model="registerForm" :rules="formRules" label-position="top" class="auth-form">
      <section class="form-section">
        <div class="section-head">
          <span class="section-title">主体类型</span>
          <span class="section-tip">决定注册时需要填写的资料</span>
        </div>

        <el-form-item prop="nature" class="compact-item">
          <el-radio-group v-model="registerForm.nature" class="nature-group" @change="onNatureChange">
            <el-radio-button :value="2">个人主体</el-radio-button>
            <el-radio-button :value="1">企业主体</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <div class="mode-hint">
          {{ identityHint }}
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <span class="section-title">主体信息</span>
          <span class="section-tip">{{ isPersonal ? "用于创建个人主体档案" : "用于创建企业主体档案" }}</span>
        </div>

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

        <template v-else>
          <div class="grid-two">
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
          </div>
        </template>
      </section>

      <section class="form-section">
        <div class="section-head">
          <span class="section-title">登录信息</span>
          <span class="section-tip">手机号会用于登录、短信验证和联系电话</span>
        </div>

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

        <el-form-item prop="verifyCode">
          <template #label>
            <span class="field-label">
              <em>*</em>
              短信验证码
            </span>
          </template>
          <div class="verify-code-wrapper">
            <el-input v-model="registerForm.verifyCode" size="large" clearable placeholder="请输入短信验证码">
              <template #prefix>
                <el-icon><Shield /></el-icon>
              </template>
            </el-input>
            <el-button class="verify-btn" :disabled="isDisabled" @click="sendVerificationCode(ruleFormRef, 'phone')">
              {{ text.length > 0 ? text + t("login.pureInfo") : "获取验证码" }}
            </el-button>
          </div>
        </el-form-item>

        <div class="grid-two">
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
      </section>

      <section class="agreement-panel">
        <div class="agreement-head">
          <div>
            <div class="agreement-title">平台使用协议</div>
            <div class="agreement-desc">注册即表示你将使用本系统开展租房业务管理，请先阅读责任边界和合规要求。</div>
          </div>
          <el-button text type="primary" class="agreement-link" @click="agreementVisible = true">查看完整协议</el-button>
        </div>

        <el-form-item prop="agreed" class="agreement-item">
          <el-checkbox v-model="registerForm.agreed">我已阅读并同意《平台使用协议》</el-checkbox>
        </el-form-item>
      </section>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="onRegister(ruleFormRef)">注 册</el-button>

      <div class="switch-page">
        <el-space>
          <span>已有账户？</span>
          <el-button link type="primary" @click="emit('switchPage', 'login')">立即登录</el-button>
        </el-space>
      </div>
    </el-form>

    <el-dialog v-model="agreementVisible" title="平台使用协议" width="760px" destroy-on-close append-to-body align-center class="agreement-dialog">
      <div class="agreement-content">
        <p>1. 本系统为租房 SaaS 工具平台，仅提供信息化管理能力，不参与用户的实际经营、交易、签约、收付款、房源审核或线下履约行为。</p>
        <p>2. 使用方在系统中录入、发布、管理、传播的房源、客户、合同、账单及其他业务数据，必须真实、合法、有效，不得存在虚假房源、欺诈租客或业主、隐瞒事实、误导交易等行为。</p>
        <p>3. 使用方必须遵守中华人民共和国现行法律法规、行政条例及监管要求，不得借助本系统从事任何违法违规活动，包括但不限于发布违法信息、实施商业欺诈、侵犯他人合法权益等。</p>
        <p>
          4. 因使用方运营行为、管理行为、发布内容、签约履约行为或违法违规行为引发的任何业务纠纷、民事责任、行政处罚、刑事风险、赔偿责任、仲裁诉讼及其他法律后果，均由使用方自行承担
          100% 责任，与本租房 SaaS 系统及平台提供方无关。
        </p>
        <p>5. 如使用方违反本协议或法律法规，平台有权视情况采取限制功能、暂停服务、终止服务、保留证据并配合监管机关处理等措施。</p>
        <p>6. 勾选“同意平台使用协议”即视为使用方已充分阅读、理解并接受本协议全部内容。</p>
      </div>
    </el-dialog>
  </Motion>
</template>

<style scoped lang="scss">
  .form-header {
    margin-bottom: 24px;
    text-align: left;
  }

  .form-title {
    margin-bottom: 8px;
    font-size: 30px;
    font-weight: 700;
    color: #101828;
    letter-spacing: -0.02em;
  }

  .form-subtitle {
    font-size: 14px;
    line-height: 1.6;
    color: #667085;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;

    :deep(.el-form-item) {
      margin-bottom: 0;
      align-items: stretch;
      width: 100%;
    }

    :deep(.el-form-item__label) {
      display: block;
      height: auto;
      margin-bottom: 8px;
      line-height: 1.2;
      white-space: normal;
    }

    :deep(.el-input__wrapper) {
      min-height: 50px;
      width: 100%;
      padding: 8px 16px;
      background: #fff;
      border: 1px solid #d0d5dd;
      border-radius: 14px;
      box-shadow: 0 1px 2px rgb(16 24 40 / 4%) !important;
      transition: 0.22s ease;

      &:hover {
        border-color: #98a2b3;
      }

      &.is-focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 4px rgb(37 99 235 / 12%) !important;
      }
    }

    :deep(.el-input__inner) {
      height: 32px;
      font-size: 15px;
      color: #101828;

      &::placeholder {
        color: #98a2b3;
      }
    }

    :deep(.el-input__prefix) {
      color: #98a2b3;
    }

    :deep(.el-form-item__error) {
      position: static;
      padding-top: 6px;
      font-size: 12px;
      line-height: 1.4;
      color: #d92d20;
    }

    :deep(.el-form-item__content) {
      display: block;
      width: 100%;
      line-height: 1.4;
    }
  }

  .form-section {
    width: 100%;
    padding: 18px;
    background: linear-gradient(180deg, rgb(248 250 252 / 92%) 0%, #fff 100%);
    border: 1px solid #eaecf0;
    border-radius: 18px;
    box-sizing: border-box;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 700;
    color: #101828;
  }

  .section-tip {
    font-size: 12px;
    color: #667085;
    text-align: right;
  }

  .mode-hint {
    margin-top: 12px;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.6;
    color: #475467;
    background: #f8fafc;
    border: 1px dashed #d0d5dd;
    border-radius: 14px;
  }

  .field-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #344054;

    em {
      font-style: normal;
      color: #d92d20;
    }

    span {
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 500;
      color: #667085;
      background: #f2f4f7;
      border-radius: 999px;
    }
  }

  .field-label.optional {
    em {
      display: none;
    }
  }

  .nature-group {
    display: flex;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: #fff;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-color: #2563eb;
      box-shadow: 0 10px 24px rgb(37 99 235 / 22%);
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      height: 48px;
      line-height: 34px;
      font-weight: 600;
      color: #344054;
      background: #fff;
      border: 1px solid #d0d5dd;
      border-radius: 14px;
      box-shadow: none;
    }
  }

  .grid-two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
  }

  .compact-item {
    margin-bottom: 0;
  }

  .verify-code-wrapper {
    display: flex;
    align-items: stretch;
    gap: 12px;
    width: 100%;

    .verify-btn {
      flex-shrink: 0;
      min-width: 132px;
      height: 50px;
      padding: 0 18px;
      font-weight: 600;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 14px;
    }
  }

  .agreement-panel {
    width: 100%;
    padding: 16px 18px 10px;
    background: linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%);
    border: 1px solid #dbe7ff;
    border-radius: 18px;
    box-sizing: border-box;
  }

  .agreement-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .agreement-title {
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 700;
    color: #101828;
  }

  .agreement-desc {
    font-size: 12px;
    line-height: 1.6;
    color: #667085;
  }

  .agreement-link {
    padding: 0;
    font-weight: 600;
  }

  .agreement-item {
    margin-top: 12px;

    :deep(.el-form-item__content) {
      line-height: 1.5;
    }

    :deep(.el-checkbox) {
      align-items: flex-start;
      white-space: normal;
    }
  }

  .submit-btn {
    width: 100%;
    height: 54px;
    margin-top: 4px;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.08em;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    border: none;
    border-radius: 16px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 14px 28px rgb(37 99 235 / 28%);
      transform: translateY(-2px);
    }
  }

  .switch-page {
    font-size: 14px;
    color: #667085;
    text-align: center;
  }

  .agreement-content {
    max-height: 65vh;
    overflow: auto;
    padding-right: 4px;
    line-height: 1.9;
    color: #333;
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

  @media (width <= 768px) {
    .form-header {
      text-align: center;
    }

    .section-head,
    .agreement-head {
      flex-direction: column;
      align-items: flex-start;
    }

    .section-tip {
      text-align: left;
    }

    .grid-two {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .verify-code-wrapper {
      flex-direction: column;

      .verify-btn {
        width: 100%;
      }
    }
  }

  @media (width >= 769px) {
    .form-section,
    .agreement-panel {
      padding-right: 22px;
      padding-left: 22px;
    }
  }
</style>
