# Major

Major Bot is a Node.js script created to automate various operations like, processing accounts, and sending requests. The bot supports multiple accounts and includes functionalities such as squad joining, handling coins, and more.)

## Features

- Process multiple accounts and URLs from a file.
- Send requests for tasks such as:
  - Visiting URLs
  - Joining squads
  - Handling coins, swipe coins, and Pavel coins.
  - Completing daily tasks.
  - Handling error cases and retrying failed requests.
- Automatic token refresh for each account.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ada682/major-bot.git

2. Navigate to the project directory:

   ```bash
   cd major-bot

3. Install dependencies:

   ```bash
   npm install

# 4. urls.txt file in the root directory and add the list of URLs (one per line) that the bot will process.

  ## step 1
   -open major apps and turn off all your connection , then refresh the major apps , then you will see full of urls there , copy and paste to urls.txt

  ## step 2
   -on telegramweb = open major - inspect element - scroll up - you will see iframe , - copy that full of url , then paste to urls.txt

   example on urls.txt file

 # Usage

 - start the bot
   ```bash
   npm start

 # License

This project is licensed under the MIT License - see the LICENSE file for details.
Feel free to modify or expand on this as needed!



