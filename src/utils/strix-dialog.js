let dialog = null

export const initStrixDialog = (naiveDialog) => {
  if (dialog == null && naiveDialog != null) {
    dialog = naiveDialog
  }
}

export const createStrixDialog = (type, title, content, duration) => {
  if (dialog != null) {
    dialog[type]({
      title: title || null,
      content: content || '发生错误',
      duration: duration || 3000
    })
  }
}
