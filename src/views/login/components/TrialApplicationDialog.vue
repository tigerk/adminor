<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
  import { pinyin } from "pinyin-pro";
  import { isPhone } from "@pureadmin/utils";
  import type { FormInstance, FormRules } from "element-plus";
  import { closeAllDialog } from "@/components/ReDialog";
  import { message } from "@/utils/message";
  import { baseUrlApi } from "@/api/utils";
  import { sendSmsCode } from "@/api/login";
  import { getRegionCityList } from "@/api/region";
  import { createTrialApplication } from "@/api/trialApplication";
  import { useVerifyCode } from "../utils/verifyCode";
  import Phone from "~icons/ri/smartphone-line";
  import Shield from "~icons/ri/shield-check-line";
  import MapPin from "~icons/ri/map-pin-2-line";
  import MessageIcon from "~icons/ri/chat-1-line";
  import ArrowDown from "~icons/ri/arrow-down-s-line";
  import CheckIcon from "~icons/ri/check-line";
  import SearchIcon from "~icons/ri/search-line";
  import RefreshIcon from "~icons/ri/refresh-line";

  type CityOption = { id: number; name: string; letter: string };

  const loading = ref(false);
  const cityLoading = ref(false);
  const cityPanelVisible = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const keyword = ref("");
  const cityOptions = ref<CityOption[]>([]);
  const activeLetter = ref("A");
  const submitSuccess = ref(false);
  const { isDisabled, text } = useVerifyCode();

  const form = reactive({
    phone: "",
    verifyCode: "",
    regionId: null as number | null,
    cityName: "",
    usageRemark: ""
  });

  const rules = reactive<FormRules>({
    phone: [
      { required: true, message: "请输入手机号", trigger: "blur" },
      {
        validator: (_, value, callback) => {
          if (!value) {
            callback();
            return;
          }
          if (!isPhone(value)) {
            callback(new Error("手机号格式不正确"));
            return;
          }
          callback();
        },
        trigger: "blur"
      }
    ],
    verifyCode: [{ required: true, message: "请输入短信验证码", trigger: "blur" }],
    regionId: [{ required: true, message: "请选择城市", trigger: "change" }]
  });

  const hasValidPhone = computed(() => /^1\d{10}$/.test(form.phone));

  const groupedCities = computed(() => {
    const filtered = cityOptions.value.filter(c => !keyword.value || c.name.includes(keyword.value.trim()));
    return filtered.reduce<Record<string, CityOption[]>>((acc, item) => {
      if (!acc[item.letter]) acc[item.letter] = [];
      acc[item.letter].push(item);
      return acc;
    }, {});
  });

  const availableLetters = computed(() => Object.keys(groupedCities.value).sort());
  const currentCityList = computed(() => groupedCities.value[activeLetter.value] || []);

  const refreshCaptcha = () => {
    if (!hasValidPhone.value) {
      captchaImageUrl.value = "";
      return;
    }
    captchaImageUrl.value = `${baseUrlApi(`captcha/${form.phone}`)}?t=${Date.now()}`;
  };

  const toggleCityPanel = () => {
    cityPanelVisible.value = !cityPanelVisible.value;
    if (cityPanelVisible.value && availableLetters.value.length > 0 && !availableLetters.value.includes(activeLetter.value)) {
      activeLetter.value = availableLetters.value[0];
    }
  };

  const selectCity = (city: CityOption) => {
    form.regionId = city.id;
    form.cityName = city.name;
    cityPanelVisible.value = false;
    keyword.value = "";
  };

  const fetchCities = async () => {
    cityLoading.value = true;
    try {
      const res = await getRegionCityList();
      const list = Array.isArray(res?.data) ? res.data : [];
      cityOptions.value = list
        .map((item: any) => {
          const rawLetter = pinyin(item.name || "", { pattern: "first", toneType: "none" })
            .charAt(0)
            .toUpperCase();
          const letter = /^[A-Z]$/.test(rawLetter) ? rawLetter : "#";
          return { id: Number(item.id), name: item.name, letter };
        })
        .sort((a: CityOption, b: CityOption) => {
          if (a.letter === b.letter) return a.name.localeCompare(b.name, "zh-CN");
          if (a.letter === "#") return 1;
          if (b.letter === "#") return -1;
          return a.letter.localeCompare(b.letter);
        });
      activeLetter.value = availableLetters.value[0] || "A";
    } finally {
      cityLoading.value = false;
    }
  };

  const sendVerificationCode = async () => {
    if (!ruleFormRef.value) return;
    try {
      await ruleFormRef.value.validateField("phone");
    } catch {
      return;
    }
    if (!imageVerifyCode.value) {
      message("请先输入图形验证码", { type: "warning" });
      refreshCaptcha();
      return;
    }
    try {
      await sendSmsCode({ phone: form.phone, captcha: imageVerifyCode.value });
      useVerifyCode().start(ruleFormRef.value, "phone", 60);
      message("验证码已发送", { type: "success" });
    } catch {
      refreshCaptcha();
    }
  };

  const handleSubmit = async () => {
    if (!ruleFormRef.value) return;
    loading.value = true;
    try {
      const valid = await ruleFormRef.value.validate().catch(() => false);
      if (!valid) return;
      await createTrialApplication({
        phone: form.phone,
        verificationCode: form.verifyCode,
        regionId: form.regionId,
        usageRemark: form.usageRemark
      });
      submitSuccess.value = true;
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => form.phone,
    phone => {
      form.verifyCode = "";
      imageVerifyCode.value = "";
      if (phone.length === 11 && hasValidPhone.value) refreshCaptcha();
      else captchaImageUrl.value = "";
    }
  );

  watch(keyword, () => {
    if (!availableLetters.value.includes(activeLetter.value)) {
      activeLetter.value = availableLetters.value[0] || "A";
    }
  });

  onMounted(fetchCities);
  onBeforeUnmount(() => useVerifyCode().end());
</script>

<template>
  <div class="tad-root">
    <!-- ══════════════════════════════════
         左侧品牌栏
    ══════════════════════════════════ -->
    <aside class="tad-brand" aria-hidden="true">
      <div class="tad-brand__bg" />
      <div class="tad-brand__glow1" />
      <div class="tad-brand__glow2" />

      <div class="tad-brand__inner">
        <!-- Logo 区 -->
        <div class="tad-brand__logo">
          <div class="tad-brand__logo-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round" />
              <circle cx="9" cy="9" r="2" fill="white" />
            </svg>
          </div>
          <span>申请试用</span>
        </div>

        <!-- 主文案 -->
        <div class="tad-brand__copy">
          <h2>
            开启您的
            <br />
            专属试用
          </h2>
          <p>
            完成信息填写后，我们将在
            <strong>1–2 个工作日</strong>
            内完成审核并联系您开通账号。
          </p>
        </div>

        <!-- 流程步骤 -->
        <ol class="tad-steps">
          <li class="tad-step">
            <div class="tad-step__badge">01</div>
            <div>
              <strong>填写申请</strong>
              <span>手机号 + 所在城市</span>
            </div>
          </li>
          <li class="tad-step__line" />
          <li class="tad-step">
            <div class="tad-step__badge">02</div>
            <div>
              <strong>人工审核</strong>
              <span>1–2 个工作日处理</span>
            </div>
          </li>
          <li class="tad-step__line" />
          <li class="tad-step">
            <div class="tad-step__badge">03</div>
            <div>
              <strong>短信通知</strong>
              <span>账号开通，即可使用</span>
            </div>
          </li>
        </ol>

        <!-- 底部声明 -->
        <p class="tad-brand__note">提交即代表同意平台服务协议与隐私政策</p>
      </div>
    </aside>

    <!-- ══════════════════════════════════
         右侧内容区
    ══════════════════════════════════ -->
    <div class="tad-main">
      <Transition name="tad-view" mode="out-in">
        <!-- ── 成功态 ── -->
        <div v-if="submitSuccess" key="success" class="tad-success">
          <div class="tad-success__anim">
            <svg class="tad-success__circle" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="201" stroke-dashoffset="201">
                <animate attributeName="stroke-dashoffset" from="201" to="0" dur="0.55s" fill="freeze" begin="0.05s" easing="ease-out" />
              </circle>
            </svg>
            <div class="tad-success__icon">
              <el-icon><CheckIcon /></el-icon>
            </div>
          </div>
          <h3>申请已提交！</h3>
          <p>
            我们将通过
            <strong>{{ form.phone }}</strong>
            与您联系，请保持手机畅通。
          </p>
          <el-button type="primary" size="large" class="tad-submit-btn" style="width: 100%" @click="closeAllDialog()">好的，我知道了</el-button>
        </div>

        <!-- ── 表单 ── -->
        <div v-else key="form" class="tad-form-wrap">
          <header class="tad-form-header">
            <h3>完善申请信息</h3>
            <p>请如实填写以下信息，便于我们快速为您开通</p>
          </header>

          <el-form ref="ruleFormRef" :model="form" :rules="rules" label-position="top" class="tad-form">
            <!-- 手机号 -->
            <el-form-item prop="phone" class="tad-field">
              <template #label>
                <span class="tad-field-label">
                  <el-icon><Phone /></el-icon>
                  手机号码
                  <em class="tad-req">*</em>
                </span>
              </template>
              <el-input v-model="form.phone" size="large" clearable maxlength="11" placeholder="请输入您的手机号码" class="tad-input" />
            </el-form-item>

            <!-- 图形验证码 -->
            <Transition name="tad-reveal">
              <el-form-item v-if="hasValidPhone" class="tad-field tad-field--no-req">
                <template #label>
                  <span class="tad-field-label">
                    <el-icon><Shield /></el-icon>
                    图形验证码
                  </span>
                </template>
                <div class="tad-inline">
                  <el-input v-model="imageVerifyCode" size="large" clearable maxlength="4" placeholder="输入图形验证码" class="tad-input" />
                  <button type="button" class="tad-captcha-btn" :title="captchaImageUrl ? '点击刷新验证码' : '点击加载验证码'" @click="refreshCaptcha">
                    <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" />
                    <span v-else class="tad-captcha-btn__empty">
                      <el-icon><RefreshIcon /></el-icon>
                      <b>点击加载</b>
                    </span>
                    <span class="tad-captcha-btn__mask">
                      <el-icon><RefreshIcon /></el-icon>
                    </span>
                  </button>
                </div>
              </el-form-item>
            </Transition>

            <!-- 短信验证码 -->
            <el-form-item prop="verifyCode" class="tad-field">
              <template #label>
                <span class="tad-field-label">
                  <el-icon><Shield /></el-icon>
                  短信验证码
                  <em class="tad-req">*</em>
                </span>
              </template>
              <div class="tad-inline">
                <el-input v-model="form.verifyCode" size="large" clearable maxlength="6" placeholder="输入 6 位验证码" class="tad-input" />
                <button type="button" class="tad-sms-btn" :class="{ 'is-waiting': isDisabled }" :disabled="isDisabled" @click="sendVerificationCode">
                  <span v-if="isDisabled">
                    <b class="tad-countdown">{{ text }}s</b>
                    &nbsp;后重发
                  </span>
                  <span v-else>获取验证码</span>
                </button>
              </div>
            </el-form-item>

            <!-- 城市 -->
            <el-form-item prop="regionId" class="tad-field">
              <template #label>
                <span class="tad-field-label">
                  <el-icon><MapPin /></el-icon>
                  所在城市
                  <em class="tad-req">*</em>
                </span>
              </template>
              <div class="tad-city-picker">
                <button type="button" class="tad-city-trigger" :class="{ 'is-open': cityPanelVisible }" @click="toggleCityPanel">
                  <span :class="form.cityName ? 'tad-city-val' : 'tad-city-ph'">
                    {{ form.cityName || "选择您所在的城市" }}
                  </span>
                  <el-icon class="tad-city-arrow"><ArrowDown /></el-icon>
                </button>

                <Transition name="tad-panel">
                  <div v-if="cityPanelVisible" class="tad-city-panel">
                    <div class="tad-city-search">
                      <el-icon><SearchIcon /></el-icon>
                      <input v-model="keyword" placeholder="搜索城市名称…" />
                    </div>
                    <div class="tad-city-letters">
                      <button v-for="l in availableLetters" :key="l" type="button" class="tad-city-letter" :class="{ active: l === activeLetter }" @click="activeLetter = l">
                        {{ l }}
                      </button>
                    </div>
                    <div class="tad-city-list">
                      <div v-if="cityLoading" class="tad-city-empty">
                        <span class="tad-spin" />
                        加载中…
                      </div>
                      <div v-else-if="!currentCityList.length" class="tad-city-empty">暂无匹配城市</div>
                      <button
                        v-for="city in currentCityList"
                        :key="city.id"
                        type="button"
                        class="tad-city-chip"
                        :class="{ selected: city.id === form.regionId }"
                        @click="selectCity(city)"
                      >
                        <el-icon v-if="city.id === form.regionId"><CheckIcon /></el-icon>
                        {{ city.name }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </el-form-item>

            <!-- 使用场景（选填） -->
            <el-form-item class="tad-field tad-field--no-req">
              <template #label>
                <span class="tad-field-label">
                  <el-icon><MessageIcon /></el-icon>
                  使用场景
                  <span class="tad-opt-tag">选填</span>
                </span>
              </template>
              <el-input
                v-model="form.usageRemark"
                type="textarea"
                :rows="3"
                maxlength="300"
                show-word-limit
                placeholder="简述您的团队规模、房源类型，或当前遇到的问题，帮助我们更好地服务您…"
                class="tad-textarea"
              />
            </el-form-item>
          </el-form>

          <!-- 底部操作 -->
          <div class="tad-actions">
            <el-button class="tad-cancel-btn" size="large" @click="closeAllDialog()">取消</el-button>
            <el-button type="primary" size="large" class="tad-submit-btn" :loading="loading" @click="handleSubmit">提交申请</el-button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* ════════════════════════════════════════════
   设计令牌
════════════════════════════════════════════ */
  .tad-root {
    /* 主色 */
    --accent: #2563eb;
    --accent-h: #1d4ed8;
    --accent-muted: rgba(37, 99, 235, 0.09);
    --accent-ring: rgba(37, 99, 235, 0.22);
    --success: #22c55e;

    /* 语义色 — 浅色 */
    --bg: #ffffff;
    --bg-sub: #f8fafc;
    --bg-hover: #f1f5f9;
    --border: #e2e8f0;
    --border-h: #94a3b8;
    --t1: #0f172a;
    --t2: #475569;
    --t3: #94a3b8;
    --shadow: rgba(15, 23, 42, 0.07);

    /* 品牌栏（始终深色，不变） */
    --brand-a: #1e3a8a;
    --brand-b: #172554;

    /* 基础 */
    --r: 10px;
    --r-lg: 14px;
    --h: 46px;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 深色覆盖 */
  :root.dark .tad-root,
  .dark .tad-root,
  [data-theme="dark"] .tad-root {
    --bg: #0f172a;
    --bg-sub: #1e293b;
    --bg-hover: #334155;
    --border: #334155;
    --border-h: #64748b;
    --t1: #f1f5f9;
    --t2: #94a3b8;
    --t3: #475569;
    --shadow: rgba(0, 0, 0, 0.35);
  }

  /* ════════════════════════════════════════════
   根布局
════════════════════════════════════════════ */
  .tad-root {
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  /* ════════════════════════════════════════════
   左侧品牌栏
════════════════════════════════════════════ */
  .tad-brand {
    position: relative;
    flex-shrink: 0;
    width: 252px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tad-brand__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(150deg, var(--brand-a) 0%, var(--brand-b) 100%);
  }

  .tad-brand__glow1,
  .tad-brand__glow2 {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .tad-brand__glow1 {
    width: 320px;
    height: 320px;
    top: -120px;
    left: -100px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 65%);
  }
  .tad-brand__glow2 {
    width: 260px;
    height: 260px;
    bottom: -80px;
    right: -80px;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.18) 0%, transparent 65%);
  }

  .tad-brand__inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 30px 26px 26px;
  }

  .tad-brand__logo {
    display: flex;
    align-items: center;
    gap: 10px;

    span {
      font-size: 14.5px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0.02em;
    }
  }

  .tad-brand__logo-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9px;
    flex-shrink: 0;
  }

  .tad-brand__copy {
    margin: 40px 0 32px;

    h2 {
      margin: 0 0 14px;
      font-size: 21px;
      font-weight: 800;
      line-height: 1.35;
      color: #fff;
      letter-spacing: -0.3px;
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.75;
      color: rgba(255, 255, 255, 0.55);

      strong {
        color: rgba(255, 255, 255, 0.8);
        font-weight: 600;
      }
    }
  }

  /* 步骤列表 */
  .tad-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .tad-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    &__badge {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10.5px;
      font-weight: 800;
      color: var(--brand-a);
      background: rgba(255, 255, 255, 0.9);
      border-radius: 7px;
      letter-spacing: 0.02em;
    }

    div:last-child {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 3px;
    }

    strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
    }

    span {
      font-size: 11.5px;
      color: rgba(255, 255, 255, 0.45);
      line-height: 1.4;
    }

    &__line {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.12);
      margin: 3px 0 3px 12px;
    }
  }

  .tad-brand__note {
    margin: auto 0 0;
    padding-top: 28px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    line-height: 1.5;
  }

  /* ════════════════════════════════════════════
   右侧主区
════════════════════════════════════════════ */
  .tad-main {
    flex: 1;
    min-width: 0;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 80vh;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 999px;
    }
  }

  /* ════════════════════════════════════════════
   成功态
════════════════════════════════════════════ */
  .tad-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 52px 48px;
    text-align: center;

    h3 {
      margin: 20px 0 10px;
      font-size: 19px;
      font-weight: 800;
      color: var(--t1);
      letter-spacing: -0.2px;
    }

    p {
      margin: 0 0 32px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--t2);
      max-width: 300px;

      strong {
        color: var(--t1);
        font-weight: 600;
      }
    }
  }

  .tad-success__anim {
    position: relative;
    width: 72px;
    height: 72px;
  }

  .tad-success__circle {
    position: absolute;
    inset: 0;
    width: 72px;
    height: 72px;
  }

  .tad-success__icon {
    position: absolute;
    inset: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--success);
    border-radius: 50%;
    animation: tad-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);

    .el-icon {
      font-size: 20px;
      color: #fff;
    }
  }

  /* ════════════════════════════════════════════
   表单包装
════════════════════════════════════════════ */
  .tad-form-wrap {
    display: flex;
    flex-direction: column;
    padding: 32px 36px 28px;
  }

  .tad-form-header {
    margin-bottom: 24px;

    h3 {
      margin: 0 0 5px;
      font-size: 17px;
      font-weight: 800;
      color: var(--t1);
      letter-spacing: -0.2px;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--t3);
    }
  }

  /* ════════════════════════════════════════════
   ElementPlus 重置
════════════════════════════════════════════ */
  .tad-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 6px !important;
      line-height: 1;
    }

    :deep(.el-form-item__error) {
      padding-top: 3px;
      font-size: 11.5px;
      color: #ef4444;
    }

    :deep(.el-input__wrapper) {
      height: var(--h);
      padding: 0 13px;
      box-shadow: none !important;
      border: 1.5px solid var(--border);
      border-radius: var(--r);
      background: var(--bg-sub) !important;
      transition:
        border-color 0.16s var(--ease),
        box-shadow 0.16s var(--ease),
        background 0.16s var(--ease);

      &:hover:not(.is-focus) {
        border-color: var(--border-h);
      }
      &.is-focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-ring) !important;
        background: var(--bg) !important;
      }
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      color: var(--t1);
      &::placeholder {
        color: var(--t3);
      }
    }

    :deep(.el-input__prefix-inner .el-icon),
    :deep(.el-input__suffix-inner .el-icon) {
      color: var(--t3);
    }

    :deep(.el-textarea__inner) {
      box-shadow: none !important;
      border: 1.5px solid var(--border);
      border-radius: var(--r);
      background: var(--bg-sub) !important;
      padding: 11px 13px;
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--t1);
      resize: none;
      transition:
        border-color 0.16s var(--ease),
        box-shadow 0.16s var(--ease);

      &::placeholder {
        color: var(--t3);
      }
      &:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-ring) !important;
        background: var(--bg) !important;
      }
    }

    :deep(.el-input__count),
    :deep(.el-input__count-inner) {
      background: transparent !important;
      font-size: 11px;
      color: var(--t3);
    }
  }

  /* ════════════════════════════════════════════
   字段标签
════════════════════════════════════════════ */
  .tad-field-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--t2);

    .el-icon {
      font-size: 13px;
      color: var(--accent);
      opacity: 0.85;
    }
  }

  .tad-req {
    font-style: normal;
    color: #ef4444;
    font-size: 14px;
    line-height: 1;
  }

  .tad-opt-tag {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--t3);
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-style: normal;
  }

  /* ════════════════════════════════════════════
   行内控件行
════════════════════════════════════════════ */
  .tad-inline {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  /* 图形验证码按钮 */
  .tad-captcha-btn {
    position: relative;
    flex-shrink: 0;
    width: 124px;
    height: var(--h);
    overflow: hidden;
    border: 1.5px solid var(--border);
    border-radius: var(--r);
    background: var(--bg-sub);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.16s var(--ease);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .el-icon {
        font-size: 15px;
        color: var(--t3);
      }

      b {
        font-size: 10.5px;
        font-weight: 500;
        color: var(--t3);
      }
    }

    &__mask {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity 0.16s var(--ease);

      .el-icon {
        font-size: 17px;
        color: #fff;
      }
    }

    &:hover {
      border-color: var(--accent);
      .tad-captcha-btn__mask {
        opacity: 1;
      }
    }
  }

  /* 短信按钮 */
  .tad-sms-btn {
    flex-shrink: 0;
    height: var(--h);
    padding: 0 15px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--accent);
    background: var(--accent-muted);
    border: 1.5px solid var(--accent-ring);
    border-radius: var(--r);
    cursor: pointer;
    transition: all 0.16s var(--ease);
    line-height: 1;

    &:not(.is-waiting):hover {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      box-shadow: 0 4px 14px var(--accent-ring);
    }

    &.is-waiting {
      color: var(--t3);
      background: var(--bg-sub);
      border-color: var(--border);
      cursor: not-allowed;
    }
  }

  .tad-countdown {
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 800;
  }

  /* ════════════════════════════════════════════
   城市选择器
════════════════════════════════════════════ */
  .tad-city-picker {
    position: relative;
    width: 100%;
  }

  .tad-city-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--h);
    padding: 0 13px;
    background: var(--bg-sub);
    border: 1.5px solid var(--border);
    border-radius: var(--r);
    cursor: pointer;
    transition:
      border-color 0.16s var(--ease),
      box-shadow 0.16s var(--ease);
    text-align: left;

    &:hover:not(.is-open) {
      border-color: var(--border-h);
    }

    &.is-open {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-ring);
      background: var(--bg);

      .tad-city-arrow {
        transform: rotate(180deg);
        color: var(--accent);
      }
    }
  }

  .tad-city-val {
    font-size: 14px;
    font-weight: 500;
    color: var(--t1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tad-city-ph {
    font-size: 14px;
    color: var(--t3);
  }

  .tad-city-arrow {
    flex-shrink: 0;
    font-size: 16px;
    color: var(--t3);
    transition:
      transform 0.18s var(--ease),
      color 0.16s var(--ease);
    margin-left: 6px;
  }

  /* 下拉面板 */
  .tad-city-panel {
    position: absolute;
    top: calc(100% + 7px);
    left: 0;
    right: 0;
    z-index: 300;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--r-lg);
    box-shadow:
      0 14px 44px var(--shadow),
      0 2px 8px var(--shadow);
    overflow: hidden;
  }

  .tad-city-search {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-sub);

    .el-icon {
      font-size: 14px;
      color: var(--t3);
      flex-shrink: 0;
    }

    input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      font-size: 13.5px;
      color: var(--t1);

      &::placeholder {
        color: var(--t3);
      }
    }
  }

  .tad-city-letters {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 9px 13px;
    border-bottom: 1px solid var(--border);
  }

  .tad-city-letter {
    width: 27px;
    height: 25px;
    font-size: 11px;
    font-weight: 700;
    color: var(--t3);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.14s var(--ease);
    letter-spacing: 0.02em;

    &:hover {
      color: var(--accent);
      background: var(--accent-muted);
    }
    &.active {
      color: var(--accent);
      background: var(--accent-muted);
      border-color: var(--accent-ring);
    }
  }

  .tad-city-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 13px 12px;
    max-height: 196px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 999px;
    }
  }

  .tad-city-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 5px 10px;
    font-size: 13px;
    color: var(--t2);
    background: var(--bg-sub);
    border: 1px solid transparent;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.14s var(--ease);
    white-space: nowrap;

    .el-icon {
      font-size: 11px;
    }

    &:hover {
      color: var(--accent);
      background: var(--accent-muted);
      border-color: var(--accent-ring);
    }

    &.selected {
      color: var(--accent);
      background: var(--accent-muted);
      border-color: var(--accent-ring);
      font-weight: 600;
    }
  }

  .tad-city-empty {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 18px 0;
    font-size: 13px;
    color: var(--t3);
    justify-content: center;
  }

  /* ════════════════════════════════════════════
   底部操作区
════════════════════════════════════════════ */
  .tad-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
  }

  .tad-cancel-btn {
    height: 40px !important;
    padding: 0 18px !important;
    font-size: 13.5px !important;
    font-weight: 500 !important;
    color: var(--t2) !important;
    background: transparent !important;
    border: 1.5px solid var(--border) !important;
    border-radius: var(--r) !important;
    box-shadow: none !important;
    transition: all 0.16s var(--ease) !important;

    &:hover {
      color: var(--t1) !important;
      border-color: var(--border-h) !important;
      background: var(--bg-hover) !important;
    }
  }

  .tad-submit-btn {
    height: 40px !important;
    padding: 0 26px !important;
    font-size: 13.5px !important;
    font-weight: 700 !important;
    border-radius: var(--r) !important;
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    box-shadow: 0 3px 10px var(--accent-ring) !important;
    letter-spacing: 0.01em;
    transition: all 0.16s var(--ease) !important;

    &:hover:not(:disabled) {
      background: var(--accent-h) !important;
      border-color: var(--accent-h) !important;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.32) !important;
      transform: translateY(-1px);
    }
    &:active:not(:disabled) {
      transform: none !important;
    }
  }

  /* ════════════════════════════════════════════
   Spinner
════════════════════════════════════════════ */
  .tad-spin {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: tad-spin 0.65s linear infinite;
  }

  /* ════════════════════════════════════════════
   Transitions
════════════════════════════════════════════ */
  /* 图形验证码 reveal */
  .tad-reveal-enter-active {
    transition: all 0.25s var(--ease);
  }
  .tad-reveal-leave-active {
    transition: all 0.16s var(--ease);
  }
  .tad-reveal-enter-from,
  .tad-reveal-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  /* 城市面板 panel */
  .tad-panel-enter-active {
    transition: all 0.2s var(--ease);
  }
  .tad-panel-leave-active {
    transition: all 0.14s var(--ease);
  }
  .tad-panel-enter-from,
  .tad-panel-leave-to {
    opacity: 0;
    transform: translateY(-5px) scale(0.98);
    transform-origin: top center;
  }

  /* 视图切换 */
  .tad-view-enter-active {
    transition: all 0.28s var(--ease);
  }
  .tad-view-leave-active {
    transition: all 0.18s var(--ease);
  }
  .tad-view-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }
  .tad-view-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  /* ════════════════════════════════════════════
   Keyframes
════════════════════════════════════════════ */
  @keyframes tad-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes tad-pop {
    from {
      transform: scale(0.35);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* ════════════════════════════════════════════
   响应式
════════════════════════════════════════════ */
  @media (width <= 600px) {
    .tad-brand {
      display: none;
    }
    .tad-form-wrap {
      padding: 26px 22px 22px;
    }

    .tad-inline {
      flex-direction: column;
      gap: 8px;
    }
    .tad-captcha-btn {
      width: 100%;
    }
    .tad-sms-btn {
      width: 100%;
    }

    .tad-actions {
      flex-direction: column-reverse;
      .tad-cancel-btn,
      .tad-submit-btn {
        width: 100% !important;
      }
    }
  }
</style>
