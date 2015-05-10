'use strict';

((domready, document) => {
  const Arr = [];

  function onReady() {
    Arr.forEach.call(
      document.querySelectorAll('.js-monotalic'),
      monotalic
    );
  }

  function monotalic($el) {
    let text = $el.innerText || $el.textContent;

    $el.innerHTML = '';

    text.split('\n').forEach(row => {
      row.split('').forEach(char => {
        let $span = document.createElement('SPAN'),
            transform = 'skewX(-15deg)';

        $span.innerHTML = char;
        $span.style.display = 'inline-block';
        $span.style.webkitTransform = transform;
        $span.style.msTransform = transform;
        $span.style.transform = transform;

        $el.appendChild($span);
      });

      $el.appendChild(document.createElement('br'));
    });
  }

  try {
    domready(onReady);
  } catch (e) {
    alert('Your browser does not support this experiment');
  }

})(domready, document);
