const puppeteer = require('puppeteer');
require('dotenv').config();


const VIEWPORT = { width: 1920, height: 1080 };
const delay = (ms) => new Promise(resolve => setTimeout(() => resolve(ms), ms));
(async () => {
    const browser = await puppeteer.launch({
        headless: !(process.env.SHOW === "true"),
        args: ["--ash-host-window-bounds=1920x1080", "--window-size=1920,1048", "--window-position=0,0", "--disable-dev-shm-usage"],
    }); 
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto('https://www.twitter.com/login');
    await page.type('.js-username-field', process.env.USERNAME, {delay: 100}); 
    await page.type('.js-password-field', process.env.PASSWORD, {delay: 100}); 
    const buttonSubmit = await page.$('button[type=submit]');
    await buttonSubmit.click();
    await page.waitFor('.u-textInheritColor');
    await page.click('.u-textInheritColor');
    await page.waitFor('.ProfileHeading-toggleLink');
    await page.click('.ProfileHeading-toggleLink');
    await page.waitFor('.ProfileTweet-actionButton');
    while(await page.$eval('.ProfileNav-value', divs => divs.innerHTML) !== "0"){
        if (await page.$$eval('.js-stream-item', divs => divs.length) === 0){
            await page.reload();
            await page.waitFor('.js-stream-item');

        } 
        const isRetweeted = await page.evaluate( () => document.querySelector('.js-stream-item>div').classList.contains('retweeted') );
        if (isRetweeted){
            await page.evaluate(() => {
                document.querySelector('button.ProfileTweet-actionButtonUndo').click();
            });
            await page.reload();
            await page.waitFor('.ProfileHeading-toggleItem');
        } 
        else{
            await page.click('.ProfileTweet-actionButton');
            await page.evaluate(() => {
                document.querySelector('.js-actionDelete>button').click();
            });
            await page.waitFor('.modal-body>.tweet>.content>.js-tweet-text-container>p');
            const timeElement = await page.$(".modal-body>.tweet>.content>.stream-item-header>.time>.tweet-timestamp>._timestamp");
            const timevalue = await page.evaluate(timeElement => timeElement.innerText, timeElement);
            const tweetElement = await page.$(".modal-body>.tweet>.content>.js-tweet-text-container>p");
            const tweetvalue = await page.evaluate(tweetElement => tweetElement.innerText, tweetElement);
            await page.evaluate(async ()=>{
                await document.querySelector('button.delete-action').click(); 
            });
            console.log("Deleted => " + timevalue + " : " + tweetvalue);
        }
        await delay(1500);
    }
    browser.close();
})();