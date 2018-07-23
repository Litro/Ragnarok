#!/usr/bin/env node

const net = require('net');
const Discord = require('discord.js');
const config = require("./config.json");

const client = new Discord.Client();
let sockets = [];

function hook(channel, username, message, avatar) {

	if (!channel) return console.log('Channel not specified.');
	if (!username) return console.log('Username not specified.');
	if (!message) return console.log('Message not specified.');
	if (!avatar) avatar = 'https://cdn4.iconfinder.com/data/icons/technology-devices-1/500/speech-bubble-128.png';

	avatar = avatar.replace(/\s/g, '');

	channel.fetchWebhooks()
		.then(webhook => {
			let foundHook = webhook.find('name', 'Bridge');

			if (!foundHook) {
				channel.createWebhook('Bridge', 'https://cdn4.iconfinder.com/data/icons/technology-devices-1/500/speech-bubble-128.png')
					.then(webhook => {
						webhook.send(message, {
							"username": username,
							"avatarURL": avatar
						}).catch(error => {
							console.log(error);
							return channel.send('**Something went wrong when sending the webhook. Please tell administrator.**');
						})
					});
			} else {
			foundHook.send(message, {
				"username": username,
				"avatarURL": avatar
			}).catch(error => {
					console.log(error);
					return channel.send('**Something went wrong when sending the webhook. Please tell administrator.**');
				});
			}
		});
}

net.createServer(socket => {
	socket.setEncoding("utf8"); // parse buffer to utf8
	socket.on('data', (msg) => {
		// parse msg
		let temp = new Array();
		temp = msg.split(",");
		
		if (temp.length == 1)
			temp.unshift('Server');
		
		// Send message to discord
		if (client.channels.get(config.channel).permissionsFor(client.user.id).has('MANAGE_WEBHOOKS'))
			hook(client.channels.get(config.channel), temp[0], temp[1]);
		else
			return console.log(`Error: Bot did not have MANAGE_WEBHOOKS permission.`);
	});
	socket.on('error', err => { console.log(`uh oh..! getting an error: ${err}`)});
	sockets.push(socket);
}).listen(1337);

client.on('message', msg => {
	if (msg.channel.name == 'general' && !msg.author.bot) { // filter for text messages only
		// filter only supported characters for herc (strip emojis or replace them for a nice ascii version)
		// <Haru> That's because the client expects text in a local charset (according to the windows legacy locale settings)
		// <Haru> it's reading the UTF8 stream it receives as latin1 or w/e charset is configured on that one specific computer
		//console.log(msg.author.username,': ', msg.content); // also then authors username

		//console.log(sockets[0]);
		if (sockets[0] !== undefined)
			sockets[0].write(`<${msg.author.username}> : ${msg.content}\0`); // check if socket exists and is hercules?
	};
});

client.login(config.token);