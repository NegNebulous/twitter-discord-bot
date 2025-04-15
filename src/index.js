console.log(`Node ${process.version}`);
require('dotenv').config();

const PREFIX = '!t';

const fs = require('fs');
const path = require('path');
// const deepcopy = require('deepcopy');

//discord client setup
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
console.log(`Discord v${require('discord.js').version}`);
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]});
// const client = new Client();

client.login(process.env.DISCORD_BOT_TOKEN);
client.on('ready', () => {
    console.log(`\n${client.user.tag} has logged in.`);
    client.user.setPresence({ activities: [{ name: `${PREFIX} help` }], status: 'online' });

    console.log('add all users to temp hours object');

    try {
        client.channels.cache.get('1165348331128627240').send({files: [{
            attachment: `${userDataPath}`,
            name: 'user_data.json'
        }]});
    } catch (e) {
        console.error(e);
    }
});
/*
//twitter client setup
const { TwitterApi } = require('twitter-api-v2');
console.log(`twitter-api-v2 v${ require('twitter-api-v2').version}`);
const twitterClient = new TwitterApi(`${process.env.TWITTER_BEARER_TOKEN}`);*/

// https://discord-player.js.org/docs/guides/common-actions#stopping-the-queue
// https://github.com/Androz2091/discord-player/blob/cd5cf97/packages/discord-player/src/manager/GuildQueue.ts#L608
const { QueryType, Player, Util } = require("discord-player");
// const {YouTubeExtractor} = require('@discord-player/extractor');
const { YoutubeiExtractor  } = require('discord-player-youtubei');

const gamble = require('./gamble');

const musicData = {
    user: {},  // data by user, user to servers
    server: {} // data by server, server to musicPlayer
};

const YTDL_OPTS = {
    quality: "highestaudio",
    highWaterMark: 1 << 25
};

const player = new Player(client, {
    ytdlOptions: YTDL_OPTS
});

player.extractors.register(YoutubeiExtractor, {
    ytdlOptions: YTDL_OPTS
});

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
        queue = player.nodes.create(message.guild, {
            metamusicData: {
                channel: message.member.voice.channel
            },
            leaveOnEmpty: false,
            leaveOnEmptyCooldown: 300000, // 5 minutes
            leaveOnEnd: false,
            leaveOnEndCooldown: 300000, // 5 minutes
            leaveOnStop: false,
            volume: 3
        })

        // console.log(queue.node.setVolume(1));
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

function destroyQueue(message) {
    const serverData = musicData.server[message.guild.id];
    if (!serverData) return;

    const queue = serverData.queue;
    if (queue) queue.delete(); // or queue.destroy()

    const connection = message.guild.members.me.voice;
    if (connection) connection.disconnect();

    delete musicData.server[message.guild.id];
}


function loadJson(filepath) {
    try {
        return JSON.parse(fs.readFileSync(filepath));
    }catch(e){console.error(e)}
}
function saveJson(filepath, obj, sync) {
    if (sync==null) sync = false;
    try {
        if (sync) {
            fs.writeFileSync(filepath, JSON.stringify(obj, null, 2), (error) => {
                console.error(error);
            });
        }
        else {
            fs.writeFile(filepath, JSON.stringify(obj, null, 2), (error) => {
                console.error(error);
            });
        }
    }catch (e) {}
}

function writeBackup() {
    client.channels.cache.get('1165348331128627240').send({files: [{
        attachment: `${userDataPath}`,
        name: 'user_data.json'
    }]});
}
const auto_save = () => {
    writeBackup();
    saveData();
};
setInterval(auto_save, 12*60*60*1000);

function saveData(sync) {
    saveJson(userDataPath, userData, sync)
}

/* Variables */
const ROOT_DIR = path.resolve(__dirname, '..');
const img_dir = `${ROOT_DIR}/data/img.png`;
const img_dir_temp = `${ROOT_DIR}/data/img_TMP.png`;
// var formatedRGB = [0, 75, 255];
var formatedRGB = [155, 0, 25];
const dcolors = {'r': [255,0,0], 'g':[0,255,0], 'b':[0,0,255]};

const DRAW_DELAY = 5*60;
const STARTTIME = Math.floor(new Date() / 1000);

var usrd = new Object();
var userDataPath = `${ROOT_DIR}/data/user_data.json`;
var userData = new Object();
try {
    userData = loadJson(userDataPath);
    console.log(userData);
}catch(e){console.error(e)}

// fix data
// for (let serverid in userData.hours) {
//     for (let userid in userData.hours[serverid]) {
//         if (typeof userData.hours[serverid][userid] == 'number') {
//             console.log('convert');
//             userData.hours[serverid][userid] = {
//                 'total': userData.hours[serverid][userid]
//             }
//         }
//     }
// }

var commandData = JSON.parse((fs.readFileSync(`${ROOT_DIR}/data/command.json`) + '').replaceAll('${PREFIX}', `${PREFIX} `));

var SecretSantaPairings = {};
var SecretSantaData = {};
var SantaPath = `${ROOT_DIR}/data/csv/Secret Santa  (Responses) - Form Responses 1.csv`;
// var SantaPath = `${ROOT_DIR}/data/csv/test_data.csv`;

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
const ytdl = require('ytdl-core');

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
        // let richEmbed = new MessageEmbed();
        let richEmbed = getEmbed(message, title, comp);
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
    let richEmbed = new EmbedBuilder();
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

function timeConvert(time, unit, asString) {
    if (unit==null) unit='seconds';
    let units = {
        'minutes': 60,
        'hours': 60*60,
        'days': 60*60*24,
        // 'weeks': 60*60*24*7,
        // 'years': 60*60*24*7*365,
        'inf': Infinity
    }
    if (time > 60) {
        for (let i = 0; i < Object.keys(units).length; i++) {
            let k = Object.keys(units);
            if (time > units[k[i]] && time < units[k[i+1]]) {
                unit = k[i];
                time = time / units[k[i]];
                break;
            }
        }
    }

    if (asString) {
        return `${parseFloat(time).toFixed(2)} ${unit}`;
    }
    return {
        "time": time,
        "unit": unit
    };
}

function exitHandler(eventType, a, b, c) {
    // TODO write this all to file

    // (await client.guilds.fetch('571780425211576330')).channels.cache.get('923750880673677373').send({files: [{
    // (client.guilds.fetch('571780425211576330')).channels.cache.get('1165348331128627240').send({files: [{
    // client.channels.cache.get('1165348331128627240').send({files: [{
    //     attachment: `${userDataPath}`,
    //     name: 'user_data.json'
    // }]});

    console.log(`exitcode: ${eventType}`);
    console.log(a)
    console.log(b)
    console.log(c)
    console.log(userData);

    let count = 0;

    for (server in hourData) {
        for (user in hourData[server]) {
            try {
                if (hourData[server][user]) {
                    if (getSeconds() - hourData[serverid][userid] > 0) {
                        userData.hours[serverid][userid] += getSeconds() - hourData[serverid][userid];
                    }
                    // delete hourData[serverid][userid]; // just in case this runs multiple times somehow
                    // console.log('added');
                    count += 1;
                }
            }
            catch(error) {}
        }
    }

    console.log(`Saved ${count} user('s) data.`)



    if (userData) {
        saveData(true);
    }

    // let start = getSeconds();

    // // wait for 1 second
    // while (getSeconds() - start < 1) {

    // }

    process.exitCode = 0;
    process.exit(0);
}

// `exit`, 
// console.log(process.argv);
if (process.argv.includes("-debug")) {
    console.log("started in debug mode");
} else {
    console.log("started in safe mode");
    [`uncaughtException`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, exitHandler);
    });
}

// temp data
hourData = {}
//userData.hours

client.on('voiceStateUpdate', (oldState, newState) => {

    //add checks for mute/deafen

    try {
        //connected
        if (!oldState.channelId && newState.channelId) {
            userid = newState.member.user.id;
            serverid = newState.guild.id;
    
            console.log(`${userid} connected to ${serverid}`);
    
            if (!hourData[serverid]) hourData[serverid] = {};
            hourData[serverid][userid] = getSeconds();
        }
        //disconnected
        else if (oldState.channelId && !newState.channelId) {
            userid = newState.member.user.id;
            serverid = oldState.guild.id;
    
            console.log(`${userid} disconnected from ${serverid}`);
    
            if (!userData.hours[serverid]) userData.hours[serverid] = {};
            if (!userData.hours[serverid][userid]) userData.hours[serverid][userid] = {
                'total': 0
            };
            // if (!userData.hours[serverid][userid]) userData.hours[serverid][userid] = 0;
            // if (typeof userData.hours[serverid][userid] == 'number') {
            //     console.log('convert');
            //     userData.hours[serverid][userid] = {
            //         'total': userData.hours[serverid][userid]
            //     }
            // }
            const NOW = new Date();
            const year = NOW.getFullYear();
            const month = NOW.getMonth();
            if (!userData.hours[serverid][userid][year]) {
                userData.hours[serverid][userid][year] = {}
            }
            if (!userData.hours[serverid][userid][year][month]) {
                userData.hours[serverid][userid][year][month] = 0
            }

            if (!hourData[serverid]) hourData[serverid] = {};
            if (!hourData[serverid][userid]) hourData[serverid][userid] = STARTTIME;
            userData.hours[serverid][userid].total += getSeconds() - hourData[serverid][userid];
            userData.hours[serverid][userid][year][month] += getSeconds() - hourData[serverid][userid];
            delete hourData[serverid][userid];
        }
        
        saveData();
    }
    catch(error) {
        console.error(error);
    }

});

// TODO is that even true?
// currently only one server can listen to a user at a time
client.on('presenceUpdate', async (oldP, newP) => {
    for (var i = 0; i < newP.activities.length;i++) {
        if (newP.activities[i].type == ActivityType.Listening) {

            (async () => {
                if (!musicData.user[newP.userId]) return;
                
                const p = newP.activities[i];
                console.log(`Playing: "${p.details}" by "${p.state}" to ${musicData.user[newP.userId].servers.length} server(s)`);
                
                let result;
                try {
                    result = await player.search(`${p.details} by ${p.state} lyrical version`, {
                        searchEngine: QueryType.YOUTUBE_SEARCH
                    })
                } catch(error) {console.error(error)};

                if (result.tracks.length == 0) {
                    console.log("No results");
                    return;
                }
                
                if (musicData.user[newP.userId].last == result.tracks[0].thumbnail) return;

                // 72 drop for funny song

                musicData.user[newP.userId].last = result.tracks[0].thumbnail;
                
                musicData.user[newP.userId].servers.forEach(async guild_player => {
                    const queue = guild_player.queue;

                    await queue.clear();
                    if (queue.node.isPlaying())
                        await queue.node.skip();

                    await queue.addTrack(result.tracks[0]);
                    
                    if (!queue.connection)
                        await queue.connect(guild_player.channel);

                    if (!queue.node.isPlaying())
                        queue.node.play(result.tracks[0]);
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
                `Now sharing ${member.user.username}'s music. If you are the host it is recommended that you mute your music player. Once the host begins listening to a new song I will connect and start playing it.`,
                `Share`
            )]});
        }
        else if (args[0] == 'stop') {
            destroyQueue(message);
            message.reply({embeds: [getEmbed(
                `Stopping music sharing...`,
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

                if (result.tracks.length == 0) {
                    message.reply("No results");
                    return;
                }

                await queue.addTrack(result.tracks[0]);
                // await queue.insert(result.tracks[0], 0);

                if (!queue.connection) await queue.connect(splayer.channel);

                // if (!queue.paused) queue.setPaused(false);
                // if (!queue.node.playing) queue.play();
                // console.log(queue.node.playing);

                if (!queue.node.isPlaying())
                    queue.node.play();

                // console.log(result.tracks[0]);
                message.reply(`Added **"${result.tracks[0].title}"** to the queue`);
            })();
        }
        else if (args[0] == 'remove') {
            // TODO write this command
        }
        else if (args[0] == 'skip') {
            // TODO fix
            // if (!message.member.permissions.has("ADMINISTRATOR")) {
            //     message.reply('You must have admin permissions for this command.');
            // }
            if (!musicData.server[message.guild.id]) return;
            if (!musicData.server[message.guild.id].queue) return;

            musicData.server[message.guild.id].queue.node.skip();
        }
        else if (args[0] == 'queue' || args[0] == 'q') {

            exit = () => {
                message.reply({embeds: [getEmbed('The queue is currently empty', 'Queue')]});
            };

            if (!musicData.server[message.guild.id]) {exit();return;}
            
            const queue = musicData.server[message.guild.id].queue;
            // const cur_song = queue.nowPlaying(); // this line errors randomly for no reason

            // console.log(queue.tracks);

            let cur_song;
            try {
                cur_song = queue.currentTrack;
            } catch(e) {}

            if (!queue) {exit();return;}
            if (!cur_song) {exit();return;}

            if (!musicData.server[message.guild.id].user) {
                song_str = '**Currently Playing**\n';
            }
            else {
                song_str = `**Currently Playing ${message.guild.members.cache.get(musicData.server[message.guild.id].user.id).user.username}'s music**\n`;
            }
            const tracks = queue.tracks.data;

            song_str += `[${cur_song.title}](${cur_song.url})` + '\n';
            song_str += `${Util.buildTimeCode(Util.parseMS(queue.node.estimatedPlaybackTime))} - ` + cur_song.duration + '\n';

            if (tracks.length > 0) song_str += '\n**Next**';

            for (let i = 0; i < tracks.length; i++) {
                song_str += `\n${i+1}. [${tracks[i].title}](${tracks[i].url})`;
            }

            message.reply( {embeds: [
                getEmbed(song_str, 'Queue')
                    .setThumbnail(cur_song.thumbnail)
            ]} );
        }
        else if (args[0] == 'time') {
            let target = message.author.id;
            if (args[1]) {
                target = getIdFromMsg(args[1]);
            }
            try {
                let result = timeConvert(userData.hours[message.guildId][target], 'seconds');
                let time = result.time;
                let unit = result.unit;

                message.reply(`<@${target}> has been in call for ${parseFloat(time).toFixed(2)} ${unit} in total.`);
            }
            catch {
                message.reply(`Targeted user never been in call.`);
            }
        }
        else if (args[0] == 'gamble') {
            gamble.command();
            // message.reply(`I LOVE GAMBLING!!!! ${1}`);
        }
        else if (args[0] == 'lb' || args[0] == 'leaderboard') {
            const err_f = () => {
                message.reply("Not enough data to construct a leaderboard.");
            };
            const NOW = new Date();
            const year = NOW.getFullYear();
            const month = NOW.getMonth();
            const _ftable = {
                'total': obj => obj.total,
                'month': obj => {
                    if (!obj[year]) return 0;
                    if (!obj[year][month]) return 0;
                    return obj[year][month]
                }
            };
            let opt1 = args[1];
            if (!(opt1 in _ftable)) opt1 = 'total'
            const _getval = _ftable[opt1];
            if (!userData.hours[message.guild.id]) {
                userData.hours[message.guild.id] = {};
                err_f();
                return;
            } else if (Object.keys(userData.hours[message.guild.id]) <= 1) {
                err_f();
                return;
            }
            let unordered = userData.hours[message.guild.id];
            console.log(unordered);
            let sorted = Object.keys(unordered).sort((function(valuea, valueb) {
                if (_getval(unordered[valuea]) > _getval(unordered[valueb])) {
                    return -1;
                }
                else {
                    return 1;
                }
            })).reduce((obj, key) => { 
                    obj[key] = unordered[key]; 
                    return obj;
                },
                {}
            );

            let finalMsg = `#1${" \u200b".repeat(3)}${message.guild.members.cache.get(Object.keys(sorted)[0]).user.username}: ${timeConvert(_getval(sorted[Object.keys(sorted)[0]]), null, true)}\n`;
            // finalMsg += `#${i+1}${((i < 9) ? " \u200b".repeat(2) : ' ')} ${message.guild.members.cache.get(Object.keys(sorted)[i])}: ${sorted[Object.keys(sorted)[i]]}\n`;
            // let finalMsg = '';

            for (var i = 1; i < (Object.keys(sorted).length < 10 ? Object.keys(sorted).length : 10); i++) {
                try {
                    finalMsg += `#${i+1}${((i < 9) ? " \u200b".repeat(2) : ' ')} ${message.guild.members.cache.get(Object.keys(sorted)[i]).user.username}: ${timeConvert(_getval(sorted[Object.keys(sorted)[i]]), null, true)}\n`;
                }
                catch(e){}
            }

            let lb_str = '';
            if (opt1 == 'total') {
                lb_str = 'all time'
            } else if (opt1 == 'month') {
                lb_str = NOW.toLocaleDateString('en-US', {month: 'long'})
            }

            message.reply({embeds: [getEmbed(finalMsg, `Leader Board ${lb_str}`)]});
        }
        else if (['203206356402962432', '293868423740653568'].includes(message.author.id)) {
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
            else if (args[0] == 'search') {
                const channel_id = '920740085736046702';
                const channel = message.guild.channels.fetch(channel_id);

                console.log(channel);
            }
            else if (args[0] == 'ytdl') {
                (async () => {
                    result = await player.search(`${args.slice(1).join(" ")}`, {
                        searchEngine: QueryType.AUTO
                    });

                    const URL = result?.tracks[0]?.url

                    if (!URL) return;

                    const RES = ytdl(URL, YTDL_OPTS);
                    const INFO = await ytdl.getBasicInfo(URL);

                    // console.log(INFO);

                    RES.pipe(fs.createWriteStream(`downloads/${INFO.player_response.videoDetails.title}.mp4`));
                    message.reply(path.resolve(`./downloads/${INFO.player_response.videoDetails.title}.mp4`));
                })();
            }
            else if (args[0] == 'backup') {
                writeBackup()
            } else if (args[0] == 'readcsv') {
                let santafile = fs.readFileSync(SantaPath, 'utf-8');

                console.log(santafile);

                santafile.split(/\r?\n/).forEach((line, lineCount) => {
                    if (lineCount == 0) return;
                    let time,email,name,discord,address;
                    let TIME_STAMP = 0;let EMAIL = 1;let NAME = 2;let DISCORD = 3;let ADDRESS = 4;
                    let temp_dat = line.split(',');

                    time = temp_dat[TIME_STAMP];
                    email = temp_dat[EMAIL];
                    name = temp_dat[NAME];
                    discord = temp_dat[DISCORD];
                    // address = temp_dat[ADDRESS];
                    address = temp_dat.slice(ADDRESS).join(',');

                    SecretSantaData[discord] = {
                        "name": name,
                        "discord": discord,
                        "address": address
                    };
                });
            } else if (args[0] == 'generate') {
                // let temp_list = ['negnebulous', 'neeeno'];
                let temp_list = Object.keys(SecretSantaData);
                let copy = temp_list.slice();

                let shuffled = [];
                while (copy.length > 0) {
                    let idx = Math.floor(Math.random() * copy.length);
                    shuffled.push(copy[idx]);
                    copy.splice(idx, 1);
                }

                console.log(shuffled);
                SecretSantaPairings = {};

                shuffled.every((ele, idx) => {
                    if (idx + 1 >= shuffled.length) {
                        SecretSantaPairings[ele] = shuffled[0];
                        return true;
                    }
                    SecretSantaPairings[ele] = shuffled[idx + 1];
                    return true;
                });

                console.log(SecretSantaPairings);

            } else if (args[0] == 'send_santa') {
                Object.keys(SecretSantaPairings).forEach((key) => {
                    let user = client.users.cache.find(u => u.username == key);

                    let secret = SecretSantaPairings[key];
                    if (user) {
                        user.send(`Your secret person to send gifts to is:\n${SecretSantaData[secret].name}\n\nTheir discord username is:\n${SecretSantaData[secret].discord}\n\nTheir address is:\n${SecretSantaData[secret].address}\n\nGood luck have fun`);
                    } else {
                        console.log(`couldn't find user "${key}"`);
                    }
                });
            } else if (args[0] == 'test_send') {
                Object.keys(SecretSantaPairings).forEach((key) => {
                    let user = client.users.cache.find(u => u.username == key);

                    let secret = SecretSantaPairings[key];
                    if (user) {
                        message.reply(`Your(${user.username}) secret person to send gifts to is:\n${SecretSantaData[secret].name}\n\nTheir discord username is:\n${SecretSantaData[secret].discord}\n\nTheir address is:\n${SecretSantaData[secret].address}\n\nGood luck have fun`);
                    } else {
                        console.log(`couldn't find user "${key}"`);
                    }
                });
            } else if (args[0] == 'wipe_lb') {
                userData.hours[message.guildId] = {}
            } else if (args[0] == 'save_data') {
                auto_save();
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