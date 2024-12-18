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

// Your Discord bot token
const TOKEN = 'YOUR_DISCORD_BOT_TOKEN';  // Replace with your actual bot token

// The specific channel ID where the bot will listen for commands (replace with your actual command channel ID)
const COMMAND_CHANNEL_ID = 'YOUR_COMMAND_CHANNEL_ID';  // Replace with the channel ID you want to receive commands in

// The channel ID where the bot will send the course details (replace with your actual target channel ID)
const TARGET_CHANNEL_ID = 'YOUR_TARGET_CHANNEL_ID';  // Replace with the channel ID you want to send messages to

// The role ID to mention (replace with your actual role ID)
const ROLE_ID = 'YOUR_ROLE_ID';  // Replace with the role ID you want to mention

// Your Discord user ID (replace with your actual user ID)
const USER_ID = 'YOUR_DISCORD_USER_ID';

// Udemy API endpoint
const API_URL = 'https://www.courspora.my.id/api/course';

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

        // // Construct the error message for the command channel
        // const errorMessage = `<@409651686752256001> Failed to fetch courses. Please try again later.`;

        // // Send the error message to the command channel
        // sendLogToCommandChannel(errorMessage);

        // Return null to indicate failure in fetching
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
    const maxLength = 2000;  // Corrected to 2000 characters (Discord's limit)
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
            // Send the log to the command channel
            sendLogToCommandChannel(`Command received: !fc ${count} - Processing request.`);
            if (coursesMessage) {
                // Send the courses message to the target channel
                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
                if (targetChannel) {
                    // Send the courses in chunks to avoid the 2000-character limit
                    sendMessageInChunks(targetChannel, `<@&${ROLE_ID}> ${coursesMessage}`);
                    const successMessage = `<@${USER_ID}> ${count} courses send to <#${TARGET_CHANNEL_ID}>.`;
                    sendLogToCommandChannel(successMessage);
                } else {
                    sendLogToCommandChannel("Target channel not found.");
                }
            } else {
                // Log failure in the command channel
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
