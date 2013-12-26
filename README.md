proxy-mirror
============

proxy-mirror is a very simple http sniffer running on node. 

While [Charles](http://www.charlesproxy.com/), [HTTP Scoop](http://www.tuffcode.com/) work well and they are worth the price I think it's still usefull to have **a free** alternative. 

For Windows there is an invaluable [Fiddler](http://fiddler2.com/) and while its possible to use it from Mac or Linux it seems to me that running a virtual machine just for it is an overkill.

Features
-----

Right now proxy-mirror only handles http and displayes request response list with a simple detailed view. 
*If only a day would be longer...* 

Installation &amp; Usage
-----
I'll prepare an npm module soon for now the only way to use proxy-mirror is to clone the repo
```bash
git clone git@github.com:miensol/proxy-mirror.git
cd proxy-mirror
npm install
bower install
```

You'll then need to start the proxy
```bash
node index.js
```

and configure your system to use proxy which is listening at `localhost:8888` there are script utils for that
- windows - `./setup-proxy.ps1 -Enable/-Disable`
- mac - `./setup-proxy.sh -enable/-disable`

To see and sniff around http traffic navigate to `http://localhost:8889` and you should be able to see the following:
