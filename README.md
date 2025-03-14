# Free Course Discord Bot

A Discord bot that provides free course recommendations using the [Courspora API](https://www.courspora.my.id/api/course).

## Features

- Fetches free course information from Courspora API.
- Provides course details directly in your Discord server.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- [Node.js](https://nodejs.org/) installed on your system.
- A Discord bot token. Learn how to get one [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html).
- Basic knowledge of Discord bot development.

## Installation

Follow these steps to set up the bot:

1. Clone the repository or download the source code:

   ```bash
   git clone https://github.com/your-username/free-course-discord-bot.git
   cd free-course-discord-bot
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

   This command will install the following packages:

   - `discord.js`: Library for interacting with the Discord API.
   - `axios`: Library for making HTTP requests.
   - `dotenv`: Tool for managing environment variables.
   - `nodemon`: Tool for automatically restarting the node application when file changes are detected.

3. Change the variables in the `.env` file in the project root directory to the following:

   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   COMMAND_CHANNEL_ID=your_command_channel_id
   TARGET_CHANNEL_ID=your_target_channel_id
   ROLE_ID=your_role_id
   USER_ID=your_user_id
   API_URL=https://www.courspora.my.id/api/course
   ```

4. Run the bot:
   ```bash
   nodemon bot.js
   ```

## Usage

1. Invite the bot to your server using the OAuth2 URL from your Discord Developer Portal.
2. Use the predefined commands to fetch and display free courses.

## Example Command

Command to fetch and display free courses:

```bash
!fc <number>
```

The bot will respond with a list of the latest `<number>` free courses fetched from the Courspora API. Replace `<number>` with the desired amount of courses to retrieve.

## API Details

The bot uses the [Courspora API](https://www.courspora.my.id/api/course) to fetch course details. Ensure that the API is accessible from your server.

## Disclaimer

This project is intended for educational purposes only. If any parties have concerns or objections, please contact me via Discord at username: `naichiii`.

## Contributing

If you want to contribute to this project:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch-name`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch-name`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
