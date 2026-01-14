"""
Discord Bot Info - Toon belangrijke informatie
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
    print('=' * 70)
    print('🤖 DISCORD BOT INFORMATIE'.center(70))
    print('=' * 70)
    
    print(f'\n✅ Bot Naam: {bot.user.name}')
    print(f'✅ Bot ID: {bot.user.id}')
    print(f'✅ Bot Tag: {bot.user.name}#{bot.user.discriminator}')
    
    if not bot.guilds:
        print('\n❌ BOT IS NIET TOEGEVOEGD AAN EEN DISCORD SERVER!')
        print('\n📋 Volg deze stappen:')
        print(f'\n1. Ga naar: https://discord.com/developers/applications')
        print(f'2. Selecteer je applicatie')
        print(f'3. Kopieer de "Application ID" (Client ID)')
        print(f'4. Gebruik deze URL om bot toe te voegen:\n')
        print(f'   https://discord.com/api/oauth2/authorize?client_id={bot.user.id}&permissions=51200&scope=bot')
        print(f'\n5. Open de URL, selecteer je server, klik "Authorize"')
        print(f'6. Run dit script opnieuw om kanalen te zien')
    else:
        print(f'\n✅ Bot is lid van {len(bot.guilds)} server(s):\n')
        
        for guild in bot.guilds:
            print(f'🏠 Server: {guild.name}')
            print(f'   Server ID: {guild.id}')
            print(f'   Leden: {guild.member_count}')
            print(f'\n   📝 Text Kanalen:')
            
            for channel in guild.text_channels:
                permissions = channel.permissions_for(guild.me)
                can_read = '✅' if permissions.read_messages else '❌'
                can_send = '✅' if permissions.send_messages else '❌'
                
                print(f'   {can_read}{can_send} #{channel.name}')
                print(f'      Channel ID: {channel.id}')
            
            print()
        
        print('\n📋 Kopieer een Channel ID naar .env:')
        print('   DISCORD_CHANNEL_ID=<channel_id>')
        print('\n💡 Zorg dat beide vinkjes ✅✅ zijn (lezen + schrijven)')
    
    print('\n' + '=' * 70)
    
    await bot.close()

if __name__ == "__main__":
    if not TOKEN:
        print('❌ DISCORD_BOT_TOKEN niet gevonden in .env!')
    else:
        bot.run(TOKEN)
