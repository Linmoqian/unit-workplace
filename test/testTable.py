import requests

API_URL = "http://localhost:3001/api"

# 终端颜色
class C:
    GREEN = '\033[92m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

print(f"\n{C.BOLD}{C.CYAN}数据库表结构检查{C.RESET}")
print(f"{C.GRAY}{'─' * 50}{C.RESET}\n")

# 1. 健康检查
print(f"{C.BLUE}1. 连接测试{C.RESET}")
try:
    res = requests.get(f"{API_URL}/health", timeout=5)
    if res.status_code == 200:
        print(f"   {C.GREEN}✓ 服务器正常{C.RESET}")
    else:
        print(f"   {C.RED}✗ 状态异常: {res.status_code}{C.RESET}")
except Exception as e:
    print(f"   {C.RED}✗ 连接失败: {e}{C.RESET}")
    exit(1)

# 2. 查看所有数据
print(f"\n{C.BLUE}2. 表数据概览{C.RESET}")
try:
    res = requests.get(f"{API_URL}/tasks", timeout=10)
    if res.status_code == 200:
        data = res.json()
        print(f"   {C.GREEN}✓ 查询成功{C.RESET}")
        print(f"   {C.GRAY}总记录数: {len(data)}{C.RESET}")

        if data:
            print(f"\n   {C.BOLD}字段列表:{C.RESET}")
            first_record = data[0]
            for key in first_record.keys():
                val = first_record[key]
                val_type = type(val).__name__
                if isinstance(val, (dict, list)):
                    val_str = f"{val_type}({len(val)} items)"
                else:
                    val_str = str(val)[:50]
                print(f"   {C.CYAN}{key}{C.RESET}: {C.GRAY}{val_str}{C.RESET}")

            print(f"\n   {C.BOLD}最近 3 条记录:{C.RESET}")
            for i, record in enumerate(data[:3]):
                print(f"   {i+1}. ID={record.get('id')} | {record.get('filename', 'N/A')} | {record.get('created_at', '')[:19]}")
    else:
        print(f"   {C.RED}✗ 查询失败: {res.status_code}{C.RESET}")
except Exception as e:
    print(f"   {C.RED}✗ 错误: {e}{C.RESET}")

print(f"\n{C.GRAY}{'─' * 50}{C.RESET}\n")
