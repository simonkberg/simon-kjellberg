// @flow strict
import * as React from 'react'
import nextTick from '../utils/nextTick'

const useScrollPreserver = () => {
  const ref = React.useRef<HTMLElement>()

  React.useLayoutEffect(() => {
    const el = ref.current

    if (el != null) {
      const { scrollTop, scrollHeight, clientHeight } = el

      if (scrollTop < scrollHeight - clientHeight) {
        nextTick(() => {
          el.scrollTop = el.scrollHeight - scrollTop
        })
      } else {
        nextTick(() => {
          el.scrollTop = el.scrollHeight
        })
      }
    }
  })

  return ref
}

export default useScrollPreserver
