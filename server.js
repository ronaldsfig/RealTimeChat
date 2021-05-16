const { Socket } = require('dgram');
const express = require('express');
const path = require('path');
const { Connection } = require('pg');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine',  'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

const Sequelize = require('sequelize');
const sequelize = new Sequelize('realtimechat', 'root', '', {
    host: "localhost",
    dialect: "mysql",
});

sequelize.authenticate().then(function(){
    console.log("Conectado ao banco de dados com sucesso!");
}).catch(function(erro){
    console.log("Houve uma falha ao se conectar com o banco de dados: "+erro);
});

const Post = sequelize.define('messages', {
    user: {
        type: Sequelize.STRING
    },
    message: {
        type: Sequelize.TEXT
    }
});

let users = [];
let messages = [];

io.on('connection', socket => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.emit('previousMessages', messages);

    socket.on('userConnected', data =>{
        socket.username = data;
        users.push(data);
        console.log(users);
        socket.broadcast.emit('updateNewUser', data);
        socket.broadcast.emit('updateUserList', users);
    });
    
    socket.on('sendMessage', data =>{
        messages.push(data);
        socket.broadcast.emit('receivedMessage', data);

        Post.sync({force: false});

        var postInstance = Post.create({
            user: data['author'],
            message: data['message']
        });

    });
});

server.listen(3000);

