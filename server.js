const express   = require('express');
const path      = require('path');
const http      = require('http');
const socktio   = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } =  require('./utils/users');

const app       = express();
const server    = http.createServer(app);
const io        = socktio(server);

// Srt static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Wrlcome current euser
        socket.emit('message', formatMessage(botName,'Welcome to Chat'))

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} user has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers' , {
            room : user.room,
            users : getRoomUsers(user.room)
        })

    });

      // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        // console.log(msg)
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    // Runs when client disconenects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username}has left the chat`));

            // Send users and room info
            io.to(user.room).emit('roomUsers' , {
                room : user.room,
                users : getRoomUsers(user.room)
            })
        }
        
    });
})

const PORT = 3000 || process.env.PORT;


server.listen(PORT, () => console.log(`Server Running on port ${PORT}`));