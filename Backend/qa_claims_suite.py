import httpx
import json
from config import Settings

settings = Settings()
BASE_URL = "http://localhost:8000/api/v1"

SETUP_DATA = {
    "tokens": {
        "admin": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZmUzOTg1NS0wOTg3LTQ5NDEtYTQ2NC1kMDgyMTIxYWRhM2EiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMzQ1NTIzLCJleHAiOjE3OTIzNDczMjMsInB3ZiI6IjQ2OTFkOGVkMWUwMWMwYjgifQ.zH4Zl0PhcXIiqo3UC4M78d_EBv7uOUoyBvRNWOIYF4c",
        "reporter": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZDI1Y2QxMS0zYzdmLTRhMzktOTkzOS04NzBmZTQwZWI4MDkiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMzQ1NTI2LCJleHAiOjE3OTIzNDczMjYsInB3ZiI6IjA4ZWFjMmM5Y2FhODkzYzQifQ.665w_wg2T1a50LPkTt9guuJZtz74G2rrFp1LNEGubFM",
        "claimant1": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OWM1NDAxZS1lYjhhLTRmNDYtYTc2Zi03MTAxYTRkYmIxNDUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMzQ1NTMzLCJleHAiOjE3OTIzNDczMzMsInB3ZiI6ImM2MzQ5NzhlOWM0OGYxZGEifQ.LV9cCSLdKxzr8ZZxerqcFouHOxRrkNjPgyrexdTHIs0",
        "claimant2": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzk2MTRlNC1mOTcxLTQ3NzYtOTNlZC1jZDY1YjE0NzNhMTIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMzQ1NTM2LCJleHAiOjE3OTIzNDczMzYsInB3ZiI6IjBhYTk5YjNhOWJmOTMyZGMifQ.ccqmnzxAvIfRndMqIwBJB48vzorZz9YMRGt-Tmtx93M",
        "unauth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFhOWRhNC03YTAyLTQxZjUtOGIzMS0yNGQ0YzAwNDU0NDQiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkyMzQ1NTQwLCJleHAiOjE3OTIzNDczNDAsInB3ZiI6IjIwYmRhZDJmODJjNTdmNmIifQ.ARsQ7LlD1DoDDx_yV1HXqrGwbWjHQiay1IDR2nm99qk"
    },
    "items": {
        "found_open": "8e65c4a6-92c6-4e6e-a34d-876b84d32514",
        "lost_open": "b4c9f39a-8b71-4873-b6be-7d5501154af2",
        "found_closed": "7850a52e-5e99-4e0e-a7bb-0ca3027f4f69"
    }
}

def request(method, path, token=None, json_data=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    with httpx.Client(base_url=BASE_URL) as client:
        try:
            resp = client.request(method, path, headers=headers, json=json_data)
            return resp.status_code, resp.text
        except Exception as e:
            return 500, str(e)

def run_test(case_id, description, method, path, token, json_data, expected_status):
    print(f"Running {case_id}: {description}")
    status, response = request(method, path, token, json_data)
    result = "PASS" if status == expected_status else "FAIL"
    print(f"  Input: {json_data}")
    print(f"  Actual Status: {status}")
    print(f"  Expected Status: {expected_status}")
    print(f"  Response: {response}")
    print(f"  Result: {result}")
    print("-" * 20)
    return {"id": case_id, "result": result, "actual": status, "expected": expected_status, "response": response}

def main():
    results = []
    tokens = SETUP_DATA["tokens"]
    items = SETUP_DATA["items"]

    # --- SUCCESS PATHS ---
    sp1_status, sp1_resp = request("POST", f"/items/{items['found_open']}/claims", tokens["claimant1"], {"ownership_proof": "I have the original receipt and a photo of the watch"})
    sp1_result = "PASS" if sp1_status == 201 else "FAIL"
    print(f"Running SP-1: Create claim on found open item\n  Actual Status: {sp1_status}\n  Expected Status: 201\n  Result: {sp1_result}\n" + "-"*20)
    results.append({"id": "SP-1", "result": sp1_result, "actual": sp1_status, "expected": 201, "response": sp1_resp})

    claim1_id = json.loads(sp1_resp)["id"] if sp1_status == 201 else None

    sp2 = run_test("SP-2", "View own claims", "GET", "/claims/my-claims", tokens["claimant1"], None, 200)
    results.append(sp2)

    if claim1_id:
        sp3 = run_test("SP-3", "View specific claim (claimant)", "GET", f"/claims/{claim1_id}", tokens["claimant1"], None, 200)
        results.append(sp3)
    else:
        results.append({"id": "SP-3", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    sp4 = run_test("SP-4", "View claims for an item (reporter)", "GET", f"/items/{items['found_open']}/claims", tokens["reporter"], None, 200)
    results.append(sp4)

    if claim1_id:
        sp5 = run_test("SP-5", "Review claim (Approve)", "PATCH", f"/claims/{claim1_id}/review", tokens["reporter"], {"status": "approved", "review_note": "Proof looks genuine"}, 200)
        results.append(sp5)
    else:
        results.append({"id": "SP-5", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    if claim1_id:
        sp6 = run_test("SP-6", "View claim with contact info (Approved)", "GET", f"/claims/{claim1_id}", tokens["claimant1"], None, 200)
        results.append(sp6)
    else:
        results.append({"id": "SP-6", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    if claim1_id:
        sp7 = run_test("SP-7", "Admin view claim", "GET", f"/claims/{claim1_id}", tokens["admin"], None, 200)
        results.append(sp7)
    else:
        results.append({"id": "SP-7", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    # --- VALIDATION ERRORS ---
    ve1 = run_test("VE-1", "Ownership proof too short", "POST", f"/items/{items['found_open']}/claims", tokens["claimant2"], {"ownership_proof": "too short"}, 422)
    results.append(ve1)

    ve2 = run_test("VE-2", "Ownership proof too long", "POST", f"/items/{items['found_open']}/claims", tokens["claimant2"], {"ownership_proof": "a" * 2001}, 422)
    results.append(ve2)

    ve3 = run_test("VE-3", "Claiming a lost item", "POST", f"/items/{items['lost_open']}/claims", tokens["claimant2"], {"ownership_proof": "I lost it!"}, 409)
    results.append(ve3)

    ve4 = run_test("VE-4", "Claiming a closed item", "POST", f"/items/{items['found_closed']}/claims", tokens["claimant2"], {"ownership_proof": "It is mine"}, 409)
    results.append(ve4)

    ve5 = run_test("VE-5", "Claiming own item", "POST", f"/items/{items['found_open']}/claims", tokens["reporter"], {"ownership_proof": "I know it's mine"}, 409)
    results.append(ve5)

    # --- AUTHORIZATION FAILURES ---
    af1 = run_test("AF-1", "Create claim without token", "POST", f"/items/{items['found_open']}/claims", None, {"ownership_proof": "Proof"}, 401)
    results.append(af1)

    if claim1_id:
        af2 = run_test("AF-2", "View others claim (unauthorized)", "GET", f"/claims/{claim1_id}", tokens["unauth"], None, 403)
        results.append(af2)
    else:
        results.append({"id": "AF-2", "result": "SKIP", "actual": None, "expected": 403, "response": "No claim ID"})

    af3 = run_test("AF-3", "View claims for item (unauthorized)", "GET", f"/items/{items['found_open']}/claims", tokens["unauth"], None, 403)
    results.append(af3)

    if claim1_id:
        af4 = run_test("AF-4", "Review claim (unauthorized user)", "PATCH", f"/claims/{claim1_id}/review", tokens["claimant2"], {"status": "approved"}, 403)
        results.append(af4)
    else:
        results.append({"id": "AF-4", "result": "SKIP", "actual": None, "expected": 403, "response": "No claim ID"})

    if claim1_id:
        af5 = run_test("AF-5", "Review own claim (claimant)", "PATCH", f"/claims/{claim1_id}/review", tokens["claimant1"], {"status": "approved"}, 403)
        results.append(af5)
    else:
        results.append({"id": "AF-5", "result": "SKIP", "actual": None, "expected": 403, "response": "No claim ID"})

    if claim1_id:
        af6 = run_test("AF-6", "Delete others claim", "DELETE", f"/claims/{claim1_id}", tokens["claimant2"], None, 403)
        results.append(af6)
    else:
        results.append({"id": "AF-6", "result": "SKIP", "actual": None, "expected": 403, "response": "No claim ID"})

    # --- STATE CONFLICTS ---
    sc1 = run_test("SC-1", "Duplicate claim (same user, same item)", "POST", f"/items/{items['found_open']}/claims", tokens["claimant1"], {"ownership_proof": "Second proof"}, 409)
    results.append(sc1)

    if claim1_id:
        sc2 = run_test("SC-2", "Review already reviewed claim", "PATCH", f"/claims/{claim1_id}/review", tokens["reporter"], {"status": "rejected"}, 409)
        results.append(sc2)
    else:
        results.append({"id": "SC-2", "result": "SKIP", "actual": None, "expected": 409, "response": "No claim ID"})

    if claim1_id:
        sc3 = run_test("SC-3", "Delete reviewed claim", "DELETE", f"/claims/{claim1_id}", tokens["claimant1"], None, 409)
        results.append(sc3)
    else:
        results.append({"id": "SC-3", "result": "SKIP", "actual": None, "expected": 409, "response": "No claim ID"})

    # --- VISIBILITY & PRIVACY ---
    if claim1_id:
        vp1_status, vp1_resp = request("GET", f"/claims/{claim1_id}", tokens["claimant1"])
        vp1_result = "PASS" if "ownership_proof" in vp1_resp and vp1_status == 200 else "FAIL"
        print(f"Running VP-1: Proof visible to claimant\n  Actual Status: {vp1_status}\n  Result: {vp1_result}\n" + "-"*20)
        results.append({"id": "VP-1", "result": vp1_result, "actual": vp1_status, "expected": 200, "response": vp1_resp})
    else:
        results.append({"id": "VP-1", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    if claim1_id:
        vp2_status, vp2_resp = request("GET", f"/claims/{claim1_id}", tokens["reporter"])
        vp2_result = "PASS" if "ownership_proof" in vp2_resp and vp2_status == 200 else "FAIL"
        print(f"Running VP-2: Proof visible to reporter\n  Actual Status: {vp2_status}\n  Result: {vp2_result}\n" + "-"*20)
        results.append({"id": "VP-2", "result": vp2_result, "actual": vp2_status, "expected": 200, "response": vp2_resp})
    else:
        results.append({"id": "VP-2", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID the proof is hidden"})

    if claim1_id:
        vp3_status, vp3_resp = request("GET", f"/claims/{claim1_id}", tokens["admin"])
        vp3_result = "PASS" if "ownership_proof" in vp3_resp and vp3_status == 200 else "FAIL"
        print(f"Running VP-3: Proof visible to admin\n  Actual Status: {vp3_status}\n  Result: {vp3_result}\n" + "-"*20)
        results.append({"id": "VP-3", "result": vp3_result, "actual": vp3_status, "expected": 200, "response": vp3_resp})
    else:
        results.append({"id": "VP-3", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    if claim1_id:
        vp4_status, vp4_resp = request("GET", f"/claims/{claim1_id}", tokens["claimant2"])
        vp4_result = "PASS" if vp4_status == 403 else "FAIL"
        print(f"Running VP-4: Proof hidden from others\n  Actual Status: {vp4_status}\n  Expected Status: 403\n  Result: {vp4_result}\n" + "-"*20)
        results.append({"id": "VP-4", "result": vp4_result, "actual": vp4_status, "expected": 403, "response": vp4_resp})
    else:
        results.append({"id": "VP-4", "result": "SKIP", "actual": None, "expected": 403, "response": "No claim ID"})

    if claim1_id:
        vp5_status, vp5_resp = request("GET", f"/claims/{claim1_id}", tokens["claimant1"])
        vp5_result = "PASS" if "counterparty_contact" in vp5_resp and vp5_status == 200 else "FAIL"
        print(f"Running VP-5: Contact info visible after approval\n  Actual Status: {vp5_status}\n  Result: {vp5_result}\n" + "-"*20)
        results.append({"id": "VP-5", "result": vp5_result, "actual": vp5_status, "expected": 200, "response": vp5_resp})
    else:
        results.append({"id": "VP-5", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    if claim1_id:
        vp6_status, vp6_resp = request("GET", f"/claims/{claim1_id}", tokens["admin"])
        vp6_result = "PASS" if "counterparty_contact" not in vp6_resp and vp6_status == 200 else "FAIL"
        print(f"Running VP-6: Contact info hidden from admin\n  Actual Status: {vp6_status}\n  Result: {vp6_result}\n" + "-"*20)
        results.append({"id": "VP-6", "result": vp6_result, "actual": vp6_status, "expected": 200, "response": vp6_resp})
    else:
        results.append({"id": "VP-6", "result": "SKIP", "actual": None, "expected": 200, "response": "No claim ID"})

    print("\n--- FINAL REPORT ---")
    total = len(results)
    passed = len([r for r in results if r["result"] == "PASS"])
    failed = len([r for r in results if r["result"] == "FAIL"])
    skipped = len([r for r in results if r["result"] == "SKIP"])

    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")

    for r in results:
        print(f"{r['id']}: {r['result']} (Actual: {r['actual']}, Expected: {r['expected']})")

if __name__ == "__main__":
    main()
