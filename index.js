const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.iplt20.com/stats/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.customSelecBox'); 
    const seasons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.customSelecBox .cSBList .cSBListItems')).map(option => option.innerText);
    });
    console.log('Seasons found:', seasons);
    const last5Seasons = seasons.slice(0, 5); 
    console.log('Extracting data for:', last5Seasons);
    const allData = {};
    for (const season of last5Seasons) {
        console.log(`Processing data for season: ${season}`);

        await page.click('.customSelecBox'); 
        await page.evaluate((season) => {
            const dropdownItems = document.querySelectorAll('.cSBListItems'); // Replace with the correct selector for your dropdown items
            dropdownItems.forEach((item) => {
                if (item.textContent.trim() === season) {
                    item.click(); 
                }
            });
        }, season);

        await page.waitForSelector('tbody', { visible: true });

        const seasonData = await page.evaluate(() => {
            const players = [];
            const options = ['runs','mat','inns', 'no', 'hs','avg', 'bf', 'sr', '100', '50', '4s', '6s']
            document.querySelectorAll('tr').forEach((player) => {
                const name = player.querySelector('.st-ply-name')?.innerText || 'N/A';
                const team = player.querySelector('.st-ply-tm-name')?.innerText || 'N/A';
                const stats = [];
                player.querySelectorAll('td').forEach((ele,idx)=>{
                    stats.push({
                        key: options[idx],
                        value: ele.innerText.trim() || 'N/A'
                    })
                });
                players.push({ name, team, stats });
            });
            return players;
        });

        console.log(`Extracted ${seasonData.length} players for season ${season}`);
        allData[season] = seasonData;
    }
    fs.writeFileSync('all_seasons_stats.json', JSON.stringify(allData, null, 2));

    console.log('Data extraction completed!');

    await browser.close();
})();
