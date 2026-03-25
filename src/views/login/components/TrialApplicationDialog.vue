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
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";
  import MapPin from "~icons/ri/map-pin-line";
  import Message from "~icons/ri/message-3-line";
  import Close from "~icons/ri/close-line";
  import ArrowDown from "~icons/ri/arrow-down-s-line";
  import Check from "~icons/ri/check-line";
  import Search from "~icons/ri/search-line";

  type CityOption = {
    id: number;
    name: string;
    letter: string;
  };

  const loading = ref(false);
  const cityLoading = ref(false);
  const cityPanelVisible = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const keyword = ref("");
  const cityOptions = ref<CityOption[]>([]);
  const activeLetter = ref("A");
  const { isDisabled, text } = useVerifyCode();
  const submitSuccess = ref(false);

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
            callback(new Error("请输入正确的手机号"));
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
    const filtered = cityOptions.value.filter(item => !keyword.value || item.name.includes(keyword.value.trim()));
    return filtered.reduce<Record<string, CityOption[]>>((acc, item) => {
      if (!acc[item.letter]) acc[item.letter] = [];
      acc[item.letter].push(item);
      return acc;
    }, {});
  });

  const availableLetters = computed(() => Object.keys(groupedCities.value).sort());
  const currentCityList = computed(() => groupedCities.value[activeLetter.value] || []);
  const selectedCityLabel = computed(() => form.cityName || "");

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

  const selectLetter = (letter: string) => {
    activeLetter.value = letter;
  };

  const selectCity = (city: CityOption) => {
    form.regionId = city.id;
    form.cityName = city.name;
    cityPanelVisible.value = false;
  };

  const fetchCities = async () => {
    cityLoading.value = true;
    try {
      const res = await getRegionCityList();
      const list = Array.isArray(res?.data) ? res.data : [];
      cityOptions.value = list
        .map(item => {
          const rawLetter = pinyin(item.name || "", { pattern: "first", toneType: "none" })
            .charAt(0)
            .toUpperCase();
          const letter = /^[A-Z]$/.test(rawLetter) ? rawLetter : "#";
          return { id: Number(item.id), name: item.name, letter };
        })
        .sort((a, b) => {
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
      message("请输入图形验证码", { type: "warning" });
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
    if (availableLetters.value.length === 0) {
      activeLetter.value = "A";
      return;
    }
    if (!availableLetters.value.includes(activeLetter.value)) activeLetter.value = availableLetters.value[0];
  });

  onMounted(() => {
    fetchCities();
  });
  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <!-- 成功状态 -->
  <Transition name="fade-up" mode="out-in">
    <div v-if="submitSuccess" class="success-view">
      <div class="success-icon-wrap">
        <div class="success-ring success-ring--outer" />
        <div class="success-ring success-ring--inner" />
        <div class="success-check">
          <el-icon><Check /></el-icon>
        </div>
      </div>
      <h3 class="success-title">申请已提交</h3>
      <p class="success-desc">
        我们会在 1-2 个工作日内审核您的申请，并通过
        <strong>{{ form.phone }}</strong>
        联系您。
      </p>
      <el-button type="primary" size="large" class="success-btn" @click="closeAllDialog()">好的，知道了</el-button>
    </div>

    <!-- 表单主体 -->
    <div v-else class="trial-dialog">
      <!-- 关闭按钮 -->
      <button type="button" class="btn-close" @click="closeAllDialog()">
        <el-icon><Close /></el-icon>
      </button>

      <!-- 左侧装饰条 -->
      <div class="side-accent" aria-hidden="true">
        <span class="side-accent__dot" />
        <span class="side-accent__line" />
        <span class="side-accent__dot" />
      </div>

      <!-- 头部 -->
      <div class="dialog-head">
        <div class="dialog-badge">申请试用</div>
        <h2 class="dialog-title">完善信息，开启试用</h2>
        <p class="dialog-subtitle">提交后进入人工审核，我们将根据您的城市和使用需求安排开通</p>
      </div>

      <!-- 表单 -->
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-position="top" class="trial-form">
        <!-- 手机号 -->
        <el-form-item prop="phone" class="form-field">
          <template #label>
            <span class="field-label">
              <el-icon class="field-label__icon"><Phone /></el-icon>
              手机号码
            </span>
          </template>
          <el-input v-model="form.phone" size="large" clearable maxlength="11" placeholder="输入您的手机号" class="custom-input" />
        </el-form-item>

        <!-- 图形验证码 -->
        <Transition name="slide-down">
          <el-form-item v-if="hasValidPhone" class="form-field captcha-field">
            <template #label>
              <span class="field-label">
                <el-icon class="field-label__icon"><Shield /></el-icon>
                图形验证码
              </span>
            </template>
            <div class="input-addon-row">
              <el-input v-model="imageVerifyCode" size="large" clearable maxlength="4" placeholder="输入图形验证码" class="custom-input" />
              <button type="button" class="captcha-box" :title="captchaImageUrl ? '点击刷新' : '点击加载'" @click="refreshCaptcha">
                <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" class="captcha-img" />
                <span v-else class="captcha-placeholder">
                  <el-icon><Shield /></el-icon>
                  点击加载
                </span>
                <span class="captcha-refresh-tip">刷新</span>
              </button>
            </div>
          </el-form-item>
        </Transition>

        <!-- 短信验证码 -->
        <el-form-item prop="verifyCode" class="form-field">
          <template #label>
            <span class="field-label">
              <el-icon class="field-label__icon"><Shield /></el-icon>
              短信验证码
            </span>
          </template>
          <div class="input-addon-row">
            <el-input v-model="form.verifyCode" size="large" clearable maxlength="6" placeholder="输入短信验证码" class="custom-input" />
            <button type="button" class="sms-btn" :class="{ 'is-disabled': isDisabled }" :disabled="isDisabled" @click="sendVerificationCode">
              <span v-if="isDisabled" class="sms-btn__countdown">{{ text }}s</span>
              <span v-else>发送验证码</span>
            </button>
          </div>
        </el-form-item>

        <!-- 城市选择 -->
        <el-form-item prop="regionId" class="form-field">
          <template #label>
            <span class="field-label">
              <el-icon class="field-label__icon"><MapPin /></el-icon>
              所在城市
            </span>
          </template>
          <div class="city-picker">
            <button type="button" class="city-trigger" :class="{ 'is-open': cityPanelVisible, 'has-value': form.cityName }" @click="toggleCityPanel">
              <span class="city-trigger__value">
                <span v-if="form.cityName" class="city-trigger__text">{{ selectedCityLabel }}</span>
                <span v-else class="city-trigger__placeholder">选择您所在的城市</span>
              </span>
              <el-icon class="city-trigger__arrow"><ArrowDown /></el-icon>
            </button>

            <Transition name="panel-drop">
              <div v-if="cityPanelVisible" class="city-panel">
                <div class="city-search-wrap">
                  <el-icon class="city-search-icon"><Search /></el-icon>
                  <input v-model="keyword" class="city-search-input" placeholder="搜索城市名称…" />
                </div>

                <div class="city-letters-bar">
                  <button
                    v-for="letter in availableLetters"
                    :key="letter"
                    type="button"
                    class="letter-btn"
                    :class="{ 'is-active': letter === activeLetter }"
                    @click="selectLetter(letter)"
                  >
                    {{ letter }}
                  </button>
                </div>

                <div class="city-list">
                  <template v-if="cityLoading">
                    <div class="city-empty">
                      <span class="city-empty__spinner" />
                      加载中…
                    </div>
                  </template>
                  <template v-else-if="currentCityList.length === 0">
                    <div class="city-empty">暂无匹配城市</div>
                  </template>
                  <template v-else>
                    <button
                      v-for="city in currentCityList"
                      :key="city.id"
                      type="button"
                      class="city-option"
                      :class="{ 'is-selected': city.id === form.regionId }"
                      @click="selectCity(city)"
                    >
                      <span>{{ city.name }}</span>
                      <el-icon v-if="city.id === form.regionId" class="city-option__check"><Check /></el-icon>
                    </button>
                  </template>
                </div>
              </div>
            </Transition>
          </div>
        </el-form-item>

        <!-- 使用备注 -->
        <el-form-item class="form-field">
          <template #label>
            <span class="field-label">
              <el-icon class="field-label__icon"><Message /></el-icon>
              使用场景
              <span class="field-label__optional">（选填）</span>
            </span>
          </template>
          <el-input
            v-model="form.usageRemark"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="例如：管理长租公寓 50 套，当前团队 3 人，希望实现合同与账单自动化…"
            class="custom-textarea"
          />
        </el-form-item>
      </el-form>

      <!-- 底部操作 -->
      <div class="dialog-footer">
        <el-button size="large" class="btn-cancel" @click="closeAllDialog()">取消</el-button>
        <el-button type="primary" size="large" class="btn-submit" :loading="loading" @click="handleSubmit">
          <span v-if="!loading">提交申请</span>
          <span v-else>提交中…</span>
        </el-button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
  /* ─── 设计令牌 ─────────────────────────────────── */
  .trial-dialog,
  .success-view {
    --accent: #3b82f6;
    --accent-soft: rgba(59, 130, 246, 0.1);
    --accent-ring: rgba(59, 130, 246, 0.25);
    --radius-sm: 10px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --input-h: 48px;
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    /* 浅色 */
    --bg: #ffffff;
    --bg-subtle: #f8fafc;
    --bg-muted: #f1f5f9;
    --border: #e2e8f0;
    --border-focus: var(--accent);
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --text-placeholder: #94a3b8;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.12);
  }

  /* 深色模式适配 */
  :root.dark .trial-dialog,
  :root.dark .success-view,
  .dark .trial-dialog,
  .dark .success-view,
  [data-theme="dark"] .trial-dialog,
  [data-theme="dark"] .success-view {
    --bg: #0f172a;
    --bg-subtle: #1e293b;
    --bg-muted: #334155;
    --border: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-placeholder: #475569;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.5);
  }

  /* ─── 容器 ─────────────────────────────────────── */
  .trial-dialog {
    position: relative;
    padding: 36px 40px 32px 52px;
    background: var(--bg);
    color: var(--text-primary);
    min-width: 0;
  }

  /* ─── 侧边装饰 ──────────────────────────────────── */
  .side-accent {
    position: absolute;
    left: 20px;
    top: 36px;
    bottom: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .side-accent__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }
  .side-accent__line {
    flex: 1;
    width: 2px;
    background: linear-gradient(to bottom, var(--accent), transparent);
    margin: 4px 0;
    opacity: 0.25;
  }

  /* ─── 关闭按钮 ──────────────────────────────────── */
  .btn-close {
    position: absolute;
    top: 16px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--text-secondary);
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    transition: all var(--transition);
    z-index: 2;

    &:hover {
      color: var(--text-primary);
      background: var(--bg-muted);
    }
  }

  /* ─── 头部 ──────────────────────────────────────── */
  .dialog-head {
    margin-bottom: 28px;
  }

  .dialog-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    margin-bottom: 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent-ring);
    border-radius: 999px;
  }

  .dialog-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }

  .dialog-subtitle {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--text-secondary);
  }

  /* ─── 表单全局覆盖 ──────────────────────────────── */
  .trial-form {
    :deep(.el-form-item) {
      margin-bottom: 20px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 8px !important;
      line-height: 1.4;
    }

    :deep(.el-form-item__error) {
      font-size: 12px;
      padding-top: 4px;
      color: #ef4444;
    }

    /* 清除 ElementPlus 默认 box-shadow */
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-subtle);
      min-height: var(--input-h);
      padding: 0 14px;
      transition:
        border-color var(--transition),
        box-shadow var(--transition),
        background var(--transition);

      &:hover {
        border-color: var(--text-secondary);
      }

      &.is-focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-ring) !important;
        background: var(--bg);
      }
    }

    :deep(.el-input__inner) {
      color: var(--text-primary);
      font-size: 14.5px;

      &::placeholder {
        color: var(--text-placeholder);
      }
    }

    :deep(.el-input__prefix) {
      color: var(--text-secondary);
    }

    :deep(.el-textarea__inner) {
      box-shadow: none !important;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-subtle);
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.7;
      padding: 12px 14px;
      resize: none;
      transition:
        border-color var(--transition),
        box-shadow var(--transition);

      &::placeholder {
        color: var(--text-placeholder);
      }

      &:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-ring) !important;
        background: var(--bg);
      }
    }

    :deep(.el-input__count) {
      background: transparent;
      color: var(--text-placeholder);
      font-size: 11.5px;
    }
  }

  /* ─── 字段标签 ──────────────────────────────────── */
  .field-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-primary);

    &__icon {
      font-size: 14px;
      color: var(--accent);
      opacity: 0.8;
    }

    &__optional {
      font-weight: 400;
      color: var(--text-secondary);
      font-size: 12px;
    }
  }

  /* ─── 行内附加控件 ──────────────────────────────── */
  .input-addon-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    width: 100%;
  }

  /* ─── 图形验证码 ─────────────────────────────────── */
  .captcha-box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: var(--input-h);
    overflow: hidden;
    background: var(--bg-subtle);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      border-color var(--transition),
      box-shadow var(--transition);

    &:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-ring);

      .captcha-refresh-tip {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  .captcha-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .captcha-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);

    .el-icon {
      font-size: 18px;
    }
  }

  .captcha-refresh-tip {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.48);
    opacity: 0;
    transform: translateY(4px);
    transition: all var(--transition);
    backdrop-filter: blur(2px);
  }

  /* ─── 短信按钮 ──────────────────────────────────── */
  .sms-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--input-h);
    padding: 0 18px;
    font-size: 13.5px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1.5px solid var(--accent-ring);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;

    &:hover:not(.is-disabled) {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      box-shadow: 0 4px 12px var(--accent-ring);
    }

    &.is-disabled {
      color: var(--text-secondary);
      background: var(--bg-muted);
      border-color: var(--border);
      cursor: not-allowed;
    }

    &__countdown {
      font-variant-numeric: tabular-nums;
      font-size: 15px;
    }
  }

  /* ─── 城市选择器 ─────────────────────────────────── */
  .city-picker {
    position: relative;
    width: 100%;
  }

  .city-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--input-h);
    padding: 0 14px;
    background: var(--bg-subtle);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
    text-align: left;

    &:hover {
      border-color: var(--text-secondary);
    }

    &.is-open {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-ring);
      background: var(--bg);

      .city-trigger__arrow {
        transform: rotate(180deg);
        color: var(--accent);
      }
    }

    &__value {
      display: flex;
      align-items: center;
      gap: 0;
      min-width: 0;
    }

    &__text {
      font-size: 14.5px;
      font-weight: 500;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__placeholder {
      font-size: 14.5px;
      color: var(--text-placeholder);
    }

    &__arrow {
      flex-shrink: 0;
      font-size: 16px;
      color: var(--text-secondary);
      transition:
        transform var(--transition),
        color var(--transition);
      margin-left: 8px;
    }
  }

  /* ─── 城市下拉面板 ───────────────────────────────── */
  .city-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 100;
    width: 100%;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .city-search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-subtle);
  }

  .city-search-icon {
    flex-shrink: 0;
    font-size: 15px;
    color: var(--text-secondary);
  }

  .city-search-input {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    color: var(--text-primary);
    background: transparent;
    border: 0;
    outline: 0;

    &::placeholder {
      color: var(--text-placeholder);
    }
  }

  .city-letters-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }

  .letter-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 28px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all var(--transition);
    letter-spacing: 0.02em;

    &:hover {
      color: var(--accent);
      background: var(--accent-soft);
    }

    &.is-active {
      color: var(--accent);
      background: var(--accent-soft);
      border-color: var(--accent-ring);
    }
  }

  .city-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px 16px 14px;
    max-height: 220px;
    overflow-y: auto;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 999px;
    }
  }

  .city-option {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 13.5px;
    color: var(--text-primary);
    background: var(--bg-subtle);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;

    &:hover {
      color: var(--accent);
      background: var(--accent-soft);
      border-color: var(--accent-ring);
    }

    &.is-selected {
      color: var(--accent);
      background: var(--accent-soft);
      border-color: var(--accent-ring);
      font-weight: 600;
    }

    &__check {
      font-size: 13px;
    }
  }

  .city-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 24px 0;
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  .city-empty__spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ─── 底部操作 ──────────────────────────────────── */
  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .btn-cancel {
    height: 44px;
    padding: 0 22px;
    font-size: 14px;
    color: var(--text-secondary) !important;
    background: transparent !important;
    border: 1.5px solid var(--border) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: none !important;
    transition: all var(--transition);

    &:hover {
      color: var(--text-primary) !important;
      border-color: var(--text-secondary) !important;
    }
  }

  .btn-submit {
    height: 44px;
    padding: 0 28px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    border-radius: var(--radius-md) !important;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3) !important;
    transition: all var(--transition) !important;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4) !important;
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* ─── 成功态 ─────────────────────────────────────── */
  .success-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 56px 48px 48px;
    text-align: center;
    background: var(--bg);
    color: var(--text-primary);
  }

  .success-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    margin-bottom: 28px;
  }

  .success-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    animation: pulse-ring 2s ease-out infinite;
  }

  .success-ring--outer {
    background: rgba(34, 197, 94, 0.08);
    animation-delay: 0s;
  }

  .success-ring--inner {
    inset: 10px;
    background: rgba(34, 197, 94, 0.14);
    animation-delay: 0.3s;
  }

  .success-check {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.35);
    animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;

    .el-icon {
      font-size: 24px;
      color: #fff;
    }
  }

  .success-title {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text-primary);
  }

  .success-desc {
    margin: 0 0 36px;
    font-size: 14px;
    line-height: 1.75;
    color: var(--text-secondary);
    max-width: 320px;

    strong {
      color: var(--text-primary);
      font-weight: 600;
    }
  }

  .success-btn {
    height: 46px;
    padding: 0 36px;
    font-size: 14.5px;
    font-weight: 600;
    border-radius: var(--radius-md) !important;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3) !important;
  }

  /* ─── 动效 ───────────────────────────────────────── */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse-ring {
    0% {
      transform: scale(0.9);
      opacity: 0.6;
    }
    60% {
      transform: scale(1.15);
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes pop-in {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Transition: slide-down (图形验证码出现) */
  .slide-down-enter-active {
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .slide-down-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  /* Transition: panel-drop (城市面板) */
  .panel-drop-enter-active {
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .panel-drop-leave-active {
    transition: all 0.16s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .panel-drop-enter-from,
  .panel-drop-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
    transform-origin: top center;
  }

  /* Transition: fade-up (表单 ↔ 成功态) */
  .fade-up-enter-active {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-up-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-up-enter-from {
    opacity: 0;
    transform: translateY(12px);
  }
  .fade-up-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  /* ─── 响应式 ─────────────────────────────────────── */
  @media (width <= 640px) {
    .trial-dialog {
      padding: 28px 20px 24px 32px;
    }

    .dialog-title {
      font-size: 19px;
    }

    .input-addon-row {
      grid-template-columns: 1fr;
    }

    .captcha-box {
      width: 100%;
      height: 44px;
    }

    .sms-btn {
      width: 100%;
      justify-content: center;
    }

    .dialog-footer {
      flex-direction: column-reverse;
      gap: 8px;

      .btn-cancel,
      .btn-submit {
        width: 100%;
        justify-content: center;
      }
    }

    .success-view {
      padding: 40px 28px 36px;
    }
  }
</style>
