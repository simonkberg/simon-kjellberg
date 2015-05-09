(function(domready, document) {
  var Arr = [];

  function onReady() {
    Arr.forEach.call(
      document.querySelectorAll('.js-monotalic'),
      monotalic
    );
  }

  function monotalic($el) {
    var text = $el.innerText || $el.textContent;

    $el.innerHTML = '';

    text.split("\n").forEach(function(row) {
      row.split('').forEach(function(char) {
        var $span = document.createElement('SPAN');

        $span.innerHTML = char;
        $span.style.display = 'inline-block';

        var transform = 'skewX(-15deg)';

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
  } catch(e) {
    alert('Your browser does not support this experiment');
  }

})(domready, document);
