import http from './../utils/axios'

// 获取验证图片 以及token
export function reqGet(data) {
  return http({
    url: '/captcha/get',
    method: 'post',
    data
  })
}

// 滑动或点选验证
export function reqCheck(data) {
  return http({
    url: '/captcha/check',
    method: 'post',
    data
  })
}
