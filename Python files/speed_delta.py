import fastf1
from fastf1 import plotting
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
import numpy as np
import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib
matplotlib.use('Agg')
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import matplotlib.font_manager as fm
from scipy.interpolate import interp1d
import pandas as pd
from PIL import Image
import threading
import time
import atexit
import sys
import re
from matplotlib.patches import FancyBboxPatch, PathPatch
import matplotlib.patheffects as path_effects
from urllib.request import urlopen, Request
from matplotlib.colors import to_rgba
import requests
from io import BytesIO

# ==========================================
# USER-AGENT PATCH FOR FASTF1 & ERGAST
# ==========================================
import requests
import urllib.request

original_get = requests.get

def patched_get(*args, **kwargs):
    kwargs.setdefault("headers", {})
    if "User-Agent" not in kwargs["headers"]:
        kwargs["headers"]["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    return original_get(*args, **kwargs)

requests.get = patched_get
requests.Session.get = patched_get

original_urlopen = urllib.request.urlopen

def patched_urlopen(url, *args, **kwargs):
    if isinstance(url, str):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'})
        return original_urlopen(req, *args, **kwargs)
    elif isinstance(url, urllib.request.Request):
        if not url.has_header('User-agent') and not url.has_header('User-Agent'):
            url.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36')
        return original_urlopen(url, *args, **kwargs)
    return original_urlopen(url, *args, **kwargs)

urllib.request.urlopen = patched_urlopen

# --- Setup FastF1 Cache ---
cache_folder = r"D:\Data\AF\f1_analysis\Cache"
os.makedirs(cache_folder, exist_ok=True)
os.environ['FASTF1_CACHE'] = cache_folder
fastf1.Cache.enable_cache(cache_folder)

# --- Export Paths ---
EXPORT_DIR = r"D:\Data\AF\Exports"
INSTAGRAM_DIR = os.path.join(EXPORT_DIR, "Instagram")
INSTAGRAM_SIZE = 1080
DARK_BG = "#1A1A1D" 
CORNER_CIRCLE = "#2C2D35"
ACCENT_CYAN = "#00E5FF"
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(INSTAGRAM_DIR, exist_ok=True)

DRIVER_IMG_DIR = os.path.join(cache_folder, "Drivers")
os.makedirs(DRIVER_IMG_DIR, exist_ok=True)

active_threads = []

# ================== FONT SETTINGS ==================
KALAMEH_FONT_NAME = "Kalameh"
possible_fonts = ["Kalameh.ttf", "Kalameh-Regular.ttf", r"D:\Data\AF\f1_analysis\Kalameh.ttf"]
font_loaded = False

for f_path in possible_fonts:
    if os.path.exists(f_path):
        try:
            fm.fontManager.addfont(f_path)
            print(f"Successfully loaded font: {f_path}")
            font_loaded = True
            break
        except Exception as e:
            print(f"Failed to load font {f_path}: {e}")

if not font_loaded:
    font_paths = fm.findSystemFonts(fontpaths=None, fontext='ttf')
    kalameh_path = next((p for p in font_paths if "Kalameh" in os.path.basename(p)), None)
    if kalameh_path:
        fm.fontManager.addfont(kalameh_path)
        font_loaded = True

plt.rcParams['font.family'] = KALAMEH_FONT_NAME
plt.rcParams['font.sans-serif'] = [KALAMEH_FONT_NAME]

plt.style.use('dark_background')
plt.rcParams.update({
    'axes.facecolor': DARK_BG,
    'figure.facecolor': DARK_BG,
    'axes.edgecolor': '#404040',
    'axes.labelcolor': 'white',
    'text.color': 'white',
    'xtick.color': 'white',
    'ytick.color': 'white',
    'legend.facecolor': '#23272F',
    'legend.edgecolor': '#404040',
    'savefig.facecolor': DARK_BG,
    'savefig.edgecolor': DARK_BG
})

SPECIAL_COLORS = {
    "second": "#9900FF", 
    "third": "#FFFFFF",  
    "fourth": "#C19A6B"  
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
    'LIN': 'https://media.formula1.com/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png',
}

def get_driver_headshot(driver_identifier, url=None):
    valid_url = False
    if url and not pd.isna(url) and str(url).strip() != '':
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
        else:
            os.remove(local_path)
            
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(response.content)
            return local_path
    except Exception as e:
        print(f"DL Error {driver_identifier}: {e}")
    
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

def safe_filename(s: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "_", s)

def save_instagram_square_png(base_filename, source_path):
    out_path = os.path.join(INSTAGRAM_DIR, base_filename + ".png")
    with Image.open(source_path) as img:
        max_side = max(img.size)
        bg_color = tuple(int(DARK_BG.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
        square_img = Image.new("RGB", (max_side, max_side), bg_color)
        square_img.paste(img, ((max_side - img.width) // 2, (max_side - img.height) // 2))
        final_img = square_img.resize((INSTAGRAM_SIZE, INSTAGRAM_SIZE), Image.LANCZOS)
        final_img.save(out_path)

def get_flag_url(gp_name):
    codes = {
        'Pre-Season': 'bh', 'Bahrain': 'bh', 'Saudi': 'sa', 'Australia': 'au', 'Japan': 'jp',
        'China': 'cn', 'Miami': 'us', 'Emilia': 'it', 'Monaco': 'mc',
        'Canada': 'ca', 'Spain': 'es', 'Austria': 'at', 'British': 'gb',
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
    if code == 'xx': return None
    return f"https://flagcdn.com/w160/{code}.png"

def get_track_rotation(session):
    circuit_info = session.get_circuit_info()
    return circuit_info.rotation / 180 * np.pi

def rotate(xy, *, angle):
    rot_mat = np.array([[np.cos(angle), np.sin(angle)],
                        [-np.sin(angle), np.cos(angle)]])
    return np.matmul(xy, rot_mat)

def plot_corners_on_ax(ax, session, track_rotation):
    try:
        circuit_info = session.get_circuit_info()
        offset_vector = [500, 0]
        shown_corners = set()
        for _, corner in circuit_info.corners.iterrows():
            corner_number = str(corner['Number'])
            if corner_number in shown_corners:
                continue
            shown_corners.add(corner_number)
            txt = corner_number
            offset_angle = corner['Angle'] / 180 * np.pi
            offset_x, offset_y = rotate(offset_vector, angle=offset_angle)
            text_x = corner['X'] + offset_x
            text_y = corner['Y'] + offset_y
            text_x, text_y = rotate([text_x, text_y], angle=track_rotation)
            track_x, track_y = rotate([corner['X'], corner['Y']], angle=track_rotation)
            ax.scatter(text_x, text_y, color=CORNER_CIRCLE, s=350, zorder=10)
            ax.plot([track_x, text_x], [track_y, text_y], color='grey', lw=1.7, zorder=9)
            ax.text(
                text_x, text_y, txt,
                va='center_baseline', ha='center',
                size=16, color='white', weight='bold',
                fontname=KALAMEH_FONT_NAME,
                zorder=12
            )
    except Exception:
        pass

def resample_track(x, y, num_points=1000): 
    distance = np.zeros_like(x)
    for i in range(1, len(x)):
        segment_length = np.sqrt((x[i] - x[i-1])**2 + (y[i] - y[i-1])**2)
        distance[i] = distance[i-1] + segment_length
    uniform_distance = np.linspace(0, distance[-1], num_points)
    x_resampled = np.interp(uniform_distance, distance, x)
    y_resampled = np.interp(uniform_distance, distance, y)
    return x_resampled, y_resampled

def draw_header_box(fig, ax_rect, gp_name, year, session_name, is_single_session):
    """Draw top header box"""
    header_ax = fig.add_axes(ax_rect)
    header_ax.set_facecolor('none')
    header_ax.axis('off')
    
    header_ax.set_xlim(0, 1)
    header_ax.set_ylim(0, 1)
    
    fancy_box = FancyBboxPatch(
        (0, 0), 1, 1,
        boxstyle="round,pad=0.0,rounding_size=0.15",
        fc='#23242B',
        ec=ACCENT_CYAN,
        lw=2.5,
        transform=header_ax.transAxes,
        zorder=0
    )
    header_ax.add_patch(fancy_box)

    try:
        flag_url = get_flag_url(gp_name)
        if flag_url:
            flag_ax = fig.add_axes([ax_rect[0] + 0.04, ax_rect[1] + 0.02, 0.06, 0.06])
            flag_ax.axis('off')
            req = Request(flag_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(req) as url:
                flag_img = Image.open(url)
                flag_ax.imshow(flag_img)
    except Exception as e:
        print(f"Flag load error: {e}")

    if is_single_session:
        text_str = f"{gp_name} - {year} - {session_name}"
    else:
        text_str = f"{gp_name}" 

    header_ax.text(0.55, 0.65, text_str, color='white', fontsize=32, 
                   fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='center', va='center')
    
    header_ax.text(0.55, 0.25, "Drivers speed delta during laps", color='#A0A0A0', fontsize=18, 
                   fontname=KALAMEH_FONT_NAME, ha='center', va='center')

def draw_driver_boxes(fig, ax_rect, drivers_data, is_single_session):
    """Draw driver info boxes"""
    num_drivers = len(drivers_data)
    if num_drivers == 0: return

    total_w = ax_rect[2]
    gap = 0.015
    box_w = (total_w - (gap * (num_drivers - 1))) / num_drivers
    box_h = ax_rect[3]
    y_pos = ax_rect[1]
    
    name_fs = 34 if num_drivers <= 2 else 24
    time_fs = 28 if num_drivers <= 2 else 20
    base_delta_fs = 28 if num_drivers <= 2 else 22
    
    delta_fs = base_delta_fs + 6
    info_fs = 22 if num_drivers <= 2 else (16 if is_single_session else 18)
    
    for i, data in enumerate(drivers_data):
        x_pos = ax_rect[0] + (i * (box_w + gap))
        rect = [x_pos, y_pos, box_w, box_h]
        
        d_ax = fig.add_axes(rect)
        d_ax.set_facecolor('none')
        d_ax.axis('off')
        
        d_ax.set_xlim(0, 1)
        d_ax.set_ylim(0, 1)
        
        fancy_box = FancyBboxPatch(
            (0, 0), 1, 1,
            boxstyle="round,pad=0.0,rounding_size=0.1",
            fc='#1E1E24',
            ec=data['color'],
            lw=2.5,
            transform=d_ax.transAxes,
            zorder=0
        )
        d_ax.add_patch(fancy_box)
        
        try:
            img_path = get_driver_headshot(data['code'], data['headshot_url'])
            if img_path:
                img_w = box_w * 0.5
                img_h = box_h * 0.8
                img_x = rect[0] + (box_w - img_w) / 2
                img_y = rect[1] + 0.01
                
                img_ax = fig.add_axes([img_x, img_y, img_w, img_h])
                img_ax.axis('off')
                img = Image.open(img_path)
                img_ax.imshow(img)
        except Exception:
            pass
            
        top_y = 0.82
        if data['is_faster']:
            d_ax.text(0.95, top_y, "Fastest", color='#00FF7F', fontsize=delta_fs-4, 
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right')
        else:
            d_ax.text(0.95, top_y, data['delta_str'], color='#FF3366', fontsize=delta_fs, 
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right')
        
        name_txt = d_ax.text(0.05, 0.60, data['name'], color=data['color'], fontsize=name_fs, 
                             fontname=KALAMEH_FONT_NAME, fontweight='bold', va='center',
                             bbox=dict(facecolor=data['color'], alpha=0.15, edgecolor='none', pad=4))
        name_txt.set_path_effects([
            path_effects.Stroke(linewidth=3, foreground='black'),
            path_effects.Normal()
        ])
        
        d_ax.text(0.95, 0.60, data['time_str'], color='white', fontsize=time_fs, 
                  fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right', va='center')

        d_ax.plot([0.05, 0.95], [0.42, 0.42], color='#333333', lw=1.5)

        if is_single_session:
            lap_info = f"Lap #{data['lap_num']}"
        else:
            lap_info = f"{data['year']} {data['sess_name']} | Lap #{data['lap_num']}"
            
        d_ax.text(0.05, 0.20, lap_info, color='#DDDDDD', fontsize=info_fs, 
                  fontname=KALAMEH_FONT_NAME, fontweight='bold', va='center')

        # 3 decimal places for speed values
        avg_text = f"Avg: {data['avg_speed']:.3f} km/h"
        d_ax.text(0.95, 0.26, avg_text, color='#DDDDDD', fontsize=info_fs - 2, 
                  fontname=KALAMEH_FONT_NAME, ha='right', va='center')

        if data['is_faster']:
            spd_diff_txt = "(Ref Avg)"
            spd_diff_color = '#888888'
        else:
            sign = "+" if data['avg_spd_delta'] > 0 else ""
            # 3 decimal places for speed delta
            spd_diff_txt = f"({sign}{data['avg_spd_delta']:.3f} km/h)"
            spd_diff_color = '#00FF7F' if data['avg_spd_delta'] > 0 else '#FF3366'
            
        d_ax.text(0.95, 0.08, spd_diff_txt, color=spd_diff_color, fontsize=info_fs - 4, 
                  fontname=KALAMEH_FONT_NAME, ha='right', va='center')

def generate_track_dominance_plot(selected_laps, loaded_sessions=None, for_export=False):
    if loaded_sessions is None: loaded_sessions = {}
    if len(selected_laps) < 2: return None

    # Get a FIXED track distance from the very first selected lap to ensure math consistency
    fixed_track_distance = None
    try:
        first_lap_tel = selected_laps[0][1].get_telemetry()
        if 'Distance' in first_lap_tel.columns:
            fixed_track_distance = first_lap_tel['Distance'].max()
    except:
        pass

    processed_laps = []
    first_key = selected_laps[0][2]
    is_single_session = all(lap[2] == first_key for lap in selected_laps)

    for (driver_code_base, lap, session_key, lap_id) in selected_laps:
        year, gp, sess_name = session_key
        if session_key not in loaded_sessions:
            if 'Pre-Season' in str(gp):
                test_num = 1 if '1' in gp else 2
                sess_num = {'P1': 1, 'P2': 2, 'P3': 3}.get(sess_name, 1)
                session = fastf1.get_testing_session(year, test_num, sess_num)
            else:
                session = fastf1.get_session(year, gp, sess_name)
            session.load()
            loaded_sessions[session_key] = session
        else:
            session = loaded_sessions[session_key]

        d_num = str(lap['DriverNumber']).strip()
        driver_info = session.get_driver(lap['DriverNumber'])

        if d_num in CUSTOM_2026_GRID:
            abbr, full_name, team_name = CUSTOM_2026_GRID[d_num]
            last_name = full_name.split(" ")[-1]
            headshot_url = driver_info.get('HeadshotUrl', '')
        else:
            abbr = driver_info.get('Abbreviation', d_num)
            full_name = driver_info.get('FullName', f"Driver {d_num}")
            last_name = driver_info.get('LastName', full_name.split()[-1])
            team_name = driver_info.get('TeamName', 'Unknown')
            headshot_url = driver_info.get('HeadshotUrl', '')

        team_color = get_team_color_safe(team_name, session=session)
        
        lap_time_val = lap['LapTime'].total_seconds()
        minutes = int(lap_time_val // 60)
        seconds = int(lap_time_val % 60)
        millis = int((lap_time_val * 1000) % 1000)
        time_str = f"{minutes}:{seconds:02d}.{millis:03d}"
        
        # ------------------------------------------------------------
        # CORRECT AVERAGE SPEED CALCULATION (FIXED TRACK DISTANCE)
        # Using a unified distance guarantees proportional speed scaling
        # ------------------------------------------------------------
        telemetry_temp = lap.get_telemetry()
        lap_time_seconds = lap['LapTime'].total_seconds()
        
        if fixed_track_distance is not None and lap_time_seconds > 0:
            avg_speed = (fixed_track_distance / lap_time_seconds) * 3.6
        elif 'Distance' in telemetry_temp.columns and lap_time_seconds > 0:
            avg_speed = (telemetry_temp['Distance'].max() / lap_time_seconds) * 3.6
        elif 'Speed' in telemetry_temp.columns:
            spd_data = telemetry_temp['Speed'].to_numpy()
            avg_speed = np.mean(spd_data) if len(spd_data) > 0 else 0
        else:
            avg_speed = 0

        processed_laps.append({
            'code': driver_code_base,
            'lap': lap,
            'lap_num': int(lap['LapNumber']),
            'session': session,
            'time_val': lap_time_val,
            'time_str': time_str,
            'avg_speed': avg_speed,
            'name': last_name,
            'full_name': full_name,
            'team': team_name,
            'color': team_color, 
            'headshot_url': headshot_url,
            'gp': gp,
            'year': year,
            'sess_name': sess_name,
            'id': lap_id
        })

    team_groups = {}
    for p in processed_laps:
        t = p['team']
        if t not in team_groups: team_groups[t] = []
        team_groups[t].append(p)
    
    unique_teams = set(p['team'] for p in processed_laps)
    is_multi_team = len(unique_teams) > 1
    processed_laps.sort(key=lambda x: x['time_val'])
    
    if is_multi_team:
        team_lap_counts = {team: len(laps) for team, laps in team_groups.items()}
        is_3_plus_1 = (len(team_lap_counts) == 2 and (3 in team_lap_counts.values() and 1 in team_lap_counts.values()))
        if is_3_plus_1:
            team_with_3 = None
            team_with_1 = None
            for team, count in team_lap_counts.items():
                if count == 3: team_with_3 = team
                elif count == 1: team_with_1 = team
            laps_team_3 = sorted(team_groups[team_with_3], key=lambda x: x['time_val'])
            lap_team_1 = team_groups[team_with_1][0]
            fastest_lap_from_team_3 = laps_team_3[0]
            
            if fastest_lap_from_team_3['time_val'] < lap_team_1['time_val']:
                laps_team_3[1]['color'] = SPECIAL_COLORS["second"] 
                laps_team_3[2]['color'] = SPECIAL_COLORS["third"] 
            else:
                laps_team_3[1]['color'] = SPECIAL_COLORS["second"] 
                laps_team_3[2]['color'] = SPECIAL_COLORS["third"] 
        else:
            team_2nd_laps = {} 
            for team, team_laps in team_groups.items():
                team_laps.sort(key=lambda x: x['time_val'])
                if len(team_laps) > 1:
                    team_2nd_laps[team] = team_laps[1]
            if len(team_2nd_laps) > 1:
                sorted_2nd_laps = sorted(team_2nd_laps.items(), key=lambda x: x[1]['time_val'])
                for idx, (team, lap) in enumerate(sorted_2nd_laps):
                    if idx == 0: lap['color'] = SPECIAL_COLORS["second"]
                    else: lap['color'] = "#FFFFFF" 
            elif len(team_2nd_laps) == 1:
                for team, lap in team_2nd_laps.items():
                    lap['color'] = SPECIAL_COLORS["second"] 
    else:
        for team, team_laps in team_groups.items():
            team_laps.sort(key=lambda x: x['time_val'])
            for position_idx, p in enumerate(team_laps):
                position_in_team = position_idx + 1
                if position_in_team == 2: p['color'] = SPECIAL_COLORS["second"] 
                elif position_in_team == 3: p['color'] = SPECIAL_COLORS["third"] 
                elif position_in_team == 4: p['color'] = SPECIAL_COLORS["fourth"]

    processed_laps.sort(key=lambda x: x['time_val'])
    fastest_time = processed_laps[0]['time_val']
    baseline_avg_speed = processed_laps[0]['avg_speed']
    
    header_drivers = []
    for i, p in enumerate(processed_laps):
        delta = p['time_val'] - fastest_time
        delta_str = f"+{delta:.3f}" if delta > 0 else ""
        
        avg_spd_delta = p['avg_speed'] - baseline_avg_speed
        
        header_drivers.append({
            'name': p['name'],
            'team': p['team'],
            'time_str': p['time_str'],
            'color': p['color'],
            'headshot_url': p['headshot_url'],
            'delta_str': delta_str,
            'is_faster': (i == 0),
            'year': p['year'],
            'sess_name': p['sess_name'],
            'lap_num': p['lap_num'],
            'avg_speed': p['avg_speed'],
            'avg_spd_delta': avg_spd_delta,
            'code': p['code']
        })

    ref_session = processed_laps[0]['session']
    track_rotation = get_track_rotation(ref_session)

    num_drivers = len(processed_laps)
    base_width = 18
    base_height = 14
    fig_width = base_width * (4/3) if num_drivers >= 4 else base_width
        
    fig, ax = plt.subplots(figsize=(fig_width, base_height) if for_export else (12, 10))
    ax.set_position([0.02, 0.05, 0.78, 0.55]) 

    draw_header_box(fig, [0.15, 0.88, 0.70, 0.10], 
                    processed_laps[0]['gp'], 
                    processed_laps[0]['year'], 
                    processed_laps[0]['sess_name'],
                    is_single_session)
    
    draw_driver_boxes(fig, [0.05, 0.68, 0.90, 0.16], header_drivers, is_single_session)

    tel_list = []
    for p in processed_laps:
        lap = p['lap']
        telemetry = lap.get_telemetry()
        x = telemetry['X'].to_numpy()
        y = telemetry['Y'].to_numpy()

        if track_rotation != 0:
            xy = np.vstack((x, y)).T
            xy_rot = rotate(xy, angle=track_rotation)
            x = xy_rot[:, 0]
            y = xy_rot[:, 1]
            
        if "Time" in telemetry.columns:
            times = telemetry["Time"].dt.total_seconds().to_numpy()
        else:
            times = np.linspace(0, 1, len(telemetry))

        valid = ~np.isnan(times) & ~np.isnan(x) & ~np.isnan(y)
        times = times[valid]; x = x[valid]; y = y[valid]

        if 'Speed' in telemetry.columns:
            speed_data = telemetry['Speed'].to_numpy()
            speed = speed_data[valid] if len(speed_data) == len(valid) else speed_data[:len(x)]
        else:
            speed = np.zeros_like(x)

        x_resampled, y_resampled = resample_track(x, y, num_points=1000)
        
        if len(x) > 1:
            track_distance = np.cumsum(np.sqrt(np.diff(x)**2 + np.diff(y)**2))
            track_distance = np.insert(track_distance, 0, 0)
            resampled_distance = np.linspace(0, track_distance[-1], len(x_resampled))
            speed_resampled = np.interp(resampled_distance, track_distance, speed)
        else:
            speed_resampled = np.zeros_like(x_resampled)

        tel_list.append({'x': x_resampled, 'y': y_resampled, 'speed': speed_resampled, 'color': p['color'], 'code': p['code']})

    base_x, base_y = tel_list[0]['x'], tel_list[0]['y']
    ax.plot(base_x, base_y, color='white', lw=15, alpha=0.1, zorder=0) 
    
    # ------------------ Calculate Speed Difference and Opacity ------------------
    all_speeds = np.array([t['speed'] for t in tel_list])
    
    fastest_driver_idx = np.argmax(all_speeds, axis=0)
    fastest_speeds = np.max(all_speeds, axis=0)
    
    if len(tel_list) > 1:
        sorted_speeds = np.sort(all_speeds, axis=0)[::-1] 
        second_fastest_speeds = sorted_speeds[1]
        speed_diffs = fastest_speeds - second_fastest_speeds
    else:
        speed_diffs = np.zeros_like(fastest_speeds)

    max_global_diff = np.max(speed_diffs)
    if max_global_diff == 0:
        max_global_diff = 1.0 

    ref_x = tel_list[0]['x']
    ref_y = tel_list[0]['y']
    points = np.array([ref_x, ref_y]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)
    
    seg_colors_with_alpha = []
    for i in range(len(fastest_driver_idx) - 1):
        d_idx = fastest_driver_idx[i]
        base_color = tel_list[d_idx]['color']
        diff = speed_diffs[i]
        
        alpha = np.clip(diff / max_global_diff, 0.05, 1.0)
        
        rgba_color = to_rgba(base_color, alpha=alpha)
        seg_colors_with_alpha.append(rgba_color)
    
    from matplotlib.collections import LineCollection
    lc = LineCollection(segments, colors=seg_colors_with_alpha, lw=11, zorder=5)
    ax.add_collection(lc)
    # --------------------------------------------------------------------------------

    # ------------------ DRAW VERTICAL GRADIENT LEGEND ------------------
    if len(processed_laps) >= 2:
        cax = fig.add_axes([0.85, 0.10, 0.025, 0.45])
        cax.set_facecolor('none')
        cax.axis('off')
        
        d1 = processed_laps[0]
        d2 = processed_laps[1]
        
        s1 = tel_list[0]['speed']
        s_other_1 = np.max([t['speed'] for i, t in enumerate(tel_list) if i != 0], axis=0)
        max_adv_1 = np.max(s1 - s_other_1) if np.max(s1 - s_other_1) > 0 else 0
        
        s2 = tel_list[1]['speed']
        s_other_2 = np.max([t['speed'] for i, t in enumerate(tel_list) if i != 1], axis=0)
        max_adv_2 = np.max(s2 - s_other_2) if np.max(s2 - s_other_2) > 0 else 0

        height = 200
        gradient = np.zeros((height, 1, 4))
        c1 = to_rgba(d1['color'])
        c2 = to_rgba(d2['color'])
        
        for row in range(height):
            if row <= height // 2: 
                val = 1 - (row / (height/2))
                alpha = np.clip(val, 0.05, 1.0)
                gradient[row, 0, :] = [c1[0], c1[1], c1[2], alpha]
            else: 
                val = (row - height/2) / (height/2)
                alpha = np.clip(val, 0.05, 1.0)
                gradient[row, 0, :] = [c2[0], c2[1], c2[2], alpha]
        
        cax.imshow(gradient, aspect='auto', extent=[0, 1, -1, 1], origin='upper')
        
        rect = plt.Rectangle((0, -1), 1, 2, fill=False, edgecolor='white', lw=1.5, zorder=10, clip_on=False)
        cax.add_patch(rect)
        
        cax.text(-0.3, 1, f"{d1['code']} +{max_adv_1:.0f} km/h", color='white', ha='right', va='center', fontsize=20, fontname=KALAMEH_FONT_NAME, fontweight='bold')
        cax.text(-0.3, 0, "0", color='white', ha='right', va='center', fontsize=20, fontname=KALAMEH_FONT_NAME, fontweight='bold')
        cax.text(-0.3, -1, f"{d2['code']} +{max_adv_2:.0f} km/h", color='white', ha='right', va='center', fontsize=20, fontname=KALAMEH_FONT_NAME, fontweight='bold')
        
        cax.plot([0, -0.15], [1, 1], color='white', lw=2, clip_on=False)
        cax.plot([0, -0.15], [0, 0], color='white', lw=2, clip_on=False)
        cax.plot([0, -0.15], [-1, -1], color='white', lw=2, clip_on=False)
    # -------------------------------------------------------------------

    try:
        plot_corners_on_ax(ax, ref_session, track_rotation)
    except Exception: pass

    ax.set_aspect('equal', adjustable='datalim')
    ax.axis('off')

    ax.text(0.5, 0.5, "@Amir_Formula", color='#FFFFFF', alpha=0.1,
            fontsize=65, fontname=KALAMEH_FONT_NAME,
            ha='center', va='center', rotation=0, zorder=0,
            transform=ax.transAxes)

    return fig

# ================== GUI SETUP ==================
class TrackDominanceApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Speed Delta Map")
        self.selected_laps = []
        self.loaded_sessions = {}
        self.setup_dark_theme()
        self.setup_gui()
        self.load_all_schedules()
        self.next_lap_id = 0
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_closing(self):
        try:
            plt.close('all')
            self.root.destroy()
        except Exception: self.root.destroy()

    def setup_dark_theme(self):
        bg_color = "#202124"
        panel_color = "#2D2E32"
        self.root.configure(bg=bg_color)
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TFrame', background=bg_color)
        style.configure('TLabel', background=bg_color, foreground='white', font=(KALAMEH_FONT_NAME, 12))
        style.configure('TButton', background=panel_color, foreground='white', font=(KALAMEH_FONT_NAME, 11), borderwidth=0)
        style.map('TButton', background=[('active', '#3D3E42')])
        style.configure('TCombobox', fieldbackground=panel_color, background=panel_color, foreground='white', arrowcolor='white')
        style.configure('Accent.TButton', font=(KALAMEH_FONT_NAME, 13, 'bold'), foreground='white', background='#00ADB5', padding=6)
        style.map('Accent.TButton', background=[('active', '#00CFD8')])
        style.configure('TLabelframe', background=bg_color, foreground='white', bordercolor=panel_color)
        style.configure('TLabelframe.Label', background=bg_color, foreground='#00ADB5', font=(KALAMEH_FONT_NAME, 13, 'bold'))

    def setup_gui(self):
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(0, weight=1)

        self.left_frame = ttk.Frame(self.root, padding=15)
        self.left_frame.grid(row=0, column=0, sticky='nsw')
        self.mid_frame = ttk.Frame(self.root, padding=15)
        self.mid_frame.grid(row=0, column=1, sticky='nsew')
        self.right_frame = ttk.Frame(self.root, padding=15)
        self.right_frame.grid(row=0, column=2, sticky='nse')

        years = list(range(2020, 2027))
        ttk.Label(self.left_frame, text="Year:").pack(anchor='w')
        self.year_var = tk.IntVar(value=2024)
        self.year_box = ttk.Combobox(self.left_frame, textvariable=self.year_var, values=years, width=10, state="readonly")
        self.year_box.pack(anchor='w', pady=(0, 15))
        self.year_box.bind("<<ComboboxSelected>>", self.update_gps_from_schedule)

        ttk.Label(self.left_frame, text="Grand Prix:").pack(anchor='w')
        self.gp_var = tk.StringVar()
        self.gp_box = ttk.Combobox(self.left_frame, textvariable=self.gp_var, state="readonly", width=32)
        self.gp_box.pack(anchor='w', pady=(0, 15))
        self.gp_box.bind("<<ComboboxSelected>>", self.update_sessions_logic)

        ttk.Label(self.left_frame, text="Session:").pack(anchor='w')
        self.session_var = tk.StringVar()
        self.session_box = ttk.Combobox(self.left_frame, textvariable=self.session_var, state="readonly", width=22)
        self.session_box.pack(anchor='w', pady=(0, 20))

        ttk.Button(self.left_frame, text="Load Drivers", command=self.load_drivers, style='Accent.TButton').pack(anchor='w', fill='x')

        self.drivers_frame_label = ttk.Label(self.mid_frame, text="Select Driver", font=(KALAMEH_FONT_NAME, 16, 'bold'), foreground='#00ADB5')
        self.drivers_frame_label.pack(anchor='w', pady=(0, 10))
        
        self.drivers_canvas = tk.Canvas(self.mid_frame, bg="#202124", highlightthickness=0)
        self.drivers_scrollbar = ttk.Scrollbar(self.mid_frame, orient="vertical", command=self.drivers_canvas.yview)
        self.drivers_buttons_frame = ttk.Frame(self.drivers_canvas)
        
        self.drivers_canvas.pack(side='left', fill='both', expand=True)
        self.drivers_scrollbar.pack(side='right', fill='y')
        self.drivers_canvas.configure(yscrollcommand=self.drivers_scrollbar.set)
        self.drivers_canvas.create_window((0, 0), window=self.drivers_buttons_frame, anchor="nw")
        
        self.drivers_buttons_frame.bind("<Configure>", lambda e: self.drivers_canvas.configure(scrollregion=self.drivers_canvas.bbox("all")))
        self.driver_buttons = []

        self.laps_frame = ttk.LabelFrame(self.right_frame, text="Selected Laps (Max 4)", padding=(10, 10))
        self.laps_frame.pack(fill='both', expand=True, pady=(0,10))
        
        self.laps_canvas = tk.Canvas(self.laps_frame, bg="#202124", highlightthickness=0, height=300)
        self.laps_scrollbar = ttk.Scrollbar(self.laps_frame, orient="vertical", command=self.laps_canvas.yview)
        self.laps_listbox_frame = ttk.Frame(self.laps_canvas)
        
        self.laps_canvas.pack(side='left', fill='both', expand=True)
        self.laps_scrollbar.pack(side='right', fill='y')
        self.laps_canvas.configure(yscrollcommand=self.laps_scrollbar.set)
        self.laps_canvas.create_window((0, 0), window=self.laps_listbox_frame, anchor="nw")
        self.laps_listbox_frame.bind("<Configure>", lambda e: self.laps_canvas.configure(scrollregion=self.laps_canvas.bbox("all")))

        ttk.Button(self.right_frame, text="Generate Plot", command=self.generate_plot, style='Accent.TButton').pack(fill='x', pady=5)
        
        self.status_var = tk.StringVar(value="Ready.")
        self.status_label = ttk.Label(self.root, textvariable=self.status_var, relief='flat', anchor='w', padding=5, background='#1A1B1E')
        self.status_label.grid(row=1, column=0, columnspan=3, sticky='we')

    def load_all_schedules(self):
        self.update_gps_from_schedule()

    def update_gps_from_schedule(self, event=None):
        year = self.year_var.get()
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
        self.update_sessions_logic()

    def update_sessions_logic(self, event=None):
        gp = self.gp_box.get()
        if str(gp).startswith('Pre-Season Test'):
            self.session_box['values'] = ["P1", "P2", "P3"]
            self.session_var.set("P1")
        else:
            vals = ["FP1", "FP2", "FP3", "Qualifying", "Race", "Sprint", "Sprint Qualifying"]
            self.session_box['values'] = vals
            if self.session_var.get() not in vals:
                self.session_var.set("Qualifying")

    def set_status(self, text):
        self.status_var.set(text)
        self.root.update_idletasks()

    def load_drivers(self):
        year = self.year_var.get()
        gp = self.gp_box.get()
        session_sel = self.session_box.get()
        
        session_key = (year, gp, session_sel)
        self.set_status(f"Loading {year} {gp} {session_sel}...")

        try:
            if 'Pre-Season' in gp:
                test_num = 1 if '1' in gp else 2
                sess_num = {'P1': 1, 'P2': 2, 'P3': 3}.get(session_sel, 1)
                session = fastf1.get_testing_session(year, test_num, sess_num)
            else:
                session = fastf1.get_session(year, gp, session_sel)
            
            session.load(telemetry=False, laps=False, weather=False) 
            self.loaded_sessions[session_key] = session
            
            drivers = session.drivers
            for btn in self.driver_buttons: btn.destroy()
            self.driver_buttons = []
            
            max_per_row = 6
            for idx, drv in enumerate(drivers):
                info = session.get_driver(drv)
                d_num = str(info.get('DriverNumber', drv)).strip()

                if d_num in CUSTOM_2026_GRID:
                    code, _, team = CUSTOM_2026_GRID[d_num]
                else:
                    code = info.get('Abbreviation', d_num)
                    team = info.get('TeamName', 'Unknown')

                color = get_team_color_safe(team, session=session)
                
                btn = tk.Button(self.drivers_buttons_frame, text=code, width=5, bg=color, fg='white',
                                font=(KALAMEH_FONT_NAME, 12, 'bold'), relief='flat', bd=0,
                                command=lambda d=drv, sk=session_key: self.load_driver_laps(d, sk))
                btn.grid(row=idx // max_per_row, column=idx % max_per_row, padx=4, pady=4)
                self.driver_buttons.append(btn)
                
            self.set_status(f"Drivers loaded for {year} {gp}.")
            
        except Exception as e:
            self.set_status("Error loading session.")
            messagebox.showerror("Error", str(e))

    def load_driver_laps(self, driver, session_key):
        session = self.loaded_sessions[session_key]
        try:
            session.load()
        except: pass

        laps = session.laps.pick_drivers(driver)

        top = tk.Toplevel(self.root)
        top.title("Select Lap")
        top.geometry("320x450")
        top.configure(bg="#2D2E32")
        
        canvas = tk.Canvas(top, bg="#2D2E32", highlightthickness=0)
        scrollbar = ttk.Scrollbar(top, orient="vertical", command=canvas.yview)
        frame = ttk.Frame(canvas)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        canvas.create_window((0,0), window=frame, anchor='nw')
        frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        
        fastest_lap_idx = laps['LapTime'].idxmin()

        for i, lap in laps.iterlaps():
            if pd.notna(lap['LapTime']):
                t_sec = lap['LapTime'].total_seconds()
                t_str = f"{int(t_sec//60)}:{int(t_sec%60):02}.{int((t_sec*1000)%1000):03}"
                
                bg = "#00E5FF" if i == fastest_lap_idx else "#3D3E42"
                fg = "black" if i == fastest_lap_idx else "white"
                
                btn = tk.Button(frame, text=f"Lap {int(lap['LapNumber'])} - {t_str}", 
                                bg=bg, fg=fg, width=30, font=(KALAMEH_FONT_NAME, 11), relief='flat',
                                command=lambda l=lap, d=driver, sk=session_key: self.add_lap(d, l, sk, top))
                btn.pack(pady=2, padx=10)

    def add_lap(self, drv_id, lap, session_key, window_to_close):
        if len(self.selected_laps) >= 4:
             messagebox.showinfo("Limit", "Max 4 laps allowed.")
             return
        
        session = self.loaded_sessions[session_key]
        info = session.get_driver(drv_id)
        d_num = str(info.get('DriverNumber', drv_id)).strip()

        if d_num in CUSTOM_2026_GRID:
            code, _, _ = CUSTOM_2026_GRID[d_num]
        else:
            code = info.get('Abbreviation', d_num)

        lap_num = int(lap['LapNumber'])
        year, gp, sname = session_key
        
        if self.selected_laps:
            first_gp = self.selected_laps[0][2][1]
            if first_gp != gp:
                if not messagebox.askyesno("Track Warning", f"Selected lap is from {gp}, but previous laps are from {first_gp}. Proceed?"):
                    return

        self.selected_laps.append((code, lap, session_key, self.next_lap_id))
        
        item_frame = tk.Frame(self.laps_listbox_frame, bg="#2D2E32", pady=2)
        lbl = tk.Label(item_frame, text=f"{code} - L{lap_num} ({year} {sname})", bg="#2D2E32", fg="white", font=(KALAMEH_FONT_NAME, 11))
        lbl.pack(side="left", padx=5)
        
        lap_id = self.next_lap_id
        btn = tk.Button(item_frame, text="X", fg="white", bg="#FF3366", font=(KALAMEH_FONT_NAME, 9), relief='flat', command=lambda: self.remove_lap(item_frame, lap_id))
        btn.pack(side="right", padx=5)
        item_frame.pack(fill="x", pady=2)
        
        self.next_lap_id += 1
        window_to_close.destroy()

    def remove_lap(self, frame, lap_id):
        frame.destroy()
        self.selected_laps = [x for x in self.selected_laps if x[3] != lap_id]

    def generate_plot(self):
        if len(self.selected_laps) < 2:
            messagebox.showerror("Error", "Select at least 2 laps.")
            return
        
        self.set_status("Generating plot...")
        self.plot_window = tk.Toplevel(self.root)
        self.plot_window.title("Speed Delta Result")
        self.plot_window.configure(bg="#1A1A1D")
        
        fig = generate_track_dominance_plot(self.selected_laps, self.loaded_sessions, for_export=True)
        
        if fig:
            canvas = FigureCanvasTkAgg(fig, master=self.plot_window)
            canvas.draw()
            canvas.get_tk_widget().pack(fill='both', expand=True)
            self.set_status("Done.")
            
            try:
                first_session_key = self.selected_laps[0][2]
                year, grand_prix, session_name = first_session_key

                seen = set()
                ordered_drivers = []
                for drv_code, _, _, _ in self.selected_laps:
                    if drv_code not in seen:
                        seen.add(drv_code)
                        ordered_drivers.append(drv_code)

                driver_segment = " vs ".join(ordered_drivers)
                
                # FILENAME FORMAT
                base_filename = f"Speed Delta-{grand_prix}-{year}-{session_name}-( {driver_segment} )-code#47"
                safe_base = safe_filename(base_filename)
                filepath = os.path.join(EXPORT_DIR, safe_base + ".png")
                
                fig.savefig(filepath, dpi=300, bbox_inches='tight')
                insta_base = safe_base.replace(" ", "_")
                save_instagram_square_png(insta_base, filepath)
                print(f"Exported to {filepath}")
            except Exception as e:
                print(f"Export failed: {e}")
        else:
            self.set_status("Failed.")

if __name__ == "__main__":
    root = tk.Tk()
    app = TrackDominanceApp(root)
    root.mainloop()