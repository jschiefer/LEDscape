#/usr/bin/env bash

if ! dmesg | egrep -i 'mdio:.. not found'; then
	echo 60 > /sys/class/gpio/export
	echo out > /sys/class/gpio/gpio60/direction
fi