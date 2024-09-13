import type { LoadingBarApiInjection } from 'naive-ui/es/loading-bar/src/LoadingBarProvider'
export type LoadingBarState = 'start' | 'finish' | 'error'

let loadingBar: LoadingBarApiInjection | null = null

export const initStrixLoadingBar = (naiveLoadingBar: LoadingBarApiInjection) => {
  if (!loadingBar && naiveLoadingBar) {
    loadingBar = naiveLoadingBar
  }
}

export const controlStrixLoadingBar = (state: LoadingBarState): void => {
  if (loadingBar != null) {
    if (state === 'start' || state === 'finish' || state === 'error') {
      loadingBar[state]()
    }
  }
}
