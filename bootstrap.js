const { Client, Collection, ActivityType, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((acc, intent) => acc | intent, 0),
});

let config;
try {
  config = require('./config/config.json');
} catch {
  console.error(`Missing config file, make sure to remove "EXAMPLE" from config file!\nExiting!`);
  return;
}

const commandHandler = require('./src/utils/commandHandler');
const eventHandler = require('./src/utils/eventHandler');
const componentHandler = require('./src/utils/componentHandler');
const logHandler = require('./src/utils/logHandler');

client.commands = new Collection();
client.cooldowns = new Collection();

client.once(Events.ClientReady, async () => {
  logHandler.initialize(client);

  if (client.user.bot == false) {
    console.log('Token is incorrect!');
  }

  console.log(`Logged in as ${client.user.displayName}`);

  client.user.setPresence({
    activities: [
      {
        name: `Discord JS Bot Template - https://github.com/NoSkill33`,
        type: ActivityType.Custom,
      },
    ],
    status: 'online',
  });

  await commandHandler.loadCommands(client).catch(console.error);
  await eventHandler.loadEvents(client).catch(console.error);
  await componentHandler.loadComponents(client).catch(console.error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand()) {
    await commandHandler.synchronizeCommands(interaction, client).catch(console.error);
  } else {
    await componentHandler.synchronizeComponent(interaction, client).catch(console.error);
  }
});

// Add prefix command handling
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command!');
  }
});

module.exports = client;
client.login(config.token).catch(console.error);
