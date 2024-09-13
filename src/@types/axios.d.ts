import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    meta?: {
      requestGroup?: string
      requestId?: string
      operate?: string
      notify?: boolean
    }
  }
}
