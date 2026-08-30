import fastf1
import fastf1.plotting
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
from typing import Optional, Tuple, List
import os
import warnings
import matplotlib as mpl
import datetime
import matplotlib.font_manager as fm
from PIL import Image, ImageTk
import threading
import time
import atexit
import sys
import re
import json
import requests
from matplotlib.patches import FancyBboxPatch
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
from urllib.request import urlopen, Request
from io import BytesIO

# Suppress the specific warnings from fastf1
warnings.filterwarnings("ignore", category=FutureWarning, module="fastf1.core")

# Define export directory
EXPORT_DIR = r"D:\Data\AF\Exports"
INSTAGRAM_DIR = os.path.join(EXPORT_DIR, "Instagram")
JSON_DIR = os.path.join(EXPORT_DIR, "JSON")
DRIVER_IMG_DIR = r"D:\Data\AF\f1_analysis\Cache\Drivers"
INSTAGRAM_SIZE = 1080
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(INSTAGRAM_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)
os.makedirs(DRIVER_IMG_DIR, exist_ok=True)

# Enable fastf1 cache
cache_folder = r'D:\Data\AF\f1_analysis\Cache'
os.makedirs(cache_folder, exist_ok=True)
os.environ['FASTF1_CACHE'] = cache_folder
fastf1.Cache.enable_cache(cache_folder)

# Global constants for styling
DARK_BG = "#181C20"
DARK_AX = "#23272E"
PANEL_BG = "#23272E"
SOLID_WHITE = "#FFFFFF"
CYAN = "#22E6EC"
CORNER_CIRCLE = "#23242B"
GREEN_HIGHLIGHT = "#1E4D2B" # Color for fastest lap background in GUI
GREEN_TEXT = "#00FF00"      # Bright green for "Faster" text
RED_TEXT = "#FF3333"        # Bright red for delta text

# Maximum width for output images in pixels
MAX_WIDTH_PIXELS = 4000

# Delta sampling interval in meters
DELTA_SAMPLING_INTERVAL = 5

# --- COLOR PALETTE ---
SPECIAL_COLORS = {
    "pos2": "#9900FF",  # Purple
    "pos3": "#FFFFFF",  # White
    "pos4": "#C19A6B",  # Brown
    "pos5": "#00FFFF",  # Cyan
    "pos6": "#DA70D6"   # Orchid
}

# --- 2026 MASTER GRID FALLBACK ---
CUSTOM_2026_GRID = {
    '1': ('NOR', 'Lando Norris', 'McLaren'),
    '3': ('VER', 'Max Verstappen', 'Red Bull'),
    '5': ('BOR', 'Gabriel Bortoleto', 'Audi'),
    '6': ('HAD', 'Isack Hadjar', 'Red Bull'),
    '10': ('GAS', 'Pierre Gasly', 'Alpine'),
    '11': ('PER', 'Sergio Perez', 'Cadillac'),
    '12': ('ANT', 'Kimi Antonelli', 'Mercedes'),
    '14': ('ALO', 'Fernando Alonso', 'Aston Martin'),
    '16': ('LEC', 'Charles Leclerc', 'Ferrari'),
    '18': ('STR', 'Lance Stroll', 'Aston Martin'),
    '23': ('ALB', 'Alexander Albon', 'Williams'),
    '25': ('HER', 'Colton Herta', 'Cadillac'),
    '27': ('HUL', 'Nico Hulkenberg', 'Audi'),
    '30': ('LAW', 'Liam Lawson', 'Racing Bulls'),
    '31': ('OCO', 'Esteban Ocon', 'Haas'),
    '36': ('IWA', 'Ayumu Iwasa', 'Red Bull'),
    '38': ('BEG', 'Dino Beganovic', 'Ferrari'),
    '41': ('LIN', 'Arvid Lindblad', 'Racing Bulls'),
    '43': ('COL', 'Franco Colapinto', 'Alpine'),
    '44': ('HAM', 'Lewis Hamilton', 'Ferrari'),
    '46': ('BRO', 'Luke Browning', 'Williams'),
    '55': ('SAI', 'Carlos Sainz', 'Williams'),
    '63': ('RUS', 'George Russell', 'Mercedes'),
    '67': ('FOR', 'Leonardo Fornaroli', 'McLaren'),
    '72': ('VES', 'Frederik Vesti', 'Mercedes'),
    '77': ('BOT', 'Valtteri Bottas', 'Cadillac'),
    '81': ('PIA', 'Oscar Piastri', 'McLaren'),
    '87': ('BEA', 'Oliver Bearman', 'Haas'),
    '97': ('ARO', 'Paul Aron', 'Audi'),
}

# --- FALLBACK HEADSHOTS ---
FALLBACK_HEADSHOTS = {
    'VER': 'https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png',
    'PER': 'https://media.formula1.com/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png',
    'HAM': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png',
    'RUS': 'https://media.formula1.com/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png',
    'LEC': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png',
    'SAI': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png',
    'NOR': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png',
    'PIA': 'https://media.formula1.com/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png',
    'ALO': 'https://media.formula1.com/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png',
    'STR': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png',
    'GAS': 'https://media.formula1.com/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png',
    'OCO': 'https://media.formula1.com/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png',
    'ALB': 'https://media.formula1.com/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png',
    'TSU': 'https://media.formula1.com/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png',
    'BOT': 'https://media.formula1.com/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png',
    'ZHO': 'https://media.formula1.com/content/dam/fom-website/drivers/G/GUAZHO01_Guanyu_Zhou/guazho01.png',
    'HUL': 'https://media.formula1.com/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png',
    'MAG': 'https://media.formula1.com/content/dam/fom-website/drivers/K/KEVMAG01_Kevin_Magnussen/kevmag01.png',
    'RIC': 'https://media.formula1.com/content/dam/fom-website/drivers/D/DANRIC01_Daniel_Ricciardo/danric01.png',
    'BEA': 'https://media.formula1.com/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png',
    'LAW': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png',
    'COL': 'https://media.formula1.com/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png',
    'DOO': 'https://media.formula1.com/content/dam/fom-website/drivers/J/JACDOO01_Jack_Doohan/jacdoo01.png',
    'ANT': 'https://media.formula1.com/content/dam/fom-website/drivers/K/KIMANT01_Kimi_Antonelli/kimant01.png',
    'HAD': 'https://media.formula1.com/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png',
    'BOR': 'https://media.formula1.com/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png',
}

# Global list to track all active threads
active_threads = []

# ----------- FONT LOADING SETTINGS -----------
FONT_PATH = r"D:\Data\AF\f1_analysis\Kalameh.ttf"
FALLBACK_FONT = "DejaVu Sans"

# Register the font with Matplotlib and get the family name
try:
    if os.path.exists(FONT_PATH):
        fm.fontManager.addfont(FONT_PATH)
        custom_font_prop = fm.FontProperties(fname=FONT_PATH)
        KALAMEH_FONT = custom_font_prop.get_name()
        print(f"Successfully loaded font: {KALAMEH_FONT}")
    else:
        print(f"Warning: Font file not found at {FONT_PATH}. Falling back to system 'Kalameh'.")
        KALAMEH_FONT = "Kalameh"
except Exception as e:
    print(f"Error loading font: {e}. Falling back to default.")
    KALAMEH_FONT = "Kalameh"

# Set up the plotting style
plt.style.use('dark_background')
plt.rcParams.update({
    'axes.facecolor': DARK_AX,
    'figure.facecolor': DARK_BG,
    'axes.edgecolor': SOLID_WHITE,
    'axes.labelcolor': SOLID_WHITE,
    'text.color': SOLID_WHITE,
    'xtick.color': SOLID_WHITE,
    'ytick.color': SOLID_WHITE,
    'legend.facecolor': '#23272F',
    'legend.edgecolor': '#404040',
    'savefig.facecolor': DARK_BG,
    'savefig.edgecolor': DARK_BG,
    'axes.titlesize': 36,     # Increased size
    'axes.labelsize': 28,     # Increased size
    'xtick.labelsize': 22,    # Increased size
    'ytick.labelsize': 22,    # Increased size
    'legend.fontsize': 22,    # Increased size
    'font.family': [KALAMEH_FONT, FALLBACK_FONT],
    'font.sans-serif': [KALAMEH_FONT, FALLBACK_FONT]
})

fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')

# Session types available for selection
SESSION_LIST = [
    ("FP1", "Practice 1"),
    ("FP2", "Practice 2"),
    ("FP3", "Practice 3"),
    ("Q", "Qualifying"),
    ("SQ", "Sprint Qualifying"),
    ("S", "Sprint"),
    ("R", "Race")
]

def calculate_figure_dimensions(export, height_ratios, rows_info=1):
    if export:
        base_width = 20
    else:
        base_width = 16
    
    # Base height calculation logic
    height_factor = 1.6 + (0.35 * (rows_info - 1))
    
    base_height = base_width * height_factor
    dpi = min(300, MAX_WIDTH_PIXELS / base_width)
    return base_width, base_height, dpi

def save_instagram_square_png(base_filename, source_path):
    out_path = os.path.join(INSTAGRAM_DIR, base_filename + ".png")
    with Image.open(source_path) as img:
        max_side = max(img.size)
        bg_color = tuple(int(DARK_BG.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
        square_img = Image.new("RGB", (max_side, max_side), bg_color)
        square_img.paste(img, ((max_side - img.width) // 2, (max_side - img.height) // 2))
        final_img = square_img.resize((INSTAGRAM_SIZE, INSTAGRAM_SIZE), Image.LANCZOS)
        final_img.save(out_path)

def hex_with_opacity(hex_color, opacity=0.5):
    if not hex_color or not hex_color.startswith('#') or len(hex_color) != 7:
        return DARK_BG
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    bg_r = int(DARK_BG[1:3], 16)
    bg_g = int(DARK_BG[3:5], 16)
    bg_b = int(DARK_BG[5:7], 16)
    r = int(opacity * r + (1 - opacity) * bg_r)
    g = int(opacity * g + (1 - opacity) * bg_g)
    b = int(opacity * b + (1 - opacity) * bg_b)
    return f'#{r:02x}{g:02x}{b:02x}'

def safe_filename(s):
    return re.sub(r'[\\/*?:"<>|]', "_", s)

def get_flag_url(gp_name):
    codes = {
        'Pre-Season': 'bh', 'Bahrain': 'bh', 'Saudi': 'sa', 'Australia': 'au', 'Japan': 'jp',
        'China': 'cn', 'Miami': 'us', 'Emilia': 'it', 'Monaco': 'mc',
        'Canada': 'ca', 'Spain': 'es', 'Barcelona': 'es', 'Austria': 'at', 'British': 'gb',
        'Hungary': 'hu', 'Belgium': 'be', 'Belgian': 'be', 'Dutch': 'nl',
        'Italy': 'it', 'Italian': 'it', 'Azerbaijan': 'az', 'Singapore': 'sg',
        'United States': 'us', 'USA': 'us', 'Mexico': 'mx', 'Brazil': 'br',
        'São Paulo': 'br', 'Las Vegas': 'us', 'Qatar': 'qa', 'Abu Dhabi': 'ae'
    }
    gp_lower = gp_name.lower()
    code = 'xx'
    for key, val in codes.items():
        if key.lower() in gp_lower:
            code = val
            break
    return f"https://flagcdn.com/w160/{code}.png"

def get_driver_headshot(driver_identifier, url=None):
    valid_url = False
    if url and not pd.isna(url) and url != '':
        valid_url = True
    
    if not valid_url:
        fallback_url = FALLBACK_HEADSHOTS.get(driver_identifier)
        if fallback_url:
            url = fallback_url
            valid_url = True

    if not valid_url:
        return None
    
    filename = safe_filename(f"{driver_identifier}.png")
    local_path = os.path.join(DRIVER_IMG_DIR, filename)
    
    if os.path.exists(local_path):
        if os.path.getsize(local_path) > 1000:
            return local_path
        
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img.save(local_path)
            return local_path
    except Exception as e:
        print(f"Headshot fetch failed for {driver_identifier}: {e}")
        pass
    return None

def get_team_color_safe(team_name, session=None):
    try:
        if session:
            color = fastf1.plotting.get_team_color(team_name, session)
        else:
            color = fastf1.plotting.get_team_color(team_name)
        if color: return color
    except Exception:
        pass

    fallback_colors = {
        'Red Bull': '#1E5BC6', 'Red Bull Racing': '#1E5BC6', 'Ferrari': '#ED1C24', 'Scuderia Ferrari': '#ED1C24',
        'Mercedes': '#6CD3BF', 'McLaren': '#F58020', 'Alpine': '#2293D1', 'Aston Martin': '#229971',
        'AlphaTauri': '#4E7C9B', 'Williams': '#37BEDD', 'Alfa Romeo': '#B12039',
        'Haas': '#B6BABD', 'Audi': '#C8002F', 'Kick Sauber': '#52E252', 'Sauber': '#52E252',
        'Visa Cash App RB': '#6692FF', 'Racing Bulls': '#1660AD', 'Cadillac': '#E5D07B'
    }
    if team_name in fallback_colors: return fallback_colors[team_name]
    for known_team, color in fallback_colors.items():
        if known_team in team_name or team_name in known_team:
            return color
    return "#AAAAAA"

def delta_time(reference_lap, compare_lap) -> tuple:
    try:
        ref = reference_lap.get_car_data(interpolate_edges=True).add_distance()
        comp = compare_lap.get_car_data(interpolate_edges=True).add_distance()

        def mini_pro(stream):
            dstream_start = stream[1] - stream[0]
            dstream_end = stream[-1] - stream[-2]
            return np.concatenate(
                [[stream[0] - dstream_start], stream, [stream[-1] + dstream_end]]
            )

        ltime = mini_pro(comp['Time'].dt.total_seconds().to_numpy())
        multiplier = ref.Distance.iat[-1] / comp.Distance.iat[-1]
        ldistance = mini_pro(comp['Distance'].to_numpy()) * multiplier
        lap_time = np.interp(ref['Distance'], ldistance, ltime)
        delta = lap_time - ref['Time'].dt.total_seconds()
        return delta, ref, comp
    except Exception as e:
        print(f"Error calculating delta time: {e}")
        ref = reference_lap.get_car_data(interpolate_edges=True).add_distance()
        delta = np.zeros_like(ref['Distance'])
        comp = pd.DataFrame()
        return delta, ref, comp

def filter_duplicate_corner_numbers(corners):
    seen_numbers = set()
    filtered_corners = []
    for _, corner in corners.iterrows():
        match = re.match(r'(\d+)', str(corner['Number']))
        if match:
            base_number = match.group(1)
            if base_number not in seen_numbers:
                seen_numbers.add(base_number)
                filtered_corners.append(corner)
        else:
            corner_num = corner['Number']
            if corner_num not in seen_numbers:
                seen_numbers.add(corner_num)
                filtered_corners.append(corner)
    return pd.DataFrame(filtered_corners)

def add_corner_markers_to_subplot(ax, corners, y_min, y_max, label_below=False, y_offset=0.06,
                                  zoom_start=None, zoom_end=None):
    if zoom_start is not None and zoom_end is not None:
        visible_corners = corners[(corners['Distance'] >= zoom_start) & (corners['Distance'] <= zoom_end)]
    else:
        visible_corners = corners
    ax.vlines(x=visible_corners['Distance'], ymin=y_min, ymax=y_max,
              linestyles='dotted', colors='grey', alpha=0.7, zorder=1, linewidth=0.8)
    
    # Always add text labels if called
    if label_below:
        # Calculate a nice Y position near the bottom of the plot relative to data
        y_span = y_max - y_min
        y_text_pos = y_min + (y_span * 0.05) # 5% from bottom inside the plot
        
        for _, corner in visible_corners.iterrows():
            if isinstance(corner['Number'], (int, str)) and not isinstance(corner['Number'], float):
                txt = f"{corner['Number']}"
                # Use fontfamily instead of fontproperties since we registered it globally
                ax.text(corner['Distance'], y_text_pos, txt,
                        va='center', ha='center', fontsize=16,
                        color='lightgrey', alpha=0.9,
                        fontfamily=KALAMEH_FONT)

def add_watermark(fig, text="@Amir_Formula"):
    fig_width, fig_height = fig.get_size_inches()
    font_size = max(120, int(fig_width * fig.dpi * 0.18 / (0.8 * len(text))))
    fig.text(
        0.5, 0.5, text,
        va='center', ha='center',
        fontsize=font_size,
        color=(1, 1, 1, 0.22),
        fontweight='bold',
        fontfamily=KALAMEH_FONT,
        alpha=0.25,
        transform=fig.transFigure,
        zorder=1000
    )

def create_unique_driver_key(driver_code, lap_number, year=None, session_name=None):
    if year and session_name:
        return f"{driver_code}-{lap_number}-{year}-{session_name}"
    return f"{driver_code}-{lap_number}"

def format_laptime(laptime):
    if pd.isnull(laptime):
        return "--:--.---"
    try:
        total_seconds = laptime.total_seconds()
        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)
        millis = int((total_seconds - int(total_seconds)) * 1000)
        return f"{minutes}:{seconds:02d}.{millis:03d}"
    except Exception:
        return str(laptime)

def get_circuit_name(session):
    try:
        circuit_info = session.get_circuit_info()
        return circuit_info.name
    except:
        return session.event['EventName']

def calculate_lap_colors(laps_data):
    """
    Implements the specific color scenarios based on team grouping and lap times.
    """
    teams = {}
    for ld in laps_data:
        t = ld['Team']
        teams.setdefault(t, []).append(ld)
    
    for t in teams:
        teams[t].sort(key=lambda x: x['LapTimeVal'])
        
    rank1_laps = []
    pool_laps = []
    
    for t, laps in teams.items():
        # First lap is rank 1 (Fastest of team)
        rank1 = laps[0]
        rank1['FinalColor'] = rank1['TeamColor']
        rank1_laps.append(rank1)
        pool_laps.extend(laps[1:])
        
    pool_laps.sort(key=lambda x: x['LapTimeVal'])
    
    palette = [
        SPECIAL_COLORS["pos2"], 
        SPECIAL_COLORS["pos3"], 
        SPECIAL_COLORS["pos4"], 
        SPECIAL_COLORS["pos5"], 
        SPECIAL_COLORS["pos6"] 
    ]
    
    for i, lap in enumerate(pool_laps):
        if i < len(palette):
            lap['FinalColor'] = palette[i]
        else:
            lap['FinalColor'] = "#888888" 
            
    color_map = {}
    all_laps = rank1_laps + pool_laps
    for lap in all_laps:
        # Use unique key logic to map color
        key = create_unique_driver_key(lap['Driver'], lap['Lap'], lap['Year'], lap['Session'])
        color_map[key] = lap['FinalColor']
        
    return color_map

def get_corner_distances_and_labels(corners):
    distances = [0]
    labels = ["Start"]
    for _, corner in corners.iterrows():
        if isinstance(corner['Number'], (int, str)) and not isinstance(corner['Number'], float):
            distances.append(corner['Distance'])
            labels.append(f"Corner {corner['Number']}")
    if len(distances) > 1:
        max_distance = max(distances)
        distances.append(max_distance * 1.01)
        labels.append("Finish")
    return distances, labels

def plot_multi_lap_delta(selected_laps, loaded_sessions, reference_session, export=False,
                         zoom_enabled=False, zoom_start=0, zoom_end=None):
    try:
        if len(selected_laps) < 2:
            raise ValueError("Need at least two laps for comparison")
        circuit_info = reference_session.get_circuit_info()
        filtered_corners = filter_duplicate_corner_numbers(circuit_info.corners)
        
        # Determine Reference Lap (Fastest)
        reference_lap_data = min(selected_laps, key=lambda x: x[1]['LapTime'].total_seconds() if pd.notnull(x[1]['LapTime']) else float('inf'))
        reference_driver, reference_lap, reference_session_key, _ = reference_lap_data
        reference_session = loaded_sessions[reference_session_key]
        reference_lap_number = int(reference_lap['LapNumber'])
        reference_year, reference_gp, reference_session_name = reference_session_key

        # Calculate Reference Color (for 0 line)
        ref_unique_key = create_unique_driver_key(reference_driver, reference_lap_number, reference_year, reference_session_name)
        
        # --- 2026 Logic check ---
        show_drs = True
        all_laps_2026_plus = True
        for _, _, session_key, _ in selected_laps:
            year = session_key[0]
            if int(year) < 2026:
                all_laps_2026_plus = False
                break
        
        if all_laps_2026_plus:
            show_drs = False

        try:
            ref_tel = reference_lap.get_car_data(interpolate_edges=True).add_distance()
        except Exception:
            ref_tel = pd.DataFrame({'Distance': [], 'Time': []})

        tel_data = {}
        laps_for_color = []
        
        # Check if all selected laps are from the exact same session (Year, GP, Session)
        first_sk = selected_laps[0][2]
        all_same_session = all(x[2] == first_sk for x in selected_laps)

        # Process all laps
        for driver_code, lap, session_key, _ in selected_laps:
            year, gp, session_name = session_key
            session = loaded_sessions[session_key]
            lap_number = int(lap['LapNumber'])
            unique_key = create_unique_driver_key(driver_code, lap_number, year, session_name)
            
            # Data for color calculation
            driver_info = session.get_driver(lap['DriverNumber'])
            d_num = str(driver_info.get('DriverNumber', driver_code)).strip()
            
            if d_num in CUSTOM_2026_GRID:
                _, full_name, team_name = CUSTOM_2026_GRID[d_num]
                headshot_url = driver_info.get('HeadshotUrl', '')
                last_name = full_name.split(" ")[-1]
            else:
                full_name = driver_info.get('FullName', f"Driver {d_num}")
                last_name = driver_info.get('LastName', full_name.split()[-1])
                team_name = driver_info.get('TeamName', 'Unknown')
                headshot_url = driver_info.get('HeadshotUrl', '')
                
            team_color = get_team_color_safe(team_name, session=session)
            
            laps_for_color.append({
                'Driver': driver_code,
                'Lap': lap_number,
                'Year': year,
                'Session': session_name,
                'LapTimeVal': lap['LapTime'].total_seconds() if pd.notnull(lap['LapTime']) else 99999,
                'Team': team_name,
                'TeamColor': team_color,
                'Headshot': headshot_url,
                'UniqueKey': unique_key,
                'FullName': full_name,
                'LastName': last_name
            })

            # Telemetry Logic
            if unique_key == ref_unique_key:
                tel_data[unique_key] = {
                    'delta': np.zeros_like(ref_tel['Distance']),
                    'tel': ref_tel,
                    'lap': lap,
                    'driver_code': driver_code,
                    'year': year,
                    'session_name': session_name,
                    'lap_number': lap_number
                }
            else:
                try:
                    delta, _, comp_tel = delta_time(reference_lap, lap)
                    tel_data[unique_key] = {
                        'delta': delta,
                        'tel': comp_tel if not comp_tel.empty else pd.DataFrame(),
                        'lap': lap,
                        'driver_code': driver_code,
                        'year': year,
                        'session_name': session_name,
                        'lap_number': lap_number
                    }
                except Exception:
                    tel_data[unique_key] = {'delta': np.zeros_like(ref_tel['Distance']), 'tel': pd.DataFrame(), 'lap': lap}

        # Calculate Colors
        color_map = calculate_lap_colors(laps_for_color)
        ref_color = color_map.get(ref_unique_key, "#FFFFFF")
        
        # --- LAYOUT CALCULATION ---
        # Sort laps for display order (Fastest first) to calculate rows
        laps_for_color.sort(key=lambda x: x['LapTimeVal'])
        num_drivers = len(laps_for_color)
        cols_info = 3 
        rows_info = (num_drivers + cols_info - 1) // cols_info
        
        # Calculate height ratio for info box area relative to other plots
        # Standard plot ratio sum is approx 15-16. 
        # Base info box ratio is 1.5. If we have 2 rows, we need roughly double that.
        info_ratio = 1.5 + ((rows_info - 1) * 1.5)
        
        if show_drs:
            height_ratios = [0.8, 3.5, 2.5, 2.5, 2, 1, 2.5, 2, 1.5, info_ratio]
            num_telemetry_rows = 8
        else:
            height_ratios = [0.8, 3.5, 2.5, 2.5, 2, 1, 2.5, 2.5, info_ratio]
            num_telemetry_rows = 7

        fig_width, fig_height, dpi = calculate_figure_dimensions(export, height_ratios, rows_info=rows_info)
        fig = plt.figure(figsize=(fig_width, fig_height), dpi=dpi)
        
        # Increase hspace to separate boxes a bit
        gs = fig.add_gridspec(len(height_ratios), 1, height_ratios=height_ratios, hspace=0.35)
        
        # Adjust top margin
        plt.subplots_adjust(top=0.97, bottom=0.03)

        header_ax = fig.add_subplot(gs[0])
        axs = [fig.add_subplot(gs[i+1]) for i in range(num_telemetry_rows)]
        info_ax = fig.add_subplot(gs[len(height_ratios)-1])

        # --- DRAW HEADER ---
        header_ax.axis('off')
        
        # Background Box for Header
        fancy_box = FancyBboxPatch((0.15, 0.1), 0.7, 0.8, boxstyle="round,pad=0.05", 
                                   fc='none', ec=CYAN, lw=2, transform=header_ax.transAxes)
        header_ax.add_patch(fancy_box)
        
        # Determine Header Text based on session mix
        if all_same_session:
             header_text = f"{reference_year} {reference_gp} - {reference_session_name}"
        else:
             header_text = f"{reference_gp}"

        # Header Text
        header_ax.text(0.5, 0.5, header_text, color='white', fontsize=48, 
                       fontfamily=KALAMEH_FONT, fontweight='bold', ha='center', va='center')

        # Flag inside Header Box
        try:
            gp_name = reference_session_key[1]
            flag_url = get_flag_url(gp_name)
            req = Request(flag_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(req) as url:
                # Convert to RGB to avoid negative colors on dark background
                img = Image.open(url).convert("RGB")
                ib = OffsetImage(img, zoom=0.5) 
                ab = AnnotationBbox(ib, (0.22, 0.5), xycoords='axes fraction', frameon=False, box_alignment=(0.5, 0.5))
                header_ax.add_artist(ab)
        except Exception: pass
        

        # --- TELEMETRY PLOTS ---
        SPEED_IDX = 0
        DELTA_SPEED_IDX = 1
        TIME_DELTA_IDX = 2
        THROTTLE_IDX = 3
        BRAKE_IDX = 4
        GEAR_IDX = 5
        RPM_IDX = 6
        DRS_IDX = 7 if show_drs else -1
        
        # Interpolate Data
        max_dist = ref_tel['Distance'].max() if not ref_tel.empty else 5000
        common_dist = np.linspace(0, max_dist, int(max_dist/5)+1)
        interp_funcs = {}
        
        for ukey, d in tel_data.items():
            t = d.get('tel', pd.DataFrame())
            interp_funcs[ukey] = {}
            for col in ['Speed', 'Throttle', 'Brake', 'RPM', 'nGear', 'DRS']:
                if col in t.columns and not t.empty:
                    # Gear Fix: Nearest Neighbor/Rounding for integers
                    if col == 'nGear':
                        # Interpolate then round to nearest integer to avoid slanted broken lines
                        val = np.interp(common_dist, t['Distance'], t[col])
                        interp_funcs[ukey][col] = np.round(val).astype(int)
                    else:
                        interp_funcs[ukey][col] = np.interp(common_dist, t['Distance'], t[col])
                else:
                    interp_funcs[ukey][col] = np.zeros_like(common_dist)
        
        # --- Add "0" Reference Line for Deltas (SOLID LINE) ---
        axs[DELTA_SPEED_IDX].axhline(0, color=ref_color, linestyle='-', linewidth=1.5, alpha=0.8)
        axs[TIME_DELTA_IDX].axhline(0, color=ref_color, linestyle='-', linewidth=1.5, alpha=0.8)

        # Plot Loop
        for ukey, d in tel_data.items():
            color = color_map.get(ukey, "#FFFFFF")
            # Speed
            axs[SPEED_IDX].plot(common_dist, interp_funcs[ukey]['Speed'], color=color)
            # Delta Speed
            if ukey != ref_unique_key:
                delta_s = interp_funcs[ukey]['Speed'] - interp_funcs[ref_unique_key]['Speed']
                axs[DELTA_SPEED_IDX].plot(common_dist, delta_s, color=color)
            # Time Delta
            if ukey != ref_unique_key:
                interp_delta = np.interp(common_dist, ref_tel['Distance'], d['delta'])
                axs[TIME_DELTA_IDX].plot(common_dist, interp_delta, color=color)
            # Throttle
            axs[THROTTLE_IDX].plot(common_dist, interp_funcs[ukey]['Throttle'], color=color)
            # Brake
            axs[BRAKE_IDX].step(common_dist, np.where(interp_funcs[ukey]['Brake']>0.5, 1, 0), color=color)
            # Gear (stepped)
            axs[GEAR_IDX].step(common_dist, interp_funcs[ukey]['nGear'], where='post', color=color)
            # RPM
            axs[RPM_IDX].plot(common_dist, interp_funcs[ukey]['RPM'], color=color)
            # DRS
            if show_drs and DRS_IDX != -1:
                axs[DRS_IDX].step(common_dist, np.where(interp_funcs[ukey]['DRS']>8, 1, 0), color=color)

        # Titles & Labels
        titles = ['Speed', 'Delta Speed', 'Time Delta', 'Throttle', 'Brake', 'Gear', 'RPM']
        if show_drs: titles.append('DRS')
        
        for i, ax in enumerate(axs):
            ax.set_title(titles[i], fontsize=32, fontweight='bold', color=CYAN, fontfamily=KALAMEH_FONT)
            ax.set_xlim(zoom_start if zoom_enabled else 0, zoom_end if zoom_enabled and zoom_end else max_dist)
            y_min, y_max = ax.get_ylim()
            # Show corner markers in ALL subplots (label_below=True)
            add_corner_markers_to_subplot(ax, filtered_corners, y_min, y_max, label_below=True, 
                                          zoom_start=zoom_start if zoom_enabled else None, 
                                          zoom_end=zoom_end if zoom_enabled else None)

        # --- DRIVER INFO BOXES (Bottom) ---
        info_ax.axis('off')
        
        # Increase margin to separate boxes
        margin_x = 0.06  # Increased from 0.04 to 0.06 for more gap
        margin_y = 0.1   
        box_w = (1.0 - (cols_info + 1) * margin_x) / cols_info
        box_h = (1.0 - (rows_info + 1) * margin_y) / max(rows_info, 1)
        
        fastest_time = laps_for_color[0]['LapTimeVal']

        for i, ldata in enumerate(laps_for_color):
            r = i // cols_info
            c = i % cols_info
            
            y_top = 1.0 - margin_y - r * (box_h + margin_y)
            y_bottom = y_top - box_h
            x_left = margin_x + c * (box_w + margin_x)
            
            color = color_map.get(ldata['UniqueKey'], "#FFFFFF")
            
            box_facecolor = PANEL_BG 
            
            rect = FancyBboxPatch((x_left, y_bottom), box_w, box_h, 
                                  boxstyle="round,pad=0.02", fc=box_facecolor, ec=color, lw=2, transform=info_ax.transAxes)
            info_ax.add_patch(rect)
            
            # Headshot (Increased Zoom significantly)
            path = get_driver_headshot(ldata['Driver'], ldata['Headshot'])
            if path:
                try:
                    img = plt.imread(path)
                    ib = OffsetImage(img, zoom=0.99) # Increased from 0.55 to 0.85
                    ab = AnnotationBbox(ib, (x_left + 0.06, y_bottom + box_h/2), 
                                        xycoords='axes fraction', frameon=False, box_alignment=(0.5, 0.5))
                    info_ax.add_artist(ab)
                except: pass
            
            text_x = x_left + 0.14 # Shifted slightly right to accommodate bigger headshot
            # Driver Name
            info_ax.text(text_x, y_bottom + 0.75*box_h, ldata['Driver'], color=color, 
                         fontsize=30, fontweight='bold', fontfamily=KALAMEH_FONT, transform=info_ax.transAxes)
            # Session info
            sess_str = f"{ldata['Year']} {ldata['Session']} L{ldata['Lap']}"
            info_ax.text(text_x, y_bottom + 0.55*box_h, sess_str, color='white', 
                         fontsize=20, fontfamily=KALAMEH_FONT, transform=info_ax.transAxes)
            # Time
            lt_str = format_laptime(pd.Timedelta(seconds=ldata['LapTimeVal']))
            info_ax.text(text_x, y_bottom + 0.35*box_h, lt_str, color='white', 
                         fontsize=25, fontweight='bold', fontfamily=KALAMEH_FONT, transform=info_ax.transAxes)
            
            # Delta to Fastest / "Faster" Text
            if i == 0:
                # Fastest Driver
                info_ax.text(text_x, y_bottom + 0.15*box_h, "Faster", color=GREEN_TEXT, 
                             fontsize=22, fontweight='bold', fontfamily=KALAMEH_FONT, transform=info_ax.transAxes)
            else:
                # Delta
                delta = ldata['LapTimeVal'] - fastest_time
                delta_str = f"+{delta:.3f}"
                info_ax.text(text_x, y_bottom + 0.15*box_h, delta_str, color=RED_TEXT, 
                             fontsize=28, fontweight='bold', fontfamily=KALAMEH_FONT, transform=info_ax.transAxes)

        add_watermark(fig, text="@Amir_Formula")
        return fig, header_text, "Circuit", tel_data, reference_session_key

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

class F1DeltaAnalyzer(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("F1 Multi-Session Lap Delta Analyzer")
        self.geometry("1200x700")
        self.configure(bg=DARK_BG)
        self.current_session = None
        self.years = list(range(2018, 2027)) 
        self.schedules = {}
        self.loaded_sessions = {}
        self.selected_laps = []
        self.next_lap_id = 0
        self.plot_window = None
        self.zoom_enabled = tk.BooleanVar(value=False)
        self.zoom_start_var = tk.StringVar()
        self.zoom_end_var = tk.StringVar()
        self.corner_distances = None
        self.corner_labels = None
        self.setup_dark_theme()
        self.setup_gui()
        self.load_all_schedules()
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_closing(self):
        try:
            plt.close('all')
            if self.plot_window: self.plot_window.destroy()
            self.destroy()
        except: self.destroy()

    def setup_dark_theme(self):
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TFrame', background=DARK_BG)
        style.configure('TLabel', background=DARK_BG, foreground='white', font=(KALAMEH_FONT, 16))
        style.configure('TButton', background='#2d2d2d', foreground='white', font=(KALAMEH_FONT, 14))
        style.configure('TCombobox', fieldbackground='#2d2d2d', background='#3d3d3d', foreground='white', font=(KALAMEH_FONT, 14))
        style.configure('Accent.TButton', foreground='white', background='#0072C6', font=(KALAMEH_FONT, 16, 'bold'))

    def setup_gui(self):
        self.left_frame = ttk.Frame(self, padding=10)
        self.left_frame.grid(row=0, column=0, sticky='nsw')
        self.mid_frame = ttk.Frame(self, padding=10)
        self.mid_frame.grid(row=0, column=1, sticky='nsew')
        self.right_frame = ttk.Frame(self, padding=10)
        self.right_frame.grid(row=0, column=2, sticky='nse')
        
        self.columnconfigure(1, weight=1)
        self.rowconfigure(0, weight=1)

        ttk.Label(self.left_frame, text="Year:").pack(anchor='w')
        self.year_var = tk.IntVar(value=2026)
        self.year_box = ttk.Combobox(self.left_frame, textvariable=self.year_var, values=self.years, width=8, state="readonly")
        self.year_box.pack(anchor='w', pady=5)
        self.year_box.bind("<<ComboboxSelected>>", self.update_gps_from_schedule)

        ttk.Label(self.left_frame, text="Grand Prix:").pack(anchor='w')
        self.gp_var = tk.StringVar()
        self.gp_box = ttk.Combobox(self.left_frame, textvariable=self.gp_var, width=32, state="readonly")
        self.gp_box.pack(anchor='w', pady=5)
        self.gp_box.bind("<<ComboboxSelected>>", self.update_sessions)

        ttk.Label(self.left_frame, text="Session:").pack(anchor='w')
        self.session_var = tk.StringVar()
        self.session_box = ttk.Combobox(self.left_frame, textvariable=self.session_var, width=22, state="readonly")
        self.session_box.pack(anchor='w', pady=5)

        ttk.Button(self.left_frame, text="Load Drivers", command=self.load_drivers, style='Accent.TButton').pack(anchor='w', pady=10)

        # Drivers Canvas
        self.drivers_canvas = tk.Canvas(self.mid_frame, bg=DARK_BG, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.mid_frame, orient="vertical", command=self.drivers_canvas.yview)
        self.drivers_buttons_frame = ttk.Frame(self.drivers_canvas)
        self.drivers_canvas.configure(yscrollcommand=scrollbar.set)
        self.drivers_canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        self.drivers_canvas.create_window((0,0), window=self.drivers_buttons_frame, anchor="nw")
        self.drivers_buttons_frame.bind("<Configure>", lambda e: self.drivers_canvas.configure(scrollregion=self.drivers_canvas.bbox("all")))
        self.driver_buttons = []

        # Laps List
        self.laps_frame = ttk.LabelFrame(self.right_frame, text="Selected Laps (Max 6)")
        self.laps_frame.pack(fill='both', expand=True)
        self.laps_listbox_frame = ttk.Frame(self.laps_frame)
        self.laps_listbox_frame.pack(fill='both', expand=True)
        self.laps_listbox_items = []

        ttk.Button(self.right_frame, text="Generate Plot", command=self.plot_multi_delta, style='Accent.TButton').pack(pady=10)
        self.status_var = tk.StringVar(value="Ready.")
        ttk.Label(self, textvariable=self.status_var, relief='sunken').grid(row=1, column=0, columnspan=3, sticky='we')

    def update_gps_from_schedule(self, event=None):
        try:
            year = int(self.year_var.get())
        except ValueError:
            year = 2026
            
        try:
            schedule = fastf1.get_event_schedule(year)
            if 'EventFormat' in schedule.columns:
                schedule = schedule[schedule['EventFormat'] != 'testing']
            gps = [name for name in schedule['EventName'] if "Test" not in name]
            gps = ["Pre-Season Test 1", "Pre-Season Test 2"] + gps
        except Exception:
            gps = ["Pre-Season Test 1", "Pre-Season Test 2"]

        if year == 2026:
            gps = [gp for gp in gps if 'Bahrain' not in gp and 'Saudi' not in gp]

        self.gp_box['values'] = gps
        if gps:
            self.gp_box.current(2 if len(gps) > 2 else 0)
            self.gp_var.set(self.gp_box.get())
        self.update_sessions()

    def update_sessions(self, event=None):
        gp = self.gp_var.get()
        if str(gp).startswith('Pre-Season Test'):
            self.session_box['values'] = ["P1", "P2", "P3"]
            self.session_var.set("P1")
        else:
            vals = ["FP1", "FP2", "FP3", "Qualifying", "Race", "Sprint", "Sprint Qualifying"]
            self.session_box['values'] = vals
            if self.session_var.get() not in vals:
                self.session_var.set("Qualifying")

    def load_all_schedules(self):
        self.update_gps_from_schedule()

    def set_status(self, text):
        self.status_var.set(text)
        self.update_idletasks()

    def load_drivers(self):
        try:
            year = int(self.year_var.get())
        except ValueError:
            year = 2026
            
        gp = self.gp_var.get()
        session_name = self.session_var.get()
        session_key = (year, gp, session_name)
        
        self.set_status(f"Loading {year} {gp} {session_name}...")
        try:
            if 'Pre-Season' in gp:
                test_num = 1 if '1' in gp else 2
                sess_num = {'P1': 1, 'P2': 2, 'P3': 3}.get(session_name, 1)
                session = fastf1.get_testing_session(year, test_num, sess_num)
            else:
                session = fastf1.get_session(year, gp, session_name)
            
            session.load(telemetry=False, laps=False, weather=False)
            self.loaded_sessions[session_key] = session
            self.current_session = session
            
            for btn in self.driver_buttons: btn.destroy()
            self.driver_buttons = []
            
            drivers = session.drivers
            for i, drv in enumerate(drivers):
                info = session.get_driver(drv)
                d_num = str(info.get('DriverNumber', drv)).strip()
                
                if d_num in CUSTOM_2026_GRID:
                    code, _, team = CUSTOM_2026_GRID[d_num]
                else:
                    code = info.get('Abbreviation', d_num)
                    team = info.get('TeamName', 'Unknown')
                    
                color = get_team_color_safe(team, session=session)
                btn = tk.Button(self.drivers_buttons_frame, text=code, bg=color, fg='white', width=4,
                                font=(KALAMEH_FONT, 14, 'bold'),
                                command=lambda d=drv, c=code, sk=session_key: self.load_driver_laps(d, c, sk))
                btn.grid(row=i//6, column=i%6, padx=2, pady=2)
                self.driver_buttons.append(btn)
                
            self.set_status("Drivers loaded.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def load_driver_laps(self, driver, code, session_key):
        session = self.loaded_sessions[session_key]
        try: session.load() 
        except: pass
        
        laps = session.laps.pick_drivers(driver)
        
        # Determine fastest lap in this list for green highlighting in GUI
        fastest_lap_idx = None
        try:
            fastest_lap = laps.pick_fastest()
            fastest_lap_idx = fastest_lap['LapNumber']
        except:
            pass
            
        top = tk.Toplevel(self)
        top.title(f"Laps - {code}")
        
        canvas = tk.Canvas(top, bg=DARK_BG)
        frame = ttk.Frame(canvas)
        sb = ttk.Scrollbar(top, command=canvas.yview)
        canvas.configure(yscrollcommand=sb.set)
        canvas.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")
        canvas.create_window((0,0), window=frame, anchor="nw")
        frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        
        for i, lap in laps.iterlaps():
            if pd.notna(lap['LapTime']):
                lt = format_laptime(lap['LapTime'])
                lap_num = int(lap['LapNumber'])
                txt = f"Lap {lap_num} ({lt})"
                
                # Check if this is the fastest lap
                bg_color = '#2d2d2d' # Default dark gray
                if fastest_lap_idx is not None and lap_num == fastest_lap_idx:
                    bg_color = GREEN_HIGHLIGHT # Green
                
                btn = tk.Button(frame, text=txt, bg=bg_color, fg='white',
                                font=(KALAMEH_FONT, 14),
                                command=lambda l=lap, c=code, sk=session_key: self.add_lap_display(c, l, sk))
                btn.pack(fill='x', pady=1)

    def add_lap_display(self, code, lap, session_key):
        if len(self.selected_laps) >= 6:
            messagebox.showinfo("Limit", "Max 6 laps allowed.")
            return
            
        year, gp, sname = session_key
        if self.selected_laps:
            first_gp = self.selected_laps[0][2][1]
            if first_gp != gp:
                if not messagebox.askyesno("Track Warning", f"Selected lap is from {gp}, but previous laps are from {first_gp}. Proceed?"):
                    return

        lap_id = self.next_lap_id
        self.next_lap_id += 1
        
        self.selected_laps.append((code, lap, session_key, lap_id))
        
        frame = tk.Frame(self.laps_listbox_frame, bg="#333")
        lbl = tk.Label(frame, text=f"{code} L{int(lap['LapNumber'])}", bg="#333", fg="white", font=(KALAMEH_FONT, 14))
        lbl.pack(side="left")
        btn = tk.Button(frame, text="X", command=lambda: self.remove_lap(frame, lap_id), bg="#333", fg="red", font=(KALAMEH_FONT, 12, 'bold'))
        btn.pack(side="right")
        frame.pack(fill="x", pady=1)
        self.laps_listbox_items.append((frame, lap_id))

    def remove_lap(self, frame, lap_id):
        frame.destroy()
        self.selected_laps = [x for x in self.selected_laps if x[3] != lap_id]
        self.laps_listbox_items = [x for x in self.laps_listbox_items if x[1] != lap_id]

    def plot_multi_delta(self):
        if len(self.selected_laps) < 2: return
        self.set_status("Generating...")
        
        ref_session = self.loaded_sessions[self.selected_laps[0][2]]
        try:
            fig, _, _, _, _ = plot_multi_lap_delta(self.selected_laps, self.loaded_sessions, ref_session, export=True)
            
            # Export
            year, gp, sess = self.selected_laps[0][2]
            drivers = " vs ".join(sorted(list(set([x[0] for x in self.selected_laps]))))
            fname = f"Telemetries compare-{gp}-{year}-{sess}-( {drivers} )-code#18"
            safe = safe_filename(fname)
            path = os.path.join(EXPORT_DIR, safe + ".png")
            fig.savefig(path, bbox_inches='tight')
            save_instagram_square_png(safe, path)
            
            self.plot_window = tk.Toplevel(self)
            canvas = FigureCanvasTkAgg(fig, master=self.plot_window)
            canvas.draw()
            canvas.get_tk_widget().pack(fill='both', expand=True)
            self.set_status("Done.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    app = F1DeltaAnalyzer()
    app.mainloop()