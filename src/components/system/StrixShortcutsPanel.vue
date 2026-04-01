<template>
  <Teleport to="body">
    <Transition name="nebula-cmd">
      <div v-if="isOpen" class="nebula-shortcuts-overlay" @click.self="close">
        <div class="nebula-shortcuts-panel">
          <!-- 标题 -->
          <div class="nebula-shortcuts-header">
            <StrixIcon icon="keyboard" :size="18" class="nebula-shortcuts-header__icon" />
            <span class="nebula-shortcuts-header__title">快捷键</span>
            <kbd class="nebula-shortcuts-header__esc" @click="close">ESC</kbd>
          </div>

          <!-- 快捷键分组 -->
          <div class="nebula-shortcuts-body">
            <div v-for="group in shortcutGroups" :key="group.label" class="nebula-shortcuts-group">
              <div class="nebula-shortcuts-group__label">
                <StrixIcon :icon="group.icon" :size="13" />
                <span>{{ group.label }}</span>
              </div>
              <div class="nebula-shortcuts-group__items">
                <div v-for="(item, idx) in group.items" :key="idx" class="nebula-shortcut-item">
                  <span class="nebula-shortcut-item__desc">{{ item.description }}</span>
                  <span class="nebula-shortcut-item__keys">
                    <template v-for="(key, ki) in item.keys" :key="ki">
                      <kbd>{{ key }}</kbd>
                      <span v-if="ki < item.keys.length - 1" class="nebula-shortcut-item__sep">+</span>
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { shortcutGroups, useShortcutsPanel } from '@/composables/useShortcutsPanel'

const { isOpen, close } = useShortcutsPanel()
</script>
