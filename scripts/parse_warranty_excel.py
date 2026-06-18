#!/usr/bin/env python3
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL_NS = '{http://schemas.openxmlformats.org/package/2006/relationships}'


def read_xlsx(path: str) -> dict:
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall('.//m:si', NS):
                texts = [t.text or '' for t in si.findall('.//m:t', NS)]
                shared.append(''.join(texts))

        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {
            rel.get('Id'): rel.get('Target')
            for rel in rels.findall(f'{REL_NS}Relationship')
        }

        sheets: dict[str, list[list[str]]] = {}
        for sheet in workbook.findall('.//m:sheet', NS):
            name = sheet.get('name') or 'Sheet'
            rel_id = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            target = rel_map[rel_id]
            sheet_path = target if target.startswith('xl/') else f'xl/{target.lstrip("/")}'
            root = ET.fromstring(z.read(sheet_path))
            rows: list[list[str]] = []
            for row in root.findall('.//m:sheetData/m:row', NS):
                cells: list[str] = []
                for cell in row.findall('m:c', NS):
                    cell_type = cell.get('t')
                    value = cell.find('m:v', NS)
                    if value is None or value.text is None:
                        cells.append('')
                    elif cell_type == 's':
                        cells.append(shared[int(value.text)])
                    else:
                        cells.append(value.text)
                if any(str(cell).strip() for cell in cells):
                    rows.append(cells)
            sheets[name] = rows
        return sheets


def main() -> None:
    input_path = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / 'Downloads' / '보증 연한.xlsx')
    output_path = Path(__file__).resolve().parent.parent / 'src/data/warrantyPeriodFromExcel.json'
    sheets = read_xlsx(input_path)
    payload = {'source': input_path, 'parser': 'zipfile+xml', 'sheets': sheets}
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {output_path}')
    for name, rows in sheets.items():
        print(f'\n=== {name} ({len(rows)} rows) ===')
        for index, row in enumerate(rows, start=1):
            print(index, row)


if __name__ == '__main__':
    main()
