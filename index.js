const express = require('express');
const socketio = require('socket.io');
const http= require('http');
const PORT =process.env.PORT || 4000
const app = express();
const {addUser,removeUser,getUser,getUsersInRoom} =require('./users.js');
const server = http.createServer(app);
const io =socketio(server);
const router =require("./router");
//const mongo = require('mongodb').MongoClient;

 const mongoose =require('mongoose');


//mongo.connect('mongodb://127.0.0.1/mongochat');
 
mongoose.connect('mongodb://localhost/chats',function(err){
    if(err){
        console.log(err);
    }else{
        console.log('connected to mongodb');
    }
});

var chatSchema= mongoose.Schema({
    nick:String,
    msg:String,
    created: {type:Date,default:Date.now}
});

var Chatting= mongoose.model('Message',chatSchema);



app.use(router);


io.on('connect',(socket)=>{
    //console.log('we have a new connection!!!')
    var numClients = {};
   
   // var clients = {};

   var query= Chatting.find({});
   
   query.limit(5).exec(function(err,message){
        if(err) throw err;
        console.log("sending old messages");
        socket.emit('load old messages',message);
    });
   

    socket.on('join',({name,room},callback)=>{
       const {error,user} =addUser({id:socket.id,name,room});
               
       if(error) return callback(error);

       
    socket.join(user.room)
     
    
    if (numClients[user.room] == undefined) {
        numClients[user.room] = 1;
    } else {
        numClients[user.room]++;
    }
   
      socket.emit('message',{ user:'admin',text:`${user.name},welcome to the room ${user.room}`});
      

       socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

       socket.to(user.room).emit('message', { user: 'admin',text: `no. of users `+numClients[user.room]});
        
       
       io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)})
       
       callback();
    });

    socket.on('sendMessage', (message,callback)=>{
      const user =getUser(socket.id);
       
       var newMsg =new Chatting({msg:message,nick:user})

       newMsg.save(function(err){
          
            
            io.to(user.room).emit('message', { user: user, text:message});
        })
        
       
        callback();
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        numClients[socket.room]--;

        if(user){
          io.to(user.room).emit('message',{user:'admin','text': `${user.name} has left.`})
          io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
       
        }
    });

});



server.listen(process.env.PORT|| 4000, ()=>console.log(`Server has started on port ${PORT}`));
