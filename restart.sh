systemctl stop ledscape.service
rm pru/bin/ws281x-rgb-123-v3-pru0.bin
make
test -f pru/bin/ws281x-rgb-123-v3-pru0.bin && ./install-service.sh
