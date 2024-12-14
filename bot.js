const puppeteer = require('puppeteer');
const { Client, GatewayIntentBits } = require('discord.js');  // Menggunakan GatewayIntentBits untuk intents
const token = 'MTMxNzU1NDc3NTEwMTAxNDE1Ng.GShWJi.equ-JPASqZKw4hSZail8dpM9vPMPv66ICuxOK8'; // Ganti dengan token bot Discord Anda

// Membuat instance bot Discord
const bot = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// Channel ID dan Role ID untuk mention
const channelId = '1314511842881568789';  // ID channel yang diinginkan
const roleId = '1316106397724966992';  // ID role yang ingin disebutkan

let lastArticleTimestamp = null;  // Untuk menyimpan timestamp artikel terakhir yang sudah dikirim

// Fungsi untuk mengambil artikel terbaru dari website
async function scrapeLatestCourses() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Ganti dengan URL website yang ingin di-scrape
    await page.goto('https://www.courspora.my.id/course', { waitUntil: 'networkidle2' });

    // Ambil informasi kursus terbaru
    const courses = await page.evaluate(() => {
        const courseElements = document.querySelectorAll('.course-card');  // Ganti selector sesuai dengan struktur halaman
        const courseInfo = [];

        courseElements.forEach(course => {
            const title = course.querySelector('.course-title') ? course.querySelector('.course-title').innerText : null;
            const link = course.querySelector('a') ? course.querySelector('a').href : null;
            const description = course.querySelector('.course-description') ? course.querySelector('.course-description').innerText : null;
            const timestamp = course.querySelector('.course-date') ? new Date(course.querySelector('.course-date').innerText).getTime() : null;  // Ambil timestamp jika ada

            if (title && link && timestamp) {
                courseInfo.push({ title, link, description, timestamp });
            }
        });

        return courseInfo;
    });

    await browser.close();
    return courses;
}

// Fungsi untuk memeriksa artikel baru dan mengirimkan ke channel
async function checkForNewArticle() {
    const courses = await scrapeLatestCourses();

    // Jika ada kursus yang ditemukan
    if (courses.length > 0) {
        console.log(`Jumlah kursus gratis yang ditemukan: ${courses.length}`);  // Log jumlah kursus yang ditemukan

        const latestCourse = courses[0];  // Mengambil artikel terbaru

        // Jika artikel terbaru belum pernah dikirim sebelumnya
        if (!lastArticleTimestamp || latestCourse.timestamp > lastArticleTimestamp) {
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
                console.log('Channel tidak ditemukan.');
            }
        }
    } else {
        console.log('Belum ada kursus gratis terbaru.');  // Log jika tidak ada kursus baru
    }
}

// Perintah untuk bot Discord
bot.on('messageCreate', async (message) => {
    if (message.content === '!fc') {  // Ganti perintah menjadi !fc
        const courses = await scrapeLatestCourses();

        // Kirim informasi kursus ke Discord dengan mention role
        if (courses.length > 0) {
            let response = `<@&${roleId}> Daftar Kursus Terbaru:\n\n`;
            courses.forEach(course => {
                response += `**${course.title}**\nLink: ${course.link}\nDeskripsi: ${course.description}\n\n`;
            });

            // Dapatkan channel yang dituju menggunakan channelId
            const channel = await bot.channels.fetch(channelId);
            if (channel) {
                channel.send(response);
            } else {
                console.log('Channel tidak ditemukan.');
            }
        } else {
            message.channel.send('Tidak ada kursus terbaru yang ditemukan.');
        }
    }
});

// Menambahkan event 'ready' untuk memberi tahu jika bot aktif
bot.once('ready', () => {
    console.log('Bot sudah aktif dan terhubung ke Discord!');
    // Anda bisa mengirimkan pesan ke channel tertentu jika ingin memberitahukan pengguna lain bahwa bot aktif
    const channel = bot.channels.cache.get(channelId);
    if (channel) {
        channel.send('Bot aktif dan siap membantu!');
    }
});

// Interval untuk memeriksa artikel baru setiap 5 menit
setInterval(checkForNewArticle, 5 * 60 * 1000);  // Cek setiap 5 menit

// Login ke bot Discord
bot.login(token);
