import domready from 'domready'

class Italicize {
  constructor (selector = '.monotalic') {
    this.selector = selector

    domready(this.onReady.bind(this))
  }

  onReady () {
    Array.prototype.forEach.call(
      document.querySelectorAll(this.selector),
      this.transform
    )
  }

  transform ($el) {
    let text = $el.innerText || $el.textContent

    $el.innerHTML = ''

    text.split('\n').forEach(row => {
      row.split('').forEach(char => {
        let $span = document.createElement('span')
        let transform = 'skewX(-15deg)'

        $span.innerHTML = char
        $span.style.display = 'inline-block'
        $span.style.webkitTransform = transform
        $span.style.msTransform = transform
        $span.style.transform = transform

        $el.appendChild($span)
      })

      $el.appendChild(document.createElement('br'))
    })
  }
}

export default global.Italicize = Italicize
