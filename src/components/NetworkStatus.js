// @flow strict
import * as React from 'react'

const NetworkStatus = React.createContext<boolean>(true)

type Props = {
  initialValue?: boolean,
  children?: React.Node,
}

type State = {
  online: boolean,
}

export class NetworkStatusProvider extends React.Component<Props, State> {
  state = {
    online:
      this.props.initialValue != null
        ? this.props.initialValue
        : typeof navigator !== 'undefined'
        ? navigator.onLine
        : true,
  }

  componentDidMount() {
    window.addEventListener('online', this.onOnline, false)
    window.addEventListener('offline', this.onOffline, false)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.onOnline)
    window.removeEventListener('offline', this.onOffline)
  }

  onOnline = () => this.setState({ online: true })
  onOffline = () => this.setState({ online: false })

  render() {
    return (
      <NetworkStatus.Provider value={this.state.online}>
        {this.props.children}
      </NetworkStatus.Provider>
    )
  }
}

export const NetworkStatusConsumer = NetworkStatus.Consumer
