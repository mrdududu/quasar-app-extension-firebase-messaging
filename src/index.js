/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */

const path = require('path')
const fs = require('fs')

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function swTransformer(mode, path, content, userSWFilePath) {
  console.log(path)  
  if (endsWith(path, 'firebase-messaging-sw.js')) {
      const firebaseVersionInLockFile = require('firebase/package.json').version
      content = content.replace(/FIREBASE_VERSION/g, firebaseVersionInLockFile)

      // add service worker for pwa mode
      if (mode === 'pwa') {
        const scripts = []
        scripts.unshift('/service-worker.js?' + Date.now())
        content += `importScripts(${scripts.map(i => `'${i}'`).join(', ')})\r\n`;
      }

      content += fs.readFileSync(userSWFilePath).toString()
    }

    return content
}

const extendWebpackForWeb = function (conf, mode, appDir) {
  const CopyPlugin = require('copy-webpack-plugin')

  console.log(` App Extension (firebase): Configure webpack to copy service workers to root directory`)
  const userSWFilePath = path.join(appDir, 'src-pwa', 'firebase-messaging-sw.js')

  conf.plugins.push(new CopyPlugin([
    {
      from: path.join(__dirname, 'templates', 'firebase-messaging-sw.js'),
      to: '.',
      transform: (content, path) => swTransformer(
          mode,
          path,
          content.toString(),
          userSWFilePath
      )
    }
  ]))
}

module.exports = function (api) {
  api.compatibleWith('@quasar/app', '^1.0.0')

  const modeName = api.ctx.modeName
  const appDir = api.appDir

  if (['pwa', 'spa', 'ssr'].includes(modeName)) {
    api.extendWebpack((conf) => extendWebpackForWeb(conf, modeName, appDir))
  }
}
