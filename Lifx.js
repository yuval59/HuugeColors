//This class handles all the Lifx integration logic

import config from './config.js';
import axios from 'axios';

const headers = {
    "Authorization": "Bearer " + config.LIFXKEY,
};
const scene_uuid = config.scene;

//------------------------------\\
//                              \\
//      Lifx integrations       \\
//                              \\
//------------------------------\\

export const changeLifxColor = (color) => {

    const data = {
        color: color,
        brightness: 1,
        fast: false
    };

    axios.put(`https://api.lifx.com/v1/lights/all/state`, data, { headers: headers })
        .then(function (response) {
            // handle success
            console.log(`Color change to ${color} successful`);

        })
        .catch(function (error) {
            // handle error
            console.error(error);
        });
};

export const lifxHype = () => {
    
    const sceneData = {
        fast: true
    };

    axios.put(`https://api.lifx.com/v1/scenes/scene_id:${scene_uuid}/activate`, sceneData, { headers: headers })
        .then(function (response) {
            // handle success
            console.log(`Scene change successful`);
        })
        .catch(function (error) {
            // handle error
            console.error(error);
        });

    setTimeout(() => postMove(), 500);
};

function postMove(){

    const moveData = {
        direction: 'backward',
        period: 4,
        fast: false
    };

    axios.post(`https://api.lifx.com/v1/lights/all/effects/move`, moveData, { headers: headers })
        .then(function (response) {
            // handle success
            console.log(`Move successful`);
        })
        .catch(function (error) {
            // handle error
            console.error(error);
        })
}