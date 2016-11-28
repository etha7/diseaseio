all:
	sudo rm -r node_modules
	sudo npm install
	sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
	sudo npm install node-easel
	sudo npm install browserify
	sudo npm install socket.io@1.5.1
	browserify public/js/mainGame.js -o public/js/bundle.js -d
	node app.js
