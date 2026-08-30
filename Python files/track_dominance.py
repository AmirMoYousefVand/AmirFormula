import fastf1
from fastf1 import plotting
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
import numpy as np
import tkinter as tk
from tkinter import ttk, messagebox
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import matplotlib.font_manager as fm
from scipy.interpolate import interp1d
from scipy.spatial import cKDTree
from scipy.signal import savgol_filter
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
import requests
from io import BytesIO

# --- Fix: Set FastF1 cache directory at top ---
cache_folder = r"D:\Data\AF\f1_analysis\Cache"
os.makedirs(cache_folder, exist_ok=True)
os.environ['FASTF1_CACHE'] = cache_folder
fastf1.Cache.enable_cache(cache_folder)

# --- Instagram / Export output ---
EXPORT_DIR = r"D:\Data\AF\Exports"
INSTAGRAM_DIR = os.path.join(EXPORT_DIR, "Instagram")
INSTAGRAM_SIZE = 1080
DARK_BG = "#000000" 
CORNER_CIRCLE = "#23242B"
ACCENT_CYAN = "#00FFFF"
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(INSTAGRAM_DIR, exist_ok=True)

DRIVER_IMG_DIR = os.path.join(cache_folder, "Drivers")
os.makedirs(DRIVER_IMG_DIR, exist_ok=True)

# Global list to keep track of all active threads
active_threads = []

# ================== FONT CONFIGURATION ==================
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
            print(f"Failed to load {f_path}: {e}")

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
    "second": "#9900FF", # Purple for 2nd
    "third": "#FFFFFF",  # White for 3rd
    "fourth": "#C19A6B"  # Brown for 4th
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

def resample_track(x, y, num_points=500):
    distance = np.zeros_like(x)
    for i in range(1, len(x)):
        segment_length = np.sqrt((x[i] - x[i-1])**2 + (y[i] - y[i-1])**2)
        distance[i] = distance[i-1] + segment_length
    uniform_distance = np.linspace(0, distance[-1], num_points)
    x_resampled = np.interp(uniform_distance, distance, x)
    y_resampled = np.interp(uniform_distance, distance, y)
    return x_resampled, y_resampled

def _project_to_reference(ref_x, ref_y, x, y, speed, n_bins):
    """Maps a lap's speed samples onto the reference path bins (uniform arclength)."""
    tree = cKDTree(np.column_stack([ref_x, ref_y]))
    dist, idx = tree.query(np.column_stack([x, y]), k=1)

    keep = dist <= 20.0
    if not np.any(keep):
        return None

    s_bins = idx[keep]
    sp = speed[keep]

    prof = np.full(n_bins, np.nan)
    order = np.argsort(s_bins, kind='stable')
    s_sorted = s_bins[order]
    sp_sorted = sp[order]
    uniq, starts = np.unique(s_sorted, return_index=True)
    ends = np.append(starts[1:], len(s_sorted))
    prof[uniq] = [np.median(sp_sorted[s:e]) for s, e in zip(starts, ends)]

    finite = np.isfinite(prof)
    if not np.any(finite):
        return None
    lo, hi = np.nanpercentile(prof, [1, 99])
    prof = np.clip(prof, lo, hi)

    if not np.all(finite):
        valid_idx = np.arange(n_bins)[finite]
        prof = np.interp(np.arange(n_bins), valid_idx, prof[finite])

    return prof

def draw_header_box(fig, ax_rect, gp_name, year, session_name, is_single_session):
    """Draws the top header box."""
    header_ax = fig.add_axes(ax_rect)
    header_ax.set_facecolor('none')
    header_ax.axis('off')
    
    fancy_box = FancyBboxPatch(
        (0, 0), 1, 1,
        boxstyle="round,pad=0.0,rounding_size=0.1",
        fc='none',
        ec=ACCENT_CYAN,
        lw=3,
        transform=header_ax.transAxes,
        zorder=0
    )
    header_ax.add_patch(fancy_box)

    try:
        flag_url = get_flag_url(gp_name)
        if flag_url:
            flag_ax = fig.add_axes([ax_rect[0] + 0.05, ax_rect[1] + 0.02, 0.06, 0.06])
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

    header_ax.text(0.55, 0.5, text_str, color='white', fontsize=30, 
                   fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='center', va='center')

def draw_driver_boxes(fig, ax_rect, drivers_data, is_single_session):
    """Draws driver boxes below the header."""
    num_drivers = len(drivers_data)
    if num_drivers == 0: return

    total_w = ax_rect[2]
    gap = 0.01
    box_w = (total_w - (gap * (num_drivers - 1))) / num_drivers
    box_h = ax_rect[3]
    y_pos = ax_rect[1]
    
    name_fs = 34 if num_drivers <= 2 else 24
    time_fs = 28 if num_drivers <= 2 else 20
    base_delta_fs = 28 if num_drivers <= 2 else 22
    
    if not is_single_session:
        delta_fs = base_delta_fs + 6 
        info_fs = 26 if num_drivers <= 2 else 20 
    else:
        delta_fs = base_delta_fs + 6 
        info_fs = 18 
    
    for i, data in enumerate(drivers_data):
        x_pos = ax_rect[0] + (i * (box_w + gap))
        rect = [x_pos, y_pos, box_w, box_h]
        
        d_ax = fig.add_axes(rect)
        d_ax.set_facecolor('none')
        d_ax.axis('off')
        
        fancy_box = FancyBboxPatch(
            (0, 0), 1, 1,
            boxstyle="round,pad=0.0,rounding_size=0.1",
            fc='none',
            ec=ACCENT_CYAN,
            lw=3,
            transform=d_ax.transAxes,
            zorder=0
        )
        d_ax.add_patch(fancy_box)
        
        # Headshot
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
            d_ax.text(0.95, top_y, "Faster", color='#00FF00', fontsize=delta_fs, 
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right')
        else:
            d_ax.text(0.95, top_y, data['delta_str'], color='#FF0000', fontsize=delta_fs, 
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right')
        
        name_txt = d_ax.text(0.05, 0.55, data['name'], color=data['color'], fontsize=name_fs, 
                             fontname=KALAMEH_FONT_NAME, fontweight='bold',
                             bbox=dict(facecolor=data['color'], alpha=0.3, edgecolor='none', pad=3))
        
        name_txt.set_path_effects([
            path_effects.Stroke(linewidth=3, foreground='black'),
            path_effects.Normal()
        ])
        
        if is_single_session:
            lap_info = f"Lap #{data['lap_num']}"
            d_ax.text(0.05, 0.30, lap_info, color='#DDDDDD', fontsize=info_fs,
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', va='center')
        else:
            sess_info = f"{data['year']} {data['sess_name']}\nLap #{data['lap_num']}"
            d_ax.text(0.05, 0.34, sess_info, color='#DDDDDD', fontsize=info_fs,
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', va='center')

        dom_pct = data.get('dom_pct')
        if dom_pct is not None:
            d_ax.text(0.05, 0.12, f"Domination: {dom_pct:.0f}%", color='white', fontsize=info_fs,
                      fontname=KALAMEH_FONT_NAME, fontweight='bold', va='center')

        d_ax.text(0.95, 0.15, data['time_str'], color='white', fontsize=time_fs,
                  fontname=KALAMEH_FONT_NAME, fontweight='bold', ha='right')

def generate_track_dominance_plot(selected_laps, loaded_sessions=None, for_export=False):
    if loaded_sessions is None: loaded_sessions = {}
    if len(selected_laps) < 2: return None

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
        
        processed_laps.append({
            'code': driver_code_base, # From UI mapping
            'lap': lap,
            'lap_num': int(lap['LapNumber']),
            'session': session,
            'time_val': lap_time_val,
            'time_str': time_str,
            'name': last_name, # Preserved format
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
        is_3_plus_1 = (len(team_lap_counts) == 2 and 
                       (3 in team_lap_counts.values() and 1 in team_lap_counts.values()))
        
        if is_3_plus_1:
            team_with_3 = None
            team_with_1 = None
            for team, count in team_lap_counts.items():
                if count == 3:
                    team_with_3 = team
                elif count == 1:
                    team_with_1 = team
            
            laps_team_3 = sorted(team_groups[team_with_3], key=lambda x: x['time_val'])

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
                    if idx == 0: 
                        lap['color'] = SPECIAL_COLORS["second"] 
                    else: 
                        lap['color'] = "#FFFFFF" 
            elif len(team_2nd_laps) == 1:
                for team, lap in team_2nd_laps.items():
                    lap['color'] = SPECIAL_COLORS["second"]
    else:
        for team, team_laps in team_groups.items():
            team_laps.sort(key=lambda x: x['time_val'])
            for position_idx, p in enumerate(team_laps):
                position_in_team = position_idx + 1
                if position_in_team == 1:
                    pass
                elif position_in_team == 2:
                    p['color'] = SPECIAL_COLORS["second"] 
                elif position_in_team == 3:
                    p['color'] = SPECIAL_COLORS["third"]   
                elif position_in_team == 4:
                    p['color'] = SPECIAL_COLORS["fourth"] 

    processed_laps.sort(key=lambda x: x['time_val'])
    fastest_time = processed_laps[0]['time_val']
    
    header_drivers = []
    for i, p in enumerate(processed_laps):
        delta = p['time_val'] - fastest_time
        delta_str = f"+{delta:.3f}" if delta > 0 else ""
        header_drivers.append({
            'name': p['name'],
            'code': p['code'],
            'team': p['team'],
            'time_str': p['time_str'],
            'color': p['color'],
            'headshot_url': p['headshot_url'],
            'delta_str': delta_str,
            'is_faster': (i == 0),
            'year': p['year'],
            'sess_name': p['sess_name'],
            'lap_num': p['lap_num'],
            'dom_pct': p.get('dom_pct')
        })

    ref_session = processed_laps[0]['session']
    track_rotation = get_track_rotation(ref_session)

    num_drivers = len(processed_laps)
    base_width = 18
    base_height = 14
    
    if num_drivers >= 4:
        fig_width = base_width * (4/3) 
    else:
        fig_width = base_width
        
    fig, ax = plt.subplots(figsize=(fig_width, base_height) if for_export else (12, 10))
    ax.set_position([0.05, 0.05, 0.9, 0.55])

    draw_header_box(fig, [0.15, 0.88, 0.70, 0.10], 
                    processed_laps[0]['gp'], 
                    processed_laps[0]['year'], 
                    processed_laps[0]['sess_name'],
                    is_single_session)
    
    draw_driver_boxes(fig, [0.05, 0.68, 0.90, 0.16], header_drivers, is_single_session)

    raw_tracks = []
    for p in processed_laps:
        lap = p['lap']
        telemetry = lap.get_telemetry()
        x = telemetry['X'].to_numpy(dtype=float)
        y = telemetry['Y'].to_numpy(dtype=float)

        if track_rotation != 0:
            xy = np.vstack((x, y)).T
            xy_rot = rotate(xy, angle=track_rotation)
            x = xy_rot[:, 0]
            y = xy_rot[:, 1]

        if 'Speed' in telemetry.columns:
            speed_data = telemetry['Speed'].to_numpy(dtype=float)
        else:
            speed_data = np.zeros(len(telemetry))

        valid = ~np.isnan(x) & ~np.isnan(y) & ~np.isnan(speed_data)
        x = x[valid]; y = y[valid]; speed = speed_data[valid]

        raw_tracks.append({'x': x, 'y': y, 'speed': speed, 'color': p['color'], 'code': p['code']})

    N_BINS = 1000
    ref = raw_tracks[0]
    ref_x_smooth = savgol_filter(ref['x'], window_length=7, polyorder=2) if len(ref['x']) > 7 else ref['x']
    ref_y_smooth = savgol_filter(ref['y'], window_length=7, polyorder=2) if len(ref['y']) > 7 else ref['y']
    ref_x, ref_y = resample_track(ref_x_smooth, ref_y_smooth, num_points=N_BINS)

    bin_len_m = 0.0
    if len(ref_x) > 1:
        bin_len_m = np.mean(np.sqrt(np.diff(ref_x)**2 + np.diff(ref_y)**2))
    smooth_win = max(5, int(round(40.0 / bin_len_m)) | 1) if bin_len_m > 0 else 5

    tel_list = []
    for t in raw_tracks:
        prof = _project_to_reference(ref_x, ref_y, t['x'], t['y'], t['speed'], N_BINS)
        if prof is None:
            x_r, y_r = resample_track(t['x'], t['y'], num_points=N_BINS)
            if len(t['x']) > 1:
                d = np.cumsum(np.sqrt(np.diff(t['x'])**2 + np.diff(t['y'])**2))
                d = np.insert(d, 0, 0)
                prof = np.interp(np.linspace(0, d[-1], N_BINS), d, t['speed'])
            else:
                prof = np.zeros(N_BINS)
        elif len(prof) > smooth_win:
            prof = savgol_filter(prof, window_length=smooth_win, polyorder=2)

        tel_list.append({'x': ref_x, 'y': ref_y, 'speed': prof, 'color': t['color'], 'code': t['code']})

    base_x, base_y = tel_list[0]['x'], tel_list[0]['y']
    ax.plot(base_x, base_y, color='white', lw=14, alpha=0.2, zorder=0)

    points = np.array([ref_x, ref_y]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    all_speeds = np.array([t['speed'] for t in tel_list])
    n_laps = len(tel_list)

    raw_winners = np.argmax(all_speeds, axis=0)

    k = min(13, (N_BINS // 10) * 2 + 1)
    pad = k // 2
    padded = np.pad(raw_winners, pad_width=pad, mode='edge')
    win_shape = (N_BINS, k)
    strides = (padded.strides[0], padded.strides[0])
    windows = np.lib.stride_tricks.as_strided(padded, shape=win_shape, strides=strides)
    winners = np.empty(N_BINS, dtype=int)
    for i in range(N_BINS):
        vals, counts = np.unique(windows[i], return_counts=True)
        winners[i] = vals[np.argmax(counts)]

    diff = np.diff(winners)
    run_starts = np.append(0, np.where(diff != 0)[0] + 1)
    run_ends = np.append(run_starts[1:], N_BINS)
    runs = list(zip(run_starts, run_ends))

    changed = True
    while changed and len(runs) > 1:
        changed = False
        lengths = [e - s for s, e in runs]
        min_run = max(3, N_BINS // 200)
        shortest_idx = int(np.argmin(lengths))
        if lengths[shortest_idx] >= min_run:
            break
        s, e = runs[shortest_idx]
        seg_mean = all_speeds[:, s:e].mean(axis=1)
        incumbent = winners[s]
        best_other, best_gain = None, -np.inf
        if shortest_idx > 0:
            left = winners[runs[shortest_idx - 1][0]]
            gain_left = seg_mean[left] - seg_mean[incumbent]
            best_other, best_gain = left, gain_left
        if shortest_idx < len(runs) - 1:
            right = winners[runs[shortest_idx + 1][0]]
            gain_right = seg_mean[right] - seg_mean[incumbent]
            if gain_right > best_gain:
                best_other, best_gain = right, gain_right
        if best_other is not None and best_gain >= 2.0:
            winners[s:e] = best_other
        elif len(runs) == 2:
            neighbors = [winners[runs[j][0]] for j in range(len(runs)) if j != shortest_idx]
            winners[s:e] = neighbors[0]
        else:
            left_len = runs[shortest_idx - 1][1] - runs[shortest_idx - 1][0] if shortest_idx > 0 else -1
            right_len = runs[shortest_idx + 1][1] - runs[shortest_idx + 1][0] if shortest_idx < len(runs) - 1 else -1
            merge_into = shortest_idx - 1 if left_len >= right_len else shortest_idx + 1
            winners[s:e] = winners[runs[merge_into][0]]

        new_diff = np.diff(winners)
        new_starts = np.append(0, np.where(new_diff != 0)[0] + 1)
        new_ends = np.append(new_starts[1:], N_BINS)
        runs = list(zip(new_starts, new_ends))
        changed = True

    seg_colors = [tel_list[idx]['color'] for idx in winners[:-1]]

    dom_counts = np.bincount(winners, minlength=n_laps)
    dom_pcts = 100.0 * dom_counts / N_BINS
    for i, p in enumerate(processed_laps):
        p['dom_pct'] = dom_pcts[i]
    
    from matplotlib.collections import LineCollection
    lc = LineCollection(segments, colors=seg_colors, lw=8, zorder=5)
    ax.add_collection(lc)

    try:
        plot_corners_on_ax(ax, ref_session, track_rotation)
    except Exception: pass

    ax.set_aspect('equal', adjustable='datalim')
    ax.axis('off')

    watermark_text = "@Amir_Formula"
    ax.text(0.5, 0.5, watermark_text, color='#FFFFFF', alpha=0.15,
            fontsize=60, fontname=KALAMEH_FONT_NAME,
            ha='center', va='center', rotation=0, zorder=0,
            transform=ax.transAxes)

    return fig

class TrackDominanceApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Track Dominance Map")
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
        self.root.configure(bg="#2d2d2d")
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TFrame', background="#2d2d2d")
        style.configure('TLabel', background="#2d2d2d", foreground='white', font=(KALAMEH_FONT_NAME, 11))
        style.configure('TButton', background='#3d3d3d', foreground='white', font=(KALAMEH_FONT_NAME, 11))
        style.configure('TCombobox', fieldbackground='#3d3d3d', background='#4d4d4d', foreground='white')
        style.configure('Accent.TButton', font=(KALAMEH_FONT_NAME, 13, 'bold'), foreground='white', background='#00ADB5')
        style.configure('TLabelframe', background="#2d2d2d", foreground='white')
        style.configure('TLabelframe.Label', background="#2d2d2d", foreground='white', font=(KALAMEH_FONT_NAME, 12, 'bold'))

    def setup_gui(self):
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(0, weight=1)

        self.left_frame = ttk.Frame(self.root, padding=10)
        self.left_frame.grid(row=0, column=0, sticky='nsw')
        self.mid_frame = ttk.Frame(self.root, padding=10)
        self.mid_frame.grid(row=0, column=1, sticky='nsew')
        self.right_frame = ttk.Frame(self.root, padding=10)
        self.right_frame.grid(row=0, column=2, sticky='nse')

        years = list(range(2020, 2027))
        ttk.Label(self.left_frame, text="Year:").pack(anchor='w')
        self.year_var = tk.IntVar(value=2026)
        self.year_box = ttk.Combobox(self.left_frame, textvariable=self.year_var, values=years, width=8, state="readonly")
        self.year_box.pack(anchor='w', pady=(0, 7))
        self.year_box.bind("<<ComboboxSelected>>", self.update_gps_from_schedule)

        ttk.Label(self.left_frame, text="Grand Prix:").pack(anchor='w')
        self.gp_var = tk.StringVar()
        self.gp_box = ttk.Combobox(self.left_frame, textvariable=self.gp_var, state="readonly", width=32)
        self.gp_box.pack(anchor='w', pady=(0, 7))
        self.gp_box.bind("<<ComboboxSelected>>", self.update_sessions_logic)

        ttk.Label(self.left_frame, text="Session:").pack(anchor='w')
        self.session_var = tk.StringVar()
        self.session_box = ttk.Combobox(self.left_frame, textvariable=self.session_var, state="readonly", width=22)
        self.session_box.pack(anchor='w', pady=(0, 7))

        ttk.Button(self.left_frame, text="Load Drivers", command=self.load_drivers, style='Accent.TButton').pack(anchor='w', pady=10)

        self.drivers_frame_label = ttk.Label(self.mid_frame, text="Select Driver", font=(KALAMEH_FONT_NAME, 15, 'bold'))
        self.drivers_frame_label.pack(anchor='w', pady=(0, 5))
        
        self.drivers_canvas = tk.Canvas(self.mid_frame, bg="#2d2d2d", highlightthickness=0)
        self.drivers_scrollbar = ttk.Scrollbar(self.mid_frame, orient="vertical", command=self.drivers_canvas.yview)
        self.drivers_buttons_frame = ttk.Frame(self.drivers_canvas)
        
        self.drivers_canvas.pack(side='left', fill='both', expand=True)
        self.drivers_scrollbar.pack(side='right', fill='y')
        self.drivers_canvas.configure(yscrollcommand=self.drivers_scrollbar.set)
        self.drivers_canvas.create_window((0, 0), window=self.drivers_buttons_frame, anchor="nw")
        
        self.drivers_buttons_frame.bind("<Configure>", lambda e: self.drivers_canvas.configure(scrollregion=self.drivers_canvas.bbox("all")))
        self.driver_buttons = []

        self.laps_frame = ttk.LabelFrame(self.right_frame, text="Selected Laps (Max 4)", padding=(10, 8))
        self.laps_frame.pack(fill='both', expand=True)
        
        self.laps_canvas = tk.Canvas(self.laps_frame, bg="#2d2d2d", highlightthickness=0, height=300)
        self.laps_scrollbar = ttk.Scrollbar(self.laps_frame, orient="vertical", command=self.laps_canvas.yview)
        self.laps_listbox_frame = ttk.Frame(self.laps_canvas)
        
        self.laps_canvas.pack(side='left', fill='both', expand=True)
        self.laps_scrollbar.pack(side='right', fill='y')
        self.laps_canvas.configure(yscrollcommand=self.laps_scrollbar.set)
        self.laps_canvas.create_window((0, 0), window=self.laps_listbox_frame, anchor="nw")
        self.laps_listbox_frame.bind("<Configure>", lambda e: self.laps_canvas.configure(scrollregion=self.laps_canvas.bbox("all")))

        ttk.Button(self.right_frame, text="Generate Plot", command=self.generate_plot, style='Accent.TButton').pack(pady=5)
        
        self.status_var = tk.StringVar(value="Ready.")
        self.status_label = ttk.Label(self.root, textvariable=self.status_var, relief='sunken', anchor='w')
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
                
                btn = tk.Button(self.drivers_buttons_frame, text=code, width=4, bg=color, fg='white',
                                font=(KALAMEH_FONT_NAME, 11, 'bold'),
                                command=lambda d=drv, sk=session_key: self.load_driver_laps(d, sk))
                btn.grid(row=idx // max_per_row, column=idx % max_per_row, padx=2, pady=2)
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
        top.title(f"Laps")
        top.geometry("300x400")
        top.configure(bg="#2d2d2d")
        
        canvas = tk.Canvas(top, bg="#2d2d2d")
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
                
                bg = "#00FF00" if i == fastest_lap_idx else "#3d3d3d"
                fg = "black" if i == fastest_lap_idx else "white"
                
                btn = tk.Button(frame, text=f"Lap {int(lap['LapNumber'])} - {t_str}", 
                                bg=bg, fg=fg, width=25,
                                command=lambda l=lap, d=driver, sk=session_key: self.add_lap(d, l, sk))
                btn.pack(pady=1)

    def add_lap(self, drv_id, lap, session_key):
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
        
        item_frame = tk.Frame(self.laps_listbox_frame, bg="#3d3d3d")
        lbl = tk.Label(item_frame, text=f"{code} - L{lap_num} ({year} {sname})", bg="#3d3d3d", fg="white", font=(KALAMEH_FONT_NAME, 10))
        lbl.pack(side="left")
        
        lap_id = self.next_lap_id
        btn = tk.Button(item_frame, text="X", fg="red", bg="#3d3d3d", relief='flat', command=lambda: self.remove_lap(item_frame, lap_id))
        btn.pack(side="right")
        item_frame.pack(fill="x", pady=1)
        
        self.next_lap_id += 1

    def remove_lap(self, frame, lap_id):
        frame.destroy()
        self.selected_laps = [x for x in self.selected_laps if x[3] != lap_id]

    def generate_plot(self):
        if len(self.selected_laps) < 2:
            messagebox.showerror("Error", "Select at least 2 laps.")
            return
        
        self.set_status("Generating...")
        self.plot_window = tk.Toplevel(self.root)
        self.plot_window.title("Track Dominance")
        
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
                base_filename = f"Track Dominance-{grand_prix}-{year}-{session_name}-( {driver_segment} )-code#16"
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