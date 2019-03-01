#!/usr/bin/env bash

BBB_NUM=$1
BBB_NAME=$2

if [ -z $BBB_NAME ] || [ -z $BBB_NUM ]; then
	echo "Usage: $0 [bbb-num] [bbb-name]"
	exit -1
fi

HOSTNAME="tedx-bbb-$BBB_NAME"
EMMC_NODE=mmcblk1
EMMC_DEV=/dev/$EMMC_NODE
ROOT_DEV="$EMMC_DEV"p1
ROOT_MNT=/mnt
STATIC_IP=10.0.44.$(expr 100 + $BBB_NUM)

if ! [ -e $EMMC_DEV ]; then
	echo ERROR: eMMC device $EMMC_DEV does not exist
	exit -1
fi

if mount | egrep $EMMC_NODE'.* on / ' &>/dev/null; then
	echo ERROR: This script cannot be run when booted from the eMMC
	exit -1
fi


echo "About to setup this beaglebone to be $HOSTNAME ($STATIC_IP)"
echo This will ERASE the contents of eMMC. Ctrl-C to stop, enter to contiue...
read

echo Erasing eMMC...
dd if=/dev/zero of=$EMMC_DEV bs=1M count=16 || exit -1

echo Partitioning eMMC...
parted -s $EMMC_DEV -- mklabel msdos mkpart primary ext4 4MiB -1s || exit -1

echo Formatting eMMC...
mkfs.ext4 -O ^metadata_csum,^64bit $ROOT_DEV || exit -1

echo Mounting eMMC...
mkdir -p $ROOT_MNT
mount $ROOT_DEV $ROOT_MNT || exit -1

echo Rsyncing System...
for DIR in /bin /boot /etc /lib /opt /root /sbin /srv /usr /var; do
	echo "    $DIR..."
	rsync -rap $DIR $ROOT_MNT/ || exit -1
done
echo "    /home..."
rsync -rap --exclude "/home/lightatplay/build" /home  $ROOT_MNT/ || exit -1

echo Setting Hostname...
echo $HOSTNAME > $ROOT_MNT/etc/hostname || exit -1

echo Setting IP Address...
echo $STATIC_IP > $ROOT_MNT/home/lightatplay/network/IP || exit -1

echo Setting up fstab...
ROOT_UUID=$(blkid -o value $ROOT_DEV | head -n 1)
sed -i.bk 's/UUID=[^ \t]*/UUID='$ROOT_UUID'/' $ROOT_MNT/etc/fstab || exit -1

echo Installing Bootloader...
dd if=/boot/MLO of=$EMMC_DEV count=1 seek=1 conv=notrunc bs=128k || exit -1
dd if=/boot/u-boot.img of=$EMMC_DEV count=2 seek=1 conv=notrunc bs=384k || exit -1

echo
echo 'Success!'
echo