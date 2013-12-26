#!/bin/sh

function enableProxy {
  networksetup -setwebproxy 'Wi-Fi' localhost 8888 off
  networksetup -setwebproxystate 'Wi-Fi' on
  echo "Enabled proxy"
}

function disableProxy {
  networksetup -setwebproxystate 'Wi-Fi' off
  echo "Disabled proxy"
}

case "$1" in
"-enable")
    enableProxy
    ;;
"-disable")
    disableProxy
    ;;
*)
    echo "Usage: ./setup-proxy -enable or -disable"
    exit 1
    ;;
esac