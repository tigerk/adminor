<template>
  <div class="hv-loading">
    <div class="hv-sk hv-sk--left">
      <div class="hv-sk__img" />
      <div class="hv-sk__lines">
        <div class="hv-sk__line hv-sk__line--w50 hv-sk__line--h16" />
        <div class="hv-sk__line hv-sk__line--w80" />
        <div class="hv-sk__line hv-sk__line--w60" />
      </div>
      <div class="hv-sk__grid">
        <div v-for="i in 6" :key="i" class="hv-sk__cell" />
      </div>
      <div class="hv-sk__lines">
        <div v-for="i in 4" :key="i" class="hv-sk__line" />
      </div>
    </div>
    <div class="hv-sk hv-sk--main">
      <div class="hv-sk__bar" />
      <div class="hv-sk__lines" style="padding: 20px; gap: 14px">
        <div v-for="i in 6" :key="i" class="hv-sk__line" :style="{ width: 40 + i * 9 + '%' }" />
      </div>
    </div>
    <div class="hv-sk hv-sk--right">
      <div class="hv-sk__card" />
      <div class="hv-sk__card" />
      <div class="hv-sk__card hv-sk__card--lg" />
    </div>
  </div>
</template>

<style scoped lang="scss">
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @mixin sk {
    background: linear-gradient(90deg, var(--sk-base) 25%, var(--sk-shine) 50%, var(--sk-base) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 5px;
  }

  .hv-loading {
    display: grid;
    grid-template-columns: 256px 1fr 280px;
    height: 100%;
    overflow: hidden;
  }

  .hv-sk {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &--left {
      background: var(--card);
      border-right: 1px solid var(--b);
    }
    &--main {
      background: var(--bg);
    }
    &--right {
      background: var(--card);
      border-left: 1px solid var(--b);
      padding: 16px;
      gap: 10px;
    }

    &__img {
      @include sk;
      height: 152px;
      border-radius: 0;
      flex-shrink: 0;
    }
    &__bar {
      @include sk;
      height: 64px;
      border-radius: 0;
      flex-shrink: 0;
      margin-bottom: 4px;
    }
    &__lines {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
    }
    &__line {
      @include sk;
      height: 12px;
      width: 100%;
      &--w50 {
        width: 50%;
      }
      &--w80 {
        width: 80%;
      }
      &--w60 {
        width: 60%;
      }
      &--h16 {
        height: 16px;
      }
    }
    &__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 16px;
    }
    &__cell {
      @include sk;
      height: 36px;
    }
    &__card {
      @include sk;
      height: 80px;
      flex-shrink: 0;
      &--lg {
        height: 120px;
        flex: 1;
      }
    }
  }
</style>
