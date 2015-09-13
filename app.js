var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mysql = require('mysql'),
	usersSockets = {},
	users = {};

server.listen(3000);

var db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'chat'
});

// Log any errors connected to the db
db.connect(function(err){
    if (err){
		console.log(err);
	} else {
		console.log("Connect to mysql");
	}
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
	var query = db.query("SELECT * FROM messages", function(err, result){
		console.log(result);
		if(err){
			console.log(err);
		} else{
			
		}
	});
	
	socket.on('new user', function(data, callback){
		var query = db.query("SELECT * FROM users WHERE username = ? ", data, function(err, result){
			if(err){
				console.log(err);
			} else{
				if(result.length > 0){
					result.forEach(function(row){
						if(data === row.username){
							
							callback(true);
							
							userFriends(row.id, function(friends){
								//socket.friends = friends;
								//console.log(JSON.stringify(socket));
								socket.userid = row.id;
								users[socket.id] = {id: row.id, username: row.username, friends: friends};
								usersSockets[socket.userid] = socket;
								updateNicknames();
								
								//console.log(users);
							});
							//socket.friends = userFriends(row.id);
						}
					});
				} else{
					callback(false);
				}
			}
		});
	/*	query.on('result', function(row) {
			console.log(row);
		});*/
	  /*if(data in users){
			callback(false);
		}else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}*/
	});
	
	function userFriends(uid, callback){
		var query = db.query("select f.fid, u.id, u.username FROM (SELECT `id` as 'fid', `friend_id` as 'id' FROM `friends` WHERE `member_id` = ? UNION SELECT `id` as 'fid', `member_id` as 'id' FROM `friends` WHERE `friend_id` = ? ) f INNER JOIN ( select u.id, u.username from users u where u.id IN (SELECT `friend_id` as 'id' FROM `friends` WHERE `member_id` = ? UNION SELECT `member_id` as 'id' FROM `friends` WHERE `friend_id` = ? )) u on f.id = u.id ", [uid, uid, uid, uid], function(err, result){
			if(err){
				console.log(err);
			} else{
				if(result.length > 0){
					result.forEach(function(row){
						console.log(row);
					});
				}
				//console.log(result);
				return callback(result);
			}
		});
	}
	
	function updateFriends(uid, callback){
		var query = db.query("select f.fid, u.id, u.username FROM (SELECT `id` as 'fid', `friend_id` as 'id' FROM `friends` WHERE `member_id` = ? UNION SELECT `id` as 'fid', `member_id` as 'id' FROM `friends` WHERE `friend_id` = ? ) f INNER JOIN ( select u.id, u.username from users u where u.id IN (SELECT `friend_id` as 'id' FROM `friends` WHERE `member_id` = ? UNION SELECT `member_id` as 'id' FROM `friends` WHERE `friend_id` = ? )) u on f.id = u.id ", [uid, uid, uid, uid], function(err, result){
			if(err){
				console.log(err);
			} else{
				if(result.length > 0){
					result.forEach(function(row){
						console.log(row);
					});
				}
				//console.log(result);
				return callback(result);
			}
		});
	}
	
	function updateNicknames(){
		//console.log(users);
		io.sockets.emit('usernames', users);
	}
	
	socket.on('send message', function(data, callback){
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substr(0, ind);
				var msg = msg.substr(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('whisper!');
				} else{
					callback("Error! enter valid username");
				}
			} else{
				callback("Error! enter message");
			}
		} else{
			var chat = {nick: socket.nickname, msg: data, createdon: new Date()};
			var query = db.query('INSERT INTO messages SET ?', chat, function(err, result){
				console.log(result);
				if(err){
					console.log(err);
				}else{
					io.sockets.emit('new message', {msg: data, nick: socket.nickname});
				}
			});
		}
	});
	
	socket.on('disconnect', function(data){
		if(!socket.userid) return;
		delete users[socket.id];
		delete usersSockets[socket.userid];
		updateNicknames();
	});
});