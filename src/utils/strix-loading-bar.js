let loadingBar = null

export const initStrixLoadingBar = (naiveLoadingBar) => {
  if (loadingBar == null && naiveLoadingBar != null) {
    loadingBar = naiveLoadingBar
  }
}

export const controlStrixLoadingBar = (type) => {
  if (loadingBar != null) {
    if (type === 'start' || type === 'finish' || type === 'error') {
      loadingBar[type]()
    }
  }
}
