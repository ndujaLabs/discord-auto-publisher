require('dotenv').config()
const _ = require('lodash')
const requireOrMock = require('require-or-mock')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

const Discord = require('discord.js')
const {Client, Collection, Intents} = Discord
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

const client = new Client({intents: [Intents.FLAGS.GUILDS]})

client.once('ready', async () => {
  channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
  // bot.guilds.get(message.guild.id).id

  main()
})

// client.commands = new Collection()

// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
//
// for (const file of commandFiles) {
//   const command = require(`./commands/${file}`)
//   client.commands.set(command.data.name, command)
// }

// client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand()) return
//
//   const command = client.commands.get(interaction.commandName)
//
//   if (!command) return
//
//   try {
//     await command.execute(interaction)
//   } catch (error) {
//     console.error(error)
//     await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
//   }
// })

client.login(process.env.DISCORD_BOT_TOKEN)

// async function executeCommand(msg) {
//
//   let content = _.trim(msg.content.replace(/<[^>]+>/g, ''))
//
//   if (/^\/drogo/.test(content)) {
//
//     content = _.trim(content.replace(/^\/drogo /, '')).split(/ +/)
//
//     let message = 'Whoops. Try `/drogo help`'
//
//     if (content[0] === 'help') {
//       message = `Examples:
//   /drogo info
// `
//     }
//
//     console.info(message)
//     msg.channel.send(message)
//   }
//
// }


const history = {}
let inline = false

function noGene(value) {
  return `**${value.replace(/^[A-Z]{1}\w{1,2}[A-Z]{0,1} /, '')}**`
}


function buildMessage (imagePath, metadata) {

  let {name, attributes} = metadata

  let attr = {}
  for (let attribute of attributes) {
    attr[attribute.trait_type] = attribute.value
  }

  let str = `Generation: **${attr.Generation}**
Purity Index: **${attr['Purity Index']}**
Element & Color Palette: **${attr['Color Palette']}**
Sky: **${attr.Sky}**
Aura: **${attr.Aura}**

DNA:
Wings: ${attr.Wings ? noGene(attr.Wings) : `*none*`}
Tail: ${attr.Tail ? noGene(attr.Tail) : `*none*`}
Head: ${noGene(attr.Head)}
Horns: ${noGene(attr.Horns)}
Eyes: ${noGene(attr.Eyes)}
Body: ${noGene(attr.Body)}
Legs: ${noGene(attr.Legs)}
`
  const std = 'Purity Index,Generation,Element,Color Palette,Sky,Aura,Wings,Tail,Body,Head,Eyes,Legs,Horns'.split(',')

  let ok
  for (let a in attr) {
    if (!~str.indexOf(a)) {
      if (!ok) {
        str += `
Extras:
`
      }
      str += `${a}: **${attr[a]}**
`
    }
  }

  const file = new Discord.MessageAttachment(imagePath)

  return [new Discord.MessageEmbed()
      .setColor('#FFFFFF')
      .setTitle(name)
      .setDescription(str)
      // .setURL(permalink || '')
      .setThumbnail('https://www.everdragons2.com/images/everDragons2.png')
      // .addFields(...fields)
      .setImage('attachment://' + name + '.png')
      .setTimestamp(new Date), file]

}

function buildMessage0 (imagePath, metadata) {

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
      .setDescription('@everyone Here is another great dragon!')
      // .setURL(permalink || '')
      .setThumbnail('https://everdragons2.com/images/everDragons2.png')
      .addFields(...fields)
      .setImage('attachment://' + name + '.png')
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
  let dName
  while (typeof ok === 'undefined' && i < 3000) {
    let index = Math.round(metadata.length * Math.random())
    dName = metadata[index].name + '.png'
    imagePath = path.join(__dirname, 'db/images', dName)
    // console.log(index, await fs.pathExists(imagePath), !~published.indexOf(index))
    if (await fs.pathExists(imagePath) && !~published.indexOf(index)) {
      ok = index
      published.push(ok)
      break
    }
    i++
  }
  if (i < 3000) {
    try {
      const [message, file] = buildMessage(imagePath, metadata[ok])
      if (message) {
        // console.log(message, file)
        // await channel.send(dName.split('.')[0], {files: [{
        //   attachment: file,
        //   name: dName
        // }]})



        // channel.send(new Discord.Attachment(file, dName) )
        //     .catch(console.error);

        await channel.send({embeds: [message], files: [file]})
        await sleep(3000)
        // db.set('published', published)
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


