#!/usr/bin/env python3
"""Generate warrantyPeriod.json from parsed Excel rows."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_warranty_excel import read_xlsx


def clean(value: str | None) -> str:
    if value is None:
        return ''
    text = str(value).replace('\r\n', '\n').strip()
    text = re.sub(r'\n +', '\n', text)
    text = re.sub(r' +', ' ', text)
    return text


def normalize_warranty_value(value: str) -> str:
    value = clean(value)
    if value == '보증불가':
        return '보증 불가'
    if value == '측정불가':
        return '측정불가'
    return value


def parse_product_row(row: list[str], line: str) -> dict | None:
    cells = [clean(c) for c in row]
    while len(cells) < 14:
        cells.append('')

    group = cells[1]
    if not group or group.lower() in {'paint', 'print', '제품군'}:
        return None

    peel = normalize_warranty_value(cells[3])
    perforation = normalize_warranty_value(cells[5])
    color_period = normalize_warranty_value(cells[8])
    color_roof = normalize_warranty_value(cells[9])
    color_wall = normalize_warranty_value(cells[10])
    chalk_period = normalize_warranty_value(cells[11])
    chalk_roof = normalize_warranty_value(cells[12])
    chalk_wall = normalize_warranty_value(cells[13])

    color_merged = color_period in {'보증 불가', '측정불가', 'N/A'} or (
        not color_roof and not color_wall
    )
    chalk_merged = chalk_period in {'보증 불가', '측정불가', 'N/A'} or (
        not chalk_roof and not chalk_wall
    )

    if line == 'print' and '\n' not in group and 'PRINT' not in group.upper():
        resin, _, coat = group.partition('\n')
        if coat:
            group = f'{resin}\n{coat}'

    product = {
        'productGroup': group,
        'productLine': line,
        'peelFlake': peel,
        'perforation': perforation,
        'colorFadingMode': 'merged' if color_merged else 'detail',
        'chalkMode': 'merged' if chalk_merged else 'detail',
        'colorFading': color_period,
        'colorFadingRoof': '' if color_merged else color_roof,
        'colorFadingWall': '' if color_merged else color_wall,
        'chalk': chalk_period,
        'chalkRoof': '' if chalk_merged else chalk_roof,
        'chalkWall': '' if chalk_merged else chalk_wall,
        'notes': '',
    }
    return product


def detect_line_marker(row: list[str]) -> str | None:
    cells = [clean(c).lower() for c in row[:3]]
    for cell in cells:
        if cell in {'paint', 'print'}:
            return cell
    return None


def parse_products(rows: list[list[str]]) -> list[dict]:
    products: list[dict] = []
    current_line = 'paint'

    for row in rows:
        marker = detect_line_marker(row)
        if marker:
            current_line = marker
            continue

        product = parse_product_row(row, current_line)
        if product:
            products.append(product)

    return products


def parse_coastal_side(row: list[str], start: int) -> tuple[str, str, str, str]:
    cells = [clean(c) for c in row]
    while len(cells) <= start + 3:
        cells.append('')
    distance = cells[start]
    coat2 = normalize_warranty_value(cells[start + 2])
    coat3 = normalize_warranty_value(cells[start + 3])
    note = clean(cells[start + 4])
    if coat2 == 'NO Warranty':
        coat2 = 'NO Warranty'
    return distance, coat2, coat3, note


def normalize_distance(value: str) -> str:
    value = clean(value)
    replacements = {
        '0~500M': '0 ~ 500 M',
        '500~1000M': '500 ~ 1,000 M',
        '1000~5000M': '1,000 ~ 5,000 M',
        '5000M 이상': '5,000 M 이상',
    }
    return replacements.get(value, value)


def parse_coastal(rows: list[list[str]]) -> dict:
    high_rows = []
    low_rows = []
    high_note = ''
    low_note = ''

    for row in rows[1:]:
        distance_h, coat2_h, coat3_h, note_h = parse_coastal_side(row, 0)
        distance_l, coat2_l, coat3_l, note_l = parse_coastal_side(row, 8)

        if note_h:
            high_note = note_h.replace('CHALK ROOF/WALL', 'CHALK\nROOF / WALL')
        if note_l:
            low_note = note_l.replace('CHALK ROOF/WALL', 'CHALK\nROOF / WALL')

        if distance_h:
            high_rows.append(
                {
                    'distance': normalize_distance(distance_h),
                    'coat2': coat2_h,
                    'coat3': coat3_h,
                }
            )
        if distance_l:
            low_rows.append(
                {
                    'distance': normalize_distance(distance_l),
                    'coat2': coat2_l,
                    'coat3': coat3_l,
                }
            )

    return {
        'title': 'AL 소재 적용 불소 제품 (해안 거리별 보증)',
        'highRisk': {
            'rows': high_rows,
            'colorFadingRoof': '≤ΔE5',
            'colorFadingWall': '≤ΔE5',
            'chalkRoof': '≥#8',
            'chalkWall': '≥#8',
        },
        'lowRisk': {
            'rows': low_rows,
            'colorFadingRoof': '≤ΔE5',
            'colorFadingWall': '≤ΔE5',
            'chalkRoof': '≥#8',
            'chalkWall': '≥#8',
        },
    }


def build_data(excel_path: str) -> dict:
    sheets = read_xlsx(excel_path)
    current_path = Path(__file__).resolve().parent.parent / 'src/data/warrantyPeriod.json'
    current = json.loads(current_path.read_text(encoding='utf-8'))

    return {
        'highRisk': {
            **current['highRisk'],
            'products': parse_products(sheets['고위험국가']),
        },
        'lowRisk': {
            **current['lowRisk'],
            'products': parse_products(sheets['저위험국가']),
        },
        'coastalAl': parse_coastal(sheets['al 소재 불소 제품']),
        'notCovered': current['notCovered'],
    }


def main() -> None:
    excel_path = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / 'Downloads' / '보증 연한.xlsx')
    data = build_data(excel_path)
    output = Path(__file__).resolve().parent.parent / 'src/data/warrantyPeriod.json'
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {output}')
    print(f"High risk products: {len(data['highRisk']['products'])}")
    print(f"Low risk products: {len(data['lowRisk']['products'])}")


if __name__ == '__main__':
    main()
