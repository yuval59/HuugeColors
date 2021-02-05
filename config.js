import { config as envConfig } from 'dotenv';

envConfig();

const config = {
    OAUTH: process.env.TWITCH_OAUTH_TOKEN,
    MAKERKEY: process.env.MAKER_KEY,
    LIFXKEY: process.env.LIFX_KEY,
    scene: process.env.SCENE_UUID
};

export default config;
