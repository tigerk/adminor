<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import Motion from "../utils/motion";
  import ReQrcode from "@/components/ReQrcode";
  import ArrowLeft from "~icons/ri/arrow-left-line";
  import Smartphone from "~icons/ri/smartphone-line";

  const emit = defineEmits<{
    (e: "switchMode", mode: "account" | "phone" | "qrcode"): void;
  }>();

  const { t } = useI18n();
</script>

<template>
  <div class="qr-login">
    <div class="qr-login__head">
      <div>
        <h3>二维码登录</h3>
        <p>适合多人协作工位与访客电脑，扫码后不会暴露账号密码，也更适合临时登录。</p>
      </div>
      <button type="button" class="ghost-link" @click="emit('switchMode', 'account')">
        <el-icon><ArrowLeft /></el-icon>
        返回账号登录
      </button>
    </div>

    <Motion class="qr-stage">
      <div class="qr-frame">
        <div class="qr-frame__pulse" />
        <ReQrcode :text="t('login.pureTest')" />
      </div>
      <div class="qr-stage__meta">
        <strong>打开移动端扫码</strong>
        <span>推荐使用企业微信、管理员 App 或已登录的业务端扫码确认。</span>
      </div>
    </Motion>

    <Motion :delay="120">
      <div class="scan-steps">
        <article>
          <span>01</span>
          <strong>打开移动端</strong>
          <p>进入消息中心或工作台首页的扫码入口。</p>
        </article>
        <article>
          <span>02</span>
          <strong>对准二维码</strong>
          <p>扫码后在手机上确认本次登录设备和地点。</p>
        </article>
        <article>
          <span>03</span>
          <strong>完成授权</strong>
          <p>确认成功后页面自动跳转，无需手动刷新。</p>
        </article>
      </div>
    </Motion>

    <Motion :delay="180">
      <div class="switch-card">
        <div>
          <strong>手机不在身边？</strong>
          <span>可以立即切换到短信验证登录，适合现场快速完成身份确认。</span>
        </div>
        <button type="button" class="ghost-link" @click="emit('switchMode', 'phone')">
          <el-icon><Smartphone /></el-icon>
          切换手机登录
        </button>
      </div>
    </Motion>
  </div>
</template>

<style scoped lang="scss">
  .qr-login {
    color: var(--shell-text, #0f172a);
  }

  .qr-login__head {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;

    h3 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: var(--shell-text-soft, #52637a);
    }
  }

  .ghost-link {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--shell-primary, #2563eb);
    background: var(--shell-primary-soft, rgb(37 99 235 / 10%));
    border: 1px solid rgb(37 99 235 / 16%);
    border-radius: 14px;
  }

  .qr-stage {
    display: grid;
    gap: 16px;
    justify-items: center;
    padding: 24px 22px;
    margin-bottom: 20px;
    background: radial-gradient(circle at top, rgb(37 99 235 / 12%), transparent 50%), rgb(148 163 184 / 6%);
    border: 1px solid rgb(148 163 184 / 14%);
    border-radius: 26px;
  }

  .qr-frame {
    position: relative;
    display: grid;
    place-items: center;
    width: 232px;
    height: 232px;
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 20px 40px rgb(15 23 42 / 12%);
  }

  .qr-frame__pulse {
    position: absolute;
    inset: -10px;
    border: 1px solid rgb(37 99 235 / 18%);
    border-radius: 34px;
    animation: qrPulse 2.8s ease-in-out infinite;
  }

  .qr-stage__meta {
    text-align: center;

    strong,
    span {
      display: block;
    }

    strong {
      margin-bottom: 6px;
      font-size: 16px;
      font-weight: 800;
    }

    span {
      max-width: 320px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--shell-text-soft, #52637a);
    }
  }

  .scan-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    article {
      padding: 16px;
      background: rgb(148 163 184 / 7%);
      border: 1px solid rgb(148 163 184 / 12%);
      border-radius: 18px;
    }

    span,
    strong,
    p {
      display: block;
    }

    span {
      margin-bottom: 10px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--shell-primary, #2563eb);
      font-family: "JetBrains Mono", ui-monospace, monospace;
    }

    strong {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 800;
    }

    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: var(--shell-text-soft, #52637a);
    }
  }

  .switch-card {
    display: flex;
    gap: 14px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    margin-top: 18px;
    background: rgb(148 163 184 / 7%);
    border: 1px solid rgb(148 163 184 / 14%);
    border-radius: 20px;

    strong,
    span {
      display: block;
    }

    strong {
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 800;
    }

    span {
      font-size: 13px;
      line-height: 1.6;
      color: var(--shell-text-soft, #52637a);
    }
  }

  @keyframes qrPulse {
    0%,
    100% {
      transform: scale(0.98);
      opacity: 0.45;
    }

    50% {
      transform: scale(1.04);
      opacity: 1;
    }
  }

  @media (width <= 768px) {
    .qr-login__head,
    .switch-card {
      flex-direction: column;
      align-items: stretch;
    }

    .scan-steps {
      grid-template-columns: 1fr;
    }
  }
</style>
