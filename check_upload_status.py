"""
检查 images.json 中的文件是否已上传到数据库
"""
import json
import requests
from pathlib import Path

# 配置
API_URL = "http://localhost:3001/api"
IMAGES_JSON = Path(__file__).parent / "json" / "images.json"

# 终端颜色
class C:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def main():
    print(f"\n{C.BOLD}{C.CYAN}Upload Status Checker{C.RESET}")
    print(f"{C.GRAY}{'─' * 50}{C.RESET}\n")

    # 1. 读取 images.json
    print(f"{C.BLUE}1. Loading images.json...{C.RESET}")
    try:
        with open(IMAGES_JSON, 'r', encoding='utf-8') as f:
            images_data = json.load(f)
        img_names = {item['img_name'] for item in images_data}
        print(f"   {C.GREEN}✓ Found {len(img_names)} images{C.RESET}")
    except Exception as e:
        print(f"   {C.RED}✗ Failed to read: {e}{C.RESET}")
        return

    # 2. 获取数据库记录
    print(f"\n{C.BLUE}2. Fetching database records...{C.RESET}")
    try:
        res = requests.get(f"{API_URL}/tasks", timeout=60)
        records = res.json()
        print(f"   {C.GREEN}✓ Found {len(records)} records{C.RESET}")
    except Exception as e:
        print(f"   {C.RED}✗ Failed to fetch: {e}{C.RESET}")
        return

    # 3. 提取数据库中的 filename
    db_files = set()
    for record in records:
        filename = record.get('filename', '')
        if filename:
            # IMG_1279.json -> 1279
            name = filename.replace('.json', '').replace('IMG_', '')
            if name.isdigit():
                db_files.add(int(name))

    # 4. 对比
    print(f"\n{C.BLUE}3. Comparing...{C.RESET}")
    uploaded = img_names & db_files
    missing = img_names - db_files
    extra = db_files - img_names

    # 统计
    print(f"\n{C.BOLD}📊 Summary:{C.RESET}")
    print(f"   Total in images.json:  {C.CYAN}{len(img_names)}{C.RESET}")
    print(f"   Total in database:     {C.CYAN}{len(db_files)}{C.RESET}")
    print(f"   {C.GREEN}✓ Uploaded:{C.RESET}            {len(uploaded)}")
    print(f"   {C.RED}✗ Missing:{C.RESET}             {len(missing)}")
    if extra:
        print(f"   {C.YELLOW}⚠ Extra in DB:{C.RESET}          {len(extra)}")

    # 缺失列表
    if missing:
        print(f"\n{C.RED}{C.BOLD}Missing files ({len(missing)}):{C.RESET}")
        missing_sorted = sorted(missing)
        # 每行显示 10 个
        for i in range(0, len(missing_sorted), 10):
            chunk = missing_sorted[i:i+10]
            line = "   " + " ".join(f"IMG_{n}" for n in chunk)
            print(f"{C.GRAY}{line}{C.RESET}")

        # 保存缺失列表到文件
        missing_file = Path(__file__).parent / "missing_files.txt"
        with open(missing_file, 'w') as f:
            for n in missing_sorted:
                f.write(f"IMG_{n}.json\n")
        print(f"\n   {C.YELLOW}Missing list saved to: {missing_file}{C.RESET}")

    # 多余文件
    if extra:
        print(f"\n{C.YELLOW}{C.BOLD}Extra files in DB ({len(extra)}):{C.RESET}")
        extra_sorted = sorted(extra)[:20]  # 只显示前 20 个
        for n in extra_sorted:
            print(f"   {C.GRAY}IMG_{n}{C.RESET}")
        if len(extra) > 20:
            print(f"   {C.GRAY}... and {len(extra) - 20} more{C.RESET}")

    # 完成率
    if img_names:
        rate = len(uploaded) / len(img_names) * 100
        bar_len = 30
        filled = int(bar_len * rate / 100)
        bar = '█' * filled + '░' * (bar_len - filled)
        print(f"\n{C.BOLD}Progress: {C.CYAN}{rate:.1f}%{C.RESET}")
        print(f"   [{C.GREEN}{bar}{C.RESET}]")

    print(f"\n{C.GRAY}{'─' * 50}{C.RESET}\n")

if __name__ == "__main__":
    main()
