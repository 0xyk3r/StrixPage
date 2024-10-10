<template>
  <div style="position: relative">
    <div
      v-if="type === '2'"
      :style="{ height: parseInt(setSize.imgHeight) + vSpace + 'px' }"
      class="verify-img-out"
    >
      <div :style="{ width: setSize.imgWidth, height: setSize.imgHeight }" class="verify-img-panel">
        <img
          :src="'data:image/png;base64,' + backImgBase"
          alt=""
          style="width: 100%; height: 100%; display: block"
        />
        <div v-show="showRefresh" class="verify-refresh" @click="refresh">
          <Icon :width="28" color="#000" icon="ion-refresh" />
        </div>
        <transition name="tips">
          <span v-if="tipWords" :class="passFlag ? 'suc-bg' : 'err-bg'" class="verify-tips">
            {{ tipWords }}
          </span>
        </transition>
      </div>
    </div>
    <!-- 公共部分 -->
    <div
      :style="{
        width: setSize.imgWidth,
        height: barSize.height,
        lineHeight: barSize.height
      }"
      class="verify-bar-area"
    >
      <span class="verify-msg" v-text="text"></span>
      <div
        :style="{
          width: leftBarWidth !== '' ? leftBarWidth : barSize.height,
          height: barSize.height,
          borderColor: leftBarBorderColor,
          transition: transitionWidth
        }"
        class="verify-left-bar"
      >
        <span class="verify-msg" v-text="finishText"></span>
        <div
          :style="{
            width: barSize.height,
            height: barSize.height,
            backgroundColor: moveBlockBackgroundColor,
            left: moveBlockLeft,
            transition: transitionLeft
          }"
          class="verify-move-block"
          @mousedown="start"
          @touchstart="start"
        >
          <Icon :icon="iconClass" :width="40" color="#000" />
          <div
            v-if="type === '2'"
            :style="{
              width: Math.floor((parseInt(setSize.imgWidth) * 47) / 310) + 'px',
              height: setSize.imgHeight,
              top: '-' + (parseInt(setSize.imgHeight) + vSpace) + 'px',
              backgroundSize: setSize.imgWidth + ' ' + setSize.imgHeight
            }"
            class="verify-sub-block"
          >
            <img
              :src="'data:image/png;base64,' + blockBackImgBase"
              alt=""
              style="width: 100%; height: 100%; display: block; -webkit-user-drag: none"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { http } from '@/plugins/axios'
import { type ComponentInternalInstance } from 'vue'
import { aesEncrypt } from '../utils/ase'
import { resetSize } from './../utils/util'
import { Icon } from '@iconify/vue'

export default {
  name: 'VerifySlide',
  components: {
    Icon
  },
  props: {
    type: {
      type: String,
      default: '1'
    },
    // 弹出式pop，固定fixed
    mode: {
      type: String,
      default: 'fixed'
    },
    vSpace: {
      type: Number,
      default: 5
    },
    explain: {
      type: String,
      default: '滑动拼图至正确位置完成验证'
    },
    imgSize: {
      type: Object,
      default() {
        return {
          width: '310px',
          height: '155px'
        }
      }
    },
    blockSize: {
      type: Object,
      default() {
        return {
          width: '50px',
          height: '50px'
        }
      }
    },
    barSize: {
      type: Object,
      default() {
        return {
          width: '310px',
          height: '40px'
        }
      }
    }
  },
  setup(props) {
    const captchaType = ref('blockPuzzle')
    const { mode, type, blockSize, explain } = toRefs(props)
    const { proxy } = getCurrentInstance() as ComponentInternalInstance
    let secretKey = ref(''), //后端返回的ase加密秘钥
      passFlag = ref(false), //是否通过的标识
      backImgBase = ref(''), //验证码背景图片
      blockBackImgBase = ref(''), //验证滑块的背景图片
      backToken = ref(''), //后端返回的唯一token值
      startMoveTime = ref(0), //移动开始的时间
      endMovetime = ref(0), //移动结束的时间
      tipsBackColor = ref(''), //提示词的背景颜色
      tipWords = ref(''),
      text = ref(''),
      finishText = ref(''),
      setSize = reactive({
        imgHeight: '0',
        imgWidth: '0',
        barHeight: '0',
        barWidth: '0'
      }),
      top = ref(0),
      left = ref(0),
      moveBlockLeft = ref(''),
      leftBarWidth = ref(''),
      // 移动中样式
      moveBlockBackgroundColor = ref(''),
      leftBarBorderColor = ref('#ddd'),
      iconColor = ref(''),
      iconClass = ref('ion:arrow-forward-outline'),
      status = ref(false), //鼠标状态
      isEnd = ref(false), //是够验证完成
      showRefresh = ref(true),
      transitionLeft = ref(''),
      transitionWidth = ref(''),
      startLeft = ref(0)

    const barArea = computed(() => {
      return proxy?.$el.querySelector('.verify-bar-area')
    })

    function init() {
      text.value = explain.value
      getPictrue()
      nextTick(() => {
        let { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy)
        setSize.imgHeight = imgHeight
        setSize.imgWidth = imgWidth
        setSize.barHeight = barHeight
        setSize.barWidth = barWidth
        proxy?.$parent?.$emit('ready', proxy)
      })

      window.removeEventListener('touchmove', function (e) {
        move(e)
      })
      window.removeEventListener('mousemove', function (e) {
        move(e)
      })

      //鼠标松开
      window.removeEventListener('touchend', function () {
        end()
      })
      window.removeEventListener('mouseup', function () {
        end()
      })

      window.addEventListener('touchmove', function (e) {
        move(e)
      })
      window.addEventListener('mousemove', function (e) {
        move(e)
      })

      //鼠标松开
      window.addEventListener('touchend', function () {
        end()
      })
      window.addEventListener('mouseup', function () {
        end()
      })
    }

    watch(type, () => {
      init()
    })
    onMounted(() => {
      // 禁止拖拽
      init()
      if (proxy) {
        proxy.$el.onselectstart = function () {
          return false
        }
      }
    })

    // 鼠标按下
    function start(e: any) {
      e = e || window.event
      let x
      if (!e.touches) {
        //兼容PC端
        x = e.clientX
      } else {
        //兼容移动端
        x = e.touches[0].pageX
      }
      startLeft.value = Math.floor(x - barArea.value.getBoundingClientRect().left)
      startMoveTime.value = +new Date() //开始滑动的时间
      if (isEnd.value == false) {
        text.value = ''
        moveBlockBackgroundColor.value = '#337ab7'
        leftBarBorderColor.value = '#337AB7'
        iconColor.value = '#fff'
        e.stopPropagation()
        status.value = true
      }
    }

    // 鼠标移动
    function move(e: any) {
      e = e || window.event
      if (status.value && isEnd.value == false) {
        let x
        if (!e.touches) {
          // 兼容PC端
          x = e.clientX
        } else {
          // 兼容移动端
          x = e.touches[0].pageX
        }
        const bar_area_left = barArea.value.getBoundingClientRect().left
        let move_block_left = x - bar_area_left // 小方块相对于父元素的left值
        if (move_block_left >= barArea.value.offsetWidth - (blockSize.value.width / 2 - 2)) {
          move_block_left = barArea.value.offsetWidth - (blockSize.value.width / 2 - 2)
        }
        if (move_block_left <= 0) {
          move_block_left = blockSize.value.width / 2
        }
        // 拖动后小方块的left值
        moveBlockLeft.value = move_block_left - startLeft.value + 'px'
        leftBarWidth.value = move_block_left - startLeft.value + 'px'
      }
    }

    // 鼠标松开
    function end() {
      endMovetime.value = +new Date()
      // 判断是否重合
      if (status.value && isEnd.value == false) {
        let moveLeftDistance = parseInt((moveBlockLeft.value || '').replace('px', ''))
        moveLeftDistance = (moveLeftDistance * 310) / parseInt(setSize.imgWidth)
        let data = {
          captchaType: captchaType.value,
          pointJson: secretKey.value
            ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey.value)
            : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
          token: backToken.value
        }

        http
          .post('captcha/check', data, { meta: { operate: '验证码校验', notify: false } })
          .then(({ data: res }) => {
            if (res.data.repCode == '0000') {
              moveBlockBackgroundColor.value = '#5cb85c'
              leftBarBorderColor.value = '#5cb85c'
              iconColor.value = '#fff'
              iconClass.value = 'ion:checkmark-outline'
              showRefresh.value = false
              isEnd.value = true
              passFlag.value = true
              tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s 验证成功`
              const captchaVerification = secretKey.value
                ? aesEncrypt(
                    backToken.value + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
                    secretKey.value
                  )
                : backToken.value + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 })
              tipWords.value = ''
              proxy?.$emit('success', { captchaVerification })
            } else {
              moveBlockBackgroundColor.value = '#d9534f'
              leftBarBorderColor.value = '#d9534f'
              iconColor.value = '#fff'
              iconClass.value = 'ion:close-outline'
              passFlag.value = false
              setTimeout(function () {
                refresh()
              }, 1000)
              proxy?.$parent?.$emit('error', proxy)
              tipWords.value = '验证失败'
              setTimeout(() => {
                tipWords.value = ''
              }, 1000)
            }
          })

        status.value = false
      }
    }

    const refresh = () => {
      showRefresh.value = true
      finishText.value = ''

      transitionLeft.value = 'left .3s'
      moveBlockLeft.value = '0'

      leftBarWidth.value = ''
      transitionWidth.value = 'width .3s'

      leftBarBorderColor.value = ''
      moveBlockBackgroundColor.value = ''
      iconColor.value = '#000'
      iconClass.value = 'ion:arrow-forward-outline'
      isEnd.value = false

      getPictrue()
      setTimeout(() => {
        transitionWidth.value = ''
        transitionLeft.value = ''
        text.value = explain.value
      }, 300)
    }

    // 请求背景图片和验证图片
    function getPictrue() {
      let data = {
        captchaType: captchaType.value
      }

      http
        .post('captcha/get', data, { meta: { operate: '验证码获取', notify: false } })
        .then(({ data: res }) => {
          if (res.data.repCode == '0000') {
            backImgBase.value = res.data.repData.originalImageBase64
            blockBackImgBase.value = res.data.repData.jigsawImageBase64
            backToken.value = res.data.repData.token
            secretKey.value = res.data.repData.secretKey
          } else {
            if (res.data.repCode == '6113') {
              tipWords.value = '行为验证系统未初始化，请稍后重试'
            } else if (res.data.repCode == '6201') {
              tipWords.value = '请求次数过多，请稍后重试'
            } else if (res.data.repCode == '6202') {
              tipWords.value = '错误次数过多，请稍后重试'
            } else if (res.data.repCode == '6204') {
              tipWords.value = '验证次数过多，请稍后重试'
            } else {
              tipWords.value = res.data.repMsg
            }
          }
        })
    }

    return {
      secretKey, //后端返回的ase加密秘钥
      passFlag, //是否通过的标识
      backImgBase, //验证码背景图片
      blockBackImgBase, //验证滑块的背景图片
      backToken, //后端返回的唯一token值
      startMoveTime, //移动开始的时间
      endMovetime, //移动结束的时间
      tipsBackColor, //提示词的背景颜色
      tipWords,
      text,
      finishText,
      setSize,
      top,
      left,
      moveBlockLeft,
      leftBarWidth,
      // 移动中样式
      moveBlockBackgroundColor,
      leftBarBorderColor,
      iconColor,
      iconClass,
      status, //鼠标状态
      isEnd, //是够验证完成
      showRefresh,
      transitionLeft,
      transitionWidth,
      barArea,
      refresh,
      start
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/style/components/verify.scss';
</style>
