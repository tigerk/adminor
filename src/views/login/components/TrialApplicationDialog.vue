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
  import PhoneIcon from "~icons/ri/smartphone-line";
  import ShieldIcon from "~icons/ri/shield-check-line";
  import MapPinIcon from "~icons/ri/map-pin-2-line";
  import ChatIcon from "~icons/ri/chat-1-line";
  import ArrowDownIcon from "~icons/ri/arrow-down-s-line";
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

  onMounted(fetchCities);
  onBeforeUnmount(() => useVerifyCode().end());
</script>

<template>
  <div class="tad">
    <Transition name="tad-view" mode="out-in">
      <!-- ══ 成功态 ══ -->
      <div v-if="submitSuccess" key="success" class="tad-success">
        <div class="tad-success__icon">
          <svg class="tad-success__ring" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="182" stroke-dashoffset="182">
              <animate attributeName="stroke-dashoffset" from="182" to="0" dur="0.5s" fill="freeze" begin="0.05s" />
            </circle>
          </svg>
          <div class="tad-success__check">
            <el-icon><CheckIcon /></el-icon>
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
        <el-button type="primary" size="large" style="width: 100%; margin-top: 4px" @click="closeAllDialog()">好的，知道了</el-button>
      </div>

      <!-- ══ 表单 ══ -->
      <div v-else key="form">
        <div class="tad-head">
          <h3>请完善信息，我们尽快与您联系</h3>
          <p>提交后进入人工审核，1–2 个工作日内通过手机联系您开通</p>
        </div>

        <el-form ref="ruleFormRef" :model="form" :rules="rules" label-position="top" class="tad-form">
          <!-- 手机号 -->
          <el-form-item prop="phone">
            <template #label>
              <span class="tad-lbl">
                <el-icon><PhoneIcon /></el-icon>
                手机号码
                <em class="tad-req">*</em>
              </span>
            </template>
            <el-input v-model="form.phone" clearable maxlength="11" placeholder="请输入手机号码" />
          </el-form-item>

          <!-- 图形验证码（手机号合法后展开） -->
          <Transition name="tad-expand">
            <el-form-item v-if="hasValidPhone">
              <template #label>
                <span class="tad-lbl">
                  <el-icon><ShieldIcon /></el-icon>
                  图形验证码
                </span>
              </template>
              <div class="tad-row">
                <el-input v-model="imageVerifyCode" clearable maxlength="4" placeholder="输入图形验证码" />
                <button type="button" class="tad-captcha" :title="captchaImageUrl ? '点击刷新' : '点击加载'" @click="refreshCaptcha">
                  <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" />
                  <span v-else class="tad-captcha__empty">
                    <el-icon><RefreshIcon /></el-icon>
                    点击加载
                  </span>
                  <span class="tad-captcha__mask">
                    <el-icon><RefreshIcon /></el-icon>
                  </span>
                </button>
              </div>
            </el-form-item>
          </Transition>

          <!-- 短信验证码 -->
          <el-form-item prop="verifyCode">
            <template #label>
              <span class="tad-lbl">
                <el-icon><ShieldIcon /></el-icon>
                短信验证码
                <em class="tad-req">*</em>
              </span>
            </template>
            <div class="tad-row">
              <el-input v-model="form.verifyCode" clearable maxlength="6" placeholder="输入 6 位验证码" />
              <button type="button" class="tad-sms-btn" :class="{ waiting: isDisabled }" :disabled="isDisabled" @click="sendVerificationCode">
                <template v-if="isDisabled">
                  <span class="tad-count">{{ text }}s</span>
                  &nbsp;后重发
                </template>
                <template v-else>获取验证码</template>
              </button>
            </div>
          </el-form-item>

          <!-- 城市 -->
          <el-form-item prop="regionId">
            <template #label>
              <span class="tad-lbl">
                <el-icon><MapPinIcon /></el-icon>
                所在城市
                <em class="tad-req">*</em>
              </span>
            </template>
            <div class="tad-city">
              <button type="button" class="tad-city__trigger" :class="{ open: cityPanelVisible }" @click="toggleCityPanel">
                <span :class="form.cityName ? 'tad-city__val' : 'tad-city__ph'">
                  {{ form.cityName || "选择所在城市" }}
                </span>
                <el-icon class="tad-city__arrow"><ArrowDownIcon /></el-icon>
              </button>

              <Transition name="tad-drop">
                <div v-if="cityPanelVisible" class="tad-city__panel">
                  <div class="tad-city__search">
                    <el-icon><SearchIcon /></el-icon>
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
                            <el-icon v-if="city.id === form.regionId"><CheckIcon /></el-icon>
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

          <!-- 使用场景 -->
          <el-form-item>
            <template #label>
              <span class="tad-lbl">
                <el-icon><ChatIcon /></el-icon>
                使用场景
                <span class="tad-opt">选填</span>
              </span>
            </template>
            <el-input v-model="form.usageRemark" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="简述您的团队规模、房源类型，帮助我们更好地为您服务…" />
          </el-form-item>
        </el-form>

        <div class="tad-footer">
          <el-button @click="closeAllDialog()">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">提交申请</el-button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
  /*
 * 所有颜色 100% 使用 Element Plus 的 --el-* CSS 变量。
 * 浅色 / 深色模式由 Element Plus 自身负责切换，
 * 本组件零自定义颜色，彻底消除深色下的色彩冲突。
 */

  .tad {
    --r: 8px;
    --h: 36px;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);

    padding: 12px 14px 10px;
    /* 不设 background，完全继承 el-dialog 背景 */
    color: var(--el-text-color-primary);
  }

  /* ══════════════════════════════════════
   成功态
══════════════════════════════════════ */
  .tad-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 12px 8px;

    h3 {
      margin: 14px 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0 0 20px;
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--el-text-color-secondary);
      max-width: 300px;

      strong {
        color: var(--el-text-color-primary);
        font-weight: 600;
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
    color: var(--el-color-success);
  }

  .tad-success__check {
    position: absolute;
    inset: 9px;
    background: var(--el-color-success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: tad-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) 0.48s both;

    .el-icon {
      font-size: 18px;
      color: #fff;
    }
  }

  /* ══════════════════════════════════════
   头部
══════════════════════════════════════ */
  .tad-head {
    margin-bottom: 18px;

    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.55;
      color: var(--el-text-color-placeholder);
    }
  }

  /* ══════════════════════════════════════
   表单重置（全用 el 变量）
══════════════════════════════════════ */
  .tad-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 5px !important;
      line-height: 1;
    }

    :deep(.el-form-item__error) {
      padding-top: 3px;
      font-size: 11.5px;
    }

    /* 输入框：去掉默认 box-shadow，改用 border */
    :deep(.el-input__wrapper) {
      height: var(--h);
      padding: 0 11px;
      box-shadow: none !important;
      border: 1px solid var(--el-border-color);
      border-radius: var(--r);
      background: var(--el-fill-color-blank);
      transition:
        border-color 0.15s var(--ease),
        box-shadow 0.15s var(--ease);

      &:hover:not(.is-focus) {
        border-color: var(--el-border-color-hover);
      }

      &.is-focus {
        border-color: var(--el-color-primary) !important;
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8) !important;
      }
    }

    :deep(.el-input__inner) {
      font-size: 13.5px;
      color: var(--el-text-color-primary);
      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    :deep(.el-input__prefix-inner .el-icon) {
      color: var(--el-text-color-placeholder);
    }

    :deep(.el-textarea__inner) {
      box-shadow: none !important;
      border: 1px solid var(--el-border-color);
      border-radius: var(--r);
      background: var(--el-fill-color-blank);
      padding: 9px 11px;
      font-size: 13px;
      line-height: 1.65;
      color: var(--el-text-color-primary);
      resize: none;
      transition:
        border-color 0.15s var(--ease),
        box-shadow 0.15s var(--ease);

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }

      &:focus {
        border-color: var(--el-color-primary) !important;
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8) !important;
      }
    }

    :deep(.el-input__count),
    :deep(.el-input__count-inner) {
      background: transparent !important;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  /* ══════════════════════════════════════
   字段标签
══════════════════════════════════════ */
  .tad-lbl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--el-text-color-regular);

    .el-icon {
      font-size: 12.5px;
      color: var(--el-color-primary);
      opacity: 0.85;
    }
  }

  .tad-req {
    font-style: normal;
    color: var(--el-color-danger);
    font-size: 13px;
    line-height: 1;
    margin-left: 1px;
  }

  .tad-opt {
    font-style: normal;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    padding: 1px 5px;
    margin-left: 2px;
  }

  /* ══════════════════════════════════════
   行内控件
══════════════════════════════════════ */
  .tad-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  /* 图形验证码框 */
  .tad-captcha {
    position: relative;
    flex-shrink: 0;
    width: 112px;
    height: var(--h);
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: var(--r);
    background: var(--el-fill-color-blank);
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
      font-size: 11.5px;
      color: var(--el-text-color-placeholder);
      .el-icon {
        font-size: 13px;
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
      .el-icon {
        font-size: 15px;
        color: #fff;
      }
    }

    &:hover {
      border-color: var(--el-color-primary);
      .tad-captcha__mask {
        opacity: 1;
      }
    }
  }

  /* 获取验证码按钮 */
  .tad-sms-btn {
    flex-shrink: 0;
    height: var(--h);
    padding: 0 12px;
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: var(--r);
    cursor: pointer;
    transition: all 0.15s var(--ease);

    &:not(.waiting):hover {
      background: var(--el-color-primary);
      color: #fff;
      border-color: var(--el-color-primary);
    }

    &.waiting {
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
      cursor: not-allowed;
    }
  }

  .tad-count {
    font-variant-numeric: tabular-nums;
    font-weight: 800;
    font-size: 13px;
  }

  /* ══════════════════════════════════════
   城市选择器
══════════════════════════════════════ */
  .tad-city {
    position: relative;
    width: 100%;
  }

  .tad-city__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--h);
    padding: 0 11px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: var(--r);
    cursor: pointer;
    transition:
      border-color 0.15s var(--ease),
      box-shadow 0.15s var(--ease);

    &:hover:not(.open) {
      border-color: var(--el-border-color-hover);
    }

    &.open {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);

      .tad-city__arrow {
        transform: rotate(180deg);
        color: var(--el-color-primary);
      }
    }
  }

  .tad-city__val {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tad-city__ph {
    font-size: 13.5px;
    color: var(--el-text-color-placeholder);
  }

  .tad-city__arrow {
    flex-shrink: 0;
    font-size: 15px;
    color: var(--el-text-color-placeholder);
    transition:
      transform 0.18s var(--ease),
      color 0.15s var(--ease);
    margin-left: 4px;
  }

  /* 下拉面板 */
  .tad-city__panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 500;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    box-shadow: var(--el-box-shadow-light);
    overflow: hidden;
  }

  .tad-city__search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);

    .el-icon {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
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
    color: var(--el-text-color-primary);
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  .tad-city__scroll {
    max-height: 236px;
    overflow-y: auto;
    padding: 8px 11px 10px;

    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
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
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
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
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.14s var(--ease);
    white-space: nowrap;

    .el-icon {
      font-size: 10.5px;
    }

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);
    }

    &.sel {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
      font-weight: 600;
    }
  }

  .tad-city__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 18px 0;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  /* ══════════════════════════════════════
   底部操作
══════════════════════════════════════ */
  .tad-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
  }

  /* ══════════════════════════════════════
   Spinner
══════════════════════════════════════ */
  .tad-spin {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--el-border-color);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: tad-spin 0.65s linear infinite;
  }

  /* ══════════════════════════════════════
   Transitions
══════════════════════════════════════ */
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

  /* ══════════════════════════════════════
   Keyframes
══════════════════════════════════════ */
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

  /* ══════════════════════════════════════
   响应式
══════════════════════════════════════ */
  @media (width <= 520px) {
    .tad {
      padding: 20px 18px 16px;
    }

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
      :deep(.el-button) {
        width: 100% !important;
      }
    }
  }
</style>
