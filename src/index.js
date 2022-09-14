console.log(`Node ${process.version}`);
require('dotenv').config();

const PREFIX = '!t';

const fs = require('fs');
const path = require('path');
const deepcopy = require('deepcopy');

//discord client setup
const { Client, Intents, MessageEmbed } = require('discord.js');
console.log(`Discord v${require('discord.js').version}`);
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_VOICE_STATES]});

client.login(process.env.DISCORD_BOT_TOKEN);
client.on('ready', () => {
    console.log(`\n${client.user.tag} has logged in.`);
    client.user.setPresence({ activities: [{ name: `${PREFIX} help` }], status: 'online' });
});
/*
//twitter client setup
const { TwitterApi } = require('twitter-api-v2');
console.log(`twitter-api-v2 v${ require('twitter-api-v2').version}`);
const twitterClient = new TwitterApi(`${process.env.TWITTER_BEARER_TOKEN}`);*/

const { QueryType } = require("discord-player")

const { Player } = require("discord-player")

const musicData = {
    user: {},  // data by user, user to servers
    server: {} // data by server, server to musicPlayer
};

const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
})

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function createQueue(obj) {
    let queue;

    const message = obj.message;
    const USER = obj.USER;
    const type = obj.type;

    if (musicData.server[message.guild.id]) {
        const server_data = musicData.server[message.guild.id];
        if (server_data.queue) queue = server_data.queue;
        queue.clear();

        // if the server data already exists and previously had the queue tied to a user. Then remove that tie
        if (server_data.user && (server_data.user != USER)) {
            const indx = server_data.user.servers.indexOf(musicData.server[message.guild.id]);
            if (indx != -1) {
                server_data.user.servers.splice(indx, 1)
            }
        }
    }
    
    if (!queue) {
        console.log('new queue');
        queue = player.createQueue(message.guild, {
            metamusicData: {
                channel: message.member.voice.channel
            },
            leaveOnEmpty: false,
            leaveOnEnd: false,
            leaveOnStop: false
        })
    }

    musicData.server[message.guild.id] = {
        id: message.guild.id,
        user: USER,
        message: message,
        channel: message.member.voice.channel,
        "queue": queue,
        "type": type
    };

    // musicData.server[message.guild.id].queue.channel = message.member.voice.channel;

    return musicData.server[message.guild.id];
}

function loadJson(filepath) {
    try {
        return JSON.parse(fs.readFileSync(filepath));
    }catch(e){}
}
function saveJson(filepath, obj) {
    try {
        fs.writeFile(filepath, JSON.stringify(obj, null, 2), (error) => {
            console.error(error);
        });
    }catch (e) {}
}
function saveData() {
    saveJson(userDataPath, userData)
}

/* Variables */
const ROOT_DIR = path.resolve(__dirname, '..');
const img_dir = `${ROOT_DIR}/data/img.png`;
const img_dir_temp = `${ROOT_DIR}/data/img_TMP.png`;
var formatedRGB = [0, 75, 255];
const dcolors = {'r': [255,0,0], 'g':[0,255,0], 'b':[0,0,255]};

const DRAW_DELAY = 5*60;

var usrd = new Object();
var userDataPath = `${ROOT_DIR}/data/user_data.json`;
var userData = new Object();
try {
    userData = loadJson(userDataPath);
}catch(e){}

var commandData = JSON.parse((fs.readFileSync(`${ROOT_DIR}/data/command.json`) + '').replaceAll('${PREFIX}', `${PREFIX} `));

/* canvas */

function dRect(scrn, pos, size, c) {
    color = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    scrn.beginPath();
    scrn.lineWidth = "1";
    scrn.fillStyle = color;
    scrn.fillRect(pos[0], pos[1], size[0], size[1]);
    scrn.stroke();
}

const cv = require('canvas');
const { createCanvas, loadImage } = require('canvas');

//real size of pixel
const scalef = 1;

const width = 100*scalef;
const height = 100*scalef;

var canvas = createCanvas(width, height);
var ctx = canvas.getContext('2d', {
    antialias: false,
    imageSmoothingEnabled: false
});

var imgdata = ctx.createImageData(1,1);
var imgd  = imgdata.data;

//overlay
const num_div = 10;
const overlay_c = [0,0,0];
function overlay(scrn, can) {
    for (var i = 1;i<num_div;i++) {
        dRect(scrn, [can.width/num_div*i, 0], [1, can.height], overlay_c);
    }
    for (var i = 1;i<num_div;i++) {
        dRect(scrn, [0, can.height/num_div*i], [can.width, 1], overlay_c);
    }
}

function dPoint(scrn, pos, c) {
    imgd[0] = c[0];
    imgd[1] = c[1];
    imgd[2] = c[2];
    imgd[3] = 255;
    if (c[3]) {
        imgd[3] = c[3];
    }

    console.log(pos);

    scrn.putImageData( imgdata, pos[0], pos[1] );   
}

function resizeTo(canvas,pct){

    var tempCanvas = createCanvas(width, height);
    var tctx = tempCanvas.getContext('2d');

    var cw=canvas.width;
    var ch=canvas.height;
    tempCanvas.width=cw;
    tempCanvas.height=ch;
    tctx.drawImage(canvas,0,0);
    canvas.width*=pct;
    canvas.height*=pct;
    var ctx2=canvas.getContext('2d');
    ctx2.drawImage(tempCanvas,0,0,cw,ch,0,0,cw*pct,ch*pct);
    return ctx2;
}

//load image
//ctx.fillStyle = 'rgb(255,255,255)';
//ctx.fillRect(0, 0, width, height);

//fs.writeFileSync(img_dir, canvas.toBuffer('image/png'))
loadImage(img_dir).then(image => {
    ctx.drawImage(image, 0, 0, width, height);
})
/*try {
    if (fs.existsSync(path)) {
        loadImage(img_dir).then(image => {
            ctx.drawImage(image, 0, 0, width, height);
        })
    }
    else {
        new Object().balls();
    }
}
catch(e) {
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, width, height);

    fs.writeFileSync(img_dir, canvas.toBuffer('image/png'))
}*/

//save image
function saveImg() {
    fs.writeFileSync(img_dir, canvas.toBuffer('image/png'))
}

//returns time accurate to second
function getSeconds() {
    return Math.floor(new Date() / 1000)
}

//Returns formatted date
function getFormattedDate() {
    let date = new Date();
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

//Send discord embed
var sendEmbed = async function(channel, message, title, comp){
    return new Promise(async function(resolve, reject) {
        let richEmbed = new MessageEmbed();
        richEmbed.setDescription(message);
        richEmbed.setColor(formatedRGB);
        if (title) {
            richEmbed.setTitle(title);
        }
    
        if (comp) {
            let returnMessage = await channel.send({embeds: [richEmbed], components: comp});
            resolve(returnMessage);
        }
        else {
            let returnMessage = await channel.send({embeds: [richEmbed]});
            resolve(returnMessage);
        }
    });
}

//returns a new embed
var getEmbed = function(description, title, comp){
    let richEmbed = new MessageEmbed();
    richEmbed.setDescription(description);
    richEmbed.setColor(formatedRGB);
    if (comp) {
        richEmbed.setTitle(title);
        return {embeds: [richEmbed], components: comp};
    }
    else if (title) {
        richEmbed.setTitle(title);
    }

    return richEmbed;
}

//converts <@DISCORD_ID> to DISCORD_ID
function getIdFromMsg(message) {
    var tempIntI1 = 0;
    var tempIntI2 = message.length;
    for (i = 0; i < message.length; i++) {
        if ((message[i] >= 0) && (message[i] <= 9)) {
            break;
        }
        else {
            tempIntI1 += 1;
        }
    }

    for (i = message.length - 1; i >= 0; i--) {
        if ((message[i] >= 0) && (message[i] <= 9)) {
            break;
        }
        else {
            tempIntI2 -= 1;
        }
    }
    return message.substring(tempIntI1, tempIntI2);
}

function cloneCanv(a) {
    let tempCanvas = createCanvas(width, height);
    let tctx = tempCanvas.getContext('2d');
    tctx.drawImage(a, 0, 0, a.width, a.height);
    return tempCanvas;
}

function sendSelected(message) {
    var temp2 = cloneCanv(canvas);

    var tctx = temp2.getContext('2d');

    var pos = usrd[message.author.id].show;
    tctx.drawImage(canvas, pos[0]*(width/num_div), pos[1]*(height/num_div), (width/num_div), (height/num_div), 0, 0, width, height);
    if (userData[message.author.id].gridlines) {
        overlay(tctx, temp2);
    }
    resizeTo(temp2, 10);

    fs.writeFileSync(img_dir_temp, temp2.toBuffer('image/png'))
    message.reply({files: [{
        attachment: `${img_dir_temp}`
    }]});
}

function sendFull(message) {
    fs.writeFileSync(img_dir_temp, canvas.toBuffer('image/png'))
        message.reply({files: [{
        attachment: `${img_dir_temp}`
    }]});
}

function newUser() {
    //everything after gridlines will show up in options
    var obj = new Object();
    obj.dTime = getSeconds();
    obj.gridlines = true;
    obj.pingtimer = false;

    return obj;
}

// currently only one server can listen to a user at a time
client.on('presenceUpdate', async (oldP, newP) => {
    for (var i = 0; i < newP.activities.length;i++) {
        if (newP.activities[i].type == 'LISTENING') {

            (async () => {
                if (!musicData.user[newP.userId]) return;
                
                const p = newP.activities[i];
                
                const result = await player.search(`${p.details} by ${p.state} lyrical version`, {
                    searchEngine: QueryType.YOUTUBE_SEARCH
                })
                
                if (musicData.user[newP.userId].last == result.tracks[0].thumbnail) return;

                console.log(`Playing: "${p.details}" by "${p.state}" to ${musicData.user[newP.userId].servers.length} server(s)`);
                // 72 drop for funny song

                musicData.user[newP.userId].last = result.tracks[0].thumbnail;

                musicData.user[newP.userId].servers.forEach(async guild_player => {

                    const message = guild_player.message;

                    // if (!guild_player.queue) {
                    //     // guild_player.queue.clear();
                    //     // guild_player.queue.destroy();
                    //     guild_player.queue = player.createQueue(message.guild, {
                    //         metamusicData: {
                    //             channel: guild_player.channel
                    //         }
                    //     });
                    // }
    
                    const queue = guild_player.queue;
    
                    // queue.setPaused(true);
                
                    try {
                        if (queue.nowPlaying())
                            await queue.skip();
                    } catch(e) {}

                    await queue.clear();
                    await queue.addTrack(result.tracks[0]);
    
                    if (queue.tracks.length > 1) {
                        // queue.skip();
                        // queue.remove(queue.tracks[queue.tracks.length - 1]);
                        queue.remove(queue.tracks[0]);
                        // console.log('removed 1 song from track');
                    }
                
                    if (!queue.connection)
                        await queue.connect(guild_player.channel);
    
    
                    // set volume requires some missing library
                    // queue.setVolume(0.5);
                
                    // queue.play();
                    // queue.setPaused(false);
                    if (!queue.playing) queue.play();

                });
            })();
        }
    }
});

client.on('messageCreate', (message) => {

    if (message.author.bot) {
        return;
    }

    try {
        var link = 'https://twitter.com';
        var rep = 'https://vxtwitter.com';
        
        (async () => {
            if (!message.content.startsWith(link)) return;

            let noVideo = true;
            message.embeds.forEach(embed => {
                if (embed.video != null) noVideo = false;
            })

            if (noVideo) return;

            console.log("\x1b[32m", `\n${getFormattedDate()}`, "\x1b[0m");
            console.log(message.content);

            message.reply(rep + message.content.slice(link.length, message.content.length));

            message.suppressEmbeds(true);
        })();

        if (!message.content.startsWith(PREFIX)) return;

        if (!usrd[message.author.id]) {
            usrd[message.author.id] = new Object();
            usrd[message.author.id].show = false;
            //false OR [x,y]
        }
        if (!userData[message.author.id]) {
            userData[message.author.id] = newUser();
            console.log(newUser());
        }

        console.log("\x1b[32m", `\n${getFormattedDate()}`, "\x1b[0m");
        console.log(message.content);

        var args = message.content.split(' ');
        args.splice(0,1);
        console.log(args);
        console.log(usrd[message.author.id])
        if (userData[message.author.id]) {
            console.log(userData[message.author.id]);
        }

        if (args.length == 0) {
            if (message.content.length != PREFIX.length) {
                return;
            }
            if (usrd[message.author.id].show) {
                //copy pasted to s
                sendSelected(message);
            }
            else {
                var temp2 = cloneCanv(canvas);
                var tctx = temp2.getContext('2d');
    
                resizeTo(temp2, 2);
                if (userData[message.author.id].gridlines) {
                    overlay(tctx, temp2);
                }
    
                fs.writeFileSync(img_dir_temp, temp2.toBuffer('image/png'))
                message.channel.send({files: [{
                    attachment: `${img_dir_temp}`
                }]});
            }
        }
        else if (args[0] == 'o') {
            usrd[message.author.id].show = false;
            //console.log(canvas);
            //var temp2 = cloneCanv(canvas);

            sendFull(message);
        }
        else if (args[0] == 's') {
            if (!args[1] || !args[2]) {
                return;
            }
            if (parseInt(args[1]) < 0 || parseInt(args[1]) >= num_div) {
                return;
            }
            else if (parseInt(args[2]) < 0 || parseInt(args[2]) >= num_div) {
                return;
            }

            usrd[message.author.id].show = [parseInt(args[1]), parseInt(args[2])];

            sendSelected(message);
        }
        else if (args[0] == 'd') {
            if (!usrd[message.author.id].show) {
                message.channel.send({embeds: [getEmbed(`No image section selected. Try \`\`${PREFIX} s X Y\`\``, 'Draw')]});
                return;
            }

            if ((parseInt(args[1]) < 0 || parseInt(args[1]) >= num_div) || (parseInt(args[2]) < 0 || parseInt(args[2]) >= num_div)) {
                message.channel.send({embeds: [getEmbed(`Invalid Coordinates. Coordinates must be between 0 and 9.`, 'Draw')]});
                return;
            }
            
            if (getSeconds() - userData[message.author.id].dTime <= DRAW_DELAY) {
                message.channel.send({embeds: [getEmbed(`Try again in ${DRAW_DELAY - (getSeconds() - userData[message.author.id].dTime)} seconds.`, 'Draw')]});
                return;
            }
            else {
                userData[message.author.id].dTime = getSeconds();
            }

            if (Object.keys(dcolors).includes(args[3])) {

                var pos = usrd[message.author.id].show;
                dPoint(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], dcolors[args[3]]);
            }
            else {
                var pos = usrd[message.author.id].show;
                dPoint(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [args[3], args[4], args[5]]);
            }

            setTimeout(() => {
                message.author.send('Your draw timeout has expired.');
            }, DRAW_DELAY*1000);

            saveData();
            saveImg();
            sendSelected(message);
        }
        else if (args[0] == 'opt') {
            if (!args[1]) {
                //send message below
            }
            else {
                var opt = -1;
                if (Object.keys(userData[message.author.id]).slice(Object.keys(userData[message.author.id]).includes('gridlines')).includes(args[1])) {
                    opt = userData[message.author.id][args[1]];
                }
                if (opt != -1) {
                    userData[message.author.id][args[1]] = !opt;
                }
                else {
                    message.reply({embeds: [getEmbed(`Option not found. Try \`\`${PREFIX} opt\`\` for a list of options.`, 'Options')]});
                }

                saveJson(userDataPath, userData);
            }
            var msgsend = ``;
            for (var i = Object.keys(userData[message.author.id]).indexOf('gridlines'); i < Object.keys(userData[message.author.id]).length;i++) {
                msgsend += `${Object.keys(userData[message.author.id])[i]}: \`\`${userData[message.author.id][Object.keys(userData[message.author.id])[i]]}\`\`\n`;
            }
            message.reply({ embeds: [getEmbed(msgsend, 'Options')]});
        }
        else if (args[0] == 'help') {
            if (!args[1]) {
                var msgsend = `For more detailed information on any commands type\n\`\`\`${PREFIX} help command name\`\`\`\n`;
                for (var i = 0; i < Object.keys(commandData.command).length; i++) {
                    msgsend += `\n**${commandData.command[Object.keys(commandData.command)[i]].name}**\n ${commandData.command[Object.keys(commandData.command)[i]].desc}\n__Examples:__ ${commandData.command[Object.keys(commandData.command)[i]].example}\n`;
                }
                sendEmbed(message.channel, msgsend, 'Commands');
            }
            else {
                for (var i = 0; i < Object.keys(commandData.command).length; i++) {
                    if (commandData.command[Object.keys(commandData.command)[i]].name == args[1]) {
                        var msgsend = ('\n' + commandData.command[Object.keys(commandData.command)[i]].desc +  '\n\nSyntax: ' + commandData.command[Object.keys(commandData.command)[i]].syntax + '\n\nExample: ' + commandData.command[Object.keys(commandData.command)[i]].example);
                        sendEmbed(message.channel, msgsend, commandData.command[Object.keys(commandData.command)[i]].name);
                    }
                }
            }
        }
        else if (args[0] == 'share') {
            if (!args[1]) return;

            const id = getIdFromMsg(args[1]);

            // if (musicData.server[message.guild.id] && musicData.server[message.guild.id].queue) {
            //     musicData.server[message.guild.id].queue.clear();
            //     // musicData.server[message.guild.id].queue.destroy();
            // }
            
            createQueue({
                message: message,
                type: 'share'
            });
            
            if (!musicData.user[id]) {
                musicData.user[id] = {
                    servers: [],
                    "id": id
                };
            }

            musicData.server[message.guild.id].user = musicData.user[id];
            if (!musicData.user[id].servers.includes(musicData.server[message.guild.id]))
                musicData.user[id].servers.push(musicData.server[message.guild.id]);

            const member = message.guild.members.cache.get(id);

            message.reply({embeds: [getEmbed(
                `Now sharing ${member.user.username}'s music. If you are the host it is recomended that you mute your music player. Once the host begins listening to a new song I will connect and start playing it.`,
                `Share`
            )]});
        }
        else if (args[0] == 'clear') {
            if (!message.member.permissions.has("ADMINISTRATOR")) {
                message.reply('You must have admin permissions for this command.');
            }
            else {
                const server = musicData.server[message.guild.id];

                if (server.user) {
                    server.user.servers.remove(server);
                }

                // server.queue.destroy();
                server.queue.clear();
                delete server;

                message.reply('Cleared the queue');
            }
        }
        else if (args[0] == 'play') {
            if (!args[1]) return;
            
            let search_str = '';
            for (var i = 1; i < args.length; i++) {
                search_str += args[i] + ' ';
            }

            // if (!musicData.server[message.guild.id] || !musicData.server[message.guild.id].queue || (musicData.server[message.guild.id] && musicData.server[message.guild.id].user)) {
            //     console.log('reset');
            //     createQueue(message);
            // }

            (async () => {

                if (!musicData.server[message.guild.id] || (musicData.server[message.guild.id].type != 'play')) {
                    if (musicData.server[message.guild.id])
                        console.log(`(${!musicData.server[message.guild.id]} || (${musicData.server[message.guild.id].type} != 'play'))`);
                    console.log('reset');

                    createQueue({
                        message: message,
                        type: 'play'
                    });
    
                    // if (musicData.server[message.guild.id].queue) {
                    //     if (musicData.server[message.guild.id].queue.connection) {
                    //         if (musicData.server[message.guild.id].queue.nowPlaying())
                    //             await musicData.server[message.guild.id].queue.skip();
                    //         await musicData.server[message.guild.id].queue.clear();
                    //     }
                    // }
                }
    
                const splayer = musicData.server[message.guild.id];
                const queue = splayer.queue;
                
                const result = await player.search(`${search_str}`, {
                    searchEngine: QueryType.YOUTUBE_SEARCH
                });

                await queue.addTrack(result.tracks[0]);
                // await queue.insert(result.tracks[0], 0);

                if (!queue.connection) await queue.connect(splayer.channel);

                // if (!queue.paused) queue.setPaused(false);
                if (!queue.playing) queue.play();

                // console.log(result.tracks[0]);
                message.reply(`Added **"${result.tracks[0].title}"** to the queue`);
            })();
        }
        else if (args[0] == 'skip') {
            if (!message.member.permissions.has("ADMINISTRATOR")) {
                message.reply('You must have admin permissions for this command.');
            }
            if (!musicData.server[message.guild.id]) return;
            if (!musicData.server[message.guild.id].queue) return;

            musicData.server[message.guild.id].queue.skip();
        }
        else if (args[0] == 'queue' || args[0] == 'q') {

            exit = () => {
                message.reply({embeds: [getEmbed('The queue is currently empty', 'Queue')]});
            };

            if (!musicData.server[message.guild.id]) {exit();return;}
            
            const queue = musicData.server[message.guild.id].queue;
            // const cur_song = queue.nowPlaying(); // this line errors randomly for no reason
            cur_song;
            try {
                cur_song = queue.nowPlaying();
            } catch(e) {}

            if (!queue) {exit();return;}
            if (!cur_song) {exit();return;}

            if (!musicData.server[message.guild.id].user) {
                song_str = '**Currently Playing**\n';
            }
            else {
                song_str = `**Currently Playing ${message.guild.members.cache.get(musicData.server[message.guild.id].user.id).user.username}'s music**\n`;
            }
            const tracks = queue.tracks;

            song_str += cur_song.title + '\n';
            song_str += `${queue.getPlayerTimestamp().current} - ` + cur_song.duration + '\n';

            if (tracks.length > 0) song_str += '\n**Next**';

            for (let i = 0; i < tracks.length; i++) {
                song_str += `\n${i+1}. ${tracks[i].title}`;
            }

            message.reply({embeds: [getEmbed(song_str, 'Queue').setThumbnail(cur_song.thumbnail)]});
        }
        else if (message.author.id == '203206356402962432') {
            if (args[0] == 'hhelp') {
                var msgsend = `Admin commands:\n`;
                for (var i = 0; i < Object.keys(commandData.adminCommand).length; i++) {
                    msgsend += `\n**${commandData.adminCommand[Object.keys(commandData.adminCommand)[i]].name}**\n ${commandData.adminCommand[Object.keys(commandData.adminCommand)[i]].desc}` + '\nSyntax: ' + commandData.adminCommand[Object.keys(commandData.adminCommand)[i]].syntax + '\n';
                }
                sendEmbed(message.channel, msgsend, 'Commands');
            }
            else if (args[0] == 'saveimg') {
                saveImg();
            }
            else if (args[0] == 'saveudata') {
                saveJson(userDataPath, userData);
                message.reply('Saved userData.');
            }
            else if (args[0] == 'clearudata') {
                userData = new Object();
                message.reply('Cleared userData.');
            }
            else if (args[0] == 'cclear') {
                if (!message.member.hasPermission("ADMINISTRATOR")) {
                    message.reply('You must have admin permissions for this command.');
                }
                else {
                    for (let i = 0; i < Object.keys(musicData.server);i++) {
                        if (musicData[Object.keys(musicData.server)[i]].queue) {
                            musicData[Object.keys(musicData.server)[i]].queue.destroy();
                        }
                    }
                    musicData = {};
                    console.log(musicData);
                    message.reply('Cleared');
                }
            }
            /*else if (args[0] == 'tweet') {
                msgsend = 'test';
                var url = `https://api.twitter.com/1.1/statuses/update.json?status=${msgsend}`;
                twitterClient.v2.post(url).then((tweet) => {
                    message.channel.reply('Tweeted.');
                });

            }*/
        }
    }
    catch (e) {
        console.error("\x1b[31m", e, "\x1b[0m");
        if (e.includes('Cannot use destroyed queue')) {
            if (message.member.voice.channel) {
                musicData.server[message.guild.id].queue = player.createQueue(message.guild, {
                    metamusicData: {
                        channel: message.member.voice.channel
                    }
                });
                console.log('remade');
            }
        }
    }
});