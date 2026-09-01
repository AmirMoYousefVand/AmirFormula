import os
import fastf1

# User-Agent patch to fix 403 errors
import fastf1.req
fastf1.req.Cache.set_disabled() # Temporarily disable to inject headers, fastf1 doesn't have a direct UA setter in all versions. 
# Better User-Agent hook for fastf1 requests:
if hasattr(fastf1.req, 'Cache') and hasattr(fastf1.req.Cache, 'requests_session'):
    _session = fastf1.req.Cache.requests_session()
    if _session:
        _session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

import fastf1.plotting  # <-- این ایمپورت برای لود رنگ های رسمی الزامی است
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import customtkinter as ctk
import threading
import re
from PIL import Image
import matplotlib
import seaborn as sns
from matplotlib import font_manager
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
from matplotlib.patches import Rectangle
import requests
from io import BytesIO

# ----------- FONT LOADING SETTINGS -----------
FONT_PATH = r"D:\Data\AF\f1_analysis\Kalameh.ttf"
FALLBACK_FONT = "DejaVu Sans"

# Register the font with Matplotlib
try:
    if os.path.exists(FONT_PATH):
        font_manager.fontManager.addfont(FONT_PATH)
        custom_font_prop = font_manager.FontProperties(fname=FONT_PATH)
        KALAMEH_FONT = custom_font_prop.get_name()
        print(f"Successfully loaded font: {KALAMEH_FONT}")
    else:
        print(f"Warning: Font file not found at {FONT_PATH}. Falling back to system 'Kalameh'.")
        KALAMEH_FONT = "Kalameh"
except Exception as e:
    print(f"Error loading font: {e}. Falling back to default.")
    KALAMEH_FONT = "Kalameh"

# ----------- DARK THEME CONFIGURATION -----------
DARK_BG = "#181C20"
DARK_AX = "#23272E"
DARK_LABEL = "#FFDF1B"
DARK_HEADER = "#23272E" 
DARK_CELL_BG = "#24272A"
DARK_CELL_ALT_BG = "#292D31"
SOLID_WHITE = "#FFFFFF"
DARK_PURPLE = "#C774E8"

cell_fontsize = 20
header_fontsize = 22
cell_height = 0.055 

# Apply font globally to Matplotlib
matplotlib.rcParams['mathtext.fontset'] = 'dejavusans'
matplotlib.rcParams['mathtext.default'] = 'regular'
matplotlib.rcParams['font.family'] = [KALAMEH_FONT, FALLBACK_FONT]
matplotlib.rcParams['font.sans-serif'] = [KALAMEH_FONT, FALLBACK_FONT]
matplotlib.rcParams['font.size'] = cell_fontsize
matplotlib.rcParams['axes.titlesize'] = 32
matplotlib.rcParams['axes.labelsize'] = 24
matplotlib.rcParams['axes.titleweight'] = 'bold'
matplotlib.rcParams['axes.labelweight'] = 'bold'
matplotlib.rcParams['font.weight'] = 'bold'
matplotlib.rcParams['axes.facecolor'] = DARK_AX
matplotlib.rcParams['figure.facecolor'] = DARK_BG
matplotlib.rcParams['axes.edgecolor'] = DARK_LABEL
matplotlib.rcParams['xtick.color'] = SOLID_WHITE
matplotlib.rcParams['ytick.color'] = SOLID_WHITE
matplotlib.rcParams['axes.labelcolor'] = DARK_LABEL
matplotlib.rcParams['text.color'] = SOLID_WHITE

sns.set_theme(font=KALAMEH_FONT, font_scale=1.4, style="darkgrid", rc={
    "axes.facecolor": DARK_AX,
    "figure.facecolor": DARK_BG,
    "axes.labelcolor": DARK_LABEL,
    "text.color": SOLID_WHITE,
    "xtick.color": SOLID_WHITE,
    "ytick.color": SOLID_WHITE
})

# ----------- CONFIGURATION -----------
cache_folder = r"D:\Data\AF\f1_analysis\Cache"
os.makedirs(cache_folder, exist_ok=True)
os.environ['FASTF1_CACHE'] = cache_folder

OUTPUT_DIR = r"D:\Data\AF\Exports"
os.makedirs(OUTPUT_DIR, exist_ok=True)

INSTAGRAM_DIR = os.path.join(OUTPUT_DIR, "Instagram")
os.makedirs(INSTAGRAM_DIR, exist_ok=True)

DRIVER_IMG_DIR = r"D:\Data\AF\f1_analysis\Cache\Drivers"
os.makedirs(DRIVER_IMG_DIR, exist_ok=True)

TEAM_IMG_DIR = r"D:\Data\AF\f1_analysis\Cache\Teams"
os.makedirs(TEAM_IMG_DIR, exist_ok=True)

INSTAGRAM_SIZE = 1080
YEARS = [str(y) for y in range(2020, 2027)]

def safe_filename(s):
    return re.sub(r'[\\/*?:"<>|]', "_", s)

def save_instagram_square_png(base_filename, source_path, log_callback=None):
    out_path = os.path.join(INSTAGRAM_DIR, base_filename + ".png")
    try:
        with Image.open(source_path) as img:
            max_side = max(img.size)
            bg_color = tuple(int(DARK_BG.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            square_img = Image.new("RGB", (max_side, max_side), bg_color)
            square_img.paste(img, ((max_side - img.width) // 2, (max_side - img.height) // 2))
            final_img = square_img.resize((INSTAGRAM_SIZE, INSTAGRAM_SIZE), Image.LANCZOS)
            final_img.save(out_path)
            if log_callback: log_callback(f"Instagram square image saved: {out_path}")
    except Exception as e:
        if log_callback: log_callback(f"Error creating square image: {e}")

def get_driver_headshot(driver_identifier, url=None):
    """Downloads and returns path to driver headshot."""
    if not url or pd.isna(url) or url == '':
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
            img = Image.open(BytesIO(response.content))
            img.save(local_path)
            return local_path
    except Exception as e:
        pass
    
    return None

def format_time(time):
    if pd.isna(time):
        return "-"
    minutes, seconds = divmod(time.total_seconds(), 60)
    milliseconds = int(round((time.total_seconds() - int(minutes) * 60 - int(seconds)) * 1000))
    return f"{int(minutes)}:{int(seconds):02d}.{milliseconds:03d}"

def format_delta(delta):
    if pd.isna(delta):
        return "-"
    sign = "+" if delta.total_seconds() > 0 else ""
    return f"{sign}{delta.total_seconds():.3f}"

def get_last_name(full_name):
    return full_name.split(" ")[-1] if " " in full_name else full_name

def driver_code(name):
    return name[:3].upper()

def filter_laps(laps):
    if laps.empty:
        return laps
    for col in ['PitInLap', 'PitOutLap', 'IsOutLap', 'IsInLap']:
        if col in laps.columns:
            laps = laps[~laps[col].fillna(False)]
    laps = laps[
        ~laps['Sector1Time'].isna() &
        ~laps['Sector2Time'].isna() &
        ~laps['Sector3Time'].isna() &
        ~laps['LapTime'].isna()
    ]
    for col in ['Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']:
        med = laps[col].median()
        mad = (abs((laps[col] - med).dt.total_seconds())).median() + 1e-9
        zscore = abs((laps[col] - med).dt.total_seconds()) / (mad * 1.4826)
        laps = laps[zscore < 2.5]
    return laps

def session_is_race(session_type: str) -> bool:
    st = (session_type or "").strip().lower()
    return st == "race" or st == "sprint"

def apply_modern_header_footer(fig, title_text, team_img_dir, font_name="Kalameh"):
    """Applies a modern, dark-themed header and footer to a Matplotlib figure."""
    HEADER_BG = DARK_HEADER
    HEADER_HEIGHT_RATIO = 0.06  
    FOOTER_HEIGHT_RATIO = 0.05
    
    TITLE_SIZE = 32
    FOOTER_TEXT_SIZE = 26
    TITLE_COLOR = DARK_LABEL
    FOOTER_TEXT_COLOR = SOLID_WHITE
    
    header_rect = Rectangle((0, 1.0 - HEADER_HEIGHT_RATIO), 1, HEADER_HEIGHT_RATIO, 
                                    facecolor=HEADER_BG, transform=fig.transFigure, zorder=0, clip_on=False)
    fig.patches.append(header_rect)
    title_y_pos = 1.0 - (HEADER_HEIGHT_RATIO / 2)
    fig.text(0.5, title_y_pos, title_text, ha='center', va='center', 
             fontsize=TITLE_SIZE, weight='bold', color=TITLE_COLOR, fontfamily=font_name)

    footer_rect = Rectangle((0, 0), 1, FOOTER_HEIGHT_RATIO, 
                                    facecolor=HEADER_BG, transform=fig.transFigure, zorder=0, clip_on=False)
    fig.patches.append(footer_rect)
    footer_y_pos = FOOTER_HEIGHT_RATIO / 2
    fig.text(0.5, footer_y_pos, "@Amir_Formula", ha='center', va='center',
             fontsize=FOOTER_TEXT_SIZE, color=FOOTER_TEXT_COLOR, weight='bold', fontfamily=font_name, zorder=10)
    
    fig_w, fig_h = fig.get_size_inches()
    
    def add_footer_logo(path, x_center_inches):
        if path and os.path.exists(path):
            try:
                img = plt.imread(path)
                img_h_px = img.shape[0]
                target_inches = fig_h * FOOTER_HEIGHT_RATIO * 0.85
                target_points = target_inches * 72.0 
                zoom_factor = target_points / img_h_px
                x_pos_fraction = x_center_inches / fig_w
                ib = OffsetImage(img, zoom=zoom_factor)
                ab = AnnotationBbox(ib, (x_pos_fraction, footer_y_pos), 
                                    xycoords='figure fraction', 
                                    frameon=False, box_alignment=(0.5, 0.5), pad=0, zorder=1000)
                ab.set_clip_on(False)
                fig.add_artist(ab)
            except Exception:
                pass

    center_in = fig_w * 0.5
    x_logo_path = os.path.join(team_img_dir, "X.png")
    tg_logo_path = os.path.join(team_img_dir, "TG.png")
    af_logo_path = os.path.join(team_img_dir, "AF.png")
    
    add_footer_logo(x_logo_path, center_in - 1.8)     
    add_footer_logo(tg_logo_path, center_in - 1.3)    
    add_footer_logo(af_logo_path, center_in + 1.6)

def add_driver_images_table(ax, table, df_data):
    """Adds driver headshots to the 'Driver' column of the table (Output 1)."""
    ax.figure.canvas.draw()
    for row_idx, (idx, row_data) in enumerate(df_data.iterrows()):
        table_row = row_idx + 1 
        abbr = row_data.get('Abbreviation')
        url = row_data.get('HeadshotUrl')
        img_path = get_driver_headshot(abbr, url)
        if img_path:
            try:
                img_arr = plt.imread(img_path)
                cell = table[table_row, 0]
                bbox = cell.get_window_extent(ax.figure.canvas.get_renderer())
                cell_height_px = bbox.height
                img_h_px = img_arr.shape[0]
                zoom_factor = (cell_height_px * 0.70) / img_h_px
                imagebox = OffsetImage(img_arr, zoom=zoom_factor)
                imagebox.image.axes = ax
                x_pos = cell.get_x() + (cell.get_width() * 0.85) 
                y_pos = cell.get_y() + cell.get_height() / 2
                ab = AnnotationBbox(imagebox, (x_pos, y_pos), xycoords='axes fraction', frameon=False, boxcoords="axes fraction", pad=0, box_alignment=(1, 0.5), zorder=10)
                ax.add_artist(ab)
            except Exception: pass

def plot_deltas_bar(year, grand_prix, session_type, df, is_average_mode, log_callback=None):
    """Generates Output 2: Delta Bar Charts (code#5)."""
    def set_safe_xlim(ax, values):
        val_max = max(values) if values else 0.0
        # Reduced padding to fill up horizontal space better
        right = val_max + (0.12 * val_max) + 0.15
        ax.set_xlim(left=0, right=right)

    def get_label_pos(bar_end, ax):
        left, right = ax.get_xlim()
        rng = right - left
        margin = 0.06 * rng
        pad = 0.012 * rng
        if bar_end + pad >= right - margin: return right - margin, 'right'
        else: return bar_end + pad, 'left'

    # ---------------------------------------------------------
    # تنظیمات فاصله نام و چهره رانندگان در چارت میله ای دلتا
    # برای دورتر کردن عکس از اسم، عدد IMG_X_OFFSET را منفی‌تر کنید (مثلاً -0.15)
    # ---------------------------------------------------------
    NAME_X_OFFSET = -0.015
    IMG_X_OFFSET = -0.11

    num_drivers = len(df)
    fig_h = 13.0
    if num_drivers > 20:
        fig_h *= 1.15

    if is_average_mode:
        fastest_s1 = df['AvgSector1'].min()
        fastest_s2 = df['AvgSector2'].min()
        fastest_s3 = df['AvgSector3'].min()
        fastest_lap = df['AvgLap'].min()

        fastest_s1_idx = df['AvgSector1'].idxmin()
        fastest_s2_idx = df['AvgSector2'].idxmin()
        fastest_s3_idx = df['AvgSector3'].idxmin()
        fastest_lap_idx = df['AvgLap'].idxmin()

        fastest_s1_val = df.loc[fastest_s1_idx, 'AvgSector1']
        fastest_s2_val = df.loc[fastest_s2_idx, 'AvgSector2']
        fastest_s3_val = df.loc[fastest_s3_idx, 'AvgSector3']
        fastest_lap_val = df.loc[fastest_lap_idx, 'AvgLap']

        fastest_s1_driver = driver_code(df.loc[fastest_s1_idx, 'Driver'])
        fastest_s2_driver = driver_code(df.loc[fastest_s2_idx, 'Driver'])
        fastest_s3_driver = driver_code(df.loc[fastest_s3_idx, 'Driver'])
        fastest_lap_driver = driver_code(df.loc[fastest_lap_idx, 'Driver'])

        df['Delta_S1'] = df['AvgSector1'] - fastest_s1
        df['Delta_S2'] = df['AvgSector2'] - fastest_s2
        df['Delta_S3'] = df['AvgSector3'] - fastest_s3
        df['Delta_Lap'] = df['AvgLap'] - fastest_lap
        
        df['DriverCode'] = df['Driver'].apply(driver_code)

        order_s1 = df.sort_values('AvgSector1')['DriverCode'].values
        idx_s1 = df.sort_values('AvgSector1').index
        order_s2 = df.sort_values('AvgSector2')['DriverCode'].values
        idx_s2 = df.sort_values('AvgSector2').index
        order_s3 = df.sort_values('AvgSector3')['DriverCode'].values
        idx_s3 = df.sort_values('AvgSector3').index
        order_lap = df.sort_values('AvgLap')['DriverCode'].values
        idx_lap = df.sort_values('AvgLap').index

        # Increased width, adjusted width_ratios for wider last column
        fig, axs = plt.subplots(1, 4, figsize=(20, fig_h), sharey=False, gridspec_kw={'width_ratios': [1, 1, 1, 1.35]})
        
        # INCREASED LEFT MARGIN to 0.10 so the images pushed back don't get cut off
        fig.subplots_adjust(left=0.10, right=0.98, top=0.87, bottom=0.11, wspace=0.26)
        
        fig.patch.set_facecolor(DARK_BG)
        bar_kw = dict(height=0.6, edgecolor=DARK_BG)
        
        # Increased Font Sizes; tick_fs controls Driver abbreviation
        title_fs, label_fs, tick_fs, value_fs = 20, 16, 21, 15

        for ax in axs:
            ax.set_facecolor(DARK_AX)
            ax.grid(False)
            ax.tick_params(axis='both', direction='out', length=0)
            for s in ['top', 'right', 'left', 'bottom']:
                ax.spines[s].set_visible(True)
                ax.spines[s].set_color(SOLID_WHITE)
                ax.spines[s].set_linewidth(1.5)
            ax.minorticks_off()

        sec_info = [
            ("Sector 1", f"({fastest_s1_driver}) {format_time(fastest_s1_val)}"),
            ("Sector 2", f"({fastest_s2_driver}) {format_time(fastest_s2_val)}"),
            ("Sector 3", f"({fastest_s3_driver}) {format_time(fastest_s3_val)}"),
            ("Avg Lap", f"({fastest_lap_driver}) {format_time(fastest_lap_val)}"),
        ]

        for i, (col, order, idx) in enumerate([
            ('Delta_S1', order_s1, idx_s1), ('Delta_S2', order_s2, idx_s2),
            ('Delta_S3', order_s3, idx_s3), ('Delta_Lap', order_lap, idx_lap)
        ]):
            header_text, sub_text = sec_info[i]
            axs[i].text(0.5, 1.01, f"{header_text}\n{sub_text}", ha='center', va='bottom', fontsize=title_fs, fontweight='bold', color=DARK_LABEL, fontfamily=KALAMEH_FONT, transform=axs[i].transAxes)

            values = [df.loc[j, col].total_seconds() for j in idx]
            axs[i].barh(range(len(order)), values, color=[df.loc[j, 'TeamColor'] for j in idx], **bar_kw)
            
            # Using 'Delta' to avoid font rendering issues
            axs[i].set_xlabel("Delta to Fastest (s)", fontsize=label_fs, color=DARK_LABEL, fontfamily=KALAMEH_FONT)
            
            axs[i].set_yticks([]) 
            axs[i].invert_yaxis()
            axs[i].tick_params(axis='x', colors=SOLID_WHITE)
            for label in axs[i].get_xticklabels(): label.set_fontfamily(KALAMEH_FONT)
            set_safe_xlim(axs[i], values)

            for k, row_index in enumerate(idx):
                driver_abbr = df.loc[row_index, 'Abbreviation'] if pd.notna(df.loc[row_index, 'Abbreviation']) else df.loc[row_index, 'DriverCode']
                
                # Applying global NAME_X_OFFSET
                axs[i].text(NAME_X_OFFSET, k, driver_abbr, ha='right', va='center', fontfamily=KALAMEH_FONT, fontsize=tick_fs, color=SOLID_WHITE, weight='bold', transform=axs[i].get_yaxis_transform())
                
                headshot_url = df.loc[row_index, 'HeadshotUrl']
                img_path = get_driver_headshot(driver_abbr, headshot_url)
                if img_path:
                    try:
                        img_arr = plt.imread(img_path)
                        imagebox = OffsetImage(img_arr, zoom=0.34)
                        # Applying global IMG_X_OFFSET
                        ab = AnnotationBbox(imagebox, (IMG_X_OFFSET, k), xycoords=axs[i].get_yaxis_transform(), frameon=False, box_alignment=(1, 0.5))
                        axs[i].add_artist(ab)
                    except Exception: pass

            for j, v in enumerate(values):
                label_text = f"+{v:.3f}"
                xpos, align = get_label_pos(v, axs[i])
                axs[i].text(xpos, j, label_text, color=SOLID_WHITE, va='center', ha=align, fontsize=value_fs, fontweight='bold', fontfamily=KALAMEH_FONT, clip_on=True)

        title_text = f"Average Sectors & Lap Deltas to Fastest in {year} ({grand_prix}) ({session_type})"
        apply_modern_header_footer(fig, title_text, TEAM_IMG_DIR, KALAMEH_FONT)

        # Delta Plot corresponds to code#5
        filename = f"average sector and lap deltas-{grand_prix}-{year}-{session_type}-code#5"
        safe_file = safe_filename(filename)
        output_path = os.path.join(OUTPUT_DIR, safe_file + ".png")
        plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), pad_inches=0, bbox_inches="tight")
        if log_callback: log_callback(f"Delta plot PNG file created: '{output_path}'")
        save_instagram_square_png(safe_file, output_path, log_callback)
        
        try:
            mng = plt.get_current_fig_manager()
            mng.window.state('zoomed')
        except Exception: pass
        plt.show()
        plt.close(fig)

    else:
        fastest_s1 = df['Sector1'].min()
        fastest_s2 = df['Sector2'].min()
        fastest_s3 = df['Sector3'].min()
        fastest_ideal = df['Ideal'].min()

        fastest_s1_idx = df['Sector1'].idxmin()
        fastest_s2_idx = df['Sector2'].idxmin()
        fastest_s3_idx = df['Sector3'].idxmin()
        fastest_ideal_idx = df['Ideal'].idxmin()

        fastest_s1_val = df.loc[fastest_s1_idx, 'Sector1']
        fastest_s2_val = df.loc[fastest_s2_idx, 'Sector2']
        fastest_s3_val = df.loc[fastest_s3_idx, 'Sector3']
        fastest_ideal_val = df.loc[fastest_ideal_idx, 'Ideal']

        fastest_s1_driver = driver_code(df.loc[fastest_s1_idx, 'Driver'])
        fastest_s2_driver = driver_code(df.loc[fastest_s2_idx, 'Driver'])
        fastest_s3_driver = driver_code(df.loc[fastest_s3_idx, 'Driver'])
        fastest_ideal_driver = driver_code(df.loc[fastest_ideal_idx, 'Driver'])

        df['Delta_S1'] = df['Sector1'] - fastest_s1
        df['Delta_S2'] = df['Sector2'] - fastest_s2
        df['Delta_S3'] = df['Sector3'] - fastest_s3
        df['Delta_Ideal'] = df['Ideal'] - fastest_ideal
        
        df['DriverCode'] = df['Driver'].apply(driver_code)

        order_s1 = df.sort_values('Sector1')['DriverCode'].values
        idx_s1 = df.sort_values('Sector1').index
        order_s2 = df.sort_values('Sector2')['DriverCode'].values
        idx_s2 = df.sort_values('Sector2').index
        order_s3 = df.sort_values('Sector3')['DriverCode'].values
        idx_s3 = df.sort_values('Sector3').index
        order_idl = df.sort_values('Ideal')['DriverCode'].values
        idx_idl = df.sort_values('Ideal').index

        # Increased width, adjusted width_ratios for wider last column
        fig, axs = plt.subplots(1, 4, figsize=(20, fig_h), sharey=False, gridspec_kw={'width_ratios': [1, 1, 1, 1.35]})
        
        # INCREASED LEFT MARGIN to 0.10 so the images pushed back don't get cut off
        fig.subplots_adjust(left=0.10, right=0.98, top=0.87, bottom=0.11, wspace=0.26)
        
        fig.patch.set_facecolor(DARK_BG)
        bar_kw = dict(height=0.6, edgecolor=DARK_BG)
        
        # Increased Font Sizes; tick_fs controls Driver abbreviation
        title_fs, label_fs, tick_fs, value_fs = 20, 16, 21, 15

        for ax in axs:
            ax.set_facecolor(DARK_AX)
            ax.grid(False)
            ax.tick_params(axis='both', direction='out', length=0)
            for s in ['top', 'right', 'left', 'bottom']:
                ax.spines[s].set_visible(True)
                ax.spines[s].set_color(SOLID_WHITE)
                ax.spines[s].set_linewidth(1.5)
            ax.minorticks_off()

        sec_info = [
            ("Sector 1", f"({fastest_s1_driver}) {format_time(fastest_s1_val)}"),
            ("Sector 2", f"({fastest_s2_driver}) {format_time(fastest_s2_val)}"),
            ("Sector 3", f"({fastest_s3_driver}) {format_time(fastest_s3_val)}"),
            ("Ideal Lap", f"({fastest_ideal_driver}) {format_time(fastest_ideal_val)}"),
        ]

        for i, (col, order, idx) in enumerate([
            ('Delta_S1', order_s1, idx_s1), ('Delta_S2', order_s2, idx_s2),
            ('Delta_S3', order_s3, idx_s3), ('Delta_Ideal', order_idl, idx_idl),
        ]):
            header_text, sub_text = sec_info[i]
            axs[i].text(0.5, 1.01, f"{header_text}\n{sub_text}", ha='center', va='bottom', fontsize=title_fs, fontweight='bold', color=DARK_LABEL, fontfamily=KALAMEH_FONT, transform=axs[i].transAxes)

            values = [df.loc[j, col].total_seconds() for j in idx]
            axs[i].barh(range(len(order)), values, color=[df.loc[j, 'TeamColor'] for j in idx], **bar_kw)
            
            # Substituted Greek Delta with string "Delta"
            axs[i].set_xlabel("Delta to Fastest (s)", fontsize=label_fs, color=DARK_LABEL, fontfamily=KALAMEH_FONT)
            
            axs[i].set_yticks([])
            axs[i].invert_yaxis()
            axs[i].tick_params(axis='x', colors=SOLID_WHITE)
            for label in axs[i].get_xticklabels(): label.set_fontfamily(KALAMEH_FONT)
            set_safe_xlim(axs[i], values)

            for k, row_index in enumerate(idx):
                driver_abbr = df.loc[row_index, 'Abbreviation'] if pd.notna(df.loc[row_index, 'Abbreviation']) else df.loc[row_index, 'DriverCode']
                
                # Applying global NAME_X_OFFSET
                axs[i].text(NAME_X_OFFSET, k, driver_abbr, ha='right', va='center', fontfamily=KALAMEH_FONT, fontsize=tick_fs, color=SOLID_WHITE, weight='bold', transform=axs[i].get_yaxis_transform())
                
                headshot_url = df.loc[row_index, 'HeadshotUrl']
                img_path = get_driver_headshot(driver_abbr, headshot_url)
                if img_path:
                    try:
                        img_arr = plt.imread(img_path)
                        imagebox = OffsetImage(img_arr, zoom=0.34)
                        # Applying global IMG_X_OFFSET
                        ab = AnnotationBbox(imagebox, (IMG_X_OFFSET, k), xycoords=axs[i].get_yaxis_transform(), frameon=False, box_alignment=(1, 0.5))
                        axs[i].add_artist(ab)
                    except Exception: pass

            for j, v in enumerate(values):
                label_text = f"+{v:.3f}"
                xpos, align = get_label_pos(v, axs[i])
                axs[i].text(xpos, j, label_text, color=SOLID_WHITE, va='center', ha=align, fontsize=value_fs, fontweight='bold', fontfamily=KALAMEH_FONT, clip_on=True)

        title_text = f"Sector & Ideal Lap Deltas to Fastest in {year} ({grand_prix}) ({session_type})"
        apply_modern_header_footer(fig, title_text, TEAM_IMG_DIR, KALAMEH_FONT)

        # Delta Plot corresponds to code#5
        filename = f"sector and ideal deltas-{grand_prix}-{year}-{session_type}-code#5"
        safe_file = safe_filename(filename)
        output_path = os.path.join(OUTPUT_DIR, safe_file + ".png")
        plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), pad_inches=0, bbox_inches="tight")
        if log_callback: log_callback(f"Delta plot PNG file created: '{output_path}'")
        save_instagram_square_png(safe_file, output_path, log_callback)
        
        try:
            mng = plt.get_current_fig_manager()
            mng.window.state('zoomed')
        except Exception: pass
        plt.show()
        plt.close(fig)

def render_main_plot(year, grand_prix, session_type, df, use_avg, log_callback=None):
    """Renders Output 1: The main table plot (code#4)."""
    num_drivers = len(df)
    fig_h = 10.8
    current_cell_height = cell_height
    
    if num_drivers > 20:
        fig_h *= 1.15
        current_cell_height /= 1.15

    fig, axs = plt.subplots(1, 4, figsize=(19.2, fig_h), gridspec_kw={'width_ratios': [1, 1, 1, 2]})
    fig.subplots_adjust(top=0.89, left=0.02, right=0.98, bottom=0.09, wspace=0.19)
    fig.patch.set_facecolor(DARK_BG)
    for ax in axs: ax.set_facecolor(DARK_AX)
    
    title_prefix = "Every Driver Average Sectors" if use_avg else "Every Driver Best Sectors"
    title_text = f"{title_prefix} in {year} ({grand_prix}) ({session_type})"
    apply_modern_header_footer(fig, title_text, TEAM_IMG_DIR, KALAMEH_FONT)

    def style_table_generic(table, col_idx_time, fastest_time, driver_colors):
        for key, cell in table.get_celld().items():
            row, col = key
            if row == 0:
                cell.set_facecolor(DARK_HEADER)
                cell.set_text_props(weight='bold', color=DARK_LABEL, fontsize=header_fontsize, fontfamily=KALAMEH_FONT)
                cell.set_height(current_cell_height)
            else:
                if col == 0:
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT, ha='left')
                    cell.get_text().set_x(0.05)
                    cell.set_facecolor(driver_colors[row-1])
                    cell.set_height(current_cell_height)
                elif col == col_idx_time and table[row, col].get_text().get_text() == format_time(fastest_time):
                    cell.set_text_props(weight='bold', color=DARK_PURPLE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == col_idx_time and table[row, col].get_text().get_text() != "-":
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                else:
                    cell.set_text_props(fontsize=cell_fontsize, color=SOLID_WHITE, fontfamily=KALAMEH_FONT)
                    if row % 2 == 0: cell.set_facecolor(DARK_CELL_ALT_BG)
                    else: cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
            cell.set_edgecolor(DARK_BG)

    def style_table_overall_generic(table, t4, fastest_ideal, fastest_lap):
        for key, cell in table.get_celld().items():
            row, col = key
            if row == 0:
                cell.set_facecolor(DARK_HEADER)
                cell.set_text_props(weight='bold', color=DARK_LABEL, fontsize=header_fontsize, fontfamily=KALAMEH_FONT)
                cell.set_height(current_cell_height)
            else:
                driver_color = t4.iloc[row-1]['TeamColor']
                if col == 0:
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT, ha='left')
                    cell.get_text().set_x(0.05)
                    cell.set_facecolor(driver_color)
                    cell.set_height(current_cell_height)
                elif col == 1 and table[row, col].get_text().get_text() == format_time(fastest_ideal):
                    cell.set_text_props(weight='bold', color=DARK_PURPLE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == 1 and table[row, col].get_text().get_text() != "-":
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == 2 and table[row, col].get_text().get_text() == format_time(fastest_lap):
                    cell.set_text_props(weight='bold', color=DARK_PURPLE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == 2 and table[row, col].get_text().get_text() != "-":
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == 3 and table[row, col].get_text().get_text() != "-":
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                else:
                    cell.set_text_props(fontsize=cell_fontsize, color=SOLID_WHITE, fontfamily=KALAMEH_FONT)
                    if row % 2 == 0: cell.set_facecolor(DARK_CELL_ALT_BG)
                    else: cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
            cell.set_edgecolor(DARK_BG)

    if use_avg:
        t1 = df[['Driver', 'AvgSector1', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('AvgSector1').copy()
        t1['AvgSector1'] = t1['AvgSector1'].apply(format_time)
        t2 = df[['Driver', 'AvgSector2', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('AvgSector2').copy()
        t2['AvgSector2'] = t2['AvgSector2'].apply(format_time)
        t3 = df[['Driver', 'AvgSector3', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('AvgSector3').copy()
        t3['AvgSector3'] = t3['AvgSector3'].apply(format_time)
        t4 = df[['Driver', 'AvgLap', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].copy()
        t4['AvgLap'] = t4['AvgLap'].apply(format_time)
        t4 = t4.sort_values('AvgLap')
        
        fs1, fs2, fs3, fl = df['AvgSector1'].min(), df['AvgSector2'].min(), df['AvgSector3'].min(), df['AvgLap'].min()
        
        tb1 = axs[0].table(cellText=t1[['Driver', 'AvgSector1']].values, colLabels=['Driver', 'Avg S1'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb1, 1, fs1, list(t1['TeamColor']))
        add_driver_images_table(axs[0], tb1, t1)
        
        tb2 = axs[1].table(cellText=t2[['Driver', 'AvgSector2']].values, colLabels=['Driver', 'Avg S2'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb2, 1, fs2, list(t2['TeamColor']))
        add_driver_images_table(axs[1], tb2, t2)
        
        tb3 = axs[2].table(cellText=t3[['Driver', 'AvgSector3']].values, colLabels=['Driver', 'Avg S3'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb3, 1, fs3, list(t3['TeamColor']))
        add_driver_images_table(axs[2], tb3, t3)
        
        tb4 = axs[3].table(cellText=t4[['Driver', 'AvgLap']].values, colLabels=['Driver', 'Avg Lap'], loc='center', cellLoc='center', colWidths=[0.55, 0.55])
        for key, cell in tb4.get_celld().items():
            row, col = key
            if row == 0:
                cell.set_facecolor(DARK_HEADER)
                cell.set_text_props(weight='bold', color=DARK_LABEL, fontsize=header_fontsize, fontfamily=KALAMEH_FONT)
                cell.set_height(current_cell_height)
            else:
                driver_color = t4.iloc[row-1]['TeamColor']
                if col == 0:
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT, ha='left')
                    cell.get_text().set_x(0.05)
                    cell.set_facecolor(driver_color)
                    cell.set_height(current_cell_height)
                elif col == 1 and tb4[row, col].get_text().get_text() == format_time(fl):
                    cell.set_text_props(weight='bold', color=DARK_PURPLE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                elif col == 1:
                    cell.set_text_props(weight='bold', color=SOLID_WHITE, fontsize=cell_fontsize, fontfamily=KALAMEH_FONT)
                    cell.set_facecolor(DARK_CELL_BG)
                    cell.set_height(current_cell_height)
                else:
                    cell.set_facecolor(DARK_CELL_BG if row % 2 else DARK_CELL_ALT_BG)
                    cell.set_height(current_cell_height)
            cell.set_edgecolor(DARK_BG)
        add_driver_images_table(axs[3], tb4, t4)

    else:
        t1 = df[['Driver', 'Sector1', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('Sector1').copy()
        t1['Sector1'] = t1['Sector1'].apply(format_time)
        t2 = df[['Driver', 'Sector2', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('Sector2').copy()
        t2['Sector2'] = t2['Sector2'].apply(format_time)
        t3 = df[['Driver', 'Sector3', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].sort_values('Sector3').copy()
        t3['Sector3'] = t3['Sector3'].apply(format_time)
        t4 = df[['Driver', 'Ideal', 'FastestLap', 'DeltaToIdeal', 'TeamColor', 'HeadshotUrl', 'Abbreviation']].copy()
        t4['Ideal'] = t4['Ideal'].apply(format_time)
        t4['FastestLap'] = t4['FastestLap'].apply(format_time)
        t4['DeltaToIdeal'] = t4['DeltaToIdeal'].apply(format_delta)
        t4 = t4.sort_values('Ideal')
        
        fs1, fs2, fs3 = df['Sector1'].min(), df['Sector2'].min(), df['Sector3'].min()
        f_ideal, f_lap = df['Ideal'].min(), df['FastestLap'].min()
        
        tb1 = axs[0].table(cellText=t1[['Driver', 'Sector1']].values, colLabels=['Driver', 'Sector 1'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb1, 1, fs1, list(t1['TeamColor']))
        add_driver_images_table(axs[0], tb1, t1)
        
        tb2 = axs[1].table(cellText=t2[['Driver', 'Sector2']].values, colLabels=['Driver', 'Sector 2'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb2, 1, fs2, list(t2['TeamColor']))
        add_driver_images_table(axs[1], tb2, t2)
        
        tb3 = axs[2].table(cellText=t3[['Driver', 'Sector3']].values, colLabels=['Driver', 'Sector 3'], loc='center', cellLoc='center', colWidths=[0.6, 0.4])
        style_table_generic(tb3, 1, fs3, list(t3['TeamColor']))
        add_driver_images_table(axs[2], tb3, t3)
        
        # Substituted Greek Delta with string "Delta Ideal"
        tb4 = axs[3].table(cellText=t4[['Driver', 'Ideal', 'FastestLap', 'DeltaToIdeal']].values, colLabels=['Driver', 'Ideal', 'Fastest', 'Delta Ideal'], loc='center', cellLoc='center', colWidths=[0.4, 0.2, 0.2, 0.2])
        style_table_overall_generic(tb4, t4, f_ideal, f_lap)
        add_driver_images_table(axs[3], tb4, t4)

    for ax in axs: ax.axis('off')
    
    # Table Plot corresponds to code#4
    filename = f"driver best sectors-{grand_prix}-{year}-{session_type}-code#4"
    safe_file = safe_filename(filename)
    output_path = os.path.join(OUTPUT_DIR, safe_file + ".png")
    plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), pad_inches=0, bbox_inches="tight")
    if log_callback: log_callback(f"Table PNG file created: '{output_path}'")
    save_instagram_square_png(safe_file, output_path, log_callback)
    plt.show()
    plt.close(fig)

class F1PlotterApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Setup
        self.title("F1 Best Sector Times Plotter - Pro Version")
        self.geometry("700x550")
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")
        
        # Grid Configuration
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Main Frame
        self.main_frame = ctk.CTkFrame(self, fg_color=DARK_BG, corner_radius=10)
        self.main_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_columnconfigure(1, weight=1)

        # Fonts
        self.ui_font = ctk.CTkFont(family=KALAMEH_FONT, size=16, weight="bold")
        self.title_font = ctk.CTkFont(family=KALAMEH_FONT, size=24, weight="bold")

        # Title Label
        self.title_label = ctk.CTkLabel(self.main_frame, text="🏁 F1 Best Sectors Plotter", font=self.title_font, text_color=DARK_LABEL)
        self.title_label.grid(row=0, column=0, columnspan=2, pady=(15, 25))

        # Year Selector
        self.year_label = ctk.CTkLabel(self.main_frame, text="Year:", font=self.ui_font)
        self.year_label.grid(row=1, column=0, padx=20, pady=10, sticky="w")
        
        self.year_var = ctk.StringVar(value=YEARS[-2] if len(YEARS) >= 2 else YEARS[-1])
        self.year_menu = ctk.CTkOptionMenu(self.main_frame, variable=self.year_var, values=YEARS, command=self.on_year_change,
                                          font=self.ui_font, dropdown_font=self.ui_font, fg_color=DARK_AX, button_color=DARK_HEADER, button_hover_color=DARK_LABEL)
        self.year_menu.grid(row=1, column=1, padx=20, pady=10, sticky="ew")

        # Grand Prix Selector
        self.gp_label = ctk.CTkLabel(self.main_frame, text="Grand Prix:", font=self.ui_font)
        self.gp_label.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        
        self.gp_var = ctk.StringVar(value="Select Year First...")
        self.gp_menu = ctk.CTkOptionMenu(self.main_frame, variable=self.gp_var, values=["Select Year First..."], command=self.on_gp_change,
                                        font=self.ui_font, dropdown_font=self.ui_font, fg_color=DARK_AX, button_color=DARK_HEADER, button_hover_color=DARK_LABEL)
        self.gp_menu.grid(row=2, column=1, padx=20, pady=10, sticky="ew")

        # Session Selector
        self.session_label = ctk.CTkLabel(self.main_frame, text="Session:", font=self.ui_font)
        self.session_label.grid(row=3, column=0, padx=20, pady=10, sticky="w")
        
        self.session_var = ctk.StringVar(value="Select GP First...")
        self.session_menu = ctk.CTkOptionMenu(self.main_frame, variable=self.session_var, values=["Select GP First..."],
                                             font=self.ui_font, dropdown_font=self.ui_font, fg_color=DARK_AX, button_color=DARK_HEADER, button_hover_color=DARK_LABEL)
        self.session_menu.grid(row=3, column=1, padx=20, pady=10, sticky="ew")

        # Progress Bar
        self.progress_bar = ctk.CTkProgressBar(self.main_frame, mode="indeterminate", progress_color=DARK_LABEL, fg_color=DARK_AX)
        self.progress_bar.grid(row=4, column=0, columnspan=2, padx=20, pady=(20, 5), sticky="ew")
        self.progress_bar.set(0)

        # Submit Button
        self.submit_btn = ctk.CTkButton(self.main_frame, text="Generate Plot", command=self.on_submit, 
                                        font=self.title_font, fg_color=DARK_LABEL, text_color=DARK_BG, hover_color="#d6ba15")
        self.submit_btn.grid(row=5, column=0, columnspan=2, padx=20, pady=15, ipady=5)

        # Log Textbox
        self.log_box = ctk.CTkTextbox(self.main_frame, height=120, font=ctk.CTkFont(family="Consolas", size=13), 
                                      fg_color=DARK_AX, text_color=SOLID_WHITE, border_width=1, border_color=DARK_HEADER)
        self.log_box.grid(row=6, column=0, columnspan=2, padx=20, pady=(0, 20), sticky="nsew")
        self.main_frame.grid_rowconfigure(6, weight=1)

        # Initial Data Load
        self.log("Application started. Loading initial FastF1 data...")
        self.on_year_change(self.year_var.get())

    def log(self, message):
        """Thread-safe logging to GUI textbox."""
        self.log_box.insert("end", message + "\n")
        self.log_box.see("end")

    def on_year_change(self, selected_year):
        self.gp_menu.configure(state="disabled")
        self.session_menu.configure(state="disabled")
        self.submit_btn.configure(state="disabled")
        self.progress_bar.start()
        self.log(f"Fetching events for year {selected_year} from FastF1 Server...")

        def fetch_events():
            try:
                year = int(selected_year)
                schedule = fastf1.get_event_schedule(year)
                valid_events = [name for name in schedule['EventName'] if isinstance(name, str) and name.strip()]
                
                self.after(0, self.update_gp_menu, valid_events)
            except Exception as e:
                self.after(0, self.log, f"Error fetching events (Check Internet): {e}")
                self.after(0, self.progress_bar.stop)
                self.after(0, self.submit_btn.configure, {"state": "normal"})

        threading.Thread(target=fetch_events, daemon=True).start()

    def update_gp_menu(self, events):
        if events:
            self.gp_menu.configure(values=events, state="normal")
            self.gp_var.set(events[-1] if len(events) > 1 else events[0])
            self.on_gp_change(self.gp_var.get())
        else:
            self.gp_menu.configure(values=["No Events Found"])
            self.gp_var.set("No Events Found")
            self.progress_bar.stop()

    def on_gp_change(self, selected_gp):
        self.session_menu.configure(state="disabled")
        self.submit_btn.configure(state="disabled")
        self.progress_bar.start()
        self.log(f"Fetching sessions for {selected_gp}...")

        def fetch_sessions():
            try:
                year = int(self.year_var.get())
                event = fastf1.get_event(year, selected_gp)
                sessions = []
                for i in range(1, 6):
                    s_name = event.get(f'Session{i}')
                    if isinstance(s_name, str) and s_name.strip():
                        sessions.append(s_name)
                
                self.after(0, self.update_session_menu, sessions)
            except Exception as e:
                self.after(0, self.log, f"Error fetching sessions: {e}")
                self.after(0, self.progress_bar.stop)
                self.after(0, self.submit_btn.configure, {"state": "normal"})

        threading.Thread(target=fetch_sessions, daemon=True).start()

    def update_session_menu(self, sessions):
        if sessions:
            self.session_menu.configure(values=sessions, state="normal")
            self.session_var.set(sessions[-1])  # Default to latest session
            self.submit_btn.configure(state="normal")
        else:
            self.session_menu.configure(values=["No Sessions"])
            self.session_var.set("No Sessions")
        self.progress_bar.stop()
        self.log("Ready.")

    def on_submit(self):
        self.submit_btn.configure(state="disabled")
        self.progress_bar.start()
        
        year = int(self.year_var.get())
        grand_prix = self.gp_var.get()
        session_type = self.session_var.get()
        
        self.log(f"Downloading telemetry for {year} {grand_prix} - {session_type}...")
        self.log("This might take a while if data is not cached...")

        threading.Thread(target=self.process_data_thread, args=(year, grand_prix, session_type), daemon=True).start()

    def process_data_thread(self, year, grand_prix, session_type):
        try:
            # 1. Load Session
            session = fastf1.get_session(year, grand_prix, session_type)
            session.load()
            
            use_avg = session_is_race(session_type)
            driver_data = []

            # 2. Extract Data using SessionResults
            results = session.results

            CUSTOM_2026_GRID = {
                '1': ('NOR', 'Lando Norris', 'McLaren'), '3': ('VER', 'Max Verstappen', 'Red Bull'),
                '5': ('BOR', 'Gabriel Bortoleto', 'Audi'), '6': ('HAD', 'Isack Hadjar', 'Red Bull'),
                '10': ('GAS', 'Pierre Gasly', 'Alpine'), '11': ('PER', 'Sergio Perez', 'Cadillac'),
                '12': ('ANT', 'Kimi Antonelli', 'Mercedes'), '14': ('ALO', 'Fernando Alonso', 'Aston Martin'),
                '16': ('LEC', 'Charles Leclerc', 'Ferrari'), '18': ('STR', 'Lance Stroll', 'Aston Martin'),
                '23': ('ALB', 'Alexander Albon', 'Williams'), '25': ('HER', 'Colton Herta', 'Cadillac'),
                '27': ('HUL', 'Nico Hulkenberg', 'Audi'), '30': ('LAW', 'Liam Lawson', 'Racing Bulls'),
                '31': ('OCO', 'Esteban Ocon', 'Haas'), '43': ('COL', 'Franco Colapinto', 'Alpine'),
                '44': ('HAM', 'Lewis Hamilton', 'Ferrari'), '55': ('SAI', 'Carlos Sainz', 'Williams'),
                '63': ('RUS', 'George Russell', 'Mercedes'), '77': ('BOT', 'Valtteri Bottas', 'Cadillac'),
                '81': ('PIA', 'Oscar Piastri', 'McLaren'), '87': ('BEA', 'Oliver Bearman', 'Haas'),
            }

            for idx, driver_info in results.iterrows():
                d_num = str(driver_info.get('DriverNumber', idx)).strip()
                full_name = str(driver_info.get('FullName', ''))
                team_name = driver_info.get('TeamName', '')
                headshot_url = driver_info.get('HeadshotUrl', '')
                abbreviation = driver_info.get('Abbreviation', '')
                
                # Fetch specific driver's telemetry via driver number or abbreviation
                try:
                    # FIX: pick_driver is deprecated, use pick_drivers
                    laps = session.laps.pick_drivers(d_num)
                except Exception:
                    continue # Skip if no lap telemetry is available
                
                if d_num in CUSTOM_2026_GRID:
                    c_abbr, c_full_name, c_team = CUSTOM_2026_GRID[d_num]
                    full_name = c_full_name
                    team_name = c_team
                    abbreviation = c_abbr
                    
                last_name = get_last_name(full_name)
                
                # Fetch Official Colors directly from FastF1 API
                driver_color = "#AAAAAA"
                if abbreviation:
                    try:
                        driver_color = fastf1.plotting.get_driver_color(abbreviation, session)
                    except Exception as e:
                        try:
                            driver_color = fastf1.plotting.get_team_color(team_name, session)
                        except Exception:
                            pass
                elif team_name:
                    try:
                        driver_color = fastf1.plotting.get_team_color(team_name, session)
                    except Exception:
                        pass

                if use_avg:
                    laps_filt = filter_laps(laps)
                    if laps_filt.empty: continue
                    driver_data.append({
                        'Driver': last_name,
                        'AvgSector1': laps_filt['Sector1Time'].mean(),
                        'AvgSector2': laps_filt['Sector2Time'].mean(),
                        'AvgSector3': laps_filt['Sector3Time'].mean(),
                        'AvgLap': laps_filt['LapTime'].mean(),
                        'TeamColor': driver_color, 'HeadshotUrl': headshot_url, 
                        'Abbreviation': abbreviation if abbreviation and not pd.isna(abbreviation) and abbreviation != '' else None
                    })
                else:
                    if laps.empty or laps['Sector1Time'].isna().all() or laps['Sector2Time'].isna().all() or laps['Sector3Time'].isna().all(): continue
                    best_sector1 = laps.loc[laps['Sector1Time'].idxmin()]['Sector1Time']
                    best_sector2 = laps.loc[laps['Sector2Time'].idxmin()]['Sector2Time']
                    best_sector3 = laps.loc[laps['Sector3Time'].idxmin()]['Sector3Time']
                    fastest_lap = laps.loc[laps['LapTime'].idxmin()]['LapTime'] if not laps['LapTime'].isna().all() else pd.NaT
                    ideal = best_sector1 + best_sector2 + best_sector3
                    delta = fastest_lap - ideal if pd.notna(fastest_lap) and pd.notna(ideal) else pd.NaT
                    driver_data.append({
                        'Driver': last_name, 'Sector1': best_sector1, 'Sector2': best_sector2, 'Sector3': best_sector3,
                        'Ideal': ideal, 'FastestLap': fastest_lap, 'DeltaToIdeal': delta,
                        'TeamColor': driver_color, 'HeadshotUrl': headshot_url, 
                        'Abbreviation': abbreviation if abbreviation and not pd.isna(abbreviation) and abbreviation != '' else None
                    })

            if not driver_data:
                self.after(0, self.log, "No lap data available for the selected session.")
                self.after(0, self.reset_gui_state)
                return

            df = pd.DataFrame(driver_data)
            
            # Delegate rendering back to Main Thread
            self.after(0, self.render_plots, year, grand_prix, session_type, df, use_avg)
            
        except Exception as e:
            self.after(0, self.log, f"Critical Error in Processing: {str(e)}")
            self.after(0, self.reset_gui_state)

    def render_plots(self, year, grand_prix, session_type, df, use_avg):
        self.log("Rendering plots...")
        try:
            # Main Table Plot (code#4)
            render_main_plot(year, grand_prix, session_type, df, use_avg, log_callback=self.log)
            # Delta Bar Plot (code#5)
            plot_deltas_bar(year, grand_prix, session_type, df, use_avg, log_callback=self.log)
            
            self.log("All plots successfully generated!")
        except Exception as e:
            self.log(f"Error during rendering: {str(e)}")
            
        self.reset_gui_state()

    def reset_gui_state(self):
        self.progress_bar.stop()
        self.submit_btn.configure(state="normal")

if __name__ == "__main__":
    app = F1PlotterApp()
    app.mainloop()