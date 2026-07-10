import type { ProductCustomColumn, ProductLine, ProductRiskSection, ProductTableLayout, ProductTableLayouts, ProductWarranty } from '../types'
import { resolveProductLine } from './productWarrantyHelpers'

export const BUILTIN_COLUMN_IDS = ['perforation', 'peelFlake', 'colorFading', 'chalk'] as const
export type BuiltinColumnId = (typeof BUILTIN_COLUMN_IDS)[number]

export type ColumnHeaderUpdateField = 'titleEn' | 'titleKo' | `sub:${number}`

export interface ColumnHeaderLabel {
  titleEn: string
  titleKo: string
  subColumns?: string[]
}

export const DEFAULT_BUILTIN_LABELS: Record<BuiltinColumnId, ColumnHeaderLabel> = {
  perforation: { titleEn: 'PERFORATION', titleKo: '천공' },
  peelFlake: { titleEn: 'PEEL/FLAKE', titleKo: '도막박리' },
  colorFading: {
    titleEn: 'COLOR FADING',
    titleKo: '변색/탈색',
    subColumns: ['기간', 'ROOF', 'WALL'],
  },
  chalk: {
    titleEn: 'CHALK',
    titleKo: '백화/묻어남',
    subColumns: ['기간', 'ROOF', 'WALL'],
  },
}

export const DEFAULT_PRODUCT_TABLE_LAYOUT: ProductTableLayout = {
  columnOrder: [...BUILTIN_COLUMN_IDS],
  customColumns: [],
  builtinLabels: { ...DEFAULT_BUILTIN_LABELS },
}

export function isBuiltinColumnId(id: string): id is BuiltinColumnId {
  return (BUILTIN_COLUMN_IDS as readonly string[]).includes(id)
}

export function isCustomColumnId(id: string): boolean {
  return id.startsWith('custom:')
}

export function resolveProductTableLayout(layout?: ProductTableLayout): ProductTableLayout {
  if (!layout?.columnOrder?.length) return DEFAULT_PRODUCT_TABLE_LAYOUT

  const columnOrder = layout.columnOrder.filter(
    (id) => isBuiltinColumnId(id) || isCustomColumnId(id)
  )
  const missingBuiltins = BUILTIN_COLUMN_IDS.filter((id) => !columnOrder.includes(id))

  return {
    columnOrder: [...columnOrder, ...missingBuiltins],
    customColumns: layout.customColumns ?? [],
    builtinLabels: layout.builtinLabels,
  }
}

export function resolveProductTableLayouts(
  layouts?: ProductTableLayouts,
  legacyLayout?: ProductTableLayout
): { paint: ProductTableLayout; print: ProductTableLayout } {
  const fallback = legacyLayout ?? layouts?.paint ?? layouts?.print
  return {
    paint: resolveProductTableLayout(layouts?.paint ?? fallback),
    print: resolveProductTableLayout(layouts?.print ?? fallback),
  }
}

export function getProductTableLayoutForLine(
  section: Pick<ProductRiskSection, 'productTableLayouts' | 'productTableLayout'>,
  line: ProductLine
): ProductTableLayout {
  return resolveProductTableLayouts(section.productTableLayouts, section.productTableLayout)[line]
}

export function withProductTableLayoutForLine(
  section: ProductRiskSection,
  line: ProductLine,
  layout: ProductTableLayout
): ProductRiskSection {
  const layouts = resolveProductTableLayouts(section.productTableLayouts, section.productTableLayout)
  const { productTableLayout: _legacy, ...rest } = section
  return {
    ...rest,
    productTableLayouts: {
      ...layouts,
      [line]: layout,
    },
  }
}

export function mapProductsForLine(
  products: ProductWarranty[],
  line: ProductLine,
  mapper: (product: ProductWarranty) => ProductWarranty
): ProductWarranty[] {
  return products.map((product) =>
    resolveProductLine(product) === line ? mapper(product) : product
  )
}

export function initCustomColumnOnProductsForLine(
  products: ProductWarranty[],
  line: ProductLine,
  columnId: string,
  kind: 'simple' | 'grouped',
  subColumns?: string[]
): ProductWarranty[] {
  return mapProductsForLine(products, line, (product) =>
    initCustomColumnOnProducts([product], columnId, kind, subColumns)[0]
  )
}

export function getBuiltinColumnLabel(
  layout: ProductTableLayout,
  columnId: BuiltinColumnId
): ColumnHeaderLabel {
  const defaults = DEFAULT_BUILTIN_LABELS[columnId]
  const stored = layout.builtinLabels?.[columnId]
  if (!stored) return { ...defaults, subColumns: [...(defaults.subColumns ?? [])] }
  return {
    titleEn: stored.titleEn ?? defaults.titleEn,
    titleKo: stored.titleKo ?? defaults.titleKo,
    subColumns: stored.subColumns?.length
      ? [...stored.subColumns]
      : [...(defaults.subColumns ?? [])],
  }
}

export function updateBuiltinColumnLabel(
  layout: ProductTableLayout,
  columnId: BuiltinColumnId,
  field: ColumnHeaderUpdateField,
  value: string
): ProductTableLayout {
  const current = getBuiltinColumnLabel(layout, columnId)
  const next: ColumnHeaderLabel = {
    ...current,
    subColumns: current.subColumns ? [...current.subColumns] : undefined,
  }

  if (field === 'titleEn') next.titleEn = value
  else if (field === 'titleKo') next.titleKo = value
  else if (field.startsWith('sub:') && next.subColumns) {
    const index = Number(field.slice(4))
    next.subColumns[index] = value
  }

  return {
    ...layout,
    builtinLabels: {
      ...layout.builtinLabels,
      [columnId]: next,
    },
  }
}

export function formatGroupHeaderTitle(label: ColumnHeaderLabel): string {
  const en = label.titleEn.trim()
  const ko = label.titleKo.trim()
  if (en && ko) return `${en} (${ko})`
  return en || ko || '\u00A0'
}

export function formatSimpleHeaderTitle(label: ColumnHeaderLabel): {
  primary: string
  secondary?: string
} {
  const en = label.titleEn.trim()
  const ko = label.titleKo.trim()
  if (en && ko) return { primary: en, secondary: `(${ko})` }
  if (ko) return { primary: ko }
  if (en) return { primary: en }
  return { primary: '\u00A0' }
}

export function customColumnToHeaderLabel(def: ProductCustomColumn): ColumnHeaderLabel {
  return {
    titleEn: def.titleEn,
    titleKo: def.titleKo,
    subColumns: def.subColumns ? [...def.subColumns] : undefined,
  }
}

export function getCustomColumnDef(
  layout: ProductTableLayout,
  columnId: string
): ProductCustomColumn | undefined {
  const customId = columnId.replace('custom:', '')
  return layout.customColumns.find((column) => column.id === customId)
}

export function createCustomColumn(kind: 'simple' | 'grouped' = 'simple'): ProductCustomColumn {
  const id = crypto.randomUUID()
  return {
    id,
    kind,
    titleEn: '',
    titleKo: '',
    subColumns: kind === 'grouped' ? ['기간', 'ROOF', 'WALL'] : undefined,
  }
}

export function createCustomColumnEntry(kind: 'simple' | 'grouped' = 'grouped'): {
  columnId: string
  def: ProductCustomColumn
} {
  const def = createCustomColumn(kind)
  return { columnId: `custom:${def.id}`, def }
}

export function getCustomColumnValue(
  product: ProductWarranty,
  columnId: string,
  subKey?: string
): string {
  const values = product.customColumnValues?.[columnId]
  if (values === undefined) return ''
  if (typeof values === 'string') return subKey ? '' : values
  if (subKey) return values[subKey] ?? ''
  return ''
}

export function setCustomColumnValue(
  product: ProductWarranty,
  columnId: string,
  value: string,
  subKey?: string
): ProductWarranty {
  const prev = product.customColumnValues ?? {}
  const current = prev[columnId]

  if (!subKey) {
    return { ...product, customColumnValues: { ...prev, [columnId]: value } }
  }

  const subs = typeof current === 'object' && current !== null ? { ...current } : {}
  subs[subKey] = value
  return { ...product, customColumnValues: { ...prev, [columnId]: subs } }
}

export function initCustomColumnOnProducts(
  products: ProductWarranty[],
  columnId: string,
  kind: 'simple' | 'grouped',
  subColumns?: string[]
): ProductWarranty[] {
  return products.map((product) => {
    const modes = product.customColumnModes ?? {}
    const withMode =
      kind === 'grouped' && modes[columnId] === undefined
        ? { ...product, customColumnModes: { ...modes, [columnId]: 'detail' as const } }
        : product

    if (withMode.customColumnValues?.[columnId] !== undefined) return withMode
    if (kind === 'simple') return setCustomColumnValue(withMode, columnId, '')

    const subs: Record<string, string> = {}
    for (const key of subColumns ?? []) subs[key] = ''
    return {
      ...withMode,
      customColumnValues: { ...withMode.customColumnValues, [columnId]: subs },
    }
  })
}

export function resolveCustomColumnMode(
  product: ProductWarranty,
  columnId: string
): 'detail' | 'merged' {
  return product.customColumnModes?.[columnId] ?? 'detail'
}

export function setCustomColumnMode(
  product: ProductWarranty,
  columnId: string,
  mode: 'detail' | 'merged'
): ProductWarranty {
  return {
    ...product,
    customColumnModes: { ...product.customColumnModes, [columnId]: mode },
  }
}

export function getCustomColumnToggleLabel(
  layout: ProductTableLayout,
  columnId: string
): string {
  const def = getCustomColumnDef(layout, columnId)
  if (!def) return '열'
  const label = def.titleKo.trim() || def.titleEn.trim()
  return label.length > 8 ? `${label.slice(0, 8)}…` : label || '열'
}

export function listGroupedCustomColumnIds(layout: ProductTableLayout): string[] {
  return layout.columnOrder.filter((columnId) => {
    if (!isCustomColumnId(columnId)) return false
    return getCustomColumnDef(layout, columnId)?.kind === 'grouped'
  })
}

export function formatCustomGroupHeaderTitle(def: ProductCustomColumn): string {
  return formatGroupHeaderTitle(customColumnToHeaderLabel(def))
}

export function formatCustomSimpleHeaderTitle(def: ProductCustomColumn): {
  primary: string
  secondary?: string
} {
  return formatSimpleHeaderTitle(customColumnToHeaderLabel(def))
}

export function removeCustomColumnFromLayout(
  layout: ProductTableLayout,
  columnId: string
): ProductTableLayout {
  const customId = columnId.replace('custom:', '')
  return {
    columnOrder: layout.columnOrder.filter((id) => id !== columnId),
    customColumns: layout.customColumns.filter((column) => column.id !== customId),
    builtinLabels: layout.builtinLabels,
  }
}

export function removeCustomColumnFromProduct(
  product: ProductWarranty,
  columnId: string
): ProductWarranty {
  const values = { ...product.customColumnValues }
  delete values[columnId]
  const modes = { ...product.customColumnModes }
  delete modes[columnId]
  return { ...product, customColumnValues: values, customColumnModes: modes }
}

export function changeCustomColumnKind(
  layout: ProductTableLayout,
  columnId: string,
  kind: 'simple' | 'grouped'
): ProductTableLayout {
  const customId = columnId.replace('custom:', '')
  const customColumns = layout.customColumns.map((column) => {
    if (column.id !== customId) return column
    if (kind === 'grouped') {
      return {
        ...column,
        kind,
        subColumns: column.subColumns?.length ? column.subColumns : ['기간', 'ROOF', 'WALL'],
      }
    }
    return { ...column, kind, subColumns: undefined }
  })
  return { ...layout, customColumns }
}

export function migrateProductCustomColumnKind(
  product: ProductWarranty,
  columnId: string,
  kind: 'simple' | 'grouped',
  subColumns?: string[]
): ProductWarranty {
  const current = product.customColumnValues?.[columnId]
  const modes = { ...(product.customColumnModes ?? {}) }

  if (kind === 'simple') {
    delete modes[columnId]
    const merged =
      typeof current === 'string'
        ? current
        : typeof current === 'object' && current
          ? Object.values(current).find((value) => value.trim()) ?? ''
          : ''
    return {
      ...product,
      customColumnModes: modes,
      customColumnValues: { ...product.customColumnValues, [columnId]: merged },
    }
  }

  const subs: Record<string, string> = {}
  for (const key of subColumns ?? []) {
    if (typeof current === 'object' && current && key in current) {
      subs[key] = current[key]
    } else if (typeof current === 'string' && key === (subColumns?.[0] ?? '기간')) {
      subs[key] = current
    } else {
      subs[key] = ''
    }
  }
  return {
    ...product,
    customColumnModes: { ...modes, [columnId]: modes[columnId] ?? 'detail' },
    customColumnValues: { ...product.customColumnValues, [columnId]: subs },
  }
}

export function addCustomSubColumn(
  layout: ProductTableLayout,
  columnId: string,
  label = '열'
): ProductTableLayout {
  const customId = columnId.replace('custom:', '')
  const customColumns = layout.customColumns.map((column) => {
    if (column.id !== customId || column.kind !== 'grouped') return column
    return { ...column, subColumns: [...(column.subColumns ?? []), label] }
  })
  return { ...layout, customColumns }
}

export function removeCustomSubColumn(
  layout: ProductTableLayout,
  columnId: string,
  subIndex: number
): { layout: ProductTableLayout; removedKey: string } | null {
  const customId = columnId.replace('custom:', '')
  const def = getCustomColumnDef(layout, columnId)
  if (!def || def.kind !== 'grouped' || (def.subColumns?.length ?? 0) <= 1) return null

  const removedKey = def.subColumns![subIndex]
  const customColumns = layout.customColumns.map((column) => {
    if (column.id !== customId) return column
    const subColumns = [...(column.subColumns ?? [])]
    subColumns.splice(subIndex, 1)
    return { ...column, subColumns }
  })
  return { layout: { ...layout, customColumns }, removedKey }
}

export function addCustomSubColumnOnProducts(
  products: ProductWarranty[],
  columnId: string,
  label: string
): ProductWarranty[] {
  return products.map((product) => {
    const current = product.customColumnValues?.[columnId]
    if (typeof current !== 'object' || current === null) return product
    return {
      ...product,
      customColumnValues: { ...product.customColumnValues, [columnId]: { ...current, [label]: '' } },
    }
  })
}

export function removeCustomSubColumnOnProducts(
  products: ProductWarranty[],
  columnId: string,
  subKey: string
): ProductWarranty[] {
  return products.map((product) => {
    const current = product.customColumnValues?.[columnId]
    if (typeof current !== 'object' || current === null) return product
    const next = { ...current }
    delete next[subKey]
    return { ...product, customColumnValues: { ...product.customColumnValues, [columnId]: next } }
  })
}

export function countLayoutHeaderColumns(layout: ProductTableLayout): number {
  let count = 1
  for (const id of layout.columnOrder) {
    if (isBuiltinColumnId(id)) {
      if (id === 'colorFading' || id === 'chalk') count += 3
      else count += 1
      continue
    }
    const def = getCustomColumnDef(layout, id)
    count += def?.kind === 'grouped' ? (def.subColumns?.length ?? 3) : 1
  }
  return count
}
