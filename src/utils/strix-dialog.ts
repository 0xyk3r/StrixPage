import { type DialogApiInjection } from 'naive-ui/es/dialog/src/DialogProvider'

let dialog: DialogApiInjection | null = null

export const initStrixDialog = (naiveDialog: DialogApiInjection) => {
  if (!dialog && naiveDialog) {
    dialog = naiveDialog
  }
}

export const createStrixDialog = (type: string, title: string, content: string, duration: number) => {
  if (dialog) {
    const fn = (dialog as unknown as Record<string, (opts: Record<string, any>) => void>)[type]
    fn?.({
      title: title || '提示',
      content: content || '发生错误',
      duration: duration ?? 3000
    })
  }
}
