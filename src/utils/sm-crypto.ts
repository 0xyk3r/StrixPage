/**
 * SM 加密工具（统一出口）
 *
 * 所有加密函数已迁移至 ./crypto.ts，此文件保留导出以兼容现有引用。
 */
export { bytesToHex, encrypt as enc, generateRandomHex, hexToBytes } from '@/utils/crypto'
