/**
 * 缓存token
 * @param {*} res 服务端返回的数据
 */
export function setToken(res) {
  window.localStorage.setItem('strix_login_token', res.data.token)
  window.localStorage.setItem('strix_login_token_expire', res.data.tokenExpire)
  window.localStorage.setItem('strix_login_info', JSON.stringify(res.data.info))
}
