
export const SET_BASE_URL = 'SET_BASE_URL'

export function setBaseUrl (baseUrl) {
  return {
    type: SET_BASE_URL,
    baseUrl,
  }
}
