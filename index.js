'use strict'

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const apicache = require('apicache')
const fetch = require('node-fetch')

const { GH_ACCESS_TOKEN } = process.env

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
        Authorization: `token ${GH_ACCESS_TOKEN}`
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
const result = (res, status, message) => res.status(status).end(JSON.stringify(message))

// Middleware
app.use(helmet())
app.use(cors())
app.use(cache('1 hour', (req, res) => res.statusCode === 200))

// Endpoints
app.get('/', async (req, res) => {
  try {
    const data = await download(apiPrefix)
    result(res, 200, data)
  } catch (err) {
    result(res, err.status, err.statusText)
  }
})

app.get('/:extension', async (req, res) => {
  let contentUrl

  // Get extension content URL
  try {
    const json = await download(`${apiPrefix}/${req.params.extension}.json`)
    contentUrl = json.download_url
  } catch (err) {
    result(res, err.status, err.statusText)
  }

  // Fetch extension JSON body
  try {
    const data = await download(contentUrl)
    result(res, 200, data)
  } catch (err) {
    result(res, err.status, err.statusText)
  }
})

module.exports = app
