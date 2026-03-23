import requests

API_URL = "http://localhost:3001/api"

# 终端颜色
class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

print(f"\n{Color.BOLD}{Color.CYAN}测试 API 连接{Color.RESET}")
print(f"{Color.GRAY}{'─' * 40}{Color.RESET}\n")

# 1. 健康检查
print(f"{Color.BLUE}1. 健康检查{Color.RESET}")
try:
    res = requests.get(f"{API_URL}/health", timeout=5)
    if res.status_code == 200:
        print(f"   {Color.GREEN}✓ 连接正常{Color.RESET}")
        print(f"   {Color.GRAY}响应: {res.json()}{Color.RESET}")
    else:
        print(f"   {Color.YELLOW}⚠ 状态异常: {res.status_code}{Color.RESET}")
except Exception as e:
    print(f"   {Color.RED}✗ 连接失败: {e}{Color.RESET}")

# 2. 获取所有数据
print(f"\n{Color.BLUE}2. 获取所有任务{Color.RESET}")
try:
    res = requests.get(f"{API_URL}/tasks", timeout=5)
    data = res.json()
    print(f"   {Color.GREEN}✓ 查询成功{Color.RESET}")
    print(f"   {Color.GRAY}数量: {len(data)} 条记录{Color.RESET}")
except Exception as e:
    print(f"   {Color.RED}✗ 查询失败: {e}{Color.RESET}")

# 3. 插入测试数据
print(f"\n{Color.BLUE}3. 插入测试数据{Color.RESET}")
try:
    res = requests.post(
        f"{API_URL}/tasks",
        json={"data": {"test": True, "message": "测试数据", "time": "2024-01-01"}},
        timeout=5
    )
    result = res.json()
    if result.get('success'):
        print(f"   {Color.GREEN}✓ 插入成功{Color.RESET}")
        print(f"   {Color.GRAY}ID: {result.get('id')}{Color.RESET}")
    else:
        print(f"   {Color.YELLOW}⚠ 插入返回: {result}{Color.RESET}")
except Exception as e:
    print(f"   {Color.RED}✗ 插入失败: {e}{Color.RESET}")

print(f"\n{Color.GRAY}{'─' * 40}{Color.RESET}\n")
