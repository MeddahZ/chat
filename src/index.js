const express = require('express')
const http = require("http")
const path = require('path')
const socketIo = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom}= require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketIo(server)
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')


app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New websocket Connection!')

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room})
        if (error) {
            return callback(error)
        }
        //console.log('join working')
        //console.log(username, room)
        socket.join(user.room)
        socket.emit('message', generateMessage('The Vivi','welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('The Vivi',`Make space y'all! ${user.username} is here!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message',generateMessage('The Vivi',`${user.username} has wandered off...`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    socket.on('newmsg',(message, callback) => {
        const filter = new Filter()

        if (filter.isProfane(message)){
            return callback('no bad words u nasty mf')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback('delivered')
    })

    socket.on('sendlocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationsent', generateLocationMessage(user.username,coords))
        callback()
    })
})
server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
})

