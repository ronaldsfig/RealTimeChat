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

let authors = [];
let messages = [];

io.on('connection', socket => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.emit('previousMessages', messages);

    socket.on('authorConnected', data =>{
        socket.username = data;
        authors.push(data);

        socket.emit('updateNewAuthor', data);
        socket.broadcast.emit('updateNewAuthor', data);
        socket.emit('updateAuthorsList', authors);
        socket.broadcast.emit('updateAuthorsList', authors);
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

