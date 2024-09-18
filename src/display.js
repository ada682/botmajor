const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const boxen = require('boxen');

function displayIntro() {
    const title = figlet.textSync('Major Bot', { horizontalLayout: 'full' });
    const coloredTitle = gradient.pastel.multiline(title);
    
    const box = boxen(coloredTitle, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan'
    });

    console.log(box);
    console.log(gradient.rainbow('='.repeat(50)));
    console.log(chalk.green('Development by t.me/slyntherinnn'));
    console.log(gradient.rainbow('='.repeat(50)));
}

function displayLog(message, type = 'info') {
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
            coloredMessage = gradient.rainbow(message);
            icon = chalk.white('•');
    }
    const logMessage = `${icon} ${chalk.gray(`[${timestamp}]`)} ${coloredMessage}`;
    console.log(boxen(logMessage, { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }));
}

module.exports = {
    displayIntro,
    displayLog
};
