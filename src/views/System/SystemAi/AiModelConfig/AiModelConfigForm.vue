<template>
  <n-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-placement="left"
    label-width="120px"
    require-mark-placement="right-hanging"
  >
    <!-- 基础信息 -->
    <n-form-item label="配置 Key" path="key">
      <n-input v-model:value="form.key" clearable placeholder="唯一标识，如 qwen3-max" />
    </n-form-item>
    <n-form-item label="配置名称" path="name">
      <n-input v-model:value="form.name" clearable placeholder="显示名称" />
    </n-form-item>
    <n-form-item label="模型类型" path="type">
      <n-select v-model:value="form.type" :options="aiModelTypeRef" placeholder="请选择模型类型" />
    </n-form-item>
    <n-form-item label="云厂商" path="providerType">
      <n-select v-model:value="form.providerType" :options="aiProviderTypeRef" placeholder="自动识别（推荐）" />
    </n-form-item>
    <n-form-item label="Base URL" path="baseUrl">
      <n-input v-model:value="form.baseUrl" clearable placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" />
    </n-form-item>
    <n-form-item label="API Key" path="apiKey">
      <n-input
        v-model:value="form.apiKey"
        type="password"
        show-password-on="click"
        :input-props="{ autocomplete: 'new-password' }"
        clearable
        :placeholder="isEdit ? '不修改请留空' : '请输入 API Key'"
      />
    </n-form-item>
    <n-form-item label="模型名称" path="modelName">
      <n-space vertical style="width: 100%">
        <n-space>
          <n-button :disabled="!canFetchModels" :loading="fetchingModels" @click="fetchModels"> 获取模型列表 </n-button>
          <n-text depth="3" style="font-size: 12px">填写 Base URL 和 API Key 后可获取</n-text>
        </n-space>
        <n-checkbox-group v-if="fetchedModels.length > 0" v-model:value="filterTypes">
          <n-space>
            <n-checkbox :value="1" label="TEXT" />
            <n-checkbox :value="2" label="VISION" />
            <n-checkbox :value="3" label="TTS" />
            <n-checkbox :value="4" label="STT" />
            <n-checkbox :value="5" label="IMAGE_GEN" />
            <n-checkbox :value="6" label="ASR" />
          </n-space>
        </n-checkbox-group>
        <n-select
          v-if="fetchedModels.length > 0"
          v-model:value="form.modelName"
          :options="modelOptions"
          filterable
          tag
          clearable
          placeholder="选择或输入模型名称"
        />
        <n-input v-else v-model:value="form.modelName" clearable placeholder="如 qwen3-max" />
      </n-space>
    </n-form-item>
    <n-form-item label="多模态支持" v-if="isText">
      <n-checkbox-group v-model:value="modalitiesArray">
        <n-space>
          <n-checkbox value="image" label="图片" />
          <n-checkbox value="video" label="视频" />
          <n-checkbox value="audio" label="音频" />
        </n-space>
      </n-checkbox-group>
    </n-form-item>
    <n-form-item label="状态" path="status">
      <n-switch v-model:value="statusSwitch" />
    </n-form-item>
    <n-form-item label="备注" path="remark">
      <n-input v-model:value="form.remark" type="textarea" clearable placeholder="备注信息" :rows="2" />
    </n-form-item>

    <!-- TEXT / VISION 参数 -->
    <template v-if="isTextOrVision">
      <n-form-item label="系统提示词" path="systemPrompt">
        <n-input
          v-model:value="form.systemPrompt"
          type="textarea"
          clearable
          placeholder="系统提示词（可选）"
          :rows="4"
        />
      </n-form-item>
      <n-form-item label="Temperature">
        <n-input-number v-model:value="form.temperature" :min="0" :max="2" :step="0.1" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="Top P">
        <n-input-number v-model:value="form.topP" :min="0" :max="1" :step="0.1" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="Max Tokens">
        <n-input-number v-model:value="form.maxTokens" :min="1" clearable style="width: 160px" />
      </n-form-item>
    </template>

    <!-- TEXT only: advanced parameters in collapsible sections -->
    <template v-if="isText">
      <n-collapse :default-expanded-names="['thinking', 'search']" style="margin-top: 12px">
        <!-- 生成参数 -->
        <n-collapse-item title="生成参数" name="generation">
          <n-form-item>
            <template #label>
              <span class="param-label">
                Max Completion Tokens
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  限制模型输出的最大 Token 数（含思考链）。超过此值生成将停止。
                </n-tooltip>
              </span>
            </template>
            <n-input-number v-model:value="form.maxCompletionTokens" :min="1" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                Presence Penalty
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  控制已出现内容的重复度。正值降低重复，负值增加重复。范围: -2.0 ~ 2.0，推荐: 0.0 ~ 1.5
                </n-tooltip>
              </span>
            </template>
            <n-input-number
              v-model:value="form.presencePenalty"
              :min="-2"
              :max="2"
              :step="0.1"
              clearable
              style="width: 180px"
            />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                Frequency Penalty
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  按词频施加惩罚，降低高频词的出现概率。范围: -2.0 ~ 2.0，推荐: 0.0 ~ 1.0
                </n-tooltip>
              </span>
            </template>
            <n-input-number
              v-model:value="form.frequencyPenalty"
              :min="-2"
              :max="2"
              :step="0.1"
              clearable
              style="width: 180px"
            />
          </n-form-item>
          <n-form-item v-if="providerFeatures.repetitionPenalty">
            <template #label>
              <span class="param-label">
                Repetition Penalty
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  对连续重复序列施加惩罚。1.0 表示不惩罚。范围: > 0，推荐: 1.0 ~ 1.2
                </n-tooltip>
              </span>
            </template>
            <n-input-number
              v-model:value="form.repetitionPenalty"
              :min="0"
              :step="0.05"
              clearable
              style="width: 180px"
            />
          </n-form-item>
          <n-form-item v-if="providerFeatures.topK">
            <template #label>
              <span class="param-label">
                Top K
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  每步生成时保留概率最高的 K 个候选 Token。值越大越随机。范围: 0 ~ 100，推荐: 20 ~ 50
                </n-tooltip>
              </span>
            </template>
            <n-input-number v-model:value="form.topK" :min="0" :max="100" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                Seed
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  固定随机种子可使相同输入得到相同输出，便于结果复现。
                </n-tooltip>
              </span>
            </template>
            <n-input-number v-model:value="form.seed" :min="0" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                N（候选数）
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  一次请求生成多个独立回复，适用于创意写作、广告文案。范围: 1 ~ 4
                </n-tooltip>
              </span>
            </template>
            <n-input-number v-model:value="form.n" :min="1" :max="4" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item label="Stop Sequences">
            <n-dynamic-tags v-model:value="stopSequencesArray" />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                Response Format
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  设为 json_object 时模型严格输出合法 JSON（需在提示词中说明）。
                </n-tooltip>
              </span>
            </template>
            <n-select
              v-model:value="form.responseFormat"
              :options="textResponseFormatOptions"
              clearable
              placeholder="默认 text"
              style="width: 200px"
            />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="param-label">
                Logprobs
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  返回每个输出 Token 的对数概率，可用于评估模型置信度。
                </n-tooltip>
              </span>
            </template>
            <n-switch v-model:value="logprobsSwitch" />
          </n-form-item>
          <n-form-item v-if="logprobsSwitch">
            <template #label>
              <span class="param-label">
                Top Logprobs
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  每步返回前 N 个最可能 Token 的概率。范围: 0 ~ 5
                </n-tooltip>
              </span>
            </template>
            <n-input-number v-model:value="form.topLogprobs" :min="0" :max="5" clearable style="width: 180px" />
          </n-form-item>
        </n-collapse-item>

        <!-- 思考模式 -->
        <n-collapse-item v-if="providerFeatures.thinkingControl !== 'none'" title="思考模式" name="thinking">
          <n-form-item label="启用思考模式">
            <n-switch v-model:value="thinkingSwitch" />
          </n-form-item>
          <n-form-item v-if="thinkingSwitch && providerFeatures.thinkingBudget">
            <template #label>
              <span class="param-label">
                思考 Token 预算
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  限制思考过程的最大 Token 数。超过后立即输出最终回复。
                </n-tooltip>
              </span>
            </template>
            <n-input-number
              v-model:value="form.thinkingBudget"
              :min="1024"
              :step="1024"
              clearable
              style="width: 180px"
            />
          </n-form-item>
          <n-form-item v-if="thinkingSwitch && providerFeatures.preserveThinking">
            <template #label>
              <span class="param-label">
                保留思考过程
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  多轮对话中将历史思考过程传入下一轮，让模型参考先前推理。会增加 Token 消耗。
                </n-tooltip>
              </span>
            </template>
            <n-space align="center">
              <n-switch v-model:value="preserveThinkingSwitch" />
              <n-text depth="3" style="font-size: 12px">在消息中保留思考内容</n-text>
            </n-space>
          </n-form-item>
          <n-form-item v-if="thinkingSwitch && providerFeatures.reasoningEffortPlacement === 'thinking-nested'">
            <template #label>
              <span class="param-label">
                推理强度
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  DashScope 推理力度控制，high = 标准推理，max = 最大力度推理。
                </n-tooltip>
              </span>
            </template>
            <n-select
              v-model:value="form.reasoningEffort"
              :options="reasoningEffortOptions"
              clearable
              placeholder="默认"
              style="width: 180px"
            />
          </n-form-item>
          <n-form-item v-if="providerFeatures.codeInterpreter">
            <template #label>
              <span class="param-label">
                代码解释器
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  模型可编写并执行 Python 代码解决数学计算、数据分析等问题。需同时开启思考模式。
                </n-tooltip>
              </span>
            </template>
            <n-space align="center">
              <n-switch v-model:value="codeInterpreterSwitch" :disabled="!thinkingSwitch" />
              <n-text depth="3" style="font-size: 12px">需开启思考模式，仅流式对话生效</n-text>
            </n-space>
          </n-form-item>
          <!-- DeepSeek 专属：推理强度独立于思考模式开关 -->
          <n-form-item v-if="providerFeatures.reasoningEffortPlacement === 'standalone'">
            <template #label>
              <span class="param-label">
                推理强度
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  DeepSeek 推理强度控制。high = 标准推理（默认），max = 最大力度推理。不依赖思考模式开关，始终生效。
                </n-tooltip>
              </span>
            </template>
            <n-select
              v-model:value="form.reasoningEffort"
              :options="reasoningEffortOptions"
              clearable
              placeholder="默认（high）"
              style="width: 180px"
            />
          </n-form-item>
        </n-collapse-item>

        <!-- 联网搜索 -->
        <n-collapse-item v-if="isText && providerFeatures.search" title="联网搜索" name="search">
          <n-form-item label="启用搜索">
            <n-switch v-model:value="searchSwitch" />
          </n-form-item>
          <n-form-item v-if="searchSwitch">
            <template #label>
              <span class="param-label">
                搜索策略
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  turbo: 平衡速度与效果（默认）；max: 多源搜索，更全面但更慢；agent: 多轮检索；agent_max: agent +
                  网页抓取
                </n-tooltip>
              </span>
            </template>
            <n-select
              v-model:value="form.searchStrategy"
              :options="searchStrategyOptions"
              clearable
              placeholder="选择搜索策略"
              style="width: 220px"
            />
          </n-form-item>
          <n-form-item v-if="searchSwitch" label="来源引用">
            <n-space align="center">
              <n-switch v-model:value="sourceSwitch" />
              <n-text depth="3" style="font-size: 12px">在回答中附带搜索来源</n-text>
            </n-space>
          </n-form-item>
          <n-form-item v-if="searchSwitch">
            <template #label>
              <span class="param-label">
                强制搜索
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  无论问题是否涉及实时信息，都强制执行联网搜索。
                </n-tooltip>
              </span>
            </template>
            <n-space align="center">
              <n-switch v-model:value="forcedSearchSwitch" />
              <n-text depth="3" style="font-size: 12px">每次请求都执行搜索</n-text>
            </n-space>
          </n-form-item>
          <n-form-item v-if="searchSwitch">
            <template #label>
              <span class="param-label">
                搜索时效
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  仅返回指定时间范围内的搜索结果，适合查找最新信息。
                </n-tooltip>
              </span>
            </template>
            <n-select
              v-model:value="form.searchFreshness"
              :options="searchFreshnessOptions"
              clearable
              placeholder="不限"
              style="width: 200px"
            />
          </n-form-item>
          <n-form-item v-if="searchSwitch">
            <template #label>
              <span class="param-label">
                搜索增强
                <n-tooltip trigger="hover" :style="{ maxWidth: '280px' }">
                  <template #trigger>
                    <n-icon :size="13" class="param-help">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </n-icon>
                  </template>
                  启用垂域搜索能力（天气、股票、汇率等精确数据源）。
                </n-tooltip>
              </span>
            </template>
            <n-space align="center">
              <n-switch v-model:value="searchExtensionSwitch" />
              <n-text depth="3" style="font-size: 12px">启用扩展搜索能力</n-text>
            </n-space>
          </n-form-item>
        </n-collapse-item>

        <!-- 视觉参数 (仅多模态包含 image/video 时显示，且仅 DashScope/AUTO 提供商支持) -->
        <n-collapse-item v-if="hasVisionModality && providerFeatures.vision" title="视觉参数" name="vision">
          <n-form-item label="高分辨率图片">
            <n-space align="center">
              <n-switch v-model:value="vlHighResSwitch" />
              <n-text depth="3" style="font-size: 12px">启用后忽略 Min/Max Pixels 限制</n-text>
            </n-space>
          </n-form-item>
          <n-form-item v-if="!vlHighResSwitch" label="Min Pixels">
            <n-input-number v-model:value="form.minPixels" :min="1" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item v-if="!vlHighResSwitch" label="Max Pixels">
            <n-input-number v-model:value="form.maxPixels" :min="1" clearable style="width: 180px" />
          </n-form-item>
          <n-form-item v-if="modalitiesArray.includes('video')" label="Video FPS">
            <n-input-number
              v-model:value="form.videoFps"
              :min="0.1"
              :max="10"
              :step="0.1"
              clearable
              style="width: 180px"
            />
          </n-form-item>
        </n-collapse-item>

        <!-- 其他能力 -->
        <n-collapse-item v-if="providerFeatures.textImageMixed" title="其他能力" name="other">
          <n-form-item label="图文混排输出">
            <n-space align="center">
              <n-switch v-model:value="textImageMixedSwitch" />
              <n-text depth="3" style="font-size: 12px">允许模型输出穿插图片</n-text>
            </n-space>
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </template>

    <!-- TTS 参数 -->
    <template v-if="isTts">
      <n-form-item label="默认音色" path="voice">
        <n-input
          v-model:value="form.voice"
          clearable
          placeholder="可选，cosyvoice-v3.5 无系统音色，请在工坊复刻/设计"
        />
      </n-form-item>
      <n-form-item label="语速">
        <n-input-number v-model:value="form.speed" :min="0.25" :max="4.0" :step="0.25" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="响应格式" path="responseFormat">
        <n-select
          v-model:value="form.responseFormat"
          :options="audioFormatOptions"
          clearable
          placeholder="音频格式"
          style="width: 200px"
        />
      </n-form-item>
      <n-form-item label="存储配置" path="ossConfigKey">
        <n-select
          v-model:value="form.ossConfigKey"
          :options="ossConfigOptions"
          clearable
          filterable
          placeholder="声音复刻上传音频经此 OSS 转公网 URL（可选）"
          style="width: 100%"
          @update:value="onOssConfigChange"
        />
      </n-form-item>
      <n-form-item label="存储空间" path="ossBucketName">
        <n-select
          v-model:value="form.ossBucketName"
          :options="ossBucketOptions"
          :loading="loadingBuckets"
          :disabled="!form.ossConfigKey"
          clearable
          filterable
          :placeholder="form.ossConfigKey ? '选择存储空间 Bucket' : '请先选择存储配置'"
          style="width: 100%"
        />
      </n-form-item>
      <n-form-item label="克隆参考音频 URL" path="promptAudioUrl">
        <n-input
          v-model:value="form.promptAudioUrl"
          clearable
          placeholder="cosyvoice-v3.5-plus 零样本克隆专用，设置后忽略默认音色"
        />
      </n-form-item>
      <n-form-item label="合成默认参数">
        <n-input
          v-model:value="form.ttsParams"
          type="textarea"
          clearable
          :rows="3"
          placeholder='JSON 格式，如 {"format":"mp3","sampleRate":22050}'
        />
      </n-form-item>
    </template>

    <!-- STT 参数（离线语音识别） -->
    <template v-if="isStt">
      <n-form-item label="存储配置" path="ossConfigKey">
        <n-select
          v-model:value="form.ossConfigKey"
          :options="ossConfigOptions"
          clearable
          filterable
          placeholder="选择 OSS 存储配置（音频经此上传转写）"
          style="width: 100%"
          @update:value="onOssConfigChange"
        />
      </n-form-item>
      <n-form-item label="存储空间" path="ossBucketName">
        <n-select
          v-model:value="form.ossBucketName"
          :options="ossBucketOptions"
          :loading="loadingBuckets"
          :disabled="!form.ossConfigKey"
          clearable
          filterable
          :placeholder="form.ossConfigKey ? '选择存储空间 Bucket' : '请先选择存储配置'"
          style="width: 100%"
        />
      </n-form-item>
      <n-form-item label="语言" path="language">
        <n-input v-model:value="form.language" clearable placeholder="如 zh / en（可选，默认语种）" />
      </n-form-item>
      <n-form-item label="响应格式" path="responseFormat">
        <n-select
          v-model:value="form.responseFormat"
          :options="sttFormatOptions"
          clearable
          placeholder="结果格式"
          style="width: 200px"
        />
      </n-form-item>
      <n-form-item label="说话人分离">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.diarizationEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Fun-ASR / Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item v-if="sttParamsForm.diarizationEnabled" label="说话人数">
        <n-input-number
          v-model:value="sttParamsForm.speakerCount"
          :min="2"
          :max="100"
          clearable
          placeholder="自动判断"
          style="width: 180px"
        />
      </n-form-item>
      <n-form-item label="过滤语气词">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.disfluencyRemovalEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="时间戳校准">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.timestampAlignmentEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="数字正则化">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.enableItn" />
          <n-text depth="3" style="font-size: 12px">ITN，仅 Qwen</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="字级时间戳">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.enableWords" />
          <n-text depth="3" style="font-size: 12px">仅 Qwen-Filetrans</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="热词 ID">
        <n-input
          v-model:value="sttParamsForm.vocabularyId"
          clearable
          placeholder="可选，热词列表 ID（Fun-ASR/Paraformer）"
        />
      </n-form-item>
    </template>

    <!-- ASR 参数（实时语音识别） -->
    <template v-if="isAsr">
      <n-form-item label="语言" path="language">
        <n-input v-model:value="form.language" clearable placeholder="如 zh / en（可选）" />
      </n-form-item>
      <n-form-item label="语义断句">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.semanticPunctuationEnabled" />
          <n-text depth="3" style="font-size: 12px">开启后关闭 VAD 断句；Paraformer-8k-v2 情感识别需关闭</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="断句静音(ms)">
        <n-input-number
          v-model:value="asrParamsForm.maxSentenceSilence"
          :min="200"
          :max="6000"
          :step="100"
          clearable
          placeholder="默认 1300"
          style="width: 180px"
        />
      </n-form-item>
      <n-form-item label="多阈值模式">
        <n-switch v-model:value="asrParamsForm.multiThresholdModeEnabled" />
      </n-form-item>
      <n-form-item label="过滤语气词">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.disfluencyRemovalEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="标点预测">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.punctuationPredictionEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="数字正则化">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.inverseTextNormalizationEnabled" />
          <n-text depth="3" style="font-size: 12px">ITN，仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="噪音阈值">
        <n-space align="center">
          <n-input-number
            v-model:value="asrParamsForm.speechNoiseThreshold"
            :min="-1"
            :max="1"
            :step="0.1"
            clearable
            placeholder="默认 0"
            style="width: 180px"
          />
          <n-text depth="3" style="font-size: 12px">仅 Fun-ASR</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="热词 ID">
        <n-input v-model:value="asrParamsForm.vocabularyId" clearable placeholder="可选，热词列表 ID" />
      </n-form-item>
    </template>

    <n-space justify="end" style="margin-top: 16px">
      <n-button @click="emit('cancel')">取消</n-button>
      <n-button type="primary" :loading="saving" @click="submit">保存</n-button>
    </n-space>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import type { AiModelConfigResp, AiModelConfigUpdateReq, AiModelInfo } from '@/api/ai'
import { aiApi } from '@/api/ai'
import { ossApi } from '@/api/oss'
import { useDict } from '@/composables/useDict.ts'

interface Props {
  editId?: string
  initialData?: AiModelConfigResp | null
}

const props = withDefaults(defineProps<Props>(), { editId: '', initialData: null })
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

// 加载字典
const aiModelTypeRef = useDict('AiModelType')
const aiProviderTypeRef = useDict('AiProviderType')

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const isEdit = computed(() => !!props.editId)

const fetchedModels = ref<AiModelInfo[]>([])
const fetchingModels = ref(false)
const filterTypes = ref<number[]>([1, 2, 3, 4, 5, 6])

const audioFormatOptions = [
  { label: 'mp3', value: 'mp3' },
  { label: 'wav', value: 'wav' },
  { label: 'pcm', value: 'pcm' },
  { label: 'opus', value: 'opus' }
]

const sttFormatOptions = [
  { label: 'json（默认）', value: 'json' },
  { label: 'text', value: 'text' },
  { label: 'verbose_json', value: 'verbose_json' }
]

const getDefaultForm = (): AiModelConfigUpdateReq & { apiKey: string } => ({
  key: '',
  name: '',
  type: 1,
  providerType: 0,
  baseUrl: '',
  apiKey: '',
  modelName: '',
  temperature: null,
  topP: null,
  maxTokens: null,
  maxCompletionTokens: null,
  presencePenalty: null,
  frequencyPenalty: null,
  repetitionPenalty: null,
  topK: null,
  seed: null,
  n: null,
  stopSequences: null,
  logprobs: null,
  topLogprobs: null,
  systemPrompt: '',
  supportedModalities: null,
  enableThinking: 0,
  thinkingBudget: null,
  preserveThinking: null,
  reasoningEffort: null,
  enableCodeInterpreter: 0,
  enableSearch: 0,
  searchStrategy: null,
  enableSource: 0,
  forcedSearch: null,
  searchFreshness: null,
  enableSearchExtension: null,
  vlHighResolutionImages: null,
  minPixels: null,
  maxPixels: null,
  videoFps: null,
  enableTextImageMixed: null,
  voice: '',
  speed: null,
  responseFormat: null,
  language: '',
  status: 1,
  remark: '',
  asrParams: null,
  sttParams: null,
  ttsParams: null,
  ossConfigKey: null,
  ossBucketName: null,
  promptAudioUrl: ''
})

const form = ref(getDefaultForm())

/** ASR 默认参数编辑态（提交时序列化为 form.asrParams JSON 字符串） */
interface AsrParamsForm {
  semanticPunctuationEnabled: boolean
  maxSentenceSilence: number | null
  multiThresholdModeEnabled: boolean
  disfluencyRemovalEnabled: boolean
  punctuationPredictionEnabled: boolean
  inverseTextNormalizationEnabled: boolean
  speechNoiseThreshold: number | null
  vocabularyId: string
}

const getDefaultAsrParams = (): AsrParamsForm => ({
  semanticPunctuationEnabled: false,
  maxSentenceSilence: null,
  multiThresholdModeEnabled: false,
  disfluencyRemovalEnabled: false,
  punctuationPredictionEnabled: true,
  inverseTextNormalizationEnabled: true,
  speechNoiseThreshold: null,
  vocabularyId: ''
})

const asrParamsForm = ref<AsrParamsForm>(getDefaultAsrParams())

/** STT 默认参数编辑态（提交时序列化为 form.sttParams JSON 字符串；语种沿用上方"语言"字段） */
interface SttParamsForm {
  enableItn: boolean
  enableWords: boolean
  diarizationEnabled: boolean
  speakerCount: number | null
  disfluencyRemovalEnabled: boolean
  timestampAlignmentEnabled: boolean
  vocabularyId: string
}

const getDefaultSttParams = (): SttParamsForm => ({
  enableItn: false,
  enableWords: false,
  diarizationEnabled: false,
  speakerCount: null,
  disfluencyRemovalEnabled: false,
  timestampAlignmentEnabled: false,
  vocabularyId: ''
})

const sttParamsForm = ref<SttParamsForm>(getDefaultSttParams())

// ——— STT 专用：OSS 存储联动（音频文件需先上传至 OSS） ———
const ossConfigOptions = ref<SelectOption[]>([])
const ossBucketOptions = ref<SelectOption[]>([])
const loadingBuckets = ref(false)

/** 加载存储配置下拉 */
async function loadOssConfigs() {
  try {
    const res = await ossApi.configSelect()
    ossConfigOptions.value = (res.data?.data?.options ?? []).map((o) => ({ label: o.label, value: o.value }))
  } catch {
    ossConfigOptions.value = []
  }
}

/** 按所选存储配置加载其存储空间（Bucket）下拉 */
async function loadOssBuckets(configKey: string) {
  if (!configKey) {
    ossBucketOptions.value = []
    return
  }
  loadingBuckets.value = true
  try {
    const res = await ossApi.bucketList({ configKey, pageSize: 200, pageNum: 1 })
    ossBucketOptions.value = (res.data?.data?.buckets ?? []).map((b) => ({ label: b.name, value: b.name }))
  } catch {
    ossBucketOptions.value = []
  } finally {
    loadingBuckets.value = false
  }
}

/** 切换存储配置：重载 Bucket 列表，并清空已选 Bucket（除非回填阶段） */
function onOssConfigChange(key: string) {
  form.value.ossConfigKey = key
  form.value.ossBucketName = null
  ossBucketOptions.value = []
  loadOssBuckets(key)
}

// 初始化存储配置下拉（STT 类型用）
loadOssConfigs()

const statusSwitch = computed({
  get: () => form.value.status === 1,
  set: (v) => (form.value.status = v ? 1 : 0)
})
const thinkingSwitch = computed({
  get: () => form.value.enableThinking === 1,
  set: (v) => {
    form.value.enableThinking = v ? 1 : 0
    if (!v) {
      form.value.thinkingBudget = null
      // 代码解释器依赖思考模式，关闭思考时一并关闭
      form.value.enableCodeInterpreter = 0
    }
  }
})
const codeInterpreterSwitch = computed({
  get: () => form.value.enableCodeInterpreter === 1,
  set: (v) => (form.value.enableCodeInterpreter = v ? 1 : 0)
})
const searchSwitch = computed({
  get: () => form.value.enableSearch === 1,
  set: (v) => {
    form.value.enableSearch = v ? 1 : 0
    if (!v) {
      form.value.searchStrategy = null
      form.value.enableSource = 0
    }
  }
})
const sourceSwitch = computed({
  get: () => form.value.enableSource === 1,
  set: (v) => (form.value.enableSource = v ? 1 : 0)
})
const preserveThinkingSwitch = computed({
  get: () => form.value.preserveThinking === 1,
  set: (v) => (form.value.preserveThinking = v ? 1 : 0)
})
const forcedSearchSwitch = computed({
  get: () => form.value.forcedSearch === 1,
  set: (v) => (form.value.forcedSearch = v ? 1 : 0)
})
const searchExtensionSwitch = computed({
  get: () => form.value.enableSearchExtension === 1,
  set: (v) => (form.value.enableSearchExtension = v ? 1 : 0)
})
const logprobsSwitch = computed({
  get: () => form.value.logprobs === 1,
  set: (v) => {
    form.value.logprobs = v ? 1 : 0
    if (!v) form.value.topLogprobs = null
  }
})
const vlHighResSwitch = computed({
  get: () => form.value.vlHighResolutionImages === 1,
  set: (v) => (form.value.vlHighResolutionImages = v ? 1 : 0)
})
const textImageMixedSwitch = computed({
  get: () => form.value.enableTextImageMixed === 1,
  set: (v) => (form.value.enableTextImageMixed = v ? 1 : 0)
})

const modalitiesArray = computed({
  get: () => {
    try {
      return JSON.parse(form.value.supportedModalities || '[]') as string[]
    } catch {
      return []
    }
  },
  set: (val: string[]) => {
    form.value.supportedModalities = val.length > 0 ? JSON.stringify(val) : null
  }
})

const stopSequencesArray = computed({
  get: () => {
    try {
      return JSON.parse(form.value.stopSequences || '[]') as string[]
    } catch {
      return []
    }
  },
  set: (val: string[]) => {
    form.value.stopSequences = val.length > 0 ? JSON.stringify(val) : null
  }
})

const hasVisionModality = computed(() => {
  const arr = modalitiesArray.value
  return arr.includes('image') || arr.includes('video')
})

const searchStrategyOptions = [
  { label: 'turbo（快速搜索）', value: 'turbo' },
  { label: 'max（高性能搜索）', value: 'max' },
  { label: 'agent（深度研究）', value: 'agent' },
  { label: 'agent_max（深度研究+）', value: 'agent_max' }
]

const reasoningEffortOptions = [
  { label: 'high（高推理）', value: 'high' },
  { label: 'max（最大推理）', value: 'max' }
]

const textResponseFormatOptions = [
  { label: 'text（纯文本）', value: 'text' },
  { label: 'json_object（JSON 模式）', value: 'json_object' }
]

const searchFreshnessOptions = [
  { label: '7 天内', value: 7 },
  { label: '30 天内', value: 30 },
  { label: '180 天内', value: 180 },
  { label: '365 天内', value: 365 }
]

// ============================================================
//  提供商功能注册表（驱动参数按提供商显示）
// ============================================================

interface ProviderFeatures {
  topK: boolean
  repetitionPenalty: boolean
  thinkingBudget: boolean
  preserveThinking: boolean
  codeInterpreter: boolean
  search: boolean
  vision: boolean
  textImageMixed: boolean
  reasoningEffortPlacement: 'thinking-nested' | 'standalone' | 'none'
  thinkingControl: 'dashscope-bool' | 'deepseek-object' | 'none'
}

const PROVIDER_FEATURES: Record<number, ProviderFeatures> = {
  0: {
    topK: true,
    repetitionPenalty: true,
    thinkingBudget: true,
    preserveThinking: true,
    codeInterpreter: true,
    search: true,
    vision: true,
    textImageMixed: true,
    reasoningEffortPlacement: 'thinking-nested',
    thinkingControl: 'dashscope-bool'
  },
  1: {
    topK: true,
    repetitionPenalty: true,
    thinkingBudget: true,
    preserveThinking: true,
    codeInterpreter: true,
    search: true,
    vision: true,
    textImageMixed: true,
    reasoningEffortPlacement: 'thinking-nested',
    thinkingControl: 'dashscope-bool'
  },
  2: {
    topK: false,
    repetitionPenalty: false,
    thinkingBudget: false,
    preserveThinking: false,
    codeInterpreter: false,
    search: false,
    vision: false,
    textImageMixed: false,
    reasoningEffortPlacement: 'standalone',
    thinkingControl: 'deepseek-object'
  },
  3: {
    topK: false,
    repetitionPenalty: false,
    thinkingBudget: false,
    preserveThinking: false,
    codeInterpreter: false,
    search: false,
    vision: false,
    textImageMixed: false,
    reasoningEffortPlacement: 'none',
    thinkingControl: 'none'
  },
  9: {
    topK: true,
    repetitionPenalty: true,
    thinkingBudget: true,
    preserveThinking: true,
    codeInterpreter: true,
    search: true,
    vision: true,
    textImageMixed: true,
    reasoningEffortPlacement: 'thinking-nested',
    thinkingControl: 'dashscope-bool'
  }
}

const providerFeatures = computed((): ProviderFeatures => {
  const pt = form.value.providerType ?? 0
  return (PROVIDER_FEATURES[pt] ?? PROVIDER_FEATURES[9]) as ProviderFeatures
})

// 切换提供商时清理对目标提供商无效的字段值（immediate: false，不影响编辑模式加载初始数据）
watch(
  () => form.value.providerType,
  () => {
    const features = providerFeatures.value
    if (!features.topK) form.value.topK = null
    if (!features.repetitionPenalty) form.value.repetitionPenalty = null
    if (!features.thinkingBudget) form.value.thinkingBudget = null
    if (!features.preserveThinking) form.value.preserveThinking = null
    if (!features.codeInterpreter) form.value.enableCodeInterpreter = 0
    if (!features.search) {
      form.value.enableSearch = 0
      form.value.searchStrategy = null
      form.value.enableSource = 0
      form.value.forcedSearch = null
      form.value.searchFreshness = null
      form.value.enableSearchExtension = null
    }
    if (!features.vision) {
      form.value.vlHighResolutionImages = null
      form.value.minPixels = null
      form.value.maxPixels = null
      form.value.videoFps = null
    }
    if (!features.textImageMixed) form.value.enableTextImageMixed = null
    if (features.reasoningEffortPlacement === 'none') form.value.reasoningEffort = null
  }
)

const isText = computed(() => form.value.type === 1)
const isTextOrVision = computed(() => form.value.type === 1 || form.value.type === 2)
const isTts = computed(() => form.value.type === 3)
const isStt = computed(() => form.value.type === 4)
const isAsr = computed(() => form.value.type === 6)

const canFetchModels = computed(() => {
  // 编辑模式：只需要 baseUrl（假设后端已有 API Key）
  if (props.editId) {
    return !!form.value.baseUrl?.trim()
  }
  // 新增模式：需要 baseUrl 和 apiKey
  return !!(form.value.baseUrl?.trim() && form.value.apiKey?.trim())
})

const modelOptions = computed<SelectOption[]>(() => {
  const filtered = fetchedModels.value.filter((m: AiModelInfo) => filterTypes.value.includes(m.type))
  return filtered.map((m: AiModelInfo) => ({
    label: `${m.name} (${aiModelTypeRef.value.find((t) => t.value === m.type)?.label})`,
    value: m.name
  }))
})

watch(
  () => props.initialData,
  (data) => {
    if (data) {
      Object.assign(form.value, {
        key: data.key,
        name: data.name,
        type: data.type,
        providerType: data.providerType ?? 0,
        baseUrl: data.baseUrl,
        apiKey: '',
        modelName: data.modelName,
        temperature: data.temperature ?? null,
        topP: data.topP ?? null,
        maxTokens: data.maxTokens ?? null,
        maxCompletionTokens: data.maxCompletionTokens ?? null,
        presencePenalty: data.presencePenalty ?? null,
        frequencyPenalty: data.frequencyPenalty ?? null,
        repetitionPenalty: data.repetitionPenalty ?? null,
        topK: data.topK ?? null,
        seed: data.seed ?? null,
        n: data.n ?? null,
        stopSequences: data.stopSequences ?? null,
        logprobs: data.logprobs ?? null,
        topLogprobs: data.topLogprobs ?? null,
        systemPrompt: data.systemPrompt ?? '',
        supportedModalities: data.supportedModalities ?? null,
        enableThinking: data.enableThinking ?? 0,
        thinkingBudget: data.thinkingBudget ?? null,
        preserveThinking: data.preserveThinking ?? null,
        reasoningEffort: data.reasoningEffort ?? null,
        enableCodeInterpreter: data.enableCodeInterpreter ?? 0,
        enableSearch: data.enableSearch ?? 0,
        searchStrategy: data.searchStrategy ?? null,
        enableSource: data.enableSource ?? 0,
        forcedSearch: data.forcedSearch ?? null,
        searchFreshness: data.searchFreshness ?? null,
        enableSearchExtension: data.enableSearchExtension ?? null,
        vlHighResolutionImages: data.vlHighResolutionImages ?? null,
        minPixels: data.minPixels ?? null,
        maxPixels: data.maxPixels ?? null,
        videoFps: data.videoFps ?? null,
        enableTextImageMixed: data.enableTextImageMixed ?? null,
        voice: data.voice ?? '',
        speed: data.speed ?? null,
        responseFormat: data.responseFormat ?? null,
        language: data.language ?? '',
        status: data.status ?? 1,
        remark: data.remark ?? '',
        ossConfigKey: data.ossConfigKey ?? null,
        ossBucketName: data.ossBucketName ?? null
      })
      // STT 存储联动：编辑态若已选配置，加载其 Bucket 列表以供下拉展示
      if (data.ossConfigKey) {
        loadOssBuckets(data.ossConfigKey)
      }
      // ASR 默认参数：从 asrParams JSON 反序列化（非法/空 → 默认）
      asrParamsForm.value = getDefaultAsrParams()
      if (data.asrParams) {
        try {
          Object.assign(asrParamsForm.value, JSON.parse(data.asrParams))
        } catch {
          /* 非法 JSON 用默认 */
        }
      }
      // STT 默认参数：从 sttParams JSON 反序列化（非法/空 → 默认）
      sttParamsForm.value = getDefaultSttParams()
      if (data.sttParams) {
        try {
          Object.assign(sttParamsForm.value, JSON.parse(data.sttParams))
        } catch {
          /* 非法 JSON 用默认 */
        }
      }
    } else {
      form.value = getDefaultForm()
      asrParamsForm.value = getDefaultAsrParams()
      sttParamsForm.value = getDefaultSttParams()
    }
  },
  { immediate: true }
)

const rules: FormRules = {
  key: [{ required: true, message: '请输入配置 Key', trigger: 'blur' }],
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  type: [{ required: true, type: 'number', message: '请选择模型类型', trigger: 'change' }],
  baseUrl: [{ required: true, message: '请输入 Base URL', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}

async function fetchModels() {
  if (!canFetchModels.value) {
    if (props.editId) {
      message.warning('请先填写 Base URL')
    } else {
      message.warning('请先填写 Base URL 和 API Key')
    }
    return
  }

  // 编辑模式且 API Key 为空时，使用占位符（后端会使用已存储的 API Key）
  const apiKey = form.value.apiKey || (props.editId ? '__USE_EXISTING__' : '')

  if (!apiKey) {
    message.warning('请填写 API Key')
    return
  }

  fetchingModels.value = true
  try {
    const res = await aiApi.fetchModels({
      baseUrl: form.value.baseUrl,
      apiKey: apiKey,
      configId: props.editId || undefined
    })

    if (res.data?.code === 200 && res.data.data) {
      fetchedModels.value = res.data.data
      message.success(`成功获取 ${fetchedModels.value.length} 个模型`)
    } else {
      message.error(res.data?.msg ?? '获取模型列表失败')
    }
  } catch {
    message.error('获取模型列表失败')
  } finally {
    fetchingModels.value = false
  }
}

async function submit() {
  try {
    await formRef.value!.validate()
  } catch {
    return
  }

  // 按类型序列化默认参数；其他类型清空
  if (form.value.type === 6) {
    const a = asrParamsForm.value
    const asrPayload: Record<string, unknown> = {
      semanticPunctuationEnabled: a.semanticPunctuationEnabled,
      multiThresholdModeEnabled: a.multiThresholdModeEnabled,
      disfluencyRemovalEnabled: a.disfluencyRemovalEnabled,
      punctuationPredictionEnabled: a.punctuationPredictionEnabled,
      inverseTextNormalizationEnabled: a.inverseTextNormalizationEnabled
    }
    if (a.maxSentenceSilence !== null) asrPayload.maxSentenceSilence = a.maxSentenceSilence
    if (a.speechNoiseThreshold !== null) asrPayload.speechNoiseThreshold = a.speechNoiseThreshold
    if (a.vocabularyId.trim()) asrPayload.vocabularyId = a.vocabularyId.trim()
    form.value.asrParams = JSON.stringify(asrPayload)
    form.value.sttParams = null
  } else if (form.value.type === 4) {
    const s = sttParamsForm.value
    const sttPayload: Record<string, unknown> = {
      enableItn: s.enableItn,
      enableWords: s.enableWords,
      diarizationEnabled: s.diarizationEnabled,
      disfluencyRemovalEnabled: s.disfluencyRemovalEnabled,
      timestampAlignmentEnabled: s.timestampAlignmentEnabled
    }
    if (s.speakerCount !== null) sttPayload.speakerCount = s.speakerCount
    if (s.vocabularyId.trim()) sttPayload.vocabularyId = s.vocabularyId.trim()
    form.value.sttParams = JSON.stringify(sttPayload)
    form.value.asrParams = null
  } else {
    form.value.asrParams = null
    form.value.sttParams = null
  }

  saving.value = true
  try {
    const payload: AiModelConfigUpdateReq = { ...form.value }

    // 过滤空的 API Key（编辑时可选）
    if (!payload.apiKey) delete payload.apiKey

    // 过滤占位符（防止占位符被保存到数据库）
    if (payload.apiKey === '__USE_EXISTING__') delete payload.apiKey

    const res = isEdit.value
      ? await aiApi.modelConfigUpdate(props.editId!, payload)
      : await aiApi.modelConfigCreate(payload)

    if (res.data?.code === 200) {
      message.success(isEdit.value ? '更新成功' : '添加成功')
      emit('saved')
    } else {
      message.error(res.data?.msg ?? '操作失败')
    }
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.param-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.param-help {
  color: var(--text-color-3, rgba(255, 255, 255, 0.3));
  cursor: help;
  transition: color 0.15s;

  &:hover {
    color: var(--primary-color, #6366f1);
  }
}
</style>
