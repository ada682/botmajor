const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const querystring = require('querystring');
const chalk = require('chalk');
const gradient = require('gradient-string');
const boxen = require('boxen');
const { displayIntro, displayLog } = require('./src/display');

class UrlInfo {
    constructor(path, token = '') {
        this.path = path;
        this.token = token;
    }
}

class RequestInfo {
    constructor(url, firstName, nextRequestTime) {
        this.url = url;
        this.firstName = firstName;
        this.nextRequestTime = nextRequestTime;
    }
}

let urls = [];
let timers = [];
let requestInfos = [];
let random = Math.random;
let claimTimers = [];
let timerVisit = [];
const currentDirectory = process.cwd();

async function main() {
    displayIntro();

    try {
        const filePath = path.join(process.cwd(), 'urls.txt');
        await ensureFileExists(filePath);

        const fileContent = await fs.readFile(filePath, 'utf-8');
        urls = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .map(line => new UrlInfo(line));

        await initTokens();
        setInterval(initTokens, 4 * 60 * 60 * 1000);

        for (const url of urls) {
        colorLog('info', `Processing account: ${await getAccountInfo(url)}`);
        await processUrl(url);
        colorLog('info', `Finished processing account: ${await getAccountInfo(url)}`);
    }

        process.stdin.resume();
    } catch (ex) {
        colorLog('error', `[ErrorMain] An error occurred in Main: ${ex.message}`);
    }
}

async function ensureFileExists(filePath) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, '');
        displayLog("File 'urls.txt' not found, creating an empty file.");
        displayLog("Please input URL token in 'urls.txt' and rerun.");
        process.exit(1);
    }
}

function colorLog(type, message, accountInfo = '') {
    const timestamp = new Date().toLocaleString();
    let coloredMessage;
    let icon;
    switch (type) {
        case 'info':
            coloredMessage = chalk.blue(message);
            icon = chalk.blue('ℹ');
            break;
        case 'success':
            coloredMessage = chalk.green(message);
            icon = chalk.green('✔');
            break;
        case 'error':
            coloredMessage = chalk.red(message);
            icon = chalk.red('✖');
            break;
        case 'warning':
            coloredMessage = chalk.yellow(message);
            icon = chalk.yellow('⚠');
            break;
        default:
            coloredMessage = chalk.white(message);
            icon = chalk.white('•');
    }
    console.log(`${icon} ${chalk.gray(`[${timestamp}]`)} ${chalk.cyan(accountInfo)} ${coloredMessage}`);
}

async function processUrl(url) {
    const accountInfo = await getAccountInfo(url);
    colorLog('info', `Processing account: ${accountInfo}`);

    try {
        await joinSquadRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in joinSquadRequest: ${error.message}`, accountInfo);
    }

    try {
        await handleTasks(url.token, accountInfo);
    } catch (error) {
        colorLog('error', `Error in handleTasks: ${error.message}`, accountInfo);
    }

    try {
        await sendVisitRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in sendVisitRequest: ${error.message}`, accountInfo);
    }

    try {
        await sendRouletteRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in sendRouletteRequest: ${error.message}`, accountInfo);
    }

    try {
        await sendCoinsRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in sendCoinsRequest: ${error.message}`, accountInfo);
    }

    try {
        await sendSwipeCoinsRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in sendSwipeCoinsRequest: ${error.message}`, accountInfo);
    }

    try {
        await sendPavelCoinsRequest(url, accountInfo);
    } catch (error) {
        colorLog('error', `Error in sendPavelCoinsRequest: ${error.message}`, accountInfo);
    }

    colorLog('info', `Finished processing account: ${accountInfo}`);
}

async function getAccountInfo(url) {
    try {
        let uri;
        let isValidUri = false;
        try {
            uri = new URL(url.path);
            isValidUri = true;
        } catch {
            isValidUri = false;
            return `[Invalid URL]`;
        }

        let queryData;
        if (isValidUri && uri.hash.includes('tgWebAppData')) {
            const query = querystring.parse(uri.hash.slice(1));
            queryData = query.tgWebAppData;
        } else if (isValidUri) {
            queryData = uri.search;
        } else {
            queryData = url.path;
        }

        const decodedData = decodeURIComponent(queryData);
        const keyValuePairs = querystring.parse(decodedData);
        const userDataJson = keyValuePairs.user;

        if (!userDataJson) {
            return `[No user data]`;
        }

        const userData = JSON.parse(userDataJson);
        const userId = userData.id;
        const firstName = userData.first_name || 'No name';
        const lastName = userData.last_name || '';
        const username = userData.username || '';

        return `[${userId}_${firstName}${lastName ? ' ' + lastName : ''}${username ? ' (@' + username + ')' : ''}]`;
    } catch (ex) {
        console.log(`Error in getAccountInfo: ${ex.message}`);
        return `[Error: ${ex.message}]`;
    }
}

async function initTokens() {
    try {
        for (const url of urls) {
            try {
                await new Promise(resolve => setTimeout(resolve, 4000));
                await sendRequest(url);
            } catch (ex) {
                console.log(`[ErrorInitTokens]==>An error occurred while processing URL: ${url.path}. Error: ${ex.message}`);
            }
        }
    } catch (ex) {
        console.log(`[ErrorInitTokens]==>An error occurred: ${ex.message}`);
    }
}

async function sendRequest(url) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        let uri;
        let isValidUri = false;
        try {
            uri = new URL(url.path);
            isValidUri = true;
        } catch {
            isValidUri = false;
        }

        let queryData;
        if (isValidUri && uri.hash.includes('tgWebAppData')) {
            const query = querystring.parse(uri.hash.slice(1));
            queryData = query.tgWebAppData;
        } else if (isValidUri) {
            queryData = uri.search;
        } else {
            queryData = url.path;
        }

        const decodedData = decodeURIComponent(queryData);
        const keyValuePairs = querystring.parse(decodedData);
        const userDataJson = keyValuePairs.user;

        if (!userDataJson) {
            console.log(`[ErrorSendRequest]==>No user data found in input: ${url.path}`);
            return;
        }

        const userData = JSON.parse(userDataJson);
        const devAuthData = userData.id;
        const firstName = userData.first_name;
        const accountInfo = `[${devAuthData}_${firstName}]`;

        const tokenFilePath = path.join(currentDirectory, 'tokens.json');
        const accountKey = devAuthData.toString();

        let token = await getStoredToken(tokenFilePath, accountKey);
        if (!token) {
            token = await getNewToken(queryData, accountInfo);
            if (token) {
                await saveToken(tokenFilePath, accountKey, token);
            }
        }

        if (token) {
            url.token = token;
            const success = await sendSecondRequest(token, accountInfo);
            if (!success) {
                token = await getNewToken(queryData, accountInfo);
                if (token) {
                    await saveToken(tokenFilePath, accountKey, token);
                    url.token = token;
                    await sendSecondRequest(token, accountInfo);
                }
            }
        }
    } catch (ex) {
        console.log(`[ErrorSendRequest]==>An error occurred: ${ex.message}`);
    }
}

async function getStoredToken(filePath, accountKey) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const tokens = JSON.parse(data);
        return tokens[accountKey];
    } catch {
        return null;
    }
}

async function saveToken(filePath, accountKey, token) {
    let tokens = {};
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        tokens = JSON.parse(data);
    } catch {}

    tokens[accountKey] = token;
    await fs.writeFile(filePath, JSON.stringify(tokens));
}

async function getNewToken(tgWebAppData, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await axios.post('https://major.glados.app/api/auth/tg/', {
            init_data: tgWebAppData
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            }
        });

        if (response.status === 504) {
            console.log(`${accountInfo}[ErrorGetNewToken]==>request failed with status code: ${response.status}`);
            console.log(`${accountInfo}[ErrorGetNewToken]==>im Trying Again...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await getNewToken(tgWebAppData, accountInfo);
        }

        if (response.status === 200) {
            console.log(`${accountInfo}==>Token received successfully.`);
            const accessToken = response.data.access_token;
            console.log(`${accountInfo}==>Access Token: ${accessToken}`);
            return accessToken;
        } else {
            console.log(`${accountInfo}[ErrorGetNewToken]==>Request failed with status code: ${response.status}`);
            return null;
        }
    } catch (ex) {
        console.log(`${accountInfo}[ErrorGetNewToken]==>An error occurred: ${ex.message}`);
        return null;
    }
}

async function sendSecondRequest(token, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await axios.get('https://major.glados.app/api/tasks/?is_daily=true', {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'authorization': `Bearer ${token}`,
                'referer': 'https://major.glados.app/earn',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127", "Microsoft Edge WebView2";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
            }
        });

        if (response.status === 504) {
            console.log(`${accountInfo}[Visit]==>Visit request failed with status code: ${response.status}`);
            console.log(`${accountInfo}[ErrorVisit]==>im Trying Again...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await sendSecondRequest(token, accountInfo);
        }

        if (response.status === 200) {
            console.log(`${accountInfo}==>Task list received successfully.`);
            const jsonResponse = response.data;

            const taskTitles = await downloadTaskTitles('https://raw.githubusercontent.com/chitoz1300/REXBOT/main/Major.txt');

            for (const title of taskTitles) {
                const task = jsonResponse.find(t => t.title === title);
                if (task) {
                    const taskId = task.id;
                    console.log(`${accountInfo}==>Found task ID for '${title}': ${taskId}`);

                    await sendTaskRequest(token, taskId, accountInfo);
                } else {
                    console.log(`${accountInfo}==>Task '${title}' not found.`);
                }
            }

            return true;
        } else {
            console.log(`${accountInfo}==>Second request failed with status code: ${response.status}`);
            console.log(response.data);
            return false;
        }
    } catch (ex) {
        console.log(`${accountInfo}==>An error occurred in the second request: ${ex.message}`);
        return false;
    }
}

async function downloadTaskTitles(url) {
    const response = await axios.get(url);
    return response.data.split(/\r?\n/).filter(line => line.trim() !== '');
}

async function gettask(token) {
    try {
        const response = await axios.get('https://major.bot/api/tasks/?is_daily=true', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://major.bot/earn',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127", "Microsoft Edge WebView2";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
            }
        });

        if (response.status === 200) {
            return response.data;
        } else {
            console.log(`Failed to get tasks. Status: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error in gettask: ${error.message}`);
        return null;
    }
}

async function donetask(token, payload) {
    try {
        const response = await axios.post('https://major.bot/api/tasks/', payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'origin': 'https://major.bot',
                'referer': 'https://major.bot/earn',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
            }
        });

        if (response.status === 200) {
            return response.data;
        } else if (response.status === 201) {
            console.log(`Task created successfully. Status: ${response.status}`);
            return response.data;
        } else {
            console.log(`Failed to complete task. Status: ${response.status}`);
            console.log(response.data);
            return null;
        }
    } catch (error) {
        console.error(`Error in donetask: ${error.message}`);
        if (error.response) {
            console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
        }
        return null;
    }
}

async function handleTasks(token, accountInfo) {
    const data_task = await gettask(token);
    if (data_task && data_task.length > 0) {
        for (const task of data_task) {
            const { id, type, title, award } = task;
            if (!["One-time Stars Purchase", "Binance x TON", "Status Purchase"].includes(title)) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const payload = { task_id: id };
                const data_done = await donetask(token, payload);
                if (data_done) {
                    colorLog('success', `Task: ${title} | Reward: ${award} | Status: ${data_done.is_completed}`, accountInfo);
                }
            }
        }
    } else {
        colorLog('info', 'No tasks available', accountInfo);
    }
}

async function sendTaskRequest(token, taskId, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await axios.post('https://major.glados.app/api/tasks/', {
            task_id: taskId
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'authorization': `Bearer ${token}`,
                'content-type': 'application/json',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/earn',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127", "Microsoft Edge WebView2";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
            }
        });

        if (response.status === 400 && response.data.detail === "Task is already completed") {
            console.log(`${accountInfo}[SendTask]==>Task '${taskId}' is already completed.`);
            console.log('Moving to the next task/account...'); 
            return;
        }

        if (response.status === 200) {
            console.log(`${accountInfo}[SendTask]==>Task '${taskId}' successfully triggered.`);
        }

    } catch (ex) {
        console.log(`${accountInfo}[ErrorSendTask]==>An error occurred: ${ex.message}`);
        if (ex.response && ex.response.status === 400) {
            console.log(`${accountInfo}[ErrorSendTask]==>Status: 400, Response: ${JSON.stringify(ex.response.data)}`);
        }
        console.log('Moving to the next task/account...');  
        return;  
    }
}

async function sendRouletteRequest(url, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await axios.post('https://major.glados.app/api/roulette/', {}, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-length': '0',
                'dnt': '1',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/reward',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            }
        });

        if (response.status === 200 || response.status === 201) {
            const jsonResponse = response.data;
            if (jsonResponse.rating_award != null) {
                colorLog('success', `Roulette successful. Rating Award: ${jsonResponse.rating_award}`, accountInfo);
            } else {
                colorLog('info', `Roulette successful, but no rating award.`, accountInfo);
            }
        } else if (response.status === 400) {
            if (!await handle400Error(response, accountInfo, 'Roulette')) {
                throw new Error('Roulette on cooldown');
            }
        } else {
            colorLog('error', `Roulette request failed with status code: ${response.status}`, accountInfo);
        }
    } catch (ex) {
        colorLog('error', `An error occurred in the roulette request: ${ex.message}`, accountInfo);
        if (ex.response && ex.response.status === 400) {
            if (await handle400Error(ex.response, accountInfo, 'Roulette')) {
                return await sendRouletteRequest(url, accountInfo);
            }
        }
    }
}

async function sendCoinsRequest(url, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const randomCoins = Math.floor(Math.random() * (914 - 890 + 1)) + 890;

        const response = await axios.post('https://major.glados.app/api/bonuses/coins/', {
            coins: randomCoins
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/reward',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });

        if (response.status === 504) {
            console.log(`${accountInfo}[ErrorCoin]==>request failed with status code: ${response.status}`);
            console.log(`${accountInfo}[ErrorCoin]==>im Trying Again...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await sendCoinsRequest(url, accountInfo);
        }

        if (response.status === 401) {
            console.log(`${accountInfo}[Visit]==>Unauthorized, attempting to refresh token...`);
            const newToken = await getNewTokenFromRequest(url);
            if (newToken) {
                url.token = newToken;
                return await sendCoinsRequest(url, accountInfo);
            }
        }

        if (typeof response.data === 'string' && response.data.includes('Not Found')) {
            console.log(`${accountInfo}[ErrorSendCoinsNOTFOUND!]==>request failed with status code: ${response.status}`);
            return;
        }

        if (response.status === 200 || response.status === 201) {
            colorLog('success', `Coins request succeeded with ${randomCoins} coins.`, accountInfo);
        } else if (response.status === 400) {
            if (await handle400Error(response, accountInfo, 'Coins')) {
                return await sendCoinsRequest(url, accountInfo);
            }
        } else {
            colorLog('error', `Coins request failed with status code: ${response.status}`, accountInfo);
        }
    } catch (ex) {
        colorLog('error', `An error occurred in the coins request: ${ex.message}`, accountInfo);
        if (ex.response && ex.response.status === 400) {
            if (await handle400Error(ex.response, accountInfo, 'Coins')) {
                return await sendCoinsRequest(url, accountInfo);
            }
        }
    }
}

async function handle400Error(response, accountInfo, actionName) {
    if (response.data && response.data.detail && response.data.detail.blocked_until) {
        const blockedUntil = response.data.detail.blocked_until;
        const blockedTime = new Date(blockedUntil * 1000);
        const waitTime = blockedTime - new Date() + 5 * 60 * 1000; 
        colorLog('warning', `${actionName} already completed. Waiting until: ${blockedTime}. Total wait: ${waitTime / 60000} minutes`, accountInfo);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return true; 
    }
    return false; 
}

async function sendSwipeCoinsRequest(url, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const randomCoins = Math.floor(Math.random() * (2980 - 2880 + 1)) + 2880;

        const response = await axios.post('https://major.glados.app/api/swipe_coin/', {
            coins: randomCoins
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/reward',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });

        if (response.status === 200 || response.status === 201) {
            colorLog('success', `Swipe Coins request succeeded with ${randomCoins} coins.`, accountInfo);
        } else if (response.status === 400) {
            if (await handle400Error(response, accountInfo, 'Swipe Coins')) {
                return await sendSwipeCoinsRequest(url, accountInfo);
            }
        } else {
            colorLog('error', `Swipe Coins request failed with status code: ${response.status}`, accountInfo);
        }
    } catch (ex) {
        colorLog('error', `An error occurred in the Swipe Coins request: ${ex.message}`, accountInfo);
        if (ex.response && ex.response.status === 400) {
            if (await handle400Error(ex.response, accountInfo, 'Swipe Coins')) {
                return await sendSwipeCoinsRequest(url, accountInfo);
            }
        }
    }
}

async function getJsonFromUrl(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching JSON from ${url}: ${error.message}`);
        return null;
    }
}

async function sendPavelCoinsRequest(url, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const jsonData = await getJsonFromUrl('https://raw.githubusercontent.com/chitoz1300/REXBOT/main/Pavelmajor.json');

        if (!jsonData) {
            console.log(`${accountInfo}[PavelCoins]==>Failed to fetch JSON data`);
            return;
        }

        const response = await axios.post('https://major.bot/api/durov/', jsonData, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.bot',
                'referer': 'https://major.bot/reward',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });

        if (response.status === 200 || response.status === 201) {
            colorLog('success', `Pavel Coins request succeeded with data from Pavelmajor.json`, accountInfo);
        } else if (response.status === 400) {
            if (await handle400Error(response, accountInfo, 'Pavel Coins')) {
                return await sendPavelCoinsRequest(url, accountInfo);
            }
        } else {
            colorLog('warning', `Pavel Coins request returned unexpected status code: ${response.status}`, accountInfo);
        }
    } catch (ex) {
        colorLog('error', `An error occurred in the Pavel coins request: ${ex.message}`, accountInfo);
        if (ex.response && ex.response.status === 400) {
            if (await handle400Error(ex.response, accountInfo, 'Pavel Coins')) {
                return await sendPavelCoinsRequest(url, accountInfo);
            }
        }
    }
}


async function joinSquadRequest(url, accountInfo) {
    try {
        const response = await axios.post('https://major.bot/api/squads/2416499148/join/', {}, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.bot',
                'referer': 'https://major.bot/api/squads/2416499148/',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });

         if (response.status === 400 && response.data.detail && response.data.detail.title === "User with is already a member of squad") {
            console.log(`${accountInfo}==>User is already a member of the squad.`);
            console.log('Moving to the next task/account...');
            return;
        }

        if (response.status === 200) {
            console.log(`${accountInfo}==>Successfully joined the squad.`);
        }

    } catch (ex) {
        console.log(`${accountInfo}[ErrorJoinSquad]==>An error occurred: ${ex.message}`);
        if (ex.response && ex.response.status === 400) {
            console.log(`${accountInfo}[ErrorJoinSquad]==>Status: 400, Response: ${JSON.stringify(ex.response.data)}`);
        }
        console.log('Moving to the next task/account...');  
        return; 
    }
}

async function sendVisitRequest(url, accountInfo) {
    try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await axios.post('https://major.glados.app/api/user-visits/visit/', {}, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
                'authorization': `Bearer ${url.token}`,
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://major.glados.app',
                'referer': 'https://major.glados.app/reward',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });
		
		if (response.status === 200) {
            console.log(`${accountInfo} Successfully sent visit request.`);
        } else {
            console.log(`${accountInfo} Visit request failed: ${response.status} - ${response.data}`);
        }
    } catch (ex) {
        console.log(`${accountInfo} Error in visit request: ${ex.message}`);
    }
}

async function getNewTokenFromRequest(url) {
    try {
        await sendRequest(url);
        return url.token;
    } catch (ex) {
        console.log(`An error occurred while refreshing token: ${ex.message}`);
        return null;
    }
}

function logError(message) {
    const logFilePath = path.join(currentDirectory, 'log.txt');
    const logMessage = `[ERROR] => ${message}`;
    fs.appendFile(logFilePath, logMessage + '\n');
}

process.on('uncaughtException', function (err) {
    colorLog('error', 'Caught exception: ' + err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

main();
