'use strict'

;(function() {

  const DEV = false
  let component = null
  let od = null

  let load = 1
  let dismissed = false

  let dismiss = (e) => {
    component.classList = 'animated slideOutDown'
    dismissed = true
  }

  ;(function() {
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
        <div class="segment">
          <div id="people-target" class="people">
          </div>
        </div>
        <div class="segment">
          <div class="figure">
            people are currently reading this article
          </div>
        </div>
        <div class="segment last">
          <div id="close-target"></div>
        </div>
      </div>
    `
    component = document.body.appendChild(instance)
    
    document.getElementById('close-target')
      .addEventListener('click', dismiss)

    od = new Odometer({
      el: document.getElementById('people-target'),
      value: 0,
      duration: 2000
    })

  })()

  chrome.storage.sync.get('apikey', main)

  let serialize = function(obj) {
    var str = []
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
      }
    }
    return str.join('&')
  }

  let render = function({ pages }, load) {
    let heat = pages.map((p) => {
      return { 'path': p.path, 'people': p.stats.people }
    }) 

    let match = heat.filter((p) => {
      return p.path !== 'bostonglobe.com/' && // filter out the homepage
        location.href.indexOf(p.path) > -1
    })
    
    if (match.length > 0) {
      var bolt = chrome.extension.getURL('bolt.svg')
      component.classList = 'animated slideInUp'
      od.update(match[0].people)
      return true
    }
    else {
      component.classList = 'initial'
      return false
    }
  }

  function main({ apikey }) {
    if (typeof apikey !== 'string' || apikey.length === 0) {
      console.error(`Not a valid apikey. See extension settings.`)
      return
    }

    const query = {
      apikey,
      'host': 'bostonglobe.com'
    }

    const URL = `http://api.chartbeat.com/live/toppages/v3/?${serialize(query)}`

    let fetchData = () => {
      if (dismissed) return
      fetch(URL).then(r => r.json())
        .then(data => {
          return render(data, load++)
        })
        .then(success => {
          let WAIT = success ? (DEV ? 100000 : 6000) : 20000
          setTimeout(fetchData, WAIT)
        })
        .catch(e => console.warn('Something went wrong with the chartbeat API request.'))
    }

    setTimeout(fetchData, 5500)
  }
})()