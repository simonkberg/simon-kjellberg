// @flow strict
import * as React from 'react'

const useNetworkStatus = (
  initialValue?: boolean = typeof navigator !== 'undefined'
    ? navigator.onLine
    : true
) => {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    const onOnline = () => setValue(true)
    const onOffline = () => setValue(false)

    window.addEventListener('online', onOnline, false)
    window.addEventListener('offline', onOffline, false)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return value
}

export default useNetworkStatus
