/* eslint camelcase: 0 */

const {app, BrowserWindow} = require('electron')
const path = require('path')
const fs = require('fs')
const url = require('url')

// Adds debug features like hotkeys for triggering dev tools and reload
// require('electron-debug')()

app._data_file_path = process.env.dp
app._backend_command = process.env.be

const main_window_state_path =
  path.join(__dirname, 'tmp/main-window-state.json')
const main_window_state =
  JSON.parse(fs.readFileSync(main_window_state_path, 'utf8'))

// keep global ref to prevent closing of window when object gc'd
let win

function createWindow () {
  win = new BrowserWindow(
    Object.assign({titleBarStyle: 'hidden'}, main_window_state))

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'main-window.html'),
    protocol: 'file:',
    slashes: true
  }))

  // when window dimensions change, change state object
  win.on('resize', () => {
    Object.assign(main_window_state, win.getBounds())
  })

  // closing window quits app
  win.on('closed', () => {
    const s = JSON.stringify(main_window_state, null, 2) + '\n'
    fs.writeFileSync(main_window_state_path, s, 'utf8')
    win = null
    app.quit()
  })
}

app.on('ready', createWindow)
