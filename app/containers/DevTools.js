import React from 'react'
import { createDevTools } from 'redux-devtools'
import LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'

const dock = {
  toggleVisibilityKey: 'ctrl-h',
  changePositionKey: 'ctrl-q'
}

export default createDevTools(
  <DockMonitor {...dock}>
    <LogMonitor />
  </DockMonitor>
)
