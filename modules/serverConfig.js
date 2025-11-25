const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { cloneRepo, updateSubmodules, getGitInstance } = require('./gitOperations');
const { startWebSocketServer } = require('./fileWatcher');
const portfinder = require('portfinder');
const fs = require('fs-extra'); // Sicherstellen, dass fs-extra importiert ist
const sharp = require('sharp');

const setupServer = async () => {
    await cloneRepo();
    await updateSubmodules();

    const projectFolder = process.argv[2] || path.join(__dirname, '..', 'project');
    const downloadFolder = path.join(projectFolder, 'download');
    const app = express();

    fs.ensureDirSync(projectFolder);
    fs.ensureDirSync(downloadFolder);

    app.use(bodyParser.json({ limit: '100mb' }));

    app.use((req, res, next) => {
        if (req.path === '/') {
            res.redirect('/project');
        } else {
            next();
        }
    });

    app.use('/project', express.static(path.resolve(projectFolder)));

    app.get('/project/*', (req, res) => {
        res.sendFile(path.resolve(projectFolder, 'index.html'));
    });

    app.get('/ws-port', (req, res) => {
        if (global.wsPort) {
            res.json({ wsPort: global.wsPort });
        } else {
            res.status(500).json({ error: 'WebSocket port not available' });
        }
    });

    const git = getGitInstance();


    app.post('/save-canvas', async (req, res) => {
        try {
            const imgData = req.body.image;
            const hash = req.body.hash;
            const gui = req.body.gui;
            const base64Data = imgData.replace(/^data:image\/png;base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');

            const variablesPath = path.join(projectFolder, 'variables.json');
            await fs.writeJson(variablesPath, gui, { spaces: 2 });

            await git.add('./*');
            const commitMessage = `${new Date().toISOString()} / hash: ${hash}`;
            await git.commit(commitMessage);
            const log = await git.log();
            const commitHash = log.latest.hash;

            const timeStamp = getTimestamp();
            const fileName = `${timeStamp}_${commitHash}_${hash}.png`;
            const filePath = path.join(downloadFolder, fileName);

            await fs.writeFile(filePath, base64Data, 'base64');

            const outputFileName = `${timeStamp}_${commitHash}_${hash}_s.webp`;
            const outputFilePath = path.join(downloadFolder, outputFileName);
            await sharp(imgBuffer).resize({ width: 1000 }).toFormat('webp').toFile(outputFilePath);

            res.status(200).json({ success: true, message: 'Image saved successfully', filePath });
        } catch (err) {
            console.error('Error during git operations:', err);
            res.status(500).json({ success: false, message: 'Error during git operations' });
        }
    });

    app.get('/commits', async (req, res) => {
        try {
            const log = await git.log(['--reflog']);
            res.json(log.all);
        } catch (err) {
            console.error('Error fetching commits:', err);
            res.status(500).json({ success: false, message: 'Error fetching commits' });
        }
    });

    app.post('/checkout', async (req, res) => {
        const commitHash = req.body.commitHash;
        try {
            await git.checkout(commitHash);
            res.status(200).json({ success: true, message: `Checked out commit ${commitHash}` });
        } catch (err) {
            console.error('Error checking out commit:', err);
            res.status(500).json({ success: false, message: 'Error checking out commit' });
        }
    });

    app.use('/timemachine', express.static(path.resolve(__dirname, '..', 'timemachine')));
    app.get('/timemachine', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'timemachine/index.html'));
    });

    const getTimestamp = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    };

    portfinder.getPortPromise().then((port) => {
        global.wsPort = port;
        startWebSocketServer(port, projectFolder);
    }).catch((err) => {
        console.error('No free port found for WebSocket server:', err);
    });

    return app;
};

module.exports = {
    setupServer
};
