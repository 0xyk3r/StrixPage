<template>
  <div class="nebula-empty" :class="`nebula-empty--${type}`">
    <div class="nebula-empty__illustration">
      <!-- NO_DATA: Empty Grid -->
      <svg v-if="type === 'no-data'" viewBox="0 0 120 120" fill="none">
        <g class="nebula-empty__grid-lines" stroke="currentColor" stroke-width="0.7">
          <line x1="12" y1="24" x2="108" y2="24" />
          <line x1="12" y1="44" x2="108" y2="44" />
          <line x1="12" y1="64" x2="108" y2="64" />
          <line x1="12" y1="84" x2="108" y2="84" />
          <line x1="12" y1="104" x2="108" y2="104" />
          <line x1="12" y1="24" x2="12" y2="104" />
          <line x1="42" y1="24" x2="42" y2="104" />
          <line x1="72" y1="24" x2="72" y2="104" />
          <line x1="108" y1="24" x2="108" y2="104" />
        </g>
        <!-- Ghost row data with shimmer -->
        <g class="nebula-empty__shimmer">
          <rect x="17" y="50" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
          <rect x="47" y="50" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.16" />
          <rect x="77" y="50" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.12" />
          <rect x="17" y="70" width="15" height="3" rx="1.5" fill="currentColor" opacity="0.16" />
          <rect x="47" y="70" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.12" />
          <rect x="77" y="70" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.1" />
          <rect x="17" y="30" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.14" />
          <rect x="47" y="30" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.1" />
          <rect x="77" y="30" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
          <rect x="17" y="90" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.1" />
          <rect x="47" y="90" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
        </g>
        <!-- Center empty indicator -->
        <circle
          cx="60"
          cy="64"
          r="22"
          stroke="currentColor"
          stroke-width="1.2"
          opacity="0.35"
          stroke-dasharray="3 3"
          class="nebula-empty__circle-breathe"
        />
        <line
          x1="52"
          y1="56"
          x2="68"
          y2="72"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.5"
          stroke-linecap="round"
        />
        <line
          x1="68"
          y1="56"
          x2="52"
          y2="72"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.5"
          stroke-linecap="round"
        />
      </svg>

      <!-- NO_RESULT: Magnifying Glass -->
      <svg v-else-if="type === 'no-result'" viewBox="0 0 120 120" fill="none">
        <circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width="1.8" opacity="0.65" />
        <circle cx="50" cy="50" r="22" stroke="currentColor" stroke-width="0.7" opacity="0.2" stroke-dasharray="2 4" />
        <line
          x1="70"
          y1="70"
          x2="95"
          y2="95"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.6"
        />
        <!-- Scan line -->
        <g :clip-path="`url(#${clipId})`">
          <rect
            x="22"
            y="22"
            width="56"
            height="2.5"
            rx="1"
            fill="currentColor"
            opacity="0.5"
            class="nebula-empty__scan"
          />
        </g>
        <!-- Grid inside lens -->
        <g opacity="0.25" :clip-path="`url(#${clipId})`">
          <line x1="35" y1="28" x2="35" y2="72" stroke="currentColor" stroke-width="0.5" />
          <line x1="50" y1="28" x2="50" y2="72" stroke="currentColor" stroke-width="0.5" />
          <line x1="65" y1="28" x2="65" y2="72" stroke="currentColor" stroke-width="0.5" />
          <line x1="28" y1="38" x2="72" y2="38" stroke="currentColor" stroke-width="0.5" />
          <line x1="28" y1="50" x2="72" y2="50" stroke="currentColor" stroke-width="0.5" />
          <line x1="28" y1="62" x2="72" y2="62" stroke="currentColor" stroke-width="0.5" />
        </g>
        <!-- X mark -->
        <line
          x1="42"
          y1="42"
          x2="58"
          y2="58"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          opacity="0.5"
        />
        <line
          x1="58"
          y1="42"
          x2="42"
          y2="58"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          opacity="0.5"
        />
        <!-- Floating particles -->
        <circle cx="88" cy="28" r="2" fill="currentColor" opacity="0.45" class="nebula-empty__float" />
        <circle
          cx="96"
          cy="42"
          r="1.5"
          fill="currentColor"
          opacity="0.35"
          class="nebula-empty__float nebula-empty__float--d1"
        />
        <circle
          cx="82"
          cy="16"
          r="1.5"
          fill="currentColor"
          opacity="0.4"
          class="nebula-empty__float nebula-empty__float--d2"
        />
        <defs>
          <clipPath :id="clipId"><circle cx="50" cy="50" r="22" /></clipPath>
        </defs>
      </svg>

      <!-- NO_SELECT: Terminal Awaiting Input -->
      <svg v-else-if="type === 'no-select'" viewBox="0 0 120 120" fill="none">
        <rect x="16" y="24" width="88" height="72" rx="6" stroke="currentColor" stroke-width="1.2" opacity="0.5" />
        <line x1="16" y1="38" x2="104" y2="38" stroke="currentColor" stroke-width="0.7" opacity="0.25" />
        <rect x="17" y="25" width="86" height="12" rx="5" fill="currentColor" opacity="0.07" />
        <!-- Title bar dots -->
        <circle cx="26" cy="31" r="2.2" fill="currentColor" opacity="0.45" />
        <circle cx="34" cy="31" r="2.2" fill="currentColor" opacity="0.3" />
        <circle cx="42" cy="31" r="2.2" fill="currentColor" opacity="0.2" />
        <!-- Terminal lines with stagger animation -->
        <g class="nebula-empty__terminal-lines">
          <rect x="24" y="46" width="36" height="2.5" rx="1" fill="currentColor" opacity="0.35" />
          <rect x="24" y="54" width="52" height="2.5" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="24" y="62" width="28" height="2.5" rx="1" fill="currentColor" opacity="0.25" />
        </g>
        <!-- Active prompt line -->
        <rect x="24" y="72" width="8" height="2.5" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="41" y="70" width="2.5" height="6" rx="0.5" fill="currentColor" class="nebula-empty__cursor" />
        <!-- Arrow pointer with hover animation -->
        <g transform="translate(75, 68)" class="nebula-empty__pointer">
          <path d="M0 0 L12 6 L6 8 L8 16 L4 16 L2 8 L-4 10 Z" fill="currentColor" opacity="0.55" />
        </g>
      </svg>

      <!-- ERROR: Broken Circle -->
      <svg v-else viewBox="0 0 120 120" fill="none">
        <path
          d="M60 14 A46 46 0 0 1 106 60"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.55"
          stroke-linecap="round"
        />
        <path
          d="M106 60 A46 46 0 0 1 60 106"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.35"
          stroke-linecap="round"
          class="nebula-empty__arc"
        />
        <path
          d="M60 106 A46 46 0 0 1 14 60"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.55"
          stroke-linecap="round"
        />
        <path
          d="M14 60 A46 46 0 0 1 60 14"
          stroke="currentColor"
          stroke-width="2"
          opacity="0.35"
          stroke-linecap="round"
          class="nebula-empty__arc nebula-empty__arc--d1"
        />
        <!-- Warning triangle -->
        <path
          d="M60 38 L78 70 L42 70 Z"
          stroke="currentColor"
          stroke-width="2"
          fill="currentColor"
          fill-opacity="0.05"
          opacity="0.75"
          stroke-linejoin="round"
        />
        <line
          x1="60"
          y1="48"
          x2="60"
          y2="58"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          opacity="0.9"
        />
        <circle cx="60" cy="64" r="2" fill="currentColor" opacity="0.9" />
        <!-- Spark particles -->
        <g class="nebula-empty__glow">
          <circle cx="30" cy="32" r="1.5" fill="currentColor" opacity="0.45" />
          <circle cx="90" cy="88" r="2" fill="currentColor" opacity="0.35" />
          <circle cx="25" cy="80" r="1.5" fill="currentColor" opacity="0.3" />
          <circle cx="95" cy="35" r="1.5" fill="currentColor" opacity="0.5" />
        </g>
      </svg>
    </div>
    <div class="nebula-empty__description">{{ resolvedDescription }}</div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    type?: 'no-data' | 'no-result' | 'no-select' | 'error'
    description?: string
  }>(),
  {
    type: 'no-data'
  }
)

const defaultDescriptions: Record<string, string> = {
  'no-data': '暂无数据',
  'no-result': '未找到匹配结果',
  'no-select': '请选择一项',
  error: '加载失败'
}

const resolvedDescription = computed(() => props.description ?? defaultDescriptions[props.type])
const clipId = useId()
</script>
