#!/bin/sh

function generateCertificate {
    rm -rf cert/*.key cert/*.csr cert/*.crt
    pushd cert
    openssl genrsa -des3 -passout pass:x -out proxy-mirror.pass.key 2048
    echo "Generated proxy-mirror.pass.key"
    openssl rsa -passin pass:x -in proxy-mirror.pass.key -out proxy-mirror.key
    rm proxy-mirror.pass.key
    echo "Generated proxy-mirror.key"
     openssl req -new -batch -key proxy-mirror.key -out proxy-mirror.csr -subj /CN=proxy-mirror/emailAddress=piotr.mionskowski@gmail.com/OU=proxy-mirror/C=PL/O=proxy-mirror
    echo "Generated proxy-mirror.csr"
    openssl x509 -req -days 365 -in proxy-mirror.csr -signkey proxy-mirror.key -out proxy-mirror.crt
    echo "Generated proxy-mirror.crt"
    popd
}

function installFakeCert {
    generateCertificate
    sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" ./cert/proxy-mirror.crt
}

function uninstallFakeCert {
    sudo security delete-certificate -c "proxy-mirror" "/Library/Keychains/System.keychain"
}


case "$1" in
"-enable")
    installFakeCert
    ;;
"-disable")
    uninstallFakeCert
    ;;
*)
    echo "Usage: ./setup-certificate -enable or -disable"
    exit 1
    ;;
esac

