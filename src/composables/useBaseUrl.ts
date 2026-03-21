export const useBaseURL = () => {
  return import.meta.env.PROD ? '/api/' : '/api/'
}
