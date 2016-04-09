import React, { Component, PropTypes } from 'react'
import { PropTypes as RouterProps } from 'react-router'
import getDisplayName from './getDisplayName'
import AppStore from 'stores/AppStore'

export default function withUrl (ComposedComponent) {
  return class WithUrl extends Component {
    static displayName = `WithUrl(${getDisplayName(ComposedComponent)})`;
    static ComposedComponent = ComposedComponent;

    static contextTypes = {
      router: PropTypes.object
    }

    static propTypes = {
      location: RouterProps.location
    }

    constructor (props) {
      super(props)

      this.state = AppStore.getState()
    }

    componentWillMount () {
      const { props, context } = this

      this._setUrl(props, context)
    }

    componentDidMount () {
      AppStore.listen(this._onChange)
    }

    componentWillUnmount () {
      AppStore.unlisten(this._onChange)
    }

    componentWillReceiveProps (props, context) {
      this._setUrl(props, context)
    }

    _onChange = (state) => {
      this.setState(state)
    }

    _setUrl = (props, context) => {
      const { router } = context
      const { location } = props
      const { baseUrl } = this.state

      this.setState({
        url: baseUrl + router.createHref(location)
      })
    }

    render () {
      return <ComposedComponent {...this.state} {...this.props} />
    }
  }
}
