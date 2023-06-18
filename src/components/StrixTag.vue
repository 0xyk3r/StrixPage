<template>
    <n-tag :type="tag.type" :bordered="false" :disabled="loading">
        {{ beforeLabel }}{{ tag.label }}{{ afterLabel }}
    </n-tag>
</template>
<script setup>
import { computed, inject } from 'vue';

const $props = defineProps({
    value: {
        type: [String, Number],
        required: true
    },
    dictName: {
        type: String,
        required: true
    },
    beforeLabel: {
        type: String,
        default: ''
    },
    afterLabel: {
        type: String,
        default: ''
    },
    notFoundLabel: {
        type: String,
        default: '未知'
    }
})

const dictRef = inject($props.dictName + 'Dict')

const loading = computed(() => {
    return !dictRef || dictRef.value.length == 0
})

const tag = computed(() => {
    if (!dictRef || dictRef.value.length == 0) {
        return {
            label: '加载中...',
            type: ''
        }
    }

    const item = dictRef.value.find(item => item.value == $props.value)
    if(!item) {
        return {
            label: $props.notFoundLabel,
            type: ''
        }
    }
    return {
        label: item.label,
        type: item.style
    }
})

</script>
<style lang="scss" scoped></style>
  