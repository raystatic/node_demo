var crypto = require('crypto');
var uuid = require('uuid');
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');

//connect to MySql
var conn = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'select_ray',
	database:'node_demo'
});

//password util
var getRandomString = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
			.toString('hex')
			.slice(0,length);
};

var sha512  = function(password, salt){
	var hash = crypto.createHmac('sha512',salt);
	hash.update(password)
	var value = hash.digest('hex')
	return {
		salt:salt,
		passwordHash:value
	};
}

function saltHashPassword(userPassword){
	var salt = getRandomString(16);
	var passwordData = sha512(userPassword,salt);
	return passwordData;
}

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// app.get("/",(req,res,next)=>{
// 	var pass = "123456";
// 	console.log('Password: ' + pass );
// 	console.log('Encrypt:' + saltHashPassword(pass).passwordHash);
// 	console.log('salt:' + saltHashPassword(pass).salt);
// })


app.post('/register/',(req,res,next)=>{
	var post_data = req.body;
	var uid = uuid.v4();
	var plain_pass = post_data.password;
	var hash_data = saltHashPassword(plain_pass);
	var password = hash_data.passwordHash;
	var salt = hash_data.salt;

	var name = post_data.name;
	var email = post_data.email;

	conn.query('SELECT * FROM users where email=?',[email], function(err, result, fields){
		conn.on('error',function(err){
			console.log('[MySql error]',err);
		});

		if (result && result.length) {
			res.json("user already exist");
		}else{
			conn.query('INSERT INTO `users` (`unique_id`, `name`, `email`, `password`, `salt`) VALUES (?, ?, ?, ?, ?)', [uid, name, email, password,salt], function(err, result, fields){
				conn.on('error',function(err){
					console.log('[MySql error]',err);
					res.json('Register error',err);
				});
				res.json('Register successful!');
			})
		}
	});
})


//start server
app.listen(3000,()=>{
	console.log("Server running at port 3000");
})
