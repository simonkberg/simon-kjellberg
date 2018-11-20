// @flow strict
import * as React from 'react'
import nextTick from '../utils/nextTick'

const useScrollPreserver = () => {
  const ref = (React: $FlowFixMe).useRef()

  ;(React: $FlowFixMe).useLayoutEffect(() => {
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
