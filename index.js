require('dotenv').config()
const requireOrMock = require('require-or-mock')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const Discord = require('discord.js')
const {Client, Intents} = Discord
const discordBot = new Client({intents: [Intents.FLAGS.GUILDS]})
// const { TextChannel } = Discord
const {ethers} = require("ethers")
const superagent = require('superagent')
const { SHA3 } = require('sha3')
const db = require('./lib/Db')

const metadata = requireOrMock('db/allMetadataV2.json', [])
if (metadata.length === 0) {
  console.info('Metadata not found')
  process.exit(1)
}

let failed = []
;[
  'DISCORD_BOT_TOKEN',
  'DISCORD_CHANNEL_ID'].map(f => {
  if (!process.env[f]) {
    failed.push(f)
  }
})
if (failed.length) {
  console.log(chalk.red(`.env file not properly configured.
The following variables are missing:
${failed.join('\n')}  
`))
  process.exit(1)
}

let channel
discordBot.login(process.env.DISCORD_BOT_TOKEN);
discordBot.on('ready', async () => {
  channel = await discordBot.channels.fetch(process.env.DISCORD_CHANNEL_ID)
  main()
})

const history = {}
let inline = false

const buildMessage = (imagePath, metadata) => {

    let {name, attributes} = metadata


    let title = name
    let fields = []
    for (let attribute of attributes) {
      let trait = attribute.trait_type
      let value = attribute.value.toString()
      if (/^[A-Z]{1}\w{1,2}[A-Z]{0,1} /.test(value)) {
        value = value.replace(/^[A-Z]{1}\w{1,2}[A-Z]{0,1} /, '')
      }
      // console.log(attribute)
      fields.push({
        name: trait,
        value
      })

      inline = !inline
    }

    const file = new Discord.MessageAttachment(imagePath)

    return [new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setTitle(title)
        // .setURL(permalink || '')
        .setThumbnail('https://everdragons2.com/images/everDragonsLogo.png')
        .addFields(...fields)
        .setImage('attachment://'+name+'.png')
        .setTimestamp(new Date)
        // .setFooter('OpenSea', 'https://files.readme.io/566c72b-opensea-logomark-full-colored.png')
      , file]
}

function has(obj, ...props) {
  if (!obj) {
    return false
  } else {
    for (let p of props) {
      if (!obj[p]) {
        return false
      }
      obj = obj[p]
    }
  }
  return true
}

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

async function main() {
  const seconds = process.env.SECONDS ? parseInt(process.env.SECONDS) : 3600;
  let ok
  let published = db.get('published') || []
  let imagePath
  let i = 0
  while (typeof ok === 'undefined' && i < 1000) {
    let index = Math.round(metadata.length * Math.random())
    imagePath = path.join(__dirname, 'db/images', metadata[index].name + '.png')
    console.log(imagePath)
    if (await fs.pathExists(imagePath) && !~published.indexOf(index)) {
      ok = index
      published.push(ok)
    }
    i++
  }
  if (i < 1000) {
    try {
      const [message, file] = buildMessage(imagePath, metadata[ok])
      if (message) {
        console.log(message)
        await channel.send({embeds: [message], files: [file]})
        await sleep(3000)
      }
    } catch (e) {
      console.error(e)
    }

  }
  // else no more available PNGs

  await sleep(seconds * 1000)
  // await sleep(10 * 1000)
  main()
}


