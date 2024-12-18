// Load environment variables
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Environment variables
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const COMMAND_CHANNEL_ID = process.env.COMMAND_CHANNEL_ID;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;
const USER_ID = process.env.USER_ID;
const API_URL = process.env.API_URL;

// Function to shorten a URL using TinyURL
const shortenUrl = async (url) => {
    try {
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        return response.data; // Returns the shortened URL directly
    } catch (error) {
        console.error('Error shortening URL:', error);
        return url; // Return the original URL in case of an error
    }
};

// Function to get the latest n courses
const getLatestCourses = async (count) => {
    try {
        // Fetch courses from the API
        const response = await axios.get(API_URL);
        const courses = response.data.Course;

        // Get the specified number of courses
        const latestCourses = courses.slice(0, count);

        // Format the courses into a message (with the shortened enroll link)
        let message = '';
        for (const course of latestCourses) {
            // Shorten the enroll URL using TinyURL
            const shortEnrollUrl = await shortenUrl(course.enrollUrl);

            message += `
**Title**: ${course.title}
**Instructor**: ${course.instructor}
**Rating**: ${course.rate} ⭐
**Duration**: ${course.totalHour} hours
**Enroll Here**: [Click Here](${shortEnrollUrl})
\n`;
        }
        return message;
    } catch (error) {
        console.error('Error fetching courses:', error);
        return null;
    }
};

// Function to send logs to the command channel
const sendLogToCommandChannel = async (message) => {
    const commandChannel = await client.channels.fetch(COMMAND_CHANNEL_ID);
    if (commandChannel) {
        commandChannel.send(message);
    }
};

// Function to send the message in chunks
const sendMessageInChunks = async (channel, messageContent) => {
    const maxLength = 2000; // Discord's character limit
    let startIndex = 0;

    // Split the message into chunks of 2000 characters or less
    while (startIndex < messageContent.length) {
        const chunk = messageContent.slice(startIndex, startIndex + maxLength);
        await channel.send(chunk);
        startIndex += maxLength;
    }
};

// Handle messages
client.on('messageCreate', async (message) => {
    // Ignore messages from bots and ensure the command is from the right channel
    if (message.author.bot || message.channel.id !== COMMAND_CHANNEL_ID) return;

    // Check if the message starts with !fc
    if (message.content.startsWith('!fc')) {
        const args = message.content.split(' ');

        // Check if the user is requesting the last n courses
        if (args[1] && !isNaN(args[1])) {
            const count = parseInt(args[1]);
            const coursesMessage = await getLatestCourses(count);

            sendLogToCommandChannel(`Command received: !fc ${count} - Processing request.`);

            if (coursesMessage) {
                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
                if (targetChannel) {
                    sendMessageInChunks(targetChannel, `<@&${ROLE_ID}> ${coursesMessage}`);
                    sendLogToCommandChannel(`<@${USER_ID}> ${count} courses sent to <#${TARGET_CHANNEL_ID}>.`);
                } else {
                    sendLogToCommandChannel('Target channel not found.');
                }
            } else {
                sendLogToCommandChannel(`<@${USER_ID}> Failed to fetch courses. Please try again later.`);
            }
        } else {
            message.channel.send('Please provide a valid number of courses (e.g., `!fc 5`).');
            sendLogToCommandChannel('Invalid !fc command received (no number or invalid number).');
        }
    }
});

// When the bot is ready
client.once('ready', () => {
    console.log(`Bot launched as ${client.user.tag}. Ready to process commands.`);
    sendLogToCommandChannel(`Bot launched as ${client.user.tag}. Ready to process commands.`);
});

// Login to Discord with your app's token
client.login(TOKEN);
