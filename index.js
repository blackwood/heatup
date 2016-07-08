'use strict'

;(function() {
  let DEV = false,
      DISMISSED = false,
      component,
      od

  let dismiss = (e) => {
    component.classList = 'animated slideOutDown'
    DISMISSED = true
  }

  let serialize = (obj) => Object.keys(obj)
    .map(k => k + '=' + encodeURIComponent(obj[k])).join('&')

  let init = () => {
    if (component) return
  
    let instance = document.createElement('div')

    instance.id = 'heatup'
    instance.className = 'animated initial'
    instance.innerHTML = `
      <div class="inner">
        <div class="segment">
          <div class="animated pulse infinite circle-bolt">
            <div class="bolt"></div>
          </div>
        </div>
        <div class="segment"><div id="people-target" class="people"></div></div>
        <div class="segment">
          <div class="figure">people are currently reading this article</div>
        </div>
        <div class="segment last"><div id="close-target"></div></div>
      </div>`

    component = document.body.appendChild(instance)
    
    document.getElementById('close-target')
      .addEventListener('click', dismiss)

    od = new Odometer({
      el: document.getElementById('people-target'),
      duration: 2000
    })
  }

  let render = function({ pages }) {
    let match = pages.map((p) => {
      return { 'path': p.path, 'people': p.stats.people }
    })
    .filter((p) => {
      return p.path !== 'bostonglobe.com/' && location.href.indexOf(p.path) > -1
    })[0] || false
    
    component.classList = match ? 'animated slideInUp' : 'initial'
    if (match) od.update(match.people)
  }

  chrome.storage.sync.get('apikey', function main({ apikey }) {
    if (typeof apikey !== 'string' || apikey.length === 0) {
      console.error(`Not a valid apikey. See extension settings.`)
      return
    }

    init()

    const query = {
      apikey,
      'host': 'bostonglobe.com'
    }

    setTimeout(function fetchData() {
      if (DISMISSED) return
      fetch(`http://api.chartbeat.com/live/toppages/v3/?${serialize(query)}`)
        .then(r => r.json())
        .then(data => render(data))
        .then(success => {
          setTimeout(fetchData, success ? (DEV ? 100000 : 6000) : 20000)
        })
        .catch(e => console.warn(`Something's wrong with the Chartbeat API.`))
    }, 5500)
  })
})()
