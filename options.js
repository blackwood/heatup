function save_options() {
  var apikey = document.getElementById('apikey').value
  chrome.storage.sync.set({ apikey }, () => {
    var status = document.getElementById('status')
    status.textContent = 'Options saved.'
    setTimeout(() => {
      status.textContent = ''
    }, 1000)
  })
}

function restore_options() {
  chrome.storage.sync.get({
    apikey: ''
  }, (items) => {
    document.getElementById('apikey').value = items.apikey
  })
}

document.addEventListener('DOMContentLoaded', restore_options)
document.getElementById('save').addEventListener('click', save_options)