console.log(`Node ${process.version}`);
require('dotenv').config();

const PREFIX = '!t';

const fs = require('fs');
const path = require('path');
const deepcopy = require('deepcopy');

const { Client, Intents, MessageEmbed } = require('discord.js');
console.log(`Discord v${require('discord.js').version}`);
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS]});

client.login(process.env.DISCORD_BOT_TOKEN);
client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);
    client.user.setPresence({ activities: [{ name: `${PREFIX}` }], status: 'online' });
});

/* Variables */
const ROOT_DIR = path.resolve(__dirname, '..');
const img_dir = `${ROOT_DIR}/data/img.png`;
const img_dir_temp = `${ROOT_DIR}/data/img_TMP.png`;
var formatedRGB = [0, 75, 255];
const dcolors = {'r': [255,0,0], 'g':[0,255,0], 'b':[0,0,255]};

var usrd = new Object();

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
const scalef = 10;

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
function overlay(scrn) {
    for (var i = 1;i<num_div;i++) {
        dRect(scrn, [width/num_div*i, 0], [1, height], overlay_c);
    }
    for (var i = 1;i<num_div;i++) {
        dRect(scrn, [0, height/num_div*i], [width, 1], overlay_c);
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
var getEmbed = function(message, title, comp){
    let richEmbed = new MessageEmbed();
    richEmbed.setDescription(message);
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
    overlay(tctx);
    resizeTo(temp2, 10);

    fs.writeFileSync(img_dir_temp, temp2.toBuffer('image/png'))
    message.channel.send({files: [{
        attachment: `${img_dir_temp}`
    }]});
}

function sendFull(message) {
    fs.writeFileSync(img_dir_temp, canvas.toBuffer('image/png'))
        message.channel.send({files: [{
        attachment: `${img_dir_temp}`
    }]});
}

client.on('messageCreate', async (message) => {

    if (message.author.bot) {
        return;
    }

    try {
        var link = 'https://twitter.com';
        var rep = 'https://fxtwitter.com';
        if (message.content.startsWith(link)) {

            console.log("\x1b[32m", `\n${getFormattedDate()}`, "\x1b[0m");
            console.log(message.content);

            message.channel.send(rep + message.content.slice(link.length, message.content.length));
        }

        if (message.content.startsWith(PREFIX)) {
            if (!usrd[message.author.id]) {
                usrd[message.author.id] = new Object();
                usrd[message.author.id].show = false;
                //false OR [x,y]
            }

            console.log("\x1b[32m", `\n${getFormattedDate()}`, "\x1b[0m");
            console.log(message.content);

            var args = message.content.split(' ');
            args.splice(0,1);
            console.log(args);
            console.log(usrd[message.author.id])
    
            if (args.length == 0) {
                if (usrd[message.author.id].show) {
                    //copy pasted to s
                    sendSelected(message);
                }
                else {
                    var temp2 = cloneCanv(canvas);
                    var tctx = temp2.getContext('2d');
        
                    overlay(tctx);
                    resizeTo(temp2, 2);
        
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
                if (parseInt(args[1]) < 0 || parseInt(args[1]) >= num_div) {
                    return;
                }
                else if (parseInt(args[2]) < 0 || parseInt(args[2]) >= num_div) {
                    return;
                }

                if (Object.keys(dcolors).includes(args[3])) {

                    var pos = usrd[message.author.id].show;
                    console.log(pos);
                    console.log(pos[0]*(width/num_div));
                    console.log(pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div));
                    console.log([pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)]);
                    dPoint(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], dcolors[args[3]]);
                    //dRect(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [(width/num_div/num_div), (height/num_div/num_div)], dcolors[args[3]]);
                    //dRect(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [25, 25], dcolors[args[3]]);
                    //console.log(pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div));
                    //ctx.fillStyle = 'rgb(0,0,0)';
                    //ctx.fillRect(0, 0, width, height);
                }
                else {
                    var pos = usrd[message.author.id].show;
                    dPoint(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [args[3], args[4], args[5]]);
                    //dRect(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [(width/num_div), (height/num_div)], [args[3], args[4], args[5]]);
                    //dRect(ctx, [pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div), pos[1]*(height/num_div)+parseInt(args[2])*(height/num_div/num_div)], [25, 25], dcolors[args[3]]);
                    //console.log(pos[0]*(width/num_div)+parseInt(args[1])*(width/num_div/num_div));
                    //ctx.fillStyle = 'rgb(0,0,0)';
                    //ctx.fillRect(0, 0, width, height);
                }

                sendSelected(message);
            }
            else if (message.author.id == '203206356402962432') {
                if (args[0] == 'save') {
                    fs.writeFileSync(img_dir, canvas.toBuffer('image/png'))
                        message.channel.send({files: [{
                        attachment: `${img_dir}`
                    }]});
                }
            }
        }
    }
    catch (e) {
        console.error("\x1b[31m", e, "\x1b[0m");
    }
});