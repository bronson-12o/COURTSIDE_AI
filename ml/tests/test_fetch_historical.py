import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fetch_historical import validate_rows

class TestHistoricalImport(unittest.TestCase):
    def test_accepts_valid_game(self):
        self.assertEqual(len(validate_rows([("2025-01-01","UTA","DEN",115,108)])),1)
    def test_rejects_duplicate(self):
        row=("2025-01-01","UTA","DEN",115,108)
        with self.assertRaisesRegex(ValueError,"Duplicate"):
            validate_rows([row,row])
    def test_rejects_tie(self):
        with self.assertRaisesRegex(ValueError,"Invalid completed"):
            validate_rows([("2025-01-01","UTA","DEN",100,100)])
