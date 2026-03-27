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

  type CityOption = { id: number; name: string; letter: string };

  const loading = ref(false);
  const cityLoading = ref(false);
  const cityPanelVisible = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const keyword = ref("");
  const cityOptions = ref<CityOption[]>([]);
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

  const sortedCityGroups = computed(() => {
    const kw = keyword.value.trim();
    const filtered = kw ? cityOptions.value.filter(c => c.name.includes(kw)) : cityOptions.value;
    const groups: Record<string, CityOption[]> = {};
    for (const c of filtered) {
      if (!groups[c.letter]) groups[c.letter] = [];
      groups[c.letter].push(c);
    }
    const letters = Object.keys(groups).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
    return letters.map(letter => ({
      letter,
      cities: groups[letter].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
    }));
  });

  const refreshCaptcha = () => {
    if (!hasValidPhone.value) {
      captchaImageUrl.value = "";
      return;
    }
    captchaImageUrl.value = `${baseUrlApi(`captcha/${form.phone}`)}?t=${Date.now()}`;
  };

  const toggleCityPanel = () => {
    cityPanelVisible.value = !cityPanelVisible.value;
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
      cityOptions.value = list.map((item: any) => {
        const rawLetter = pinyin(item.name || "", { pattern: "first", toneType: "none" })
          .charAt(0)
          .toUpperCase();
        const letter = /^[A-Z]$/.test(rawLetter) ? rawLetter : "#";
        return { id: Number(item.id), name: item.name, letter };
      });
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
      await createTrialApplication({ phone: form.phone, verificationCode: form.verifyCode, regionId: form.regionId, usageRemark: form.usageRemark });
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

  onMounted(fetchCities);
  onBeforeUnmount(() => useVerifyCode().end());
</script>

<template>
  <div class="tad">
    <Transition name="tad-view" mode="out-in">
      <!-- Success state -->
      <div v-if="submitSuccess" key="success" class="tad-success">
        <div class="tad-success__icon">
          <svg viewBox="0 0 64 64" class="tad-success__ring">
            <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="182" stroke-dashoffset="182">
              <animate attributeName="stroke-dashoffset" from="182" to="0" dur="0.5s" fill="freeze" begin="0.05s" />
            </circle>
          </svg>
          <div class="tad-success__check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>
        <h3>申请已提交</h3>
        <p>
          我们将通过
          <strong>{{ form.phone }}</strong>
          联系您，
          <br />
          请保持手机畅通，审核通常在 1–2 个工作日内完成。
        </p>
        <button type="button" class="btn-submit" style="width: 100%; margin-top: 8px" @click="closeAllDialog()">好的，知道了</button>
      </div>

      <!-- Form -->
      <div v-else key="form">
        <div class="tad-head">
          <p>留下手机号和所在城市，我们会在审核后协助开通试用环境</p>
        </div>

        <el-form ref="ruleFormRef" :model="form" :rules="rules" label-position="top" class="tad-form">
          <!-- Phone -->
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              手机号码
              <em class="req">*</em>
            </label>
            <el-form-item prop="phone">
              <el-input v-model="form.phone" clearable maxlength="11" placeholder="请输入手机号码" class="tad-input" />
            </el-form-item>
          </div>

          <!-- Image captcha -->
          <Transition name="tad-expand">
            <div v-if="hasValidPhone" class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                图形验证码
              </label>
              <div class="tad-row">
                <el-input v-model="imageVerifyCode" clearable maxlength="4" placeholder="输入图形验证码" class="tad-input" />
                <button type="button" class="tad-captcha" @click="refreshCaptcha">
                  <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" />
                  <span v-else class="tad-captcha__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    加载验证码
                  </span>
                  <span class="tad-captcha__mask">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- SMS code -->
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              短信验证码
              <em class="req">*</em>
            </label>
            <el-form-item prop="verifyCode">
              <div class="tad-row">
                <el-input v-model="form.verifyCode" clearable maxlength="6" placeholder="输入 6 位验证码" class="tad-input" />
                <button type="button" class="tad-sms-btn" :class="{ waiting: isDisabled }" :disabled="isDisabled" @click="sendVerificationCode">
                  <template v-if="isDisabled">
                    <span class="tad-count">{{ text }}s</span>
                    后重发
                  </template>
                  <template v-else>获取验证码</template>
                </button>
              </div>
            </el-form-item>
          </div>

          <!-- City -->
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              所在城市
              <em class="req">*</em>
            </label>
            <el-form-item prop="regionId">
              <div class="tad-city">
                <button type="button" class="tad-city__trigger" :class="{ open: cityPanelVisible }" @click="toggleCityPanel">
                  <span :class="form.cityName ? 'tad-city__val' : 'tad-city__ph'">
                    {{ form.cityName || "选择所在城市" }}
                  </span>
                  <svg class="tad-city__arrow" :style="cityPanelVisible ? 'transform:rotate(180deg)' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <Transition name="tad-drop">
                  <div v-if="cityPanelVisible" class="tad-city__panel">
                    <div class="tad-city__search">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      <input v-model="keyword" placeholder="搜索城市名称…" class="tad-city__sinput" />
                    </div>
                    <div class="tad-city__scroll">
                      <div v-if="cityLoading" class="tad-city__empty">
                        <span class="tad-spin" />
                        加载中…
                      </div>
                      <div v-else-if="!sortedCityGroups.length" class="tad-city__empty">暂无匹配城市</div>
                      <template v-else>
                        <div v-for="group in sortedCityGroups" :key="group.letter" class="tad-city__group">
                          <div class="tad-city__gl">{{ group.letter }}</div>
                          <div class="tad-city__gc">
                            <button
                              v-for="city in group.cities"
                              :key="city.id"
                              type="button"
                              class="tad-city__chip"
                              :class="{ sel: city.id === form.regionId }"
                              @click="selectCity(city)"
                            >
                              <svg v-if="city.id === form.regionId" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width: 10px; height: 10px">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              {{ city.name }}
                            </button>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>
            </el-form-item>
          </div>

          <!-- Usage remark -->
          <div class="form-group">
            <label class="form-label" style="text-transform: none; letter-spacing: 0">
              使用场景
              <span class="opt-tag">选填</span>
            </label>
            <el-input
              v-model="form.usageRemark"
              type="textarea"
              :rows="3"
              maxlength="300"
              show-word-limit
              placeholder="简述您的团队规模、房源类型，帮助我们更好地为您服务…"
              class="tad-textarea"
            />
          </div>
        </el-form>

        <div class="tad-footer">
          <button type="button" class="btn-cancel" @click="closeAllDialog()">取消</button>
          <button type="button" class="btn-submit" :disabled="loading" @click="handleSubmit">
            {{ loading ? "提交中…" : "提交申请" }}
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
  .tad {
    --bg: #f6f3ee;
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
    --radius-sm: 14px;
    --radius-xs: 10px;
    --sans: "DM Sans", -apple-system, sans-serif;
    --mono: "JetBrains Mono", monospace;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);

    padding: 8px 4px 4px;
    font-family: var(--sans);
    color: var(--text);
  }

  /* Dark mode via el-dialog's dark class */
  :global(.dark) .tad {
    --bg: #161412;
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
  }

  /* Success */
  .tad-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px 12px 8px;

    h3 {
      margin: 14px 0 8px;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    }

    p {
      margin: 0 0 20px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-soft);
      max-width: 300px;

      strong {
        color: var(--text);
        font-weight: 700;
      }
    }
  }

  .tad-success__icon {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .tad-success__ring {
    position: absolute;
    inset: 0;
    color: var(--success);
  }

  .tad-success__check {
    position: absolute;
    inset: 9px;
    background: var(--success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: tad-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) 0.48s both;

    svg {
      width: 20px;
      height: 20px;
      stroke: white;
    }
  }

  /* Head */
  .tad-head {
    margin-bottom: 20px;

    h3 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: var(--text-soft);
    }
  }

  /* Form */
  .tad-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      display: none;
    }

    :deep(.el-form-item__error) {
      position: static;
      padding: 3px 0 6px;
      font-size: 11.5px;
      color: var(--danger);
      font-family: var(--mono);
    }
  }

  .tad-input {
    :deep(.el-input__wrapper) {
      height: 48px;
      background: var(--bg);
      border: 1.5px solid var(--border) !important;
      border-radius: var(--radius-xs) !important;
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
      font-size: 14px;
      font-family: var(--sans);
      color: var(--text);
      background: transparent;
      &::placeholder {
        color: var(--text-faint);
      }
    }
  }

  .tad-textarea {
    :deep(.el-textarea__inner) {
      background: var(--bg);
      border: 1.5px solid var(--border) !important;
      border-radius: var(--radius-xs) !important;
      box-shadow: none !important;
      font-size: 13.5px;
      font-family: var(--sans);
      color: var(--text);
      resize: none;
      transition: all 0.2s var(--ease);

      &::placeholder {
        color: var(--text-faint);
      }
      &:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-bg) !important;
        background: var(--surface-solid);
      }
    }

    :deep(.el-input__count) {
      background: transparent;
      font-size: 11px;
      color: var(--text-faint);
      font-family: var(--mono);
    }
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 7px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-soft);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: var(--mono);

    svg {
      width: 12px;
      height: 12px;
      color: var(--accent);
      opacity: 0.8;
      flex-shrink: 0;
    }
  }

  .req {
    font-style: normal;
    color: var(--danger);
    font-size: 13px;
  }

  .opt-tag {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-faint);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    letter-spacing: 0;
    text-transform: none;
  }

  /* Row */
  .tad-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  /* Captcha */
  .tad-captcha {
    position: relative;
    flex-shrink: 0;
    width: 120px;
    height: 48px;
    overflow: hidden;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xs);
    background: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s var(--ease);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__empty {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-faint);
      font-family: var(--mono);

      svg {
        width: 12px;
        height: 12px;
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
      transition: opacity 0.15s var(--ease);

      svg {
        width: 15px;
        height: 15px;
        stroke: white;
      }
    }

    &:hover {
      border-color: var(--accent);
      .tad-captcha__mask {
        opacity: 1;
      }
    }
  }

  /* SMS btn */
  .tad-sms-btn {
    flex-shrink: 0;
    height: 48px;
    padding: 0 14px;
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1.5px solid var(--accent-border);
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.15s var(--ease);
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

  .tad-count {
    font-variant-numeric: tabular-nums;
    font-weight: 800;
    font-size: 13px;
    font-family: var(--mono);
  }

  /* City picker */
  .tad-city {
    position: relative;
    width: 100%;
  }

  .tad-city__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 48px;
    padding: 0 14px;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.15s var(--ease);
    font-family: var(--sans);

    &:hover:not(.open) {
      border-color: var(--border-strong);
    }
    &.open {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-bg);
    }
  }

  .tad-city__val {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }
  .tad-city__ph {
    font-size: 14px;
    color: var(--text-faint);
  }

  .tad-city__arrow {
    width: 16px;
    height: 16px;
    color: var(--text-faint);
    transition: transform 0.18s var(--ease);
    flex-shrink: 0;
  }

  .tad-city__panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 500;
    background: var(--surface-solid);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xs);
    box-shadow: 0 8px 24px rgba(28, 25, 23, 0.1);
    overflow: hidden;
  }

  .tad-city__search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);

    svg {
      width: 13px;
      height: 13px;
      color: var(--text-faint);
      flex-shrink: 0;
    }
  }

  .tad-city__sinput {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 13px;
    font-family: var(--sans);
    color: var(--text);
    &::placeholder {
      color: var(--text-faint);
    }
  }

  .tad-city__scroll {
    max-height: 220px;
    overflow-y: auto;
    padding: 8px 10px 10px;

    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 999px;
    }
  }

  .tad-city__group {
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .tad-city__gl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text-faint);
    text-transform: uppercase;
    font-family: var(--mono);
    padding: 0 2px;
    margin-bottom: 5px;
  }
  .tad-city__gc {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tad-city__chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 26px;
    padding: 0 9px;
    font-size: 12.5px;
    color: var(--text-soft);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.14s var(--ease);
    white-space: nowrap;
    font-family: var(--sans);

    &:hover {
      color: var(--accent);
      border-color: var(--accent-border);
      background: var(--accent-bg);
    }
    &.sel {
      color: var(--accent);
      background: var(--accent-bg);
      border-color: var(--accent-border);
      font-weight: 700;
    }
  }

  .tad-city__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 18px 0;
    font-size: 13px;
    color: var(--text-faint);
    font-family: var(--mono);
  }

  /* Footer */
  .tad-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .btn-cancel {
    height: 44px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-soft);
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.2s var(--ease);
    font-family: var(--sans);

    &:hover {
      border-color: var(--border-strong);
      color: var(--text);
    }
  }

  .btn-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 700;
    color: white;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all 0.25s var(--ease);
    font-family: var(--sans);
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
      box-shadow: 0 8px 20px rgba(180, 83, 9, 0.28);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  /* Spinner */
  .tad-spin {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: tad-spin 0.65s linear infinite;
  }

  /* Transitions */
  .tad-expand-enter-active {
    transition: all 0.22s var(--ease);
  }
  .tad-expand-leave-active {
    transition: all 0.15s var(--ease);
  }
  .tad-expand-enter-from,
  .tad-expand-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  .tad-drop-enter-active {
    transition: all 0.18s var(--ease);
  }
  .tad-drop-leave-active {
    transition: all 0.12s var(--ease);
  }
  .tad-drop-enter-from,
  .tad-drop-leave-to {
    opacity: 0;
    transform: translateY(-5px) scale(0.985);
    transform-origin: top center;
  }

  .tad-view-enter-active {
    transition: all 0.24s var(--ease);
  }
  .tad-view-leave-active {
    transition: all 0.15s var(--ease);
  }
  .tad-view-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }
  .tad-view-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }

  @keyframes tad-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes tad-pop {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (width <= 520px) {
    .tad-row {
      flex-direction: column;
      gap: 7px;
    }
    .tad-captcha {
      width: 100%;
    }
    .tad-sms-btn {
      width: 100%;
    }
    .tad-footer {
      flex-direction: column-reverse;
    }
    .btn-cancel,
    .btn-submit {
      width: 100%;
    }
  }
</style>
