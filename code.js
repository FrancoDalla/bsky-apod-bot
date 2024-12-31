import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import axios from 'axios'

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
  })


async function convertImage(url){
    const response = await axios.get(url, { responseType: 'arraybuffer'})
    return { data: new Uint8Array(response.data)}
}
async function main() {
    const nasaResponse = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_KEY}` )
    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD})
    const convertedImage = await convertImage(nasaResponse.data.url)
    const nasaImage = await agent.uploadBlob(convertedImage.data,{encoding:"image/jpg",})
    await agent.post({
        text: `${nasaResponse.data.title} ${nasaResponse.data.date}`,
        embed: {
            $type: 'app.bsky.embed.images',
            images: [
                {
                    image: nasaImage.data.blob,
                    alt: `${nasaResponse.data.explanation}`,
                },
            ],
        },
    });
    console.log("Just posted!")
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *';
const scheduleExpression = '0 5 * * * '; 

const job = new CronJob(scheduleExpression, main);

job.start();
