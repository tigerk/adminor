<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import Motion from "../utils/motion";
  import ReQrcode from "@/components/ReQrcode";

  const { t } = useI18n();
</script>

<template>
  <div class="qr-login">
    <Motion class="qr-stage">
      <div class="qr-frame">
        <ReQrcode :text="t('login.pureTest')" />
        <div class="qr-frame__logo">DX</div>
      </div>
      <div class="qr-stage__meta">
        <strong>扫码快速登录</strong>
        <span>使用企业微信或管理员 App 扫码确认</span>
      </div>
    </Motion>

    <Motion :delay="120">
      <div class="scan-steps">
        <article>
          <span>01</span>
          <strong>打开移动端</strong>
        </article>
        <article>
          <span>02</span>
          <strong>对准二维码</strong>
        </article>
        <article>
          <span>03</span>
          <strong>完成授权</strong>
        </article>
      </div>
    </Motion>
  </div>
</template>

<style scoped lang="scss">
  .qr-login {
    color: var(--text, #241f1b);
  }

  .qr-stage {
    display: grid;
    gap: 16px;
    justify-items: center;
    padding: 20px 0;
  }

  .qr-frame {
    position: relative;
    display: grid;
    place-items: center;
    width: 188px;
    height: 188px;
    background: #fff;
    border: 1px solid var(--border, rgb(145 89 39 / 12%));
    border-radius: 24px;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 45%);
  }

  .qr-frame::before {
    position: absolute;
    inset: 18px;
    background-image:
      linear-gradient(45deg, rgb(0 0 0 / 8%) 25%, transparent 25%), linear-gradient(-45deg, rgb(0 0 0 / 8%) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgb(0 0 0 / 8%) 75%), linear-gradient(-45deg, transparent 75%, rgb(0 0 0 / 8%) 75%);
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
    background-size: 16px 16px;
    border-radius: 18px;
    content: "";
  }

  .qr-frame :deep(canvas),
  .qr-frame :deep(img) {
    position: relative;
    z-index: 1;
    width: 116px !important;
    height: 116px !important;
    padding: 10px;
    background: #fff;
    border-radius: 18px;
  }

  .qr-frame__logo {
    position: absolute;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    color: #fff;
    background: var(--accent, #ba6a28);
    border-radius: 14px;
    font-size: 18px;
    font-weight: 700;
    font-family: var(--mono, "JetBrains Mono", ui-monospace, monospace);
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
      font-weight: 700;
    }

    span {
      max-width: 280px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--text-soft, #827873);
    }
  }

  .scan-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    article {
      padding: 14px 8px;
      text-align: center;
      background: var(--bg, #f7f3ec);
      border: 1px solid var(--border, rgb(145 89 39 / 12%));
      border-radius: 14px;
    }

    span,
    strong {
      display: block;
    }

    span {
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--accent, #ba6a28);
      font-family: var(--mono, "JetBrains Mono", ui-monospace, monospace);
    }

    strong {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-soft, #827873);
    }
  }

  @media (width <= 768px) {
    .scan-steps {
      grid-template-columns: 1fr;
    }
  }
</style>
