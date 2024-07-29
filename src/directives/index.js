import hasRole from './permission/hasRole'
import hasPerm from './permission/hasPerm'

const install = function (Vue) {
  Vue.directive('hasRole', hasRole)
  Vue.directive('hasPerm', hasPerm)
}

export default install
