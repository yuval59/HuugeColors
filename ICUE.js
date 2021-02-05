import sdk from 'cue-sdk';
import rgb from 'hsv-rgb';

const colorDict = {
    white:{
        r:255,
        g:255,
        b:255
    },
    red:{
        r:255,
        g:0,
        b:0
    },
    green:{
        r:0,
        g:255,
        b:0
    },
    blue:{
        r:0,
        g:0,
        b:255
    },
    cyan:{
        r:0,
        g:255,
        b:255
    },
    orange:{
        r:255,
        g:128,
        b:0
    },
    yellow:{
        r:255,
        g:255,
        b:0
    },
    purple:{
        r:128,
        g:0,
        b:255
    },
    pink:{
        r:255,
        g:0,
        b:128
    }
};

//------------------------------\\
//                              \\
//      ICUE integrations       \\
//                              \\
//------------------------------\\

function getAvailableLeds() {
    const leds = []
    const deviceCount = sdk.CorsairGetDeviceCount()
    for (let di = 0; di < deviceCount; ++di) {
        const ledPositions = sdk.CorsairGetLedPositionsByDeviceIndex(di)
        leds.push(ledPositions.map(p => ({ ledId: p.ledId, r: 0, g: 0, b: 0 })))
    }

    return leds
}

function performPulseEffect(allLeds, x) {

    const count = allLeds.length
    let val = ~~((1 - (x - 1) * (x - 1)) * 255)

    for (let i = 0; i < count; ++i) {

        const device_leds = allLeds[i]
        device_leds.forEach(led => {
            led.r = 0
            led.g = val
            led.b = 0
        })

        sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
    }
    sdk.CorsairSetLedsColorsFlushBuffer()
}

export const pulse = async () => {

    const details = sdk.CorsairPerformProtocolHandshake()
    const errCode = sdk.CorsairGetLastError()
    if (errCode !== 0) {
        console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`)
        exit(1)
    }

    const availableLeds = getAvailableLeds()
    if (!availableLeds.length) {
        console.error('No devices found')
        exit(1)
    }

    function loop(leds, waveDuration, x) {
        const TIME_PER_FRAME = 25
        performPulseEffect(leds, x)
        return setTimeout(
            loop,
            TIME_PER_FRAME,
            leds,
            waveDuration,
            (x + TIME_PER_FRAME / waveDuration) % 2
        )
    }

    return loop(availableLeds, 500, 0)
};

export async function doRainbow() {

    const details = sdk.CorsairPerformProtocolHandshake()
    const errCode = sdk.CorsairGetLastError()

    if (errCode !== 0) {
        console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`)
        exit(1)
    }

    const availableLeds = getAvailableLeds()

    if (!availableLeds.length) {
        console.error('No devices found')
        exit(1)
    }

    const count = availableLeds.length

    let currentHue = 0;

    setInterval(() => {
        currentHue = (currentHue + 0.2) % 360;

        const val = rgb(currentHue, 100, 100);

        for (let i = 0; i < count; ++i) {

            const device_leds = availableLeds[i]
            device_leds.forEach(led => {
                led.r = val[0]
                led.g = val[1]
                led.b = val[2]
            })

            sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
        }
        sdk.CorsairSetLedsColorsFlushBuffer()
    }, 1);
}

export const changeColor = (color) => {

    const details = sdk.CorsairPerformProtocolHandshake()
    const errCode = sdk.CorsairGetLastError()

    if (errCode !== 0) {
        console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`)
        exit(1)
    }

    const availableLeds = getAvailableLeds()

    if (!availableLeds.length) {
        console.error('No devices found')
        exit(1)
    }

    const count = availableLeds.length

    for (let i = 0; i < count; ++i) {

        const device_leds = availableLeds[i]
        device_leds.forEach(led => {
            led.r = colorDict[color].r
            led.g = colorDict[color].g
            led.b = colorDict[color].b
        })

        sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
    }
    sdk.CorsairSetLedsColorsFlushBuffer()
};