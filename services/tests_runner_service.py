import os
import json
import unittest
import requests
from io import StringIO

from services.constant_service import TESTS_FILE, TEST_RESULTS_FILE


class DynamicImposterTests(unittest.TestCase):
    pass

class TestRunnerService:
    def __init__(self, suite_path=TESTS_FILE, results_path=TEST_RESULTS_FILE):
        self.suite_path = suite_path
        self.results_path = results_path

    def _load_test_cases(self):
        if not os.path.exists(self.suite_path):
            raise FileNotFoundError(f"❌ Test suite file not found: {self.suite_path}")
        with open(self.suite_path, "r") as f:
            return json.load(f)

    def _create_test_function(self, test_case):
        def test(self):
            test._test_meta_name = test_case["name"]
            method = test_case["method"]
            url = test_case["url"]
            headers = test_case.get("headers", {})
            body = test_case.get("body", {})
            expected_code = test_case["expected_code"]
            expected_text = test_case["expected_text"]

            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                if "json" in headers.get("Content-Type", ""):
                    response = requests.post(url, headers=headers, json=body)
                else:
                    response = requests.post(url, headers=headers, json=body)
            else:
                self.fail(f"Unsupported HTTP method: {method}")

            self.assertEqual(response.status_code, expected_code)
            self.assertEqual(response.text, expected_text)
        return test

    def _inject_tests(self, cases):
        for attr in list(DynamicImposterTests.__dict__):
            if attr.startswith("test_"):
                delattr(DynamicImposterTests, attr)
        for case in cases:
            func = self._create_test_function(case)
            setattr(DynamicImposterTests, case["name"], func)

    def run_tests(self):
        cases = self._load_test_cases()
        self._inject_tests(cases)

        suite = unittest.defaultTestLoader.loadTestsFromTestCase(DynamicImposterTests)
        result_stream = StringIO()
        runner = _JSONTestRunner(resultclass=_JSONTestResult, stream=result_stream, verbosity=2)
        result = runner.run(suite)

        if hasattr(result, "test_results"):
            with open(self.results_path, "w") as f:
                json.dump(result.test_results, f, indent=2)

        return result.test_results


class _JSONTestResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_results = []

    def addSuccess(self, test):
        self.test_results.append({"name": str(test).split(" ")[0], "status": "Pass"})

    def addFailure(self, test, err):
        self.test_results.append({
            "name": str(test).split(" ")[0],
            "status": "Fail",
            "error": self._exc_info_to_string(err, test)
        })

    def addError(self, test, err):
        self.test_results.append({
            "name": str(test).split(" ")[0],
            "status": "Error",
            "error": self._exc_info_to_string(err, test)
        })

class _JSONTestRunner(unittest.TextTestRunner):
    def run(self, test):
        return super().run(test)

if __name__ == "__main__":
    service = TestRunnerService()
    results = service.run_tests()
    print(json.dumps(results, indent=2))