<template>
  <div class="nebula-bg" aria-hidden="true">
    <div class="nebula-bg__blob nebula-bg__blob--1" />
    <div class="nebula-bg__blob nebula-bg__blob--2" />
    <div class="nebula-bg__blob nebula-bg__blob--3" />
  </div>
</template>

<style lang="scss" scoped>
.nebula-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;

  &__blob {
    position: absolute;
    border-radius: $radius-circle;
    filter: blur(100px);
    animation: nebula-float 12s ease-in-out infinite alternate;

    &--1 {
      width: 350px;
      height: 350px;
      top: -120px;
      right: 60px;

      [data-theme='dark'] & {
        background: rgba(99, 226, 183, 0.1);
      }

      [data-theme='light'] & {
        background: rgba(45, 180, 140, 0.06);
      }
    }

    &--2 {
      width: 280px;
      height: 280px;
      bottom: -80px;
      left: 120px;
      animation-delay: -5s;

      [data-theme='dark'] & {
        background: rgba(78, 205, 196, 0.08);
      }

      [data-theme='light'] & {
        background: rgba(78, 205, 196, 0.04);
      }
    }

    &--3 {
      width: 180px;
      height: 180px;
      top: 45%;
      left: 45%;
      animation-delay: -8s;

      [data-theme='dark'] & {
        background: rgba(136, 216, 168, 0.05);
      }

      [data-theme='light'] & {
        background: rgba(136, 216, 168, 0.03);
      }
    }
  }
}
</style>
