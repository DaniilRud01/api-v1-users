/* eslint-disable import/no-duplicates */
import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import axios from 'axios'

import cookieParser from 'cookie-parser'
import Html from '../client/html'

const port = process.env.PORT || 3000
const server = express()
const { readFile, writeFile, unlink } = require('fs').promises

server.use(cors())

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())

const wrFile = (users) => {
  writeFile(`${__dirname}/users.json`, JSON.stringify(users), { encoding: 'utf8' })
}

const rFile = () => {
  return readFile(`${__dirname}/users.json`, { encoding: 'utf8' })
    .then((data) => JSON.parse(data))
    .catch(async () => {
      const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
      wrFile(users)
      return users
    })
}
server.delete('/api/v1/users/:userId', async (req, res) => {
  const { userId } = req.params
  const userList = await rFile()
  const users = userList.filter((el) => el.id !== +userId)
  wrFile(users)
  res.json({ status: 'success', userId })
})

server.delete('/api/v1/users', (req, res) => {
  unlink(`${__dirname}/users.json`)
  res.json({ status: 'success' })
})

server.get('/api/v1/users', async (req, res) => {
  const users = await rFile()
  res.json(users)
})
server.get('/api/v1/users/:userId', async (req, res) => {
  const { userId } = req.params
  const userList = await rFile()
  const users = userList.filter((el) => el.id === +userId)
  res.json(users)
})

server.post('/api/v1/users', async (req, res) => {
  const newUser = req.body
  const users = await rFile()
  const id = users[users.length - 1].id + 1
  const addedUsers = [...users, { ...newUser, id }]
  await wrFile(addedUsers)
  res.json({ status: 'success', id })
})

server.patch('/api/v1/users/:userid', async (req, res) => {
  const { userid } = req.params
  const newData = req.body
  const users = await rFile()
  const updatedUsers = users.map((el) => (el.id === +userid ? { ...el, ...newData } : el))
  await wrFile(updatedUsers)
  res.json({ status: 'success', userid })
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

server.get('/', (req, res) => {
  // const body = renderToString(<Root />);
  const title = 'Server side Rendering'
  res.send(
    Html({
      body: '',
      title
    })
  )
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

server.listen(port)

console.log(`Serving at http://localhost:${port}`)
