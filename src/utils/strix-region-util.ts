import type { RetResult } from '@/api/types'
import { http } from '@/plugins/axios'
import { callOnce } from './strix-cache-call'

/**
 * 地区数据项
 */
export interface RegionItem {
  /** 地区ID */
  id: string
  /** 地区名称 */
  name: string
}

/**
 * Naive UI 下拉框选项格式
 */
export interface RegionSelectOption {
  label: string
  value: string
}

// 地区数据缓存（模块级，应用生命周期内有效）
let regionCache: RegionItem[] | null = null

/**
 * 获取地区列表
 * @returns 地区列表
 */
export async function getRegionList(): Promise<RegionItem[]> {
  if (regionCache) {
    return regionCache
  }

  const fetchRegions = async () => {
    const { data: res } = await http.get<RetResult<{ items: RegionItem[] }>>('zjjg/common/region', {
      meta: { operate: '获取地区列表', notify: false }
    })
    return res.data?.items || []
  }

  const regions = await callOnce(fetchRegions)
  regionCache = regions
  return regions
}

/**
 * 通过ID获取地区名称
 * @param id 地区ID
 * @returns 地区名称，未找到返回空字符串
 */
export async function getRegionNameById(id: string): Promise<string> {
  if (!id) {
    return ''
  }

  const regions = await getRegionList()
  const region = regions.find((item) => item.id === id)
  return region?.name || ''
}

/**
 * 批量获取地区名称
 * @param ids 地区ID数组
 * @returns 地区名称数组
 */
export async function getRegionNamesByIds(ids: string[]): Promise<string[]> {
  if (!ids || ids.length === 0) {
    return []
  }

  const regions = await getRegionList()
  const regionMap = new Map(regions.map((item) => [item.id, item.name]))
  return ids.map((id) => regionMap.get(id) || '')
}

/**
 * 转换地区列表为 Naive UI 下拉框选项格式
 * @param regions 地区列表，不传则使用完整地区列表
 * @returns Naive UI 选项数组
 */
export async function convertToRegionOptions(regions?: RegionItem[]): Promise<RegionSelectOption[]> {
  const regionList = regions || (await getRegionList())
  return regionList.map((item) => ({
    label: item.name,
    value: item.id
  }))
}

/**
 * 根据名称搜索地区
 * @param keyword 搜索关键词
 * @returns 匹配的地区列表
 */
export async function searchRegionsByName(keyword: string): Promise<RegionItem[]> {
  if (!keyword) {
    return []
  }

  const regions = await getRegionList()
  const lowerKeyword = keyword.toLowerCase()
  return regions.filter((item) => item.name.toLowerCase().includes(lowerKeyword))
}

/**
 * 转换搜索结果为 Naive UI 选项格式
 * @param keyword 搜索关键词
 * @returns Naive UI 选项数组
 */
export async function searchRegionOptions(keyword: string): Promise<RegionSelectOption[]> {
  const searchResults = await searchRegionsByName(keyword)
  return convertToRegionOptions(searchResults)
}

/**
 * 通过ID列表过滤地区
 * @param ids 要过滤的ID数组
 * @returns 过滤后的地区列表
 */
export async function getRegionsByIds(ids: string[]): Promise<RegionItem[]> {
  if (!ids || ids.length === 0) {
    return []
  }

  const regions = await getRegionList()
  const idSet = new Set(ids)
  return regions.filter((item) => idSet.has(item.id))
}

/**
 * 刷新地区缓存
 * 强制重新从服务器获取最新数据
 */
export async function refreshRegionCache(): Promise<RegionItem[]> {
  regionCache = null
  return getRegionList()
}

/**
 * 创建地区ID到名称的映射表
 * 用于批量转换时提升性能
 * @returns Map<id, name>
 */
export async function createRegionIdNameMap(): Promise<Map<string, string>> {
  const regions = await getRegionList()
  return new Map(regions.map((item) => [item.id, item.name]))
}
