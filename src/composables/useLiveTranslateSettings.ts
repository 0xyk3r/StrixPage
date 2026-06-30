import type { AsrVadParams } from './useAsrSettings'
import { DEFAULT_VAD } from './useAsrSettings'

/** 实时语音翻译设置（设备 + VAD + 翻译参数） */
export interface LiveTranslateSettings {
  deviceId: string
  alwaysSend: boolean
  vad: AsrVadParams
  /** 源语种代码（''=自动检测） */
  sourceLanguage: string
  /** 目标语种代码，默认 en */
  targetLanguage: string
  /** 翻译输出音色，默认 Tina */
  voice: string
  /** 输出模态：["text"] 或 ["text","audio"] */
  modalities: string[]
  /** 是否同时返回源语言转写，默认 true */
  enableSourceTranscription: boolean
  /** 是否启用声音复刻，默认 false */
  enableVoiceClone: boolean
  /** 声音复刻频率：once/always/never */
  voiceCloneFrequency: string
  /** 是否启用同声传译模式（音频块实时流式播放，不等待一段完成），默认 true */
  liveInterpretation: boolean
}

const STORAGE_KEY = 'strix-live-translate-settings'

const DEFAULT_SETTINGS: Omit<LiveTranslateSettings, 'vad'> = {
  deviceId: '',
  alwaysSend: false,
  sourceLanguage: 'zh',
  targetLanguage: 'en',
  voice: 'Tina',
  modalities: ['text', 'audio'],
  enableSourceTranscription: true,
  enableVoiceClone: false,
  voiceCloneFrequency: 'once',
  liveInterpretation: true
}

function loadSettings(): LiveTranslateSettings {
  const fallback: LiveTranslateSettings = { ...DEFAULT_SETTINGS, vad: { ...DEFAULT_VAD } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<LiveTranslateSettings>
    return {
      deviceId: typeof p.deviceId === 'string' ? p.deviceId : '',
      alwaysSend: p.alwaysSend === true,
      vad: { ...DEFAULT_VAD, ...p.vad },
      sourceLanguage: typeof p.sourceLanguage === 'string' ? p.sourceLanguage : 'zh',
      targetLanguage: typeof p.targetLanguage === 'string' ? p.targetLanguage : 'en',
      voice: typeof p.voice === 'string' ? p.voice : 'Tina',
      modalities: Array.isArray(p.modalities) && p.modalities.length ? p.modalities : ['text', 'audio'],
      enableSourceTranscription: p.enableSourceTranscription !== false,
      enableVoiceClone: p.enableVoiceClone === true,
      voiceCloneFrequency: typeof p.voiceCloneFrequency === 'string' ? p.voiceCloneFrequency : 'once',
      liveInterpretation: p.liveInterpretation !== false
    }
  } catch {
    return fallback
  }
}

/** 实时语音翻译设置单一数据源，自动持久化到 localStorage */
export function useLiveTranslateSettings() {
  const settings = reactive<LiveTranslateSettings>(loadSettings())

  watch(
    settings,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        /* 隐私模式/配额不可用时退化为仅内存态 */
      }
    },
    { deep: true }
  )

  function reset() {
    Object.assign(settings.vad, DEFAULT_VAD)
  }

  return { settings, reset }
}

// ——— 语种与音色选项 ———

export const SOURCE_LANGUAGE_OPTIONS = [
  { label: '自动检测', value: '' },
  { label: '中文（普通话）', value: 'zh' },
  { label: '粤语', value: 'yue' },
  { label: '英语', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
  { label: '德语', value: 'de' },
  { label: '俄语', value: 'ru' },
  { label: '意大利语', value: 'it' },
  { label: '西班牙语', value: 'es' },
  { label: '葡萄牙语', value: 'pt' },
  { label: '阿拉伯语', value: 'ar' },
  { label: '荷兰语', value: 'nl' },
  { label: '越南语', value: 'vi' },
  { label: '泰语', value: 'th' },
  { label: '印尼语', value: 'id' },
  { label: '土耳其语', value: 'tr' },
  { label: '印地语', value: 'hi' },
  { label: '波兰语', value: 'pl' },
  { label: '乌克兰语', value: 'uk' },
  { label: '捷克语', value: 'cs' },
  { label: '乌尔都语', value: 'ur' },
  { label: '菲律宾语', value: 'tl' },
  { label: '瑞典语', value: 'sv' },
  { label: '丹麦语', value: 'da' },
  { label: '希伯来语', value: 'he' },
  { label: '冰岛语', value: 'is' },
  { label: '马来语', value: 'ms' },
  { label: '挪威语', value: 'no' },
  { label: '波斯语', value: 'fa' }
]

export const TARGET_LANGUAGE_OPTIONS = SOURCE_LANGUAGE_OPTIONS.filter((o) => o.value !== '')

/** Qwen3.5-LiveTranslate-Flash-Realtime 支持的音色列表（默认音色：Tina） */
export const TRANSLATE_VOICE_OPTIONS = [
  { label: 'Tina（甜甜，默认）', value: 'Tina' },
  { label: 'Cherry（芊悦，Qwen3 默认）', value: 'Cherry' },
  { label: 'Cindy（林欣宜，台湾口音）', value: 'Cindy' },
  { label: 'Liora Mira（清欢）', value: 'Liora Mira' },
  { label: 'Sunnybobi（知芝）', value: 'Sunnybobi' },
  { label: 'Raymond（林川野）', value: 'Raymond' },
  { label: 'Ethan（晨煦）', value: 'Ethan' },
  { label: 'Theo Calm（予安）', value: 'Theo Calm' },
  { label: 'Serena（苏瑶）', value: 'Serena' },
  { label: 'Harvey（厚）', value: 'Harvey' },
  { label: 'Maia（四月）', value: 'Maia' },
  { label: 'Evan（江晨）', value: 'Evan' },
  { label: 'Qiao（小乔妹，台湾口音）', value: 'Qiao' },
  { label: 'Momo（茉兔）', value: 'Momo' },
  { label: 'Wil（伟伦）', value: 'Wil' },
  { label: 'Angel（台普-安琪）', value: 'Angel' },
  { label: 'Li Cassian（东厂-李公公）', value: 'Li Cassian' },
  { label: 'Mia（温柔生活博主-舒然）', value: 'Mia' },
  { label: 'Joyner（喜剧担当-阿逗）', value: 'Joyner' },
  { label: 'Gold（金爷）', value: 'Gold' },
  { label: 'Katerina（卡捷琳娜）', value: 'Katerina' },
  { label: 'Ryan（甜茶）', value: 'Ryan' },
  { label: 'Jennifer（詹妮弗）', value: 'Jennifer' },
  { label: 'Aiden（艾登）', value: 'Aiden' },
  { label: 'Mione（敏儿）', value: 'Mione' },
  { label: 'Sohee（素熙）', value: 'Sohee' },
  { label: 'Lenn（莱恩）', value: 'Lenn' },
  { label: 'Ono Anna（小野杏）', value: 'Ono Anna' },
  { label: 'Sonrisa（索尼莎）', value: 'Sonrisa' },
  { label: 'Bodega（博德加）', value: 'Bodega' },
  { label: 'Emilien（埃米尔安）', value: 'Emilien' },
  { label: 'Andre（安德雷）', value: 'Andre' },
  { label: 'Radio Gol（拉迪奥·戈尔）', value: 'Radio Gol' },
  { label: 'Alek（阿列克）', value: 'Alek' },
  { label: 'Rizky（阿力）', value: 'Rizky' },
  { label: 'Roya（萝雅）', value: 'Roya' },
  { label: 'Arda（阿尔达）', value: 'Arda' },
  { label: 'Hana（阿幸）', value: 'Hana' },
  { label: 'Dolce（多尔切）', value: 'Dolce' },
  { label: 'Jakub（雅克）', value: 'Jakub' },
  { label: 'Griet（海娜）', value: 'Griet' },
  { label: 'Eliška（艾莉卡）', value: 'Eliška' },
  { label: 'Marina（玛丽娜）', value: 'Marina' },
  { label: 'Siiri（西芮）', value: 'Siiri' },
  { label: 'Ingrid（林恩）', value: 'Ingrid' },
  { label: 'Sigga（海娜）', value: 'Sigga' },
  { label: 'Bea（雅娜）', value: 'Bea' },
  { label: 'Chloe（思怡）', value: 'Chloe' },
  { label: 'Sunny（四川-晴儿）', value: 'Sunny' },
  { label: 'Dylan（北京-晓东）', value: 'Dylan' },
  { label: 'Eric（四川-程川）', value: 'Eric' },
  { label: 'Peter（天津-李彼得）', value: 'Peter' },
  { label: 'Joseph Chen（阿樸伯，闽南话）', value: 'Joseph Chen' },
  { label: 'Marcus（陕西-秦川）', value: 'Marcus' },
  { label: 'Li（南京-老李）', value: 'Li' },
  { label: 'Kiki（粤语-阿清）', value: 'Kiki' },
  { label: 'Rocky（粤语-阿强）', value: 'Rocky' }
]

/** 语种代码 → 显示标签（常见语种，其余回退大写代码） */
const LANG_MAP: Record<string, string> = {
  zh: '中文',
  yue: '粤语',
  en: 'EN',
  ja: '日文',
  ko: '韩文',
  fr: 'FR',
  de: 'DE',
  ru: 'RU',
  it: 'IT',
  es: 'ES',
  pt: 'PT',
  ar: 'AR',
  nl: 'NL',
  vi: 'VI',
  th: 'TH',
  id: 'ID',
  tr: 'TR',
  hi: 'HI',
  pl: 'PL',
  uk: 'UK',
  cs: 'CS',
  ur: 'UR',
  tl: 'TL',
  sv: 'SV',
  da: 'DA',
  he: 'HE',
  is: 'IS',
  ms: 'MS',
  no: 'NO',
  fa: 'FA'
}

export function langLabel(code: string): string {
  return LANG_MAP[code] ?? code.toUpperCase()
}
