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

  const form = reactive({
    phone: "",
    verifyCode: "",
    regionId: null as number | null,
    cityName: "",
    usageRemark: ""
  });

  const rules = reactive<FormRules>({
    phone: [
      {
        required: true,
        message: "请输入手机号",
        trigger: "blur"
      },
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

  const selectedCityLabel = computed(() => form.cityName || "请选择");

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
          return {
            id: Number(item.id),
            name: item.name,
            letter
          };
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
      await sendSmsCode({
        phone: form.phone,
        captcha: imageVerifyCode.value
      });
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
      message("申请已提交，我们会尽快与你联系", { type: "success" });
      closeAllDialog();
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => form.phone,
    phone => {
      form.verifyCode = "";
      imageVerifyCode.value = "";
      if (phone.length === 11 && hasValidPhone.value) {
        refreshCaptcha();
      } else {
        captchaImageUrl.value = "";
      }
    }
  );

  watch(keyword, () => {
    if (availableLetters.value.length === 0) {
      activeLetter.value = "A";
      return;
    }
    if (!availableLetters.value.includes(activeLetter.value)) {
      activeLetter.value = availableLetters.value[0];
    }
  });

  onMounted(() => {
    fetchCities();
  });

  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <div class="trial-dialog">
    <button type="button" class="trial-close" @click="closeAllDialog()">
      <el-icon><Close /></el-icon>
    </button>

    <div class="trial-header">
      <h2>请完善信息，我们尽快与您联系</h2>
      <p>提交后将进入人工审核，我们会根据城市和使用需求安排试用开通。</p>
    </div>

    <el-form ref="ruleFormRef" :model="form" :rules="rules" label-position="top" class="trial-form">
      <el-form-item prop="phone" label="手机号">
        <el-input v-model="form.phone" size="large" clearable maxlength="11" placeholder="请输入手机号">
          <template #prefix>
            <el-icon><Phone /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="hasValidPhone" class="trial-inline-item" label="图形验证码">
        <div class="captcha-row">
          <el-input v-model="imageVerifyCode" size="large" clearable maxlength="4" placeholder="请输入图形验证码">
            <template #prefix>
              <el-icon><Shield /></el-icon>
            </template>
          </el-input>
          <button type="button" class="captcha-image-box" @click="refreshCaptcha">
            <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" class="captcha-image" />
            <span v-else>点击加载</span>
          </button>
        </div>
      </el-form-item>

      <el-form-item prop="verifyCode" label="手机验证码">
        <div class="sms-row">
          <el-input v-model="form.verifyCode" size="large" clearable maxlength="6" placeholder="请输入短信验证码">
            <template #prefix>
              <el-icon><Shield /></el-icon>
            </template>
          </el-input>
          <el-button class="sms-btn" :disabled="isDisabled" @click="sendVerificationCode">
            {{ text ? `${text}后重新获取` : "发送验证码" }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item prop="regionId" label="所在城市">
        <div class="city-picker">
          <button type="button" class="city-trigger" :class="{ 'is-open': cityPanelVisible }" @click="toggleCityPanel">
            <span class="city-trigger__main">
              <el-icon><MapPin /></el-icon>
              <span :class="{ placeholder: !form.cityName }">{{ selectedCityLabel }}</span>
            </span>
            <el-icon class="city-trigger__arrow"><ArrowDown /></el-icon>
          </button>

          <div v-if="cityPanelVisible" class="city-panel">
            <div class="city-search">
              <el-input v-model="keyword" clearable placeholder="搜索城市" />
            </div>

            <div class="city-letters">
              <button
                v-for="letter in availableLetters"
                :key="letter"
                type="button"
                class="city-letter"
                :class="{ 'is-active': letter === activeLetter }"
                @click="selectLetter(letter)"
              >
                {{ letter }}
              </button>
            </div>

            <div class="city-list">
              <div v-if="cityLoading" class="city-empty">城市加载中...</div>
              <div v-else-if="currentCityList.length === 0" class="city-empty">暂无匹配城市</div>
              <button
                v-for="city in currentCityList"
                :key="city.id"
                type="button"
                class="city-option"
                :class="{ 'is-selected': city.id === form.regionId }"
                @click="selectCity(city)"
              >
                {{ city.name }}
              </button>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="如何使用系统？">
        <el-input v-model="form.usageRemark" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="选填，可填写你计划管理的房源类型、团队规模或当前遇到的问题">
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <div class="trial-footer">
      <el-button size="large" @click="closeAllDialog()">取消</el-button>
      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handleSubmit">提交试用申请</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .trial-dialog {
    position: relative;
    padding: 8px 4px 0;
    color: var(--el-text-color-primary);
  }

  .trial-close {
    position: absolute;
    top: -10px;
    right: -2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .trial-close:hover {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
  }

  .trial-header {
    margin-bottom: 28px;
    text-align: center;
  }

  .trial-header h2 {
    margin: 0 0 10px;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.25;
  }

  .trial-header p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .trial-form {
    :deep(.el-form-item) {
      margin-bottom: 22px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 10px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      box-shadow: none;
      border: 1px solid var(--el-border-color);
      border-radius: 16px;
      background: var(--el-bg-color);
    }

    :deep(.el-input__wrapper) {
      min-height: 52px;
      padding: 0 16px;
    }

    :deep(.el-textarea__inner) {
      padding: 14px 16px;
      line-height: 1.7;
    }

    :deep(.el-input__wrapper.is-focus),
    :deep(.el-textarea__inner:focus) {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
    }
  }

  .trial-inline-item :deep(.el-form-item__content) {
    display: block;
  }

  .captcha-row,
  .sms-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 156px;
    gap: 12px;
    width: 100%;
  }

  .captcha-image-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    overflow: hidden;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 16px;
    cursor: pointer;
  }

  .captcha-image {
    display: block;
    width: 100%;
    height: 52px;
    object-fit: cover;
  }

  .sms-btn {
    min-height: 52px;
    margin-left: 0;
    border-radius: 16px;
  }

  .city-picker {
    position: relative;
    width: 100%;
  }

  .city-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .city-trigger.is-open {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  }

  .city-trigger__main {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .city-trigger__main .placeholder {
    color: var(--el-text-color-placeholder);
  }

  .city-trigger__arrow {
    color: var(--el-text-color-secondary);
    transition: transform 0.2s ease;
  }

  .city-trigger.is-open .city-trigger__arrow {
    transform: rotate(180deg);
  }

  .city-panel {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    z-index: 20;
    width: 100%;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    border-radius: 22px;
    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
  }

  .city-search {
    margin-bottom: 14px;
  }

  .city-letters {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .city-letter {
    height: 38px;
    font-size: 16px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .city-letter.is-active {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
    border-color: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  }

  .city-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    overflow-y: auto;
  }

  .city-option {
    padding: 12px 10px;
    font-size: 16px;
    text-align: left;
    color: var(--el-text-color-primary);
    background: transparent;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .city-option:hover,
  .city-option.is-selected {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }

  .city-empty {
    padding: 28px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .trial-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 28px;
  }

  .submit-btn {
    min-width: 160px;
    border-radius: 16px;
    box-shadow: none;
  }

  @media (width <= 768px) {
    .trial-header h2 {
      font-size: 24px;
    }

    .captcha-row,
    .sms-row {
      grid-template-columns: 1fr;
    }

    .city-letters {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .trial-footer {
      flex-direction: column-reverse;
    }

    .submit-btn {
      width: 100%;
    }
  }
</style>
