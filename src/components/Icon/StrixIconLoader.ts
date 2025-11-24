import { defineAsyncComponent } from 'vue'

const iconCache: Record<string, any> = {}

export function getLucideComponent(name: string) {
  if (iconCache[name]) return iconCache[name]

  const comp = defineAsyncComponent(async () => {
    try {
      const module = (await import('lucide-vue-next')) as any
      return module[name] || module.FileQuestion
    } catch {
      console.warn(`Icon ${name} not found, using fallback`)
      const { FileQuestion } = await import('lucide-vue-next')
      return FileQuestion
    }
  })

  iconCache[name] = comp
  return comp
}
