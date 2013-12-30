#!/bin/sh

function enableProxy {
  networksetup -setproxybypassdomains 'Wi-Fi' 'proxy-mirror'
  networksetup -setwebproxy 'Wi-Fi' localhost 8888 off
  networksetup -setwebproxystate 'Wi-Fi' on
  networksetup -setsecurewebproxy 'Wi-Fi' localhost 8888 off
  networksetup -setsecurewebproxystate 'Wi-Fi' on
  echo "Enabled proxy"
}

function disableProxy {
  networksetup -setwebproxystate 'Wi-Fi' off
  networksetup -setsecurewebproxystate 'Wi-Fi' off
  echo "Disabled proxy"
}

if ! grep -F "proxy-mirror" /etc/hosts ; then 
  echo "127.0.0.1\tproxy-mirror\n" | sudo tee -a /etc/hosts
fi


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