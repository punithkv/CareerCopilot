
import json
import urllib.request
import urllib.error
import socket

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"
OLLAMA_URL = "http://127.0.0.1:11434"

results = []


def check(name, url, expected_status=200):
    try:
        request = urllib.request.Request(url, method="GET")

        with urllib.request.urlopen(request, timeout=10) as response:
            status = response.status

            if status == expected_status:
                print(f"[PASS] {name} - Status: {status}")
                results.append(True)
            else:
                print(f"[FAIL] {name} - Expected {expected_status}, got {status}")
                results.append(False)

    except urllib.error.HTTPError as error:
        print(f"[FAIL] {name} - HTTP Error: {error.code}")
        results.append(False)

    except (urllib.error.URLError, socket.timeout) as error:
        print(f"[FAIL] {name} - Connection error: {error}")
        results.append(False)

    except Exception as error:
        print(f"[FAIL] {name} - {error}")
        results.append(False)


def check_ollama_model():
    try:
        request = urllib.request.Request(f"{OLLAMA_URL}/api/tags")

        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

        models = [
            model.get("name", "")
            for model in data.get("models", [])
        ]

        if any("qwen2.5:3b" in model for model in models):
            print("[PASS] Ollama - qwen2.5:3b model is available")
            results.append(True)
        else:
            print("[FAIL] Ollama - qwen2.5:3b model not found")
            print("Available models:", models)
            results.append(False)

    except Exception as error:
        print(f"[FAIL] Ollama model check - {error}")
        results.append(False)


print("\n===================================")
print("       CAREERCOPILOT TEST")
print("===================================\n")

check("Backend root", f"{BACKEND_URL}/")
check("Backend health", f"{BACKEND_URL}/health")
check("Swagger documentation", f"{BACKEND_URL}/docs")
check("Frontend", FRONTEND_URL)
check_ollama_model()

print("\n===================================")
print("             SUMMARY")
print("===================================")

passed = sum(results)
failed = len(results) - passed

print(f"Total tests : {len(results)}")
print(f"Passed      : {passed}")
print(f"Failed      : {failed}")

if failed == 0:
    print("\nAll basic health checks passed!")
else:
    print("\nSome checks failed. Review the errors above.")
