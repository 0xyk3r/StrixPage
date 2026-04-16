/**
 * 从数据库生成 TypeScript 字典类型定义
 *
 * 用法: pnpm dict:types
 *
 * 生成文件: src/types/dict-generated.d.ts
 * - 每个字典生成一个 union type (值类型)
 * - 每个字典生成一个 label map 类型
 * - 导出字典 key 的 union type
 */

import mysql from 'mysql2/promise'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_CONFIG = {
  host: '192.168.31.99',
  port: 3306,
  user: 'root',
  password: 'AnAn@8899#',
  database: 'strix',
}

const OUTPUT_FILE = resolve(__dirname, '../src/types/dict-generated.d.ts')

interface DictRow {
  key: string
  name: string
  data_type: number
}

interface DictDataRow {
  key: string
  value: string
  label: string
  sort: number
}

const DATA_TYPE_MAP: Record<number, string> = {
  1: 'string', // STRING
  2: 'number', // INTEGER
  3: 'number', // LONG
  4: 'number', // FLOAT
  5: 'number', // DOUBLE
  6: 'boolean', // BOOLEAN
  7: 'number', // BYTE
  8: 'number', // SHORT
  9: 'string', // DATE
  10: 'string', // JSON
  11: 'string', // ENUM_SET
}

async function main() {
  console.log('连接数据库...')
  const conn = await mysql.createConnection(DB_CONFIG)

  try {
    // 查询所有启用的字典
    const [dicts] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT `key`, name, data_type FROM sys_dict WHERE deleted_status = 0 AND status = 1 ORDER BY `key`',
    )

    if (!dicts.length) {
      console.log('未找到字典，跳过生成')
      return
    }

    // 查询所有字典数据
    const [dictData] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT `key`, value, label, sort FROM sys_dict_data WHERE deleted_status = 0 AND status = 1 ORDER BY `key`, sort',
    )

    // 按 key 分组
    const dataMap = new Map<string, DictDataRow[]>()
    for (const row of dictData as DictDataRow[]) {
      if (!dataMap.has(row.key)) {
        dataMap.set(row.key, [])
      }
      dataMap.get(row.key)!.push(row)
    }

    // 生成类型定义
    const lines: string[] = [
      '/**',
      ' * 字典类型定义 (自动生成，请勿手动修改)',
      ` * 生成时间: ${new Date().toISOString()}`,
      ` * 字典数量: ${dicts.length}`,
      ' */',
      '',
      '/* eslint-disable */',
      '',
    ]

    const dictKeys: string[] = []

    for (const dict of dicts as DictRow[]) {
      const items = dataMap.get(dict.key)
      if (!items?.length) continue

      dictKeys.push(dict.key)
      const tsType = DATA_TYPE_MAP[dict.data_type] ?? 'string'

      lines.push(`/** ${dict.name} */`)

      if (tsType === 'string') {
        const values = items.map((i) => `'${i.value.replace(/'/g, "\\'")}'`).join(' | ')
        lines.push(`export type ${dict.key}Value = ${values}`)
      } else if (tsType === 'number') {
        const values = items.map((i) => i.value).join(' | ')
        lines.push(`export type ${dict.key}Value = ${values}`)
      } else {
        lines.push(`export type ${dict.key}Value = ${tsType}`)
      }

      // Label map
      const labelEntries = items.map((i) => {
        const key = tsType === 'string' ? `'${i.value}'` : i.value
        return `  ${key}: '${i.label.replace(/'/g, "\\'")}'`
      })
      lines.push(`export type ${dict.key}LabelMap = {`)
      lines.push(labelEntries.join('\n'))
      lines.push('}')
      lines.push('')
    }

    // Dict key union
    lines.push('/** 所有字典 key */')
    lines.push(`export type DictKey = ${dictKeys.map((k) => `'${k}'`).join(' | ')}`)
    lines.push('')

    // 确保目录存在
    mkdirSync(dirname(OUTPUT_FILE), { recursive: true })
    writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8')

    console.log(`生成完成: ${dictKeys.length} 个字典类型 → ${OUTPUT_FILE}`)
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('生成失败:', err)
  process.exit(1)
})
