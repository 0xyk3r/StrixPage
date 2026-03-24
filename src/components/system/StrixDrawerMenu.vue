<template>
  <!-- 遮罩 -->
  <Teleport to="body">
    <Transition name="nebula-overlay">
      <div v-if="drawerOpen" class="nebula-overlay" @click.self="close" />
    </Transition>

    <!-- 变形面板 -->
    <Transition name="nebula-morph">
      <div v-if="drawerOpen" class="nebula-morph-panel" @click.stop>
        <!-- Logo 区域 (与 header 对齐, 透明背景) -->
        <div class="nebula-morph__logo-zone" @click="close">
          <span class="nebula-morph__logo-text">Strix</span>
          <span class="nebula-morph__logo-dot" />
        </div>

        <!-- 内容区 (玻璃背景) -->
        <div class="nebula-morph__content">
          <!-- 搜索栏 (触发命令面板) -->
          <div class="nebula-morph__search" @click="openCommandPalette">
            <StrixIcon icon="search" :size="14" />
            <span>搜索菜单或命令…</span>
            <kbd>Ctrl+K</kbd>
          </div>

          <!-- 菜单列表 -->
          <div class="nebula-morph__body">
            <template v-for="group in groupedMenu" :key="group.label">
              <div class="nebula-menu-group">
                <div v-if="group.label" class="nebula-menu-label">{{ group.label }}</div>
                <template v-for="item in group.items" :key="item.id">
                  <!-- 有子菜单的项 -->
                  <div
                    v-if="item.children && item.children.length"
                    :class="['nebula-menu-item', { expanded: expandedKeys.has(item.id) }]"
                    @click="toggleExpand(item.id)"
                  >
                    <span class="nebula-menu-item__icon">
                      <StrixIcon v-if="item.iconName" :icon="item.iconName" :size="14" />
                    </span>
                    <span class="nebula-menu-item__text">{{ item.name }}</span>
                    <StrixIcon icon="chevron-right" :size="12" class="nebula-menu-item__arrow" />
                  </div>

                  <!-- 子菜单 -->
                  <div
                    v-if="item.children && item.children.length"
                    :class="['nebula-menu-sub', { open: expandedKeys.has(item.id) }]"
                  >
                    <div
                      v-for="child in item.children"
                      :key="child.id"
                      :class="['nebula-menu-item', { active: menuSelected === child.id }]"
                      @click="handleItemClick(child)"
                    >
                      <span class="nebula-menu-item__icon">
                        <StrixIcon v-if="child.iconName" :icon="child.iconName" :size="14" />
                      </span>
                      <span class="nebula-menu-item__text">{{ child.name }}</span>
                    </div>
                  </div>

                  <!-- 无子菜单的叶子项 -->
                  <div
                    v-if="!item.children || !item.children.length"
                    :class="['nebula-menu-item', { active: menuSelected === item.id }]"
                    @click="handleItemClick(item)"
                  >
                    <span class="nebula-menu-item__icon">
                      <StrixIcon v-if="item.iconName" :icon="item.iconName" :size="14" />
                    </span>
                    <span class="nebula-menu-item__text">{{ item.name }}</span>
                  </div>
                </template>
              </div>
            </template>

            <!-- 加载中 -->
            <div v-if="menuLoading" class="nebula-menu-loading">
              <n-spin :size="20" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useDrawer } from '@/composables/useDrawer'
import { type MenuItem, useHomeMenu } from '@/composables/useHomeMenu'
import { EventBus } from '@/plugins/event-bus'

const { drawerOpen, close } = useDrawer()
const { menuLoading, menuList, menuSelected, expandedKeys, toggleExpand, navigateTo } = useHomeMenu()

/**
 * 将扁平菜单按顶级父节点分组
 * 一级菜单项如果有子项, 它的 name 作为分组标签
 */
const groupedMenu = computed(() => {
  if (!menuList.value.length) return []

  return menuList.value.map((topItem) => {
    if (topItem.children && topItem.children.length > 0) {
      return {
        label: topItem.name,
        items: topItem.children
      }
    }
    return {
      label: '',
      items: [topItem]
    }
  })
})

const handleItemClick = (item: MenuItem) => {
  if (item.url) {
    navigateTo(item)
    close()
  }
}

const openCommandPalette = () => {
  close()
  nextTick(() => {
    EventBus.emit('open-command-palette')
  })
}
</script>

<style lang="scss" scoped>
// ---- 遮罩过渡 ----
.nebula-overlay-enter-active,
.nebula-overlay-leave-active {
  transition: opacity $duration-slow $ease-out-smooth;
}

.nebula-overlay-enter-from,
.nebula-overlay-leave-to {
  opacity: 0;
}

// ---- 遮罩 ----
.nebula-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-overlay;
  background: var(--strix-bg-overlay);
  backdrop-filter: blur(3px);
  // 仅遮罩 header 下方区域, header 中的 Logo 过渡由面板 Logo 区域接管
  clip-path: inset(var(--strix-header-height) 0 0 0);
}

// ---- 变形面板过渡 ----
.nebula-morph-enter-active {
  transition:
    transform 0.45s $ease-out-expo,
    opacity 0.3s $ease-out-smooth;
}

.nebula-morph-leave-active {
  transition:
    transform 0.25s $ease-out-smooth,
    opacity 0.2s;
}

.nebula-morph-enter-from {
  transform: scaleY(0) scaleX(0.4);
  opacity: 0;
}

.nebula-morph-leave-to {
  transform: scaleY(0) scaleX(0.4);
  opacity: 0;
}

// ---- 变形面板 ----
.nebula-morph-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  max-height: 100vh;
  z-index: $z-drawer;
  transform-origin: 60px 26px;
  display: flex;
  flex-direction: column;
}

// ---- Logo 区域 (与 header 对齐, 透明背景) ----
.nebula-morph__logo-zone {
  height: var(--strix-header-height);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  cursor: pointer;
}

.nebula-morph__logo-text {
  font-family: $font-display;
  font-weight: $weight-extrabold;
  font-size: 24px;
  font-style: italic;
  letter-spacing: -0.5px;
  padding-right: 3px;
  background: var(--strix-logo-gradient);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: nebula-logo-shimmer 6s ease-in-out infinite;
  filter: drop-shadow(0 0 16px var(--strix-accent-glow));
  padding-left: 8px;
}

.nebula-morph__logo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--strix-text-accent);
  position: relative;
  top: -0.55em;
  box-shadow: 0 0 12px var(--strix-accent-glow);
  animation: nebula-logo-pulse 2s ease-in-out infinite;
}

// ---- 内容区 (玻璃背景) ----
.nebula-morph__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  @include glass;
  border-radius: $radius-xl;
  margin: 0 8px 8px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.25),
    0 0 1px rgba(99, 226, 183, 0.15);
  overflow: hidden;
}

// ---- 搜索栏 ----
.nebula-morph__search {
  margin: $space-2 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  display: flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  transition: all $duration-fast;
  color: var(--strix-text-muted);

  &:hover {
    border-color: var(--strix-border-accent);
  }

  span {
    flex: 1;
    font-size: $text-base;
  }

  kbd {
    padding: 2px 6px;
    border-radius: $radius-xs;
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-default);
    color: var(--strix-text-muted);
    font-size: $text-2xs;
    font-family: $font-mono;
  }
}

// ---- 菜单主体 ----
.nebula-morph__body {
  flex: 1;
  overflow-y: auto;
  padding: $space-1 0 $space-2;
  @include thin-scrollbar;
}

.nebula-menu-group {
  padding: 0 $space-2;
  margin-bottom: $space-1;
}

.nebula-menu-label {
  padding: $space-2 $space-3 $space-1;
  font-size: $text-xs;
  text-transform: uppercase;
  letter-spacing: $tracking-wider;
  color: var(--strix-text-tertiary);
  font-weight: $weight-bold;
}

.nebula-menu-item {
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  font-size: $text-md;
  color: var(--strix-text-secondary);
  cursor: pointer;
  transition: all $duration-fast;
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 1px;
  position: relative;

  &:hover {
    background: var(--strix-bg-surface);
    color: var(--strix-text-primary);
  }

  &.active {
    background: var(--strix-border-accent);
    color: var(--strix-text-accent);

    .nebula-menu-item__icon {
      color: var(--strix-text-accent);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--strix-color-accent);
    }
  }

  &__icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--strix-text-tertiary);
    transition: color $duration-fast;
  }

  &__text {
    flex: 1;
    min-width: 0;
    @include text-ellipsis;
  }

  &__arrow {
    color: var(--strix-text-muted);
    transition: transform $duration-fast;
    flex-shrink: 0;
  }

  &.expanded &__arrow {
    transform: rotate(90deg);
  }
}

// ---- 子菜单 ----
.nebula-menu-sub {
  padding-left: $space-5;
  max-height: 0;
  overflow: hidden;
  transition: max-height $duration-normal $ease-out-smooth;

  &.open {
    max-height: 500px;
  }
}

// ---- 加载状态 ----
.nebula-menu-loading {
  display: flex;
  justify-content: center;
  padding: $space-8;
}
</style>
