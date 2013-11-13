param([switch]$enable,[switch]$disable)
$proxyServer = "localhost"
$proxyPort     = "8888"

$Path   = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

$Proxy = "http=$($proxyServer):$($proxyPort)"

# Enable an explicit proxy
if($enable){
    Set-ItemProperty -Path $path -Name ProxyEnable -Value 1          #Enable the explicit proxy

    Set-ItemProperty -Path $path -Name ProxyServer -Value $Proxy #Configure the server settings    
}
if($disable){
# Disable an explicit proxy

Set-ItemProperty -Path $path -Name ProxyEnable -Value 0 #Disable the explicit proxy    
}

