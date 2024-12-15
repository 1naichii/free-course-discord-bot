const puppeteer = require("puppeteer");
const { Client, GatewayIntentBits } = require("discord.js");
const token = "MTMxNzU1NDc3NTEwMTAxNDE1Ng.GShWJi.equ-JPASqZKw4hSZail8dpM9vPMPv66ICuxOK8"; // Ganti dengan token bot Discord Anda

// Membuat instance bot Discord
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Channel ID dan Role ID untuk mention
const channelId = "1314511842881568789"; // ID channel yang diinginkan
const roleId = "1316106397724966992"; // ID role yang ingin disebutkan

let lastArticleTimestamp = null; // Untuk menyimpan timestamp artikel terakhir yang sudah dikirim

// Fungsi untuk mengambil artikel terbaru dari website
async function scrapeLatestCourses(limit = 5) {
    const browser = await puppeteer.launch({
        headless: false, // Disable headless mode for debugging
        defaultViewport: null, // Optional: to avoid viewport size issues
    });
    const page = await browser.newPage();

    // Set User-Agent and add Timeout
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Set request interception to block unnecessary requests
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        if (request.resourceType() === "document") {
            request.continue(); // Allow only document resources (block images, CSS, etc.)
        } else {
            request.abort(); // Block non-document resources
        }
    });

    // Go to the page and wait for it to load
    try {
        await page.goto("https://www.courspora.my.id/course", {
            waitUntil: "domcontentloaded", // Wait for DOM content to load
            timeout: 90000, // Timeout 90 seconds for slow pages
        });

        // Wait for the page to load dynamic content rendered by React (this selector can vary based on actual page structure)
        await page.waitForSelector('.course-card', { timeout: 30000 }); // Adjust this selector based on actual page structure
    } catch (error) {
        console.log("Page failed to load:", error);
        await browser.close();
        return [];
    }

    // Ambil informasi kursus terbaru
    const courses = await page.evaluate(() => {
        const courseElements = document.querySelectorAll(".course-card"); // Ganti selector sesuai dengan struktur halaman
        const courseInfo = [];

        courseElements.forEach((course) => {
            const title = course.querySelector(".course-title")
                ? course.querySelector(".course-title").innerText
                : null;
            const link = course.querySelector("a")
                ? course.querySelector("a").href
                : null;
            const description = course.querySelector(".course-description")
                ? course.querySelector(".course-description").innerText
                : null;
            const timestamp = course.querySelector(".course-date")
                ? new Date(
                      course.querySelector(".course-date").innerText,
                  ).getTime()
                : null; // Ambil timestamp jika ada

            if (title && link && timestamp) {
                courseInfo.push({ title, link, description, timestamp });
            }
        });

        return courseInfo;
    });

    await browser.close();

    // Limit the result to the top limit number of courses
    return courses.slice(0, limit); // Returns only the top limit courses
}

// Fungsi untuk memeriksa artikel baru dan mengirimkan ke channel
async function checkForNewArticle() {
    const timestamp = new Date().toLocaleString(); // Menambahkan timestamp
    console.log(`Pengecekan dilakukan pada: ${timestamp}`);

    const courses = await scrapeLatestCourses();

    // Jika ada kursus yang ditemukan
    if (courses.length > 0) {
        console.log(`Jumlah kursus gratis yang ditemukan: ${courses.length}`); // Log jumlah kursus yang ditemukan

        const latestCourse = courses[0]; // Mengambil artikel terbaru

        // Jika artikel terbaru belum pernah dikirim sebelumnya
        if (
            !lastArticleTimestamp ||
            latestCourse.timestamp > lastArticleTimestamp
        ) {
            lastArticleTimestamp = latestCourse.timestamp;

            // Kirim informasi kursus ke Discord dengan mention role
            const response = `<@&${roleId}> Artikel Baru:\n\n**${latestCourse.title}**\nLink: ${latestCourse.link}\nDeskripsi: ${latestCourse.description}\n`;

            // Dapatkan channel yang dituju menggunakan channelId
            const channel = await bot.channels.fetch(channelId);
            if (channel) {
                channel.send(response);

                // Log ke console jika artikel baru berhasil terkirim
                console.log(`Artikel Baru Terkirim: ${latestCourse.title}`);
                console.log(`Link: ${latestCourse.link}`);
                console.log(`Deskripsi: ${latestCourse.description}`);
            } else {
                console.log("Channel tidak ditemukan.");
            }
        }
    } else {
        console.log("Belum ada kursus gratis terbaru."); // Log jika tidak ada kursus baru
    }
}

// Interval untuk memeriksa artikel baru setiap 5 menit
setInterval(checkForNewArticle, 5 * 60 * 1000); // Cek setiap 5 menit

// Perintah untuk bot Discord
bot.on("messageCreate", async (message) => {
    if (message.content === "!fc") {
        // Ganti perintah menjadi !fc
        const courses = await scrapeLatestCourses();

        // Kirim informasi kursus ke Discord dengan mention role
        if (courses.length > 0) {
            let response = `<@&${roleId}> Daftar Kursus Terbaru:\n\n`;
            courses.forEach((course) => {
                response += `**${course.title}**\nLink: ${course.link}\nDeskripsi: ${course.description}\n\n`;
            });

            // Dapatkan channel yang dituju menggunakan channelId
            const channel = await bot.channels.fetch(channelId);
            if (channel) {
                channel.send(response);
            } else {
                console.log("Channel tidak ditemukan.");
            }
        } else {
            message.channel.send("Tidak ada kursus terbaru yang ditemukan.");
        }
    }

    // New command to display 5 latest courses directly from the website
    if (message.content === "!fc5") {
        // Command to display top 5 courses from the website
        const courses = await scrapeLatestCourses(5); // Fetch top 5 courses

        // Kirim informasi kursus ke Discord dengan mention role
        if (courses.length > 0) {
            let response = `<@&${roleId}> 5 Kursus Terbaru:\n\n`;
            courses.forEach((course) => {
                response += `**${course.title}**\nLink: ${course.link}\nDeskripsi: ${course.description}\n\n`;
            });

            // Dapatkan channel yang dituju menggunakan channelId
            const channel = await bot.channels.fetch(channelId);
            if (channel) {
                channel.send(response);
            } else {
                console.log("Channel tidak ditemukan.");
            }
        } else {
            message.channel.send("Tidak ada kursus terbaru yang ditemukan.");
        }
    }
});

// Menambahkan event 'ready' untuk memberi tahu jika bot aktif
bot.once("ready", () => {
    console.log("Bot sudah aktif dan terhubung ke Discord!");
    // Anda bisa mengirimkan pesan ke channel tertentu jika ingin memberitahukan pengguna lain bahwa bot aktif
    const channel = bot.channels.cache.get(channelId);
    if (channel) {
        channel.send("Bot aktif dan siap membantu!");
    }
});

// Login ke bot Discord
bot.login(token);
