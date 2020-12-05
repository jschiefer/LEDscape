systemctl stop ledscape.service
rm pru/bin/ws281x-rgb-123-v3-pru0.bin
make
#config-pin overlay cape-universal
#config-pin  P9-31 gpio
test -f pru/bin/ws281x-rgb-123-v3-pru0.bin && ./install-service.sh
#config-pin  P9-31 pruout
