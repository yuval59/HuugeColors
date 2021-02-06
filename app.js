import config from './config.js';
import tmi from 'tmi.js';
import sdk from 'cue-sdk';
import { changeIcueColor, doRainbow, pulse } from './ICUE.js';
import { changeLifxColor, lifxHype } from './Lifx.js';

let subs = [];
let revoked = [];
let isHype = false;
let isPulse = false;

const authorizedUsers = ["yuval59", "Huuge"];
const validColors = ["yellow", "purple", "orange", "red", "cyan", "blue", "white", "green", "pink"];

const userName = 'HuugeBot';
const connectedChannels = ['Huuge'];

const client = new tmi.Client({

    connection: {
        secure: true,
        reconnect: true
    },

    //Get OAUTH at https://twitchapps.com/tmi/
    identity: {
        username: userName,
        password: config.OAUTH
    },
    channels: connectedChannels

});

const details = sdk.CorsairPerformProtocolHandshake();
const errCode = sdk.CorsairGetLastError();
if (errCode === 0) {
    // 'CE_Success'
}

client.connect()
    .then(console.log(`Connected to channels ${connectedChannels} as ${userName}`));

client.on('message', (channel, tags, message, self) => {

    if (self) return;

    let color = 'default';

    const n = message[0];

    message = message.toLowerCase().split(' ');

    if (message.length == 2 && n == "!") {

        switch (message[0]) {

            case ("!color"): {

                if(message[1]=="list"){
                    client.say(channel,`Hi @${tags['display-name']} - the current available colors are Yellow, Purple, Orange, Red, Cyan, Blue, White, Green, Pink`)
                    break;
                }

                if (isHype) {

                    client.say(channel, `Sorry @${tags['display-name']}, the stream lights are currently in hype mode`)

                } else {

                    if (subs.includes(tags['display-name']) || authorizedUsers.includes(tags['display-name'])) {

                        if (validColors.includes(message[1])) {

                            color = message[1];

                        } else {

                            client.say(channel, `Sorry @${tags['display-name']}, "${message[1]}" is not a valid color`);

                        }

                        if (color != 'default') {

                            changeIcueColor(color);
                            changeLifxColor(color);

                            client.say(channel, `@${tags['display-name']} has changed the color of the lights to ${color}`);

                            if (!authorizedUsers.includes(tags['display-name'])) {

                                const index = subs.indexOf(tags['display-name']);
                                subs.splice(index, 1);
                                revoked.push(tags['display-name']);
                            }

                        }

                    } else {

                        if (revoked.includes(tags['display-name'])) {
                            client.say(channel, `@${tags['display-name']}, you have already changed the stream color`)
                        } else {
                            client.say(channel, `@${tags['display-name']}, you have not subscribed during this stream and cannot change the stream color`)
                        }

                    }

                }
                break;
            }

            case ("!hype"): {
                if (tags['mod'] || authorizedUsers.includes(tags['display-name'])) {
                    switch (message[1]) {
                        default: {
                            client.say(channel, `Sorry @${tags['display-name']}, ${message} is not a valid state`);
                            break;
                        }
                        case ('on'): {
                            if (isHype) {
                                client.say(channel, `Stream is already in hype mode`);
                                break;
                            }
                            client.say(channel, `Stream is now in hype mode`);
                            isHype = true;

                            doRainbow();
                            lifxHype();

                            break;
                        }
                        case ('off'): {
                            client.say(channel, `Stream is no longer in hype mode`);
                            isHype = false;

                            changeLifxColor("white");
                        }
                    }
                }

                break;
            }

            case ("!pulse"): {
                if (tags['mod'] || tags['display-name'] == "yuval59") {
                    switch (message[1]) {
                        default: {
                            client.say(channel, `Sorry @${tags['display-name']}, ${message} is not a valid state`);
                            break;
                        }
                        case ('on'): {
                            if (isPulse) {
                                client.say(channel, `Stream is already in pulse mode`);
                            }
                            client.say(channel, `Stream is now in pulse mode`);
                            isPulse = true;
                            pulse();
                            break;
                        }
                        case ('off'): {
                            client.say(channel, `Stream is no longer in pulse mode`);
                            isPulse = false;
                            break;
                        }
                    }
                }

                break;

            }

        }

    }

});

client.on('subscription', (channel, username, methods, msg, tags) => {

    console.log("-----------subscription event has been called-----------")

    console.log(`${username} has subscribed to ${channel}`);

    subs.push(username);

});

client.on('resub', (channel, username, streakMonths, msg, tags, methods) => {

    console.log("-----------resub event has been called-----------")

    console.log(`${username} has re-subscribed to ${channel}`);

    subs.push(username);

});

client.on("subgift", (channel, username, recipient, methods, tags, userstate) => {   

    console.log("-----------subgift event has been called-----------")

    subs.push(userstate["msg-param-recipient-display-name"]);

    console.log(subs);

});

client.on("submysterygift", (channel, username, giftSubCount, methods, tag) => {

    console.log("-----------submysterygift event has been called-----------")

    if (giftSubCount >= 5) {
        subs.push(username);
    }

});