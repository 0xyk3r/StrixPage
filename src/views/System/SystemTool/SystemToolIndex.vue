<template>
  <div class="tool-station">
    <header class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">SYSTEM_TOOLS</span>
        </div>
        <h2 class="nbp-page-title">工具中心</h2>
        <p class="nbp-page-subtitle">系统内置工具集合 · {{ tools.length }} 个可用</p>
      </div>
      <div class="ts-counter">
        <span class="ts-counter__val">{{ tools.length }}</span>
        <span class="ts-counter__label">TOOLS</span>
      </div>
    </header>

    <div class="ts-grid">
      <div
        v-for="(tool, idx) in tools"
        :key="idx"
        class="ts-card"
        :style="{ '--delay': `${idx * 0.1}s` }"
        @click="openTool(tool.url)"
      >
        <span class="ts-card-corner ts-card-corner--tl"></span>
        <span class="ts-card-corner ts-card-corner--br"></span>
        <div class="ts-card-glow"></div>

        <div class="ts-card-index">
          <span class="nbp-mono-label">TOOL.{{ String(idx + 1).padStart(2, '0') }}</span>
        </div>

        <div class="ts-card-body">
          <div class="ts-card-icon">
            <StrixIcon :icon="tool.icon" :size="28" />
          </div>
          <div class="ts-card-info">
            <div class="ts-card-name">{{ tool.name }}</div>
            <div class="ts-card-desc">{{ tool.description }}</div>
          </div>
        </div>

        <div class="ts-card-foot">
          <div class="ts-launch-bar">
            <div class="ts-launch-bar__fill"></div>
          </div>
          <span class="ts-launch-label">启动工具 →</span>
        </div>
      </div>
    </div>

    <div v-if="tools.length === 0" class="nbp-table-empty">
      <div class="nbp-table-empty__icon">⊘</div>
      <div class="nbp-mono-label nbp-dim">NO_TOOLS_CONFIGURED</div>
      <div class="nbp-table-empty__sub">暂无可用工具</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'

const router = useRouter()

const tools = [
  {
    name: '热度工具',
    description: '用于配置浏览量、人气值等数据的算法，以及查看相应数据的原始数值的工具。',
    icon: 'flame',
    url: '/system/tool/popularity'
  },
  {
    name: '文档格式转换',
    description: '支持 Excel / PDF / PPT / Word 等 18 种格式转换，含文档转图片、HTML、Markdown 等能力。',
    icon: 'file-cog',
    url: '/system/tool/document-convert'
  }
]

const openTool = (url: string) => {
  router.push({ path: url })
}
</script>

<style lang="scss" scoped>
.tool-station {
  padding: 4px 0;
}

/* ─── Header counter (unique) ─── */
.ts-counter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ts-counter__val {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: var(--strix-color-accent);
  opacity: 0.18;
}

.ts-counter__label {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--strix-text-muted);
  opacity: 0.55;
}

/* ─── Grid ─── */
.ts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

/* ─── Card ─── */
.ts-card {
  position: relative;
  padding: 22px 22px 18px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  animation: ts-card-in 0.5s var(--delay, 0s) both cubic-bezier(0.16, 1, 0.3, 1);
  transition:
    border-color 0.25s,
    background 0.25s,
    transform 0.2s,
    box-shadow 0.25s;

  &:hover {
    border-color: var(--strix-border-accent);
    background: var(--strix-bg-surface-hover);
    transform: translateY(-2px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.15),
      0 0 0 1px var(--strix-border-accent);

    .ts-card-glow {
      opacity: 1;
    }

    .ts-card-corner {
      opacity: 1;
    }

    .ts-card-icon {
      background: var(--strix-accent-glow);
    }

    .ts-launch-bar__fill {
      transform: scaleX(1);
    }

    .ts-launch-label {
      color: var(--strix-color-accent);
    }
  }

  &:active {
    transform: translateY(0) scale(0.998);
  }
}

@keyframes ts-card-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.ts-card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 30%, var(--strix-accent-glow-subtle), transparent 65%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s;
}

.ts-card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--strix-color-accent);
  border-style: solid;
  opacity: 0;
  transition: opacity 0.25s;

  &--tl {
    top: 8px;
    left: 8px;
    border-width: 1.5px 0 0 1.5px;
  }

  &--br {
    bottom: 8px;
    right: 8px;
    border-width: 0 1.5px 1.5px 0;
  }
}

.ts-card-index {
  margin-bottom: 16px;
}

.ts-card-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.ts-card-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: var(--strix-accent-glow-subtle);
  border: 1px solid var(--strix-border-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--strix-color-accent);
  transition: background 0.25s;
}

.ts-card-info {
  flex: 1;
  min-width: 0;
}

.ts-card-name {
  font-family: 'Outfit', 'Alimama FangYuanTi', 'PingFang SC', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--strix-text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
}

.ts-card-desc {
  font-size: 13px;
  color: var(--strix-text-secondary);
  line-height: 1.6;
}

.ts-card-foot {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ts-launch-bar {
  flex: 1;
  height: 1px;
  background: var(--strix-border-subtle);
  overflow: hidden;
}

.ts-launch-bar__fill {
  height: 100%;
  background: var(--strix-color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.ts-launch-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--strix-text-secondary);
  white-space: nowrap;
  transition: color 0.25s;
}
</style>
