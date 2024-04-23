<template>
  <div>
    <div class="wf-tool-bar-container">
      <n-card class="wf-tool-bar" content-style="padding: 15px" hoverable>
        <n-button-group>
          <n-button @click="test">Print Data</n-button>
          <n-button @click="containerZoomIn">+</n-button>
          <n-button @click="containerZoomOut">-</n-button>
        </n-button-group>
      </n-card>
    </div>
    <vue-draggable-resizable w="auto" h="auto" style="z-index: 1">
      <n-el tag="div" class="wf-container" :style="'transform: scale(' + scale + ')'">
        <NodeTree />
      </n-el>
    </vue-draggable-resizable>
  </div>
</template>
<script setup>
import { renderNode } from '@/components/workflow/util/workflow.js'
import { NEl } from 'naive-ui'
import { defineComponent, ref, reactive } from 'vue'
import VueDraggableResizable from 'vue-draggable-resizable'
// const $props = defineProps({
// model: { type: Object, required: true }
// })

// const flowDataJson =
//   '{"id":"root","name":"root节点","desc":"root节点...","type":"root","props":null,"parentId":null,"parentType":null,"branches":null,"children":{"id":"shenpi1","name":"审批1","desc":"审批1...","type":"approval","props":null,"parentId":"root","parentType":null,"branches":null,"children":{"id":"banli1","name":"办理1","desc":"办理1...","type":"task","props":null,"parentId":"shenpi1","parentType":null,"branches":null,"children":{"id":"tiaojian-start","name":"条件组1开始","desc":"条件组1开始...","type":"conditions","props":null,"parentId":"banli1","parentType":null,"branches":[{"id":"tiaojian1","name":"条件1","desc":"条件1...","type":"condition","props":null,"parentId":"tiaojian-start","parentType":null,"branches":null,"children":{"id":"shenpi2","name":"审批2","desc":"审批2...","type":"approval","props":null,"parentId":"tiaojian1","parentType":null,"branches":null,"children":{"id":"banli2","name":"办理2","desc":"办理2...","type":"task","props":null,"parentId":"shenpi2","parentType":null,"branches":null,"children":null}}},{"id":"tiaojian2","name":"条件2","desc":"条件2...","type":"condition","props":null,"parentId":"tiaojian-start","parentType":null,"branches":null,"children":null}],"children":{"id":"tiaojian-end","name":"条件组1结束","desc":"条件组1结束...","type":"empty","props":null,"parentId":"banli1","parentType":null,"branches":null,"children":{"id":"chaosong1","name":"抄送1","desc":"抄送1...","type":"cc","props":null,"parentId":"tiaojian-end","parentType":null,"branches":null,"children":null}}}}}}'
const flowDataJson = '{"id":"root","name":"root节点","desc":"root节点...","type":"root","props":null,"parentId":null,"parentType":null,"branches":null,"children":{"id":"node-ezpjrwwzu3p","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"root","parentType":"root","branches":null,"children":{"id":"node-ghglmwjxjs6","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"node-ezpjrwwzu3p","parentType":"approval","branches":null,"children":{"id":"node-ezy9y4mq9g4-start","name":"新conditions","desc":"新conditions...","type":"conditions","props":null,"parentId":"node-ghglmwjxjs6","parentType":"task","branches":[{"id":"node-5nolh6sdd3m","name":"新条件0","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]},"parentId":"node-ezy9y4mq9g4-start","parentType":"conditions","branches":null,"children":{"id":"node-589hedeokvr","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"node-5nolh6sdd3m","parentType":"condition","branches":null,"children":{"id":"node-3fjbt80q0hm","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-589hedeokvr","parentType":"approval","branches":null,"children":null}}},{"id":"node-iybaidskuas","name":"新条件1","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]},"parentId":"node-ezy9y4mq9g4-start","parentType":"conditions","branches":null,"children":{"id":"node-36sbzt32zp9","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"node-iybaidskuas","parentType":"condition","branches":null,"children":null}}],"children":{"id":"node-ezy9y4mq9g4-end","name":"新conditions","desc":"新conditions...","type":"empty","props":null,"parentId":"node-ghglmwjxjs6","parentType":"task","branches":null,"children":{"id":"node-2sr6fenl55x","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-ezy9y4mq9g4-end","parentType":"empty","branches":null,"children":null}}}}}}'

const flowData = reactive(JSON.parse(flowDataJson))

const NodeTree = defineComponent(() => {
  return () => {
    return renderNode(flowData)
  }
})

const scale = ref(1)
const containerZoomIn = () => {
  if (scale.value >= 2) {
    return
  }
  scale.value += 0.1
}
const containerZoomOut = () => {
  if (scale.value <= 0.5) {
    return
  }
  scale.value -= 0.1
}

const test = () => {
  console.log('test', flowData)
}
</script>
<style lang="scss">
.wf-tool-bar-container {
  .wf-tool-bar {
    z-index: 100;
    position: absolute;
    right: 30px;
    top: 30px;
    width: auto;
  }
}

.wf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  padding: 20px;
  user-select: none;
  -webkit-user-drag: none;

  .wf-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-wrap: wrap;

    .wf-node-main {
      // flex: 1;
      width: 300px;
      cursor: pointer;

      &:hover {
        border-color: var(--n-primary-color);
      }

      &.node-end {
        width: 100px;
        height: 30px;
        line-height: 30px;
        font-size: 14px;
        text-align: center;
        border-radius: 10px;
        background-color: var(--clear-color);
      }

      .node-header {
        padding: 3px 10px;
        height: 28px;
        border-radius: 2px 2px 0 0;
        background-color: var(--clear-color);
        color: var(--text-color-1);

        &.node-approval {
          background-color: var(--primary-color-suppl);
        }

        &.node-task {
          background-color: var(--warning-color-suppl);
        }

        &.node-cc {
          background-color: var(--info-color-suppl);
        }

        .node-header-content {
          font-size: 14px;
          line-height: 14px;
          display: flex;
          align-items: stretch;

          .n-icon {
            margin-right: 5px;
          }
        }
      }

      .node-content {
        padding: 20px;
        font-size: 16px;
        color: var(--n-text-color);
        min-height: 60px;

        .node-body-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .n-icon {
            margin-right: 5px;
          }
        }
      }
    }
    .wf-node-footer {
      width: 34px;
      margin: 0 auto;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
        margin: auto;
        width: 2px;
        height: 100%;
        background-color: var(--n-text-color);
        opacity: 0.1;
      }

      .wf-node-btn {
        z-index: 1;
        margin: 20px auto;
      }
    }
  }

  .wf-node-branch {
    position: relative;

    .wf-node-footer {
      // 覆盖wf-node下的footer样式
      &::before {
        opacity: 0;
      }
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      margin: auto;
      width: 2px;
      height: 100%;
      background-color: var(--n-text-color);
      opacity: 0.1;
    }
  }

  .wf-node-condition {
    overflow-x: auto;

    .wf-node-condition-main {
      width: 300px;
      margin: 10px 0;
    }
  }

  .branches-card {
    &:hover {
      border-color: var(--n-primary-color);
    }

    .branches-card-content {
      padding: 20px 36px 0 36px;
    }
  }
}
</style>
