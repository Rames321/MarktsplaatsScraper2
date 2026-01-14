"""
Test Discord Bot - Laat alle beschikbare kanalen zien
"""
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv('DISCORD_BOT_TOKEN')

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'✓ Bot is ingelogd als {bot.user}')
    print(f'\n📋 Bot is lid van de volgende servers:')
    
    for guild in bot.guilds:
        print(f'\n🏠 Server: {guild.name} (ID: {guild.id})')
        print(f'   Text kanalen:')
        for channel in guild.text_channels:
            print(f'   • #{channel.name} (ID: {channel.id})')
    
    print(f'\n💡 Kopieer een Channel ID naar .env file!')
    print(f'   DISCORD_CHANNEL_ID=<channel_id_hier>')
    
    await bot.close()

if __name__ == "__main__":
    bot.run(TOKEN)
