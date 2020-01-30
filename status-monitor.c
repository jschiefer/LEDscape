#include "status-monitor.h"
#include <linux/i2c.h>
#include <linux/i2c-dev.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct {
    struct {
        uint8_t dev;
        uint8_t bit;
    } fuseSense;

    struct {
        uint8_t dev;
        uint8_t bit;
    } statusLed;
} ChannelStatusConfig;

#define ARRAY_COUNT(a) (sizeof(a)/sizeof((a)[0]))

ChannelStatusConfig channelConfigs[] = {
        { .fuseSense={ .dev=1, .bit=017 }, .statusLed={ .dev=0, .bit=004 } }, // 00
        { .fuseSense={ .dev=1, .bit=016 }, .statusLed={ .dev=0, .bit=005 } }, // 01
        { .fuseSense={ .dev=1, .bit=015 }, .statusLed={ .dev=0, .bit=006 } }, // 02
        { .fuseSense={ .dev=1, .bit=014 }, .statusLed={ .dev=0, .bit=007 } }, // 03
        { .fuseSense={ .dev=1, .bit=013 }, .statusLed={ .dev=0, .bit=010 } }, // 04
        { .fuseSense={ .dev=1, .bit=012 }, .statusLed={ .dev=0, .bit=011 } }, // 05
        { .fuseSense={ .dev=1, .bit=011 }, .statusLed={ .dev=0, .bit=012 } }, // 06
        { .fuseSense={ .dev=0, .bit=010 }, .statusLed={ .dev=0, .bit=013 } }, // 07
        { .fuseSense={ .dev=0, .bit=000 }, .statusLed={ .dev=0, .bit=014 } }, // 08
        { .fuseSense={ .dev=0, .bit=001 }, .statusLed={ .dev=0, .bit=015 } }, // 09
        { .fuseSense={ .dev=0, .bit=002 }, .statusLed={ .dev=0, .bit=016 } }, // 10
        { .fuseSense={ .dev=0, .bit=003 }, .statusLed={ .dev=0, .bit=017 } }, // 11
        { .fuseSense={ .dev=1, .bit=000 }, .statusLed={ .dev=2, .bit=012 } }, // 12
        { .fuseSense={ .dev=1, .bit=001 }, .statusLed={ .dev=2, .bit=013 } }, // 13
        { .fuseSense={ .dev=1, .bit=002 }, .statusLed={ .dev=2, .bit=014 } }, // 14
        { .fuseSense={ .dev=1, .bit=003 }, .statusLed={ .dev=2, .bit=015 } }, // 15
        { .fuseSense={ .dev=1, .bit=004 }, .statusLed={ .dev=2, .bit=016 } }, // 16
        { .fuseSense={ .dev=1, .bit=005 }, .statusLed={ .dev=2, .bit=017 } }, // 17
        { .fuseSense={ .dev=1, .bit=006 }, .statusLed={ .dev=2, .bit=000 } }, // 18
        { .fuseSense={ .dev=1, .bit=007 }, .statusLed={ .dev=2, .bit=001 } }, // 19
        { .fuseSense={ .dev=2, .bit=010 }, .statusLed={ .dev=2, .bit=002 } }, // 20
        { .fuseSense={ .dev=2, .bit=011 }, .statusLed={ .dev=2, .bit=003 } }, // 21
};

typedef struct {
    uint16_t pinDirections;
} MCP23017Config;

int writeReg(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t registerAddress,
        uint8_t registerValue
);

int writeGpioBit(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t pin,
        bool value
) ;

int readReg(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t registerAddress,
        uint8_t *registerOutput
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Status UI Thread

void* status_thread(void* unused_data)
{
    int i2cFd = open("/dev/i2c-2", O_RDWR);

    if (i2cFd < 0){
        printf("[status] Failed to open i2c device /dev/i2c-2\n");
        return;
    }

    MCP23017Config devConfigs[3] = {
            { 0 },
            { 0 },
            { 0 },
    };

    for (uint8_t i=0; i<ARRAY_COUNT(channelConfigs); i++) {
        ChannelStatusConfig* config = channelConfigs + i;

        devConfigs[config->statusLed.dev].pinDirections &= ~(1 << config->statusLed.bit);
        devConfigs[config->fuseSense.dev].pinDirections |= 1 << config->fuseSense.bit;
    }


    printf("[status] Initializing mcp23017...\n");

    for (uint8_t i=0; i<ARRAY_COUNT(devConfigs); i++) {
        MCP23017Config* config = devConfigs + i;

        if (writeReg(i2cFd, 0x20 + i, 0x00, config->pinDirections & 0xFF) == -1 ||
            writeReg(i2cFd, 0x20 + i, 0x01, config->pinDirections >> 8) == -1
        ) {
            printf("[status] Failed to initialize mcp23017 at address %d\n", 0x20 + i);
            return;
        }
    }

    printf("[status] Initialization complete. Status reporting starting...\n");

    while (true) {


        // Read status pins
        for (uint8_t i=0; i<ARRAY_COUNT(channelConfigs); i++) {
            ChannelStatusConfig* config = channelConfigs + i;

            writeGpioBit(i2cFd, 0x20 + config->statusLed.dev, config->statusLed.bit, true);
            usleep(50000);
            writeGpioBit(i2cFd, 0x20 + config->statusLed.dev, config->statusLed.bit, false);
        }
    }
}

// Inspired by http://www.hertaville.com/interfacing-an-i2c-gpio-expander-mcp23017-to-the-raspberry-pi-using-c.html

int writeGpioBit(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t pin,
        bool value
) {
    uint8_t registerAddr = 0x12 + pin/8;
    uint8_t registerValue;
    int res = readReg(
            i2cFileDescriptor,
            deviceAddress,
            registerAddr,
            &registerValue
    );

    if (res < 0) return res;

    if (value)
        registerValue |= 1 << (pin % 8);
    else
        registerValue &= ~(1 << (pin % 8));

    return writeReg(
            i2cFileDescriptor,
            deviceAddress,
            registerAddr,
            registerValue
    );
}

int writeReg(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t registerAddress,
        uint8_t registerValue
){
    uint8_t buff[] = {
            registerAddress,
            registerValue
    };

    int retVal = -1;
    struct i2c_rdwr_ioctl_data packets;
    struct i2c_msg messages[1] = {
            {
                    .addr = deviceAddress,
                    .flags = 0,
                    .len = sizeof(buff),
                    .buf = buff,
            }
    };

    packets.msgs = messages;
    packets.nmsgs = 1;

    retVal = ioctl(i2cFileDescriptor, I2C_RDWR, &packets);

    if(retVal < 0)
        perror("Write to I2C Device failed");

    return retVal;
}

int readReg(
        int i2cFileDescriptor,
        uint8_t deviceAddress,
        uint8_t registerAddress,
        uint8_t *registerOutput
){
    uint8_t buff[] = {
            registerAddress
    };

    int retVal = -1;
    struct i2c_rdwr_ioctl_data packets;
    struct i2c_msg messages[2] = {
            {
                    .addr = deviceAddress,
                    .flags = 0,
                    .len = sizeof(buff),
                    .buf = buff
            },
            {
                    .addr = deviceAddress,
                    .flags = I2C_M_RD,
                    .len = 1,
                    .buf = registerOutput
            }
    };

    packets.msgs = messages;
    packets.nmsgs = 2;

    retVal = ioctl(i2cFileDescriptor, I2C_RDWR, &packets);
    if(retVal < 0)
        perror("Read from I2C Device failed");

    return retVal;
}