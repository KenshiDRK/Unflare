import sys
import json
import requests

def main():
    # Leer el JSON desde stdin
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        return

    url = data.get("url")
    headers = data.get("headers", {})
    cookies = data.get("cookies", {})
    cookie_dict = {c['name']: c['value'] for c in cookies}

    if not url:
        print(json.dumps({"error": "Missing URL"}))
        return

    try:
        response = requests.get(url, headers=headers, cookies=cookie_dict, timeout=20)
        response.raise_for_status()
        print(json.dumps({"html": response.text}))
    except requests.RequestException as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()