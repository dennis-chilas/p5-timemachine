# P5 Timemachine

This is an environment to develop p5.js projects. The main feature is to handle screenshots and corresponding code from a p5.js script. Therefore it's heavily inspired by [canvas-sketch](https://github.com/mattdesl/canvas-sketch) from [Matt DesLauriers](https://github.com/mattdesl), the screenshots are located in the project folder, where they are tracked by git and named after their git commit hash. The server has a visual tool built in to listing all commits and display the according screenshots in a discrete webview. In the boilerplate p5.js project is the functionality of hash seeds and a gui library ([dat.gui](https://github.com/dataarts/dat.gui)) integrated. The hash seeds are also saved in the git commit and in the screenshot filename. 

I use this starter kit for teaching classes, therefore the code organisation is just basic, hopefully understandable for beginners.

## Disclaimer
This project is a beta version and is primarily intended for educational and student use.
It is provided as is, without any warranties or guarantees of any kind.

The authors take no responsibility for data loss, corrupted files, or other issues that may arise from using this software.
Please make sure to backup your work regularly and use this tool at your own risk.

## requirements
node.js needs to be installed. e.g. for MacOS, install [homebrew](https://www.homebrew.sh) then

```
brew install node
```


## install
To install the environment download zip and unpack or clone the repository.

Install all dependencies:

```
npm install
```


## starting
The p5.js template [see repo here](https://github.com/dennis-chilas/p5-project) loaded as a submodule automatically to project/ - in this folder is the source code and a download folder. All screenshots/image exports are saved in project/download/
The script searches for a free port for the webserver and for websockets (for browser auto refresh...) and logs on the command line.

```
node server.js

----------
Cloning the repository...
Repository cloned.
Initializing submodules...
Submodules initialized.
Updating submodules...
Submodules updated.
Project is hosted on http://localhost:3007
WebSocket server is running on ws://localhost:8000
```

The visual view is under the project url /timemachine... in my case http://localhost:3007/timemachine

[![example](https://upload.dennis-chilas.de/p5devkit-2.jpg)](https://upload.dennis-chilas.de/p5devkit.mp4)
