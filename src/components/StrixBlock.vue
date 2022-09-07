<template>
  <n-el tag="div" class="strix-block" :class="[{ 'hover': hovering }]" @mouseenter="hovering = true"
    @mouseleave="hovering = false">
    <div class="source">
      <slot name="show"></slot>
    </div>
    <div ref="meta" class="meta">
      <div v-if="$slots.default" class="description">
        <slot></slot>
      </div>
    </div>
    <div ref="control" class="strix-block-control" :class="{ 'is-fixed': fixedControl }" @click="changeExpand">
      <n-icon v-if="$slots.default" :component="expandedIcon" />
      <transition name="text-slide">
        <span v-if="$slots.default" v-show="hovering">{{ isExpanded ? '收起' : '显示全部' }}</span>
      </transition>
      <!-- 左侧按钮 -->
      <div class="control-button-container control-button-container-left">
        <n-button v-if="showClearButton" quaternary type="error" @click.stop="$emit('clear-search')">
          清除搜索条件
        </n-button>
      </div>
      <!-- 右侧按钮 -->
      <div class="control-button-container">
      </div>
    </div>
  </n-el>
</template>
<script>
import { CaretDown, CaretUp } from '@vicons/ionicons5'

export default {
  name: 'StrixBlock',
  props: {
    showClearButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['clear-search'],
  data() {
    return {
      hovering: false,
      isExpanded: false,
      fixedControl: false,
      scrollParent: null
    }
  },
  computed: {
    expandedIcon() {
      return this.isExpanded ? CaretUp : CaretDown
    },
    codeArea() {
      return this.$el.getElementsByClassName('meta')[0]
    }
  },
  watch: {
    isExpanded(val) {
      this.setCodeAreaHeight()
      if (!val) {
        this.fixedControl = false
        this.$refs.control.style.left = '0'
        this.removeScrollHandler()
        return
      }
      setTimeout(() => {
        this.scrollParent = document.querySelector('.page-component__scroll > .el-scrollbar__wrap')
        this.scrollParent && this.scrollParent.addEventListener('scroll', this.scrollHandler)
        this.scrollHandler()
      }, 200)
    }
  },
  created() {
  },
  beforeUnmount() {
    this.removeScrollHandler()
  },
  mounted() {
  },
  methods: {
    changeExpand() {
      if (this.$slots.default) {
        this.isExpanded = !this.isExpanded
      }
    },
    getCodeAreaHeight() {
      if (this.$el.getElementsByClassName('description').length > 0) {
        return this.$el.getElementsByClassName('description')[0].clientHeight + 20
        // this.$el.getElementsByClassName('highlight')[0].clientHeight
      }
      // this.$el.getElementsByClassName('highlight')[0].clientHeight
      return 0
    },
    setCodeAreaHeight() {
      this.codeArea.style.height = this.isExpanded ? `${this.getCodeAreaHeight() + 1}px` : '0'
    },
    scrollHandler() {
      const {
        top,
        bottom,
        left
      } = this.$refs.meta.getBoundingClientRect()
      const controlBarHeight = 44
      this.fixedControl = bottom + controlBarHeight > document.documentElement.clientHeight &&
        top <= document.documentElement.clientHeight
      this.$refs.control.style.left = this.fixedControl ? `${left}px` : '0'
    },
    removeScrollHandler() {
      this.scrollParent && this.scrollParent.removeEventListener('scroll', this.scrollHandler)
    }
  }
}
</script>
<style lang="scss" scoped>
.strix-block {
  background-color: var(--card-color);
  border: solid 1px var(--border-color);
  border-radius: 3px;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);

  &.hover {
    box-shadow: 0 -1px 4px 0 var(--border-color), 0 2px 4px 0 var(--border-color);

    .strix-block-control .n-icon {
      transform: translateX(-40px);
    }
  }

  .source {
    padding: 24px;
  }

  .meta {
    background-color: var(--card-color);
    border-top: solid 1px var(--border-color);
    overflow: hidden;
    height: 0;
    transition: all .3s cubic-bezier(.4, 0, .2, 1);
  }

  .description {
    padding: 10px;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 22px;
    color: var(--text-color-3);
    word-break: break-word;
    margin: 10px;
    background-color: var(--card-color);
    transition: all .3s cubic-bezier(.4, 0, .2, 1);

    p {
      margin: 0;
      line-height: 24px;
    }
  }

  .strix-block-control {
    border-top: solid 1px var(--border-color);
    height: 44px;
    box-sizing: border-box;
    background-color: var(--card-color);
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    text-align: center;
    margin-top: -1px;
    color: var(--text-color-3);
    cursor: pointer;
    position: relative;
    transition: all .3s cubic-bezier(.4, 0, .2, 1);

    &:hover {
      color: var(--primary-color);
      background-color: var(--tag-color);
    }

    &.is-fixed {
      position: sticky;
      bottom: 0;
    }

    .n-icon {
      font-size: 16px;
      line-height: 44px;
      transition: all .3s cubic-bezier(.4, 0, .2, 1);
    }

    >span {
      position: absolute;
      transform: translateX(-30px);
      font-size: 14px;
      line-height: 44px;
      transition: all .3s cubic-bezier(.4, 0, .2, 1);
      display: inline-block;
    }

    & .text-slide-enter-from,
    & .text-slide-leave-to {
      opacity: 0;
      transform: translateX(-15px);
    }

    .control-button-container {
      line-height: 40px;
      position: absolute;
      top: 0;
      right: 0;
      padding-left: 5px;
      padding-right: 25px;
    }

    .control-button-container-left {
      left: 0;
      width: 100px;
      padding-left: 14px;
    }

    .control-button {
      font-size: 14px;
      margin: 0 10px;
    }
  }
}
</style>
