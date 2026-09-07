import discord
from discord.ext import commands, tasks
import os
from dotenv import load_dotenv
from scraper import MarktplaatsScraper
import database
import json
from datetime import datetime
import sys

# Workaround voor Python 3.13 audioop issue
if sys.version_info >= (3, 13):
    import warnings
    warnings.filterwarnings('ignore', message='.*audioop.*')
    # Discord voice ondersteuning uitschakelen voor Python 3.13
    try:
        import discord.voice_client
        discord.voice_client.has_nacl = False
    except:
        pass

load_dotenv()

# Configuratie
TOKEN = os.getenv('DISCORD_BOT_TOKEN')
CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', '0'))
CHECK_INTERVAL = int(os.getenv('CHECK_INTERVAL_MINUTES', '5'))

# Bepaal de directory waar dit script staat
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, 'search_config.json')

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

scraper = MarktplaatsScraper()

def load_search_config():
    """Laad zoektermen uit configuratie"""
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"search_terms": []}

def save_search_config(config):
    """Sla zoektermen op"""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def create_ad_embed(ad, query):
    """Maak een Discord embed voor een advertentie"""
    # Discord heeft een limiet van 256 karakters voor title
    title = ad['title'][:253] + "..." if len(ad['title']) > 256 else ad['title']
    
    embed = discord.Embed(
        title=title,
        url=ad['link'],
        description=f"🔍 Zoekterm: **{query}**",
        color=discord.Color.green(),
        timestamp=datetime.now()
    )
    
    embed.add_field(name="💰 Prijs", value=ad['price'], inline=True)
    embed.add_field(name="📍 Locatie", value=ad['location'], inline=True)
    embed.add_field(name="📅 Datum", value=ad['date'], inline=True)
    
    if ad.get('image_url'):
        embed.set_thumbnail(url=ad['image_url'])
    
    embed.set_footer(text="Marktplaats Scraper")
    
    return embed

@bot.event
async def on_ready():
    print(f'✓ Bot is ingelogd als {bot.user}')
    print(f'✓ Check interval: elke {CHECK_INTERVAL} minuten')
    database.init_database()
    if not check_new_ads.is_running():
        check_new_ads.start()

@tasks.loop(minutes=CHECK_INTERVAL)
async def check_new_ads():
    """Controleer periodiek op nieuwe advertenties"""
    channel = bot.get_channel(CHANNEL_ID)
    
    if not channel:
        print(f"⚠ Kan kanaal met ID {CHANNEL_ID} niet vinden")
        return
    
    config = load_search_config()
    
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] === Checking voor nieuwe advertenties ===")
    
    for search_term in config.get('search_terms', []):
        if not search_term.get('enabled', True):
            continue
        
        query = search_term['query']
        max_price = search_term.get('max_price')
        min_price = search_term.get('min_price')
        
        new_ads = scraper.get_new_ads(query, max_price, min_price)
        
        for ad in new_ads:
            # Sla op in database
            if database.add_monitor_result(ad, query):
                embed = create_ad_embed(ad, query)
                try:
                    await channel.send(embed=embed)
                    database.mark_as_notified(ad['id'], query)
                    print(f"✓ Notificatie verstuurd: {ad['title']}")
                except Exception as e:
                    print(f"✗ Error bij versturen notificatie: {e}")

@check_new_ads.before_loop
async def before_check():
    await bot.wait_until_ready()

@bot.command(name='zoek')
async def search_command(ctx, *, query: str):
    """Zoek direct naar advertenties: !zoek <zoekterm>"""
    await ctx.send(f"🔍 Zoeken naar: **{query}**...")
    
    ads = scraper.search(query)
    
    if not ads:
        await ctx.send("Geen advertenties gevonden.")
        return
    
    # Toon eerste 5 resultaten
    for ad in ads[:5]:
        embed = create_ad_embed(ad, query)
        await ctx.send(embed=embed)
    
    if len(ads) > 5:
        await ctx.send(f"... en nog {len(ads) - 5} advertenties meer")

@bot.command(name='add')
async def add_search(ctx, *, query: str):
    """Voeg een zoekterm toe: !add <zoekterm>"""
    config = load_search_config()
    
    # Check of zoekterm al bestaat
    for term in config.get('search_terms', []):
        if term['query'].lower() == query.lower():
            await ctx.send(f"⚠ Zoekterm **{query}** staat al in de lijst!")
            return
    
    new_id = str(len(config.get('search_terms', [])) + 1)
    config.setdefault('search_terms', []).append({
        'id': new_id,
        'query': query,
        'enabled': True,
        'max_price': 0,
        'min_price': 0
    })
    
    save_search_config(config)
    await ctx.send(f"✓ Zoekterm **{query}** toegevoegd aan monitoring!")

@bot.command(name='remove')
async def remove_search(ctx, *, query: str):
    """Verwijder een zoekterm: !remove <zoekterm>"""
    config = load_search_config()
    search_terms = config.get('search_terms', [])
    
    original_length = len(search_terms)
    config['search_terms'] = [t for t in search_terms if t['query'].lower() != query.lower()]
    
    if len(config['search_terms']) < original_length:
        save_search_config(config)
        await ctx.send(f"✓ Zoekterm **{query}** verwijderd!")
    else:
        await ctx.send(f"⚠ Zoekterm **{query}** niet gevonden.")

@bot.command(name='list')
async def list_searches(ctx):
    """Toon alle actieve zoektermen: !list"""
    config = load_search_config()
    search_terms = config.get('search_terms', [])
    
    if not search_terms:
        await ctx.send("Geen actieve zoektermen.")
        return
    
    embed = discord.Embed(
        title="📋 Actieve Zoektermen",
        color=discord.Color.blue()
    )
    
    for term in search_terms:
        status = "✅" if term.get('enabled', True) else "⏸️"
        price_info = ""
        if term.get('max_price', 0) > 0:
            price_info = f" (max €{term['max_price']})"
        
        embed.add_field(
            name=f"{status} {term['query']}",
            value=f"ID: {term['id']}{price_info}",
            inline=False
        )
    
    await ctx.send(embed=embed)

@bot.command(name='check')
async def manual_check(ctx):
    """Forceer een handmatige check: !check"""
    await ctx.send("🔍 Checking voor nieuwe advertenties...")
    await check_new_ads()
    await ctx.send("✓ Check voltooid!")

@bot.command(name='help_scraper')
async def help_command(ctx):
    """Toon help informatie"""
    embed = discord.Embed(
        title="🤖 Marktplaats Scraper Commands",
        description="Beschikbare commando's:",
        color=discord.Color.blue()
    )
    
    embed.add_field(
        name="!zoek <zoekterm>",
        value="Zoek direct naar advertenties",
        inline=False
    )
    embed.add_field(
        name="!add <zoekterm>",
        value="Voeg zoekterm toe aan monitoring",
        inline=False
    )
    embed.add_field(
        name="!remove <zoekterm>",
        value="Verwijder zoekterm uit monitoring",
        inline=False
    )
    embed.add_field(
        name="!list",
        value="Toon alle actieve zoektermen",
        inline=False
    )
    
    await ctx.send(embed=embed)

if __name__ == "__main__":
    if not TOKEN:
        print("⚠ DISCORD_BOT_TOKEN niet gevonden in .env file!")
        exit(1)
    
    if CHANNEL_ID == 0:
        print("⚠ DISCORD_CHANNEL_ID niet gevonden in .env file!")
        exit(1)
    
    print("Starting Discord bot...")
    bot.run(TOKEN)
