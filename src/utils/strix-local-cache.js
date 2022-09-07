import _ from 'lodash'

export default (app) => {
  app.config.globalProperties.$localCache = {
    put: function (group, key, value) {
      const groupData = this.getGroup(group)
      groupData[key] = value
      window.localStorage.setItem(group, JSON.stringify(groupData))
    },
    get: function (group, key) {
      const groupData = this.getGroup(group)
      return groupData[key]
    },
    getGroup: function (group) {
      return JSON.parse(window.localStorage.getItem(group)) || {}
    },
    remove: function (group, key) {
      const groupData = _.map(this.getGroup(group), o => _.omit(o, [key]))
      window.localStorage.setItem(group, JSON.stringify(groupData))
    },
    removeGroup: function (group) {
      window.localStorage.removeItem(group)
    }
  }
}
