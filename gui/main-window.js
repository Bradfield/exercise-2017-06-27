/* eslint camelcase: 0 */

const yo = require('yo-yo')
// const path = require('path')
// const {app} = require('electron').remote
// const fs = require('fs')
// const log = (...args) => console.log(...args); log

let state = {}
let el = view(state)
document.body.appendChild(el)

Object.assign(state, load_all(), {loaded: true})
yo.update(el, view(state))

// setTimeout(() => {
//   state.loaded = true
//   yo.update(el, view(state))
// }, 5000)

function view (m) {
  console.log(m)
  let {loaded, discovered_timestamp, discovered_files} = m
  let available_for_download = discovered_files // subtract shared files
  return yo`<div>
    ${!loaded
      ? yo`<span>loading...</span>`
      : yo`<div>
        <span>last update from backend ${discovered_timestamp}</span>
        <span>available for download</span>
        ${available_for_download_view(available_for_download)}

      </div>`}
  </div>`
}

function available_for_download_view (xs) {
  return yo`<span>...</span>`
}

function load_all () {
  return Object.assign({}, load_data_file(), load_share(), load_chunks())
}

function load_data_file () {
  // read contents of data file from disk
  return JSON.parse(`{
    "discovered_timestamp": 1498596074226,
    "discovered_files": [
      {
        "sha1": "3f786850e387550fdab836ed7e6dc881de23001b",
        "size": 967632312,
        "locations": [
          { "ip": "10.0.0.4", "filename": "hackers.mov" },
          { "ip": "10.0.0.7", "filename": "Hackers-1995.mov" }
        ]
      },
      {
        "sha1": "84da426d75746ac9fce1277043515ade79f4c861",
        "size": 138,
        "locations": [
          { "ip": "10.0.0.4", "filename": "alice.txt" }
        ]
      },
      {
        "sha1": "6fbf03012a6b76cd731d63c75d81ef344e2b48c6",
        "size": 152,
        "locations": [
          { "ip": "10.0.0.7", "filename": "bob.txt" }
        ]
      }
    ]
  }`)
}

function load_share () {
  // read share dir
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
  // read chunks dir
  return JSON.parse(`{
    "chunks": [
      {
        "sha1": "3f786850e387550fdab836ed7e6dc881de23001b",
        "size": 967632312,
        "filename": "hackers.mov",
        "chunks": [
          { "offset": 0, "length": 5000 }
        ]
      }
    ]
  }`)
}
