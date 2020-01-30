#/usr/bin/env bash


# Checks if the network interface wasn't found by the kernel. This indicates the presense

if ! dmesg | egrep -i 'mdio:.. not found'; then
	echo 60 > /sys/class/gpio/export
	echo out > /sys/class/gpio/gpio60/direction
fi