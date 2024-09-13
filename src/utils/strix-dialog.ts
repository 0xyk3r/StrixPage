let dialog: any = null

export const initStrixDialog = (naiveDialog: any) => {
  if (!dialog && naiveDialog) {
    dialog = naiveDialog
  }
}

export const createStrixDialog = (
  type: string,
  title: string,
  content: string,
  duration: number
) => {
  if (dialog) {
    dialog[type]({
      title: title || '提示',
      content: content || '发生错误',
      duration: duration ?? 3000
    })
  }
}
