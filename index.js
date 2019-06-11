'use strict'

const fetch = require('node-fetch')
const NodeCache = require('node-cache')

const download = (url) => {
  return new Promise((resolve, reject) => {
    // API fetch header options
    const fetchOptions = {
      method: 'GET',
      headers: {
        Authorization: `token ${process.env.GH_ACCESS_TOKEN}`
      }
    }

    // Memory cache for storing extensions
    const extensionCache = new NodeCache({
      checkperiod: 3600 // Cache for 1 hour
    })

    // Fetch from GitHub API
    fetch(url, fetchOptions)
      .then(async (res) => {
        if (res.status < 200 || res.status >= 300) reject(res.status)

        const extension = await res.json()
        let extensionName

        if (Array.isArray(extension)) {
          extensionName = extension[0].name.replace(/\.[^/.]+$/, '')
        } else {
          extensionName = extension.name.replace(/\.[^/.]+$/, '')
        }

        // Cache the extension if it doesn't already exist
        try {
          extensionCache.get(extensionName, (err, value) => {
            if (err) console.error('Error getting cache: ', err)

            if (value === undefined) {
              extensionCache.set(extensionName, extension, (err, success) => {
                if (err || !success) console.error('Error setting cache: ', err)
              })
            }
          })
        } catch (err) {
          console.error('Cache Error: ', err)
        }

        resolve(extension)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

module.exports = async (req, res) => {
  // Response object tempkate structure
  const result = (success, message) =>
    res.end(
      JSON.stringify(
        {
          success,
          message
        },
        null,
        2
      )
    )

  // Set response header content type
  res.setHeader('Content-Type', 'application/json')

  // GitHub API prefix URL
  const apiPrefix = 'https://api.github.com/repos/tdemapp/registry/contents/extensions'

  // If no extension name provided (Request URL), fetch all and respond
  if (req.url === '/') {
    await download(apiPrefix)
      .then((data) => {
        result(true, data)
      })
      .catch((err) => {
        result(false, JSON.stringify(err))
      })
  }

  // If extension name provided, fetch it and respond with it
  await download(
    `https://api.github.com/repos/tdemapp/registry/contents/extensions${req.url}.json`
  )
    .then((data) => {
      result(true, data)
    })
    .catch((err) => {
      result(false, JSON.stringify(err))
    })
}
