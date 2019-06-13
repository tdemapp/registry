'use strict'

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const apicache = require('apicache')
const fetch = require('node-fetch')

const app = express()
const cache = apicache.middleware
const apiPrefix = 'https://api.github.com/repos/tdemapp/registry/contents/extensions'

// Fetch helper
const download = (url) => {
  return new Promise((resolve, reject) => {
    // API fetch header options
    const fetchOptions = {
      method: 'GET',
      headers: {
        Authorization: `token ${process.env.GH_ACCESS_TOKEN}`
      }
    }

    // Fetch from GitHub API
    fetch(url, fetchOptions)
      .then(async (res) => {
        if (res.status < 200 || res.status >= 300) reject(res)
        resolve(await res.json())
      })
      .catch((err) => reject(err))
  })
}

// Response object structure
const result = (res, status, success, message) => res.status(status).end(JSON.stringify({ success, message }))

// Middleware
app.use(helmet())
app.use(cors())
app.use(cache('1 hour'))

// Endpoints
app.get('/', async (req, res) => {
  res.set('Content-Type', 'application/json')
  await download(apiPrefix)
    .then(data => result(res, 200, true, data))
    .catch(err => result(res, err.status, false, err.statusText))

  res.status(200).end(JSON.stringify({
    name: req.params.extension
  }))
})

app.get('/:extension', async (req, res) => {
  res.set('Content-Type', 'application/json')

  let contentUrl

  // Get extension content URL
  await download(`${apiPrefix}/${req.params.extension}.json`)
    .then(data => {
      contentUrl = data.download_url
    })
    .catch(err => result(res, err.status, false, err.statusText))

  // Fetch extension JSON body
  await download(contentUrl)
    .then(data => result(res, 200, true, data))
    .catch(err => result(res, err.status, false, err.statusText))
})

module.exports = app
