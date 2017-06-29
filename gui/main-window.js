/* eslint camelcase: 0 */
/* eslint comma-dangle: ["error", "always-multiline"] */

const yo = require('yo-yo')
const child_process = require('child_process')
const fs = require('fs')

const inBrowser = typeof document !== 'undefined'
const isMain = require.main === module
const state = {}
const el = yo`<span>loading...</span>`

if (inBrowser) {
  const app = require('electron').remote.app
  document.title = 'networking exercise'
  document.body.appendChild(el)
  Object.assign(state, {
    data_file_path: app._data_file_path,
    backend_command: app._backend_command,
  })
  console.log(state.data_file_path, load_data_file())
  Object.assign(state, load_all())
  yo.update(el, render(state))
  // todo: watch data file
  // todo: watch chunks dir
  // todo: watch shared dir
} else if (isMain) {
  process.exit()
}

function render (m) {
  let {discovered_timestamp, discovered_files, shared_files, chunks} = m
  // todo: subtract shared files from this list
  let available_for_download = discovered_files
  return yo`
  <div>
    <span>last update from backend: ${new Date(discovered_timestamp)}</span>
    <h4>available for download</h4>
    ${available_for_download.map(available_for_download_item)}
    <h4>transfers</h4>
    ${chunks.map(transfer_element)}
    <h4>shared and downloaded</h4>
    ${shared_files.map(shared_file_element)}
  </div>`
}

function shortsha (s) {
  return s.slice(0, 7)
}

function available_for_download_item (m) {
  const {sha1, locations, size} = m
  const locations_with_item = locations.map((x) => Object.assign({}, x, m))
  return yo`
  <div>
    <span style="margin-right: 1em">${shortsha(sha1)}</span>
    ${join(locations_with_item.map(download_link), yo`<span>, </span>`)}
    <span>(${size} bytes)</span>
  </div>`
}

function download_link (m) {
  let { filename } = m
  let action = () => download_action(m)
  return yo`
  <span style="cursor: pointer" onclick=${action}>${filename}</span>`
}

function join (xs, y) {
  return xs.reduce((r, x) => r.concat([x, y]), []).slice(0, -1)
}

function transfer_element (m) {
  const {filename, size, chunks, sha1} = m
  return yo`
  <div>
    <span style="margin-right: 1em">${shortsha(sha1)}</span>
    <span>${filename}</span>
    <span>${percent_complete(chunks, size)}</span>
    <span>of</span>
    <span>${size} bytes</span>
  </div>`
}

function percent_complete (chunks, length) {
  let total_chunk_length = chunks.reduce((r, {length}) => r + length, 0)
  return Math.floor((total_chunk_length / length) * 100).toString() + '%'
}

function download_action (x) {
  let {sha1, size, locations, filename} = x
  let ips = locations.map((x) => x.ip)
  let args = [sha1, filename, size].concat(ips)
  // backend will mutate fs and we'll respond to that event
  child_process.spawn(
    state.backend_command, args, {stdio: 'inherit'})
}

function shared_file_element (m) {
  let { filename, size, sha1 } = m
  return yo`
  <div>
    <span style="margin-right: 1em">${shortsha(sha1)}</span>
    <span>${filename}</span>
    <span>(${size} bytes)</span>
  </div>
  `
}

function load_all () {
  return Object.assign({}, load_data_file(), load_share(), load_chunks())
}

function load_data_file () {
  return JSON.parse(fs.readFileSync(state.data_file_path, 'utf8'))
}

function load_share () {
  // todo: read share dir, and stat of each path
  return JSON.parse(`{
    "shared_files": [
      {
        "sha1": "3f786850e387550fdab836ed7e6dc881de23001b",
        "size": 967632312,
        "filename": "hackers.mov"
      }
    ]
  }`)
}

function load_chunks () {
  // read chunks dir, and stat of each path
  return JSON.parse(`{
    "chunks": [
      {
        "sha1": "3f786850e387550fdab836ed7e6dc881de23001b",
        "size": 967632312,
        "filename": "hackers.mov",
        "chunks": [
          { "offset": 0, "length": 1400 },
          { "offset": 1400, "length": 96763232 }
        ]
      }
    ]
  }`)
}
