<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ funName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按配置 ID 搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="filterDataList" :row-key="dataRowKey"
      :pagination="dataPagination" :expanded-row-keys="dataExpandedRowKeys"
      @updateExpandedRowKeys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入角色名称" clearable />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="角色名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入角色名称" clearable />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>

  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { createStrixNotify } from '@/utils/strix-notify'
import { Icon } from '@iconify/vue'
import _ from 'lodash'
import { NButton, NDataTable, NDivider, NEmpty, NGi, NGrid, NPopconfirm, NScrollbar, NSpace, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { computed, h, onMounted, reactive, ref } from 'vue'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '短信服务'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  parentId: '',
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  {
    type: "expand",
    renderExpand: (row) => {
      if (!row.expandTab) row.expandTab = 'sign'
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      const expandSmsSignChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '签名', key: 'name', width: 200 },
            {
              title: '签名状态', key: 'status', width: 80, render: (row) => {
                let tagType = 'default'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagType = 'warning'
                    tagLabel = '待审核'
                    break
                  case 2:
                    tagType = 'success'
                    tagLabel = '审核通过'
                    break
                  case 3:
                    tagType = 'error'
                    tagLabel = '审核未通过'
                    break
                  case 4:
                    tagType = 'default'
                    tagLabel = '审核取消'
                    break
                  default:
                    tagType = 'default'
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            { title: '创建时间', key: 'createTime', width: 160 }
          ],
          data: row.signs,
          rowKey: (row) => row.id,
        }, null)
      ]

      const expandSmsTemplateChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '模板 Code', key: 'code', width: 140 },
            { title: '模板名称', key: 'name', width: 150 },
            {
              title: '模板类型', key: 'type', width: 100, render: (row) => {
                let tagType = 'primary'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagLabel = '验证码'
                    break
                  case 2:
                    tagLabel = '通知短信'
                    break
                  case 3:
                    tagLabel = '推广短信'
                    break
                  case 4:
                    tagLabel = '国际短信'
                    break
                  case 5:
                    tagLabel = '数字短信'
                    break
                  default:
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            {
              title: '模板状态', key: 'status', width: 100, render: (row) => {
                let tagType = 'default'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagType = 'warning'
                    tagLabel = '待审核'
                    break
                  case 2:
                    tagType = 'success'
                    tagLabel = '审核通过'
                    break
                  case 3:
                    tagType = 'error'
                    tagLabel = '审核未通过'
                    break
                  case 4:
                    tagType = 'default'
                    tagLabel = '审核取消'
                    break
                  default:
                    tagType = 'default'
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            { title: '模板内容', key: 'content' },
            { title: '创建时间', key: 'createTime', width: 160 }
          ],
          data: row.templates,
          rowKey: (row) => row.id,
        }, null)
      ]

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => { row.expandTab = value }
        },
        () => [
          h(NTabPane, { name: 'sign', tab: '短信签名', class: 'expand-sign-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 600px; padding-bottom: 10px;' }, [expandSmsSignChildrenVNode]))
          ),
          h(NTabPane, { name: 'template', tab: '短信模板', class: 'expand-template-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 1200px; padding-bottom: 10px;' }, [expandSmsTemplateChildrenVNode]))
          )
        ]
      )
    }
  },
  { key: 'id', width: 150, title: '配置 ID' },
  {
    key: 'platform',
    witdh: 100,
    title: '平台',
    render(row) {
      let tagType = 'default'
      let tagLabel = ''
      switch (row.platform) {
        case 1:
          tagType = 'warning'
          tagLabel = '阿里云'
          break
        case 2:
          tagType = 'primary'
          tagLabel = '腾讯云'
          break
      }
      return h(NTag, {
        type: tagType,
        bordered: false
      }, {
        default: () => tagLabel
      })
    }
  },
  { key: 'regionId', witdh: 100, title: '地域' },
  { key: 'accessKey', witdh: 150, title: 'AccessKey' },
  { key: 'createTime', witdh: 150, title: '创建时间' },
  {
    title: '操作',
    width: 240,
    render(row) {
      return [
        h(NButton,
          {
            size: 'medium',
            type: 'warning',
            style: 'margin-right: 10px',
            onClick: () => showEditDataModal(row.id)
          },
          () => h(Icon, { icon: 'ion:create-outline' })
        ),
        h(NPopconfirm,
          {
            onPositiveClick: () => deleteData(row.id)
          }, {
          trigger: () => h(NButton,
            {
              size: 'medium',
              type: 'error',
              style: 'margin-right: 10px'
            },
            () => h(Icon, { icon: 'ion:trash-outline' })
          ),
          default: () => '是否确认删除这条数据? 该操作不可恢复!'
        }
        )
      ]
    }
  }
]

// 分页配置
const dataPagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
  onChange: (page) => {
    dataPagination.page = page
    getDataListParams.value.current = page
    getDataList()
  },
  onUpdatePageSize: (pageSize) => {
    dataPagination.pageSize = pageSize
    dataPagination.page = 1
    getDataListParams.value.size = pageSize
    getDataListParams.value.current = 1
    getDataList()
  }
})
// 加载列表
const dataData = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/sms', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataData.value = res.data.configs
  })
}
onMounted(getDataList)
// 本地筛选数据
const filterDataListParams = ref({
  keyword: ''
})
const filterDataList = computed(() =>
  dataData.value?.filter((d) => {
    let filterd = true
    if (filterDataListParams.value.keyword && d.name.indexOf(filterDataListParams.value.keyword) < 0) filterd = false
    return filterd
  })
)

const dataRowKey = (rowData) => rowData.id
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataList()
}
const dataExpandedRowKeys = ref([])
const dataExpandedRowKeysChange = (value) => {
  // 只获取新展开的
  const diffs = _.differenceWith(value, dataExpandedRowKeys.value, _.isEqual);
  dataExpandedRowKeys.value = value
  diffs.forEach(diff => {
    const row = _.find(dataData.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/sms/${row.id}`).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('error', `获取${funName}的详细信息失败`, res.msg)
        }
        row.signs = res.data.signs
        row.templates = res.data.templates
        row.loaded = true
      })
    }
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    name: ''
  }
  editDataId = ''
  editDataForm.value = {
    name: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  name: ''
})
const addDataRules = {
  name: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 12,
      message: '角色名称昵称长度需在2-12之间',
      trigger: 'blur'
    }
  ]
}
const showAddDataModal = (id) => {
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post('system/role/update', addDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `添加${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `添加${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  name: ''
})
const editDataRules = {
  name: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 12,
      message: '角色名称长度需在2-12之间',
      trigger: 'blur'
    }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/sms/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    const canUpdateFields = []
    _.forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post(`system/sms/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `修改${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `修改${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/sms/remove/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `删除${funName}失败`, res.msg)
    }
    createStrixNotify('success', '提示信息', `删除${funName}成功`)
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemModuleSmsIndex'
}
</script>

<style lang="scss" scoped>
::v-deep(.expand-menu-pane) {
  .n-grid:not(:last-child) {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .n-grid {
    align-items: center;
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
