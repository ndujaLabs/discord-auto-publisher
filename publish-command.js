require('dotenv').config()
const superagent = require('superagent')

const url = 'https://discord.com/api/v8/applications/904165844551086081/guilds/<guild_id>/commands'

// // # This is an example USER command, with a type of 2
// const json = {
//   "name": "High Five",
//   "type": 2
// }
//
// // # For authorization, you can use either your bot token
// const headers = {
//   "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
// }

// # or a client credentials token for your app with the applications.commands.update scope
// const headers = {
//   "Authorization": "Bearer <my_credentials_token>"
// }


r = superagent.post(url)
    .set({Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`})
    .send({
      name: 'Traits',
      type: 2
    })