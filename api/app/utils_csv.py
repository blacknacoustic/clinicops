import csv, io
from typing import List, Dict

def sniff_headers(file_bytes: bytes) -> List[str]:
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))
    headers = next(reader, [])
    return [h.strip() for h in headers]

def parse_rows(file_bytes: bytes) -> List[Dict[str, str]]:
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return [{(k or "").strip(): (v.strip() if isinstance(v, str) else v) for k, v in row.items()} for row in reader]