import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { PageHeader, PageHeaderCautionIcon } from '../components/layout/PageHeader'
import { CountryGuideGrid } from '../components/warranty-period/CountryGuideGrid'
import { CoastalGuideTables } from '../components/warranty-period/CoastalGuideTables'
import { NotCoveredGuide } from '../components/warranty-period/NotCoveredGuide'
import {
  PeriodSection,
  PeriodSectionEditButton,
  CardSectionToolbar,
  type PeriodSectionId,
} from '../components/warranty-period/PeriodSection'
import { ProductGuideTable } from '../components/warranty-period/ProductGuideTable'
import { WarrantyGuideDownloadButton } from '../components/warranty-period/WarrantyGuideDownloadButton'
import { periodCardTitleClass, periodCautionNoticeClass, periodCautionRowClass } from '../components/warranty-period/periodTheme'
import { RiskBadge } from '../components/warranty-period/RiskBadge'
import { useAuth } from '../contexts/AuthContext'
import type {
  CoastalDistanceRow,
  CoastalSideSpecField,
  CountryEntry,
  ProductLine,
  ProductWarranty,
  WarrantyPeriodData,
} from '../types'
import { canEditWarrantyPeriod } from '../utils/authValidation'
import { resolveProductLine } from '../utils/productWarrantyHelpers'
import {
  applyPeriodSectionReset,
  productLineFromSection,
  riskTabFromProductSection,
} from '../utils/warrantyPeriodSectionHelpers'
import {
  addCustomSubColumn,
  addCustomSubColumnOnProducts,
  changeCustomColumnKind,
  createCustomColumnEntry,
  getCustomColumnDef,
  getProductTableLayoutForLine,
  mapProductsForLine,
  migrateProductCustomColumnKind,
  initCustomColumnOnProductsForLine,
  removeCustomColumnFromLayout,
  removeCustomColumnFromProduct,
  removeCustomSubColumn,
  removeCustomSubColumnOnProducts,
  setCustomColumnMode,
  setCustomColumnValue,
  updateBuiltinColumnLabel,
  withProductTableLayoutForLine,
  isBuiltinColumnId,
  type ColumnHeaderUpdateField,
} from '../utils/productTableLayoutHelpers'
import { loadWarrantyPeriod, saveWarrantyPeriod, createEmptyProductWarranty } from '../utils/warrantyPeriodStorage'

type PeriodTab = 'highRisk' | 'lowRisk' | 'coastalAl' | 'notCovered'

const tabs: { id: PeriodTab; label: string }[] = [
  { id: 'highRisk', label: '고위험 국가' },
  { id: 'lowRisk', label: '저위험 국가' },
  { id: 'coastalAl', label: 'AL 소재 불소 제품' },
  { id: 'notCovered', label: '보증 제외 대상' },
]

function filterProducts(products: ProductWarranty[]): { product: ProductWarranty; index: number }[] {
  return products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => {
      if (product.productGroup === '제품군') return false
      if (product.productGroup.includes('위 LIST')) return false
      if (product.productGroup === '유럽' && !product.peelFlake) return false
      return true
    })
}

function adjustIndexAfterReorder(
  currentIndex: number,
  fromIndex: number,
  toIndex: number
): number {
  if (currentIndex === fromIndex) return toIndex
  if (fromIndex < currentIndex && toIndex >= currentIndex) return currentIndex - 1
  if (fromIndex > currentIndex && toIndex <= currentIndex) return currentIndex + 1
  return currentIndex
}

type ProductHighlight = {
  section: 'highRisk:paint' | 'highRisk:print' | 'lowRisk:paint' | 'lowRisk:print'
  index: number
}
type ProductInsertAnchor = ProductHighlight
type ProductColumnInsertAnchor = {
  risk: 'highRisk' | 'lowRisk'
  productLine: ProductLine
  columnId: string
}
type CoastalInsertAnchor = { side: 'highRisk' | 'lowRisk'; index: number }

const PRODUCT_SECTIONS = new Set<PeriodSectionId>([
  'highRisk:paint',
  'highRisk:print',
  'lowRisk:paint',
  'lowRisk:print',
])

function createEmptyCoastalRow(): CoastalDistanceRow {
  return { distance: '', coat2: '', coat3: '' }
}

export function WarrantyPeriodPage() {
  const { user } = useAuth()
  const canEdit = canEditWarrantyPeriod(user?.email)
  const [data, setData] = useState<WarrantyPeriodData>(() => loadWarrantyPeriod())
  const [activeTab, setActiveTab] = useState<PeriodTab>('highRisk')
  const [editingSections, setEditingSections] = useState<Set<PeriodSectionId>>(new Set())
  const [sectionMessages, setSectionMessages] = useState<Partial<Record<PeriodSectionId, string>>>({})
  const [highlightedProduct, setHighlightedProduct] = useState<ProductHighlight | null>(null)
  const [highlightedNotCoveredIndex, setHighlightedNotCoveredIndex] = useState<number | null>(null)
  const [productHighlightSeq, setProductHighlightSeq] = useState(0)
  const [productAddTick, setProductAddTick] = useState(0)
  const [productInsertAnchor, setProductInsertAnchor] = useState<ProductInsertAnchor | null>(null)
  const [productColumnInsertAnchor, setProductColumnInsertAnchor] =
    useState<ProductColumnInsertAnchor | null>(null)
  const [notCoveredInsertAnchor, setNotCoveredInsertAnchor] = useState<number | null>(null)
  const [coastalInsertAnchor, setCoastalInsertAnchor] = useState<CoastalInsertAnchor | null>(null)

  const isSectionEditing = (sectionId: PeriodSectionId) => canEdit && editingSections.has(sectionId)
  const sectionMessage = (sectionId: PeriodSectionId) => sectionMessages[sectionId] ?? ''

  const clearSectionMessage = (sectionId: PeriodSectionId) => {
    setSectionMessages((prev) => {
      if (!prev[sectionId]) return prev
      const next = { ...prev }
      delete next[sectionId]
      return next
    })
  }

  const setSectionMessage = (sectionId: PeriodSectionId, message: string) => {
    setSectionMessages((prev) => ({ ...prev, [sectionId]: message }))
  }

  useEffect(() => {
    if (!canEdit && editingSections.size > 0) {
      setEditingSections(new Set())
    }
  }, [canEdit, editingSections.size])

  useEffect(() => {
    if (!highlightedProduct) return
    const timer = window.setTimeout(() => setHighlightedProduct(null), 5000)
    return () => clearTimeout(timer)
  }, [highlightedProduct])

  useEffect(() => {
    if (highlightedNotCoveredIndex === null) return
    const timer = window.setTimeout(() => setHighlightedNotCoveredIndex(null), 4000)
    return () => clearTimeout(timer)
  }, [highlightedNotCoveredIndex])

  const startSectionEdit = (sectionId: PeriodSectionId) => {
    if (!canEdit) return
    setEditingSections((prev) => new Set(prev).add(sectionId))
    if (PRODUCT_SECTIONS.has(sectionId)) {
      setProductInsertAnchor(null)
      setProductColumnInsertAnchor(null)
    }
    if (sectionId === 'notCovered') {
      setNotCoveredInsertAnchor(null)
    }
    if (sectionId === 'coastalAl:highRisk' || sectionId === 'coastalAl:lowRisk') {
      setCoastalInsertAnchor(null)
    }
    clearSectionMessage(sectionId)
  }

  const saveSection = (sectionId: PeriodSectionId) => {
    saveWarrantyPeriod(data)
    setEditingSections((prev) => {
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
    if (PRODUCT_SECTIONS.has(sectionId)) {
      setHighlightedProduct(null)
      setProductInsertAnchor(null)
      setProductColumnInsertAnchor(null)
    }
    if (sectionId === 'notCovered') {
      setHighlightedNotCoveredIndex(null)
      setNotCoveredInsertAnchor(null)
    }
    if (sectionId === 'coastalAl:highRisk' || sectionId === 'coastalAl:lowRisk') {
      setCoastalInsertAnchor(null)
    }
    setSectionMessage(sectionId, '저장되었습니다.')
    window.setTimeout(() => clearSectionMessage(sectionId), 3000)
  }

  const resetSection = (sectionId: PeriodSectionId) => {
    const saved = loadWarrantyPeriod()
    setData((prev) => applyPeriodSectionReset(prev, saved, sectionId))
    if (PRODUCT_SECTIONS.has(sectionId)) {
      setHighlightedProduct(null)
      setProductInsertAnchor(null)
      setProductColumnInsertAnchor(null)
    }
    if (sectionId === 'notCovered') {
      setHighlightedNotCoveredIndex(null)
      setNotCoveredInsertAnchor(null)
    }
    if (sectionId === 'coastalAl:highRisk' || sectionId === 'coastalAl:lowRisk') {
      setCoastalInsertAnchor(null)
    }
    setSectionMessage(sectionId, '초기화되었습니다.')
    window.setTimeout(() => clearSectionMessage(sectionId), 3000)
  }

  const handleSectionAdd = (sectionId: PeriodSectionId) => {
    if (sectionId === 'highRisk:paint' || sectionId === 'highRisk:print') {
      setProductAddTick((tick) => tick + 1)
      const atIndex =
        productInsertAnchor?.section === sectionId ? productInsertAnchor.index : undefined
      addProduct('highRisk', productLineFromSection(sectionId), atIndex, sectionId)
      return
    }
    if (sectionId === 'lowRisk:paint' || sectionId === 'lowRisk:print') {
      setProductAddTick((tick) => tick + 1)
      const atIndex =
        productInsertAnchor?.section === sectionId ? productInsertAnchor.index : undefined
      addProduct('lowRisk', productLineFromSection(sectionId), atIndex, sectionId)
      return
    }
    if (sectionId === 'notCovered') {
      addNotCoveredItem(notCoveredInsertAnchor ?? undefined)
      return
    }
    if (sectionId === 'highRisk:countries') {
      addCountry('highRisk')
      return
    }
    if (sectionId === 'lowRisk:countries') {
      addCountry('lowRisk')
      return
    }
    if (sectionId === 'coastalAl:highRisk' && coastalInsertAnchor?.side === 'highRisk') {
      addCoastalRow('highRisk', coastalInsertAnchor.index)
      return
    }
    if (sectionId === 'coastalAl:lowRisk' && coastalInsertAnchor?.side === 'lowRisk') {
      addCoastalRow('lowRisk', coastalInsertAnchor.index)
    }
  }

  const handleSectionAddGroupedColumn = (sectionId: PeriodSectionId) => {
    if (
      sectionId === 'highRisk:paint' ||
      sectionId === 'highRisk:print' ||
      sectionId === 'lowRisk:paint' ||
      sectionId === 'lowRisk:print'
    ) {
      const risk = riskTabFromProductSection(sectionId)
      const productLine = productLineFromSection(sectionId)
      const atColumnId =
        productColumnInsertAnchor?.risk === risk &&
        productColumnInsertAnchor.productLine === productLine
          ? productColumnInsertAnchor.columnId
          : undefined
      addProductColumn(sectionId, 'grouped', atColumnId)
    }
  }

  const handleSectionAddSimpleColumn = (sectionId: PeriodSectionId) => {
    if (
      sectionId === 'highRisk:paint' ||
      sectionId === 'highRisk:print' ||
      sectionId === 'lowRisk:paint' ||
      sectionId === 'lowRisk:print'
    ) {
      const risk = riskTabFromProductSection(sectionId)
      const productLine = productLineFromSection(sectionId)
      const atColumnId =
        productColumnInsertAnchor?.risk === risk &&
        productColumnInsertAnchor.productLine === productLine
          ? productColumnInsertAnchor.columnId
          : undefined
      addProductColumn(sectionId, 'simple', atColumnId)
    }
  }

  const updateProduct = (
    section: 'highRisk' | 'lowRisk',
    index: number,
    field: keyof ProductWarranty,
    value: string
  ) => {
    setData((prev) => {
      const products = [...prev[section].products]
      products[index] = { ...products[index], [field]: value }
      return { ...prev, [section]: { ...prev[section], products } }
    })
    setSectionMessages({})
  }

  const updateCountry = (
    section: 'highRisk' | 'lowRisk',
    index: number,
    field: keyof CountryEntry,
    value: string
  ) => {
    setData((prev) => {
      const countries = [...prev[section].countries]
      countries[index] = { ...countries[index], [field]: value }
      return { ...prev, [section]: { ...prev[section], countries } }
    })
    setSectionMessages({})
  }

  const addCountry = (section: 'highRisk' | 'lowRisk', atIndex?: number) => {
    setData((prev) => {
      const countries = [...prev[section].countries]
      const insertAt =
        atIndex !== undefined && atIndex >= 0 && atIndex <= countries.length
          ? atIndex
          : countries.length
      countries.splice(insertAt, 0, { region: '', countries: '' })
      return { ...prev, [section]: { ...prev[section], countries } }
    })
    setSectionMessages({})
  }

  const deleteCountry = (section: 'highRisk' | 'lowRisk', index: number) => {
    setData((prev) => {
      const countries = [...prev[section].countries]
      countries.splice(index, 1)
      return { ...prev, [section]: { ...prev[section], countries } }
    })
    setSectionMessages({})
  }

  const reorderCountry = (
    section: 'highRisk' | 'lowRisk',
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return
    setData((prev) => {
      const countries = [...prev[section].countries]
      const [moved] = countries.splice(fromIndex, 1)
      countries.splice(toIndex, 0, moved)
      return { ...prev, [section]: { ...prev[section], countries } }
    })
    setSectionMessages({})
  }

  const updateCoastalRow = (
    side: 'highRisk' | 'lowRisk',
    rowIndex: number,
    field: keyof CoastalDistanceRow,
    value: string
  ) => {
    setData((prev) => {
      const rows = [...prev.coastalAl[side].rows]
      rows[rowIndex] = { ...rows[rowIndex], [field]: value }
      return {
        ...prev,
        coastalAl: {
          ...prev.coastalAl,
          [side]: { ...prev.coastalAl[side], rows },
        },
      }
    })
    setSectionMessages({})
  }

  const updateCoastalSideSpec = (
    side: 'highRisk' | 'lowRisk',
    field: CoastalSideSpecField,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      coastalAl: {
        ...prev.coastalAl,
        [side]: { ...prev.coastalAl[side], [field]: value },
      },
    }))
    setSectionMessages({})
  }

  const addCoastalRow = (side: 'highRisk' | 'lowRisk', atIndex?: number) => {
    setData((prev) => {
      const rows = [...prev.coastalAl[side].rows]
      const insertAt =
        atIndex !== undefined && atIndex >= 0 && atIndex <= rows.length ? atIndex : rows.length
      rows.splice(insertAt, 0, createEmptyCoastalRow())
      return {
        ...prev,
        coastalAl: {
          ...prev.coastalAl,
          [side]: { ...prev.coastalAl[side], rows },
        },
      }
    })
    setCoastalInsertAnchor((prev) => {
      if (!prev || prev.side !== side) return prev
      if (prev.index >= (atIndex ?? Number.MAX_SAFE_INTEGER)) {
        return { side, index: prev.index + 1 }
      }
      return prev
    })
    setSectionMessages({})
  }

  const deleteCoastalRow = (side: 'highRisk' | 'lowRisk', rowIndex: number) => {
    setData((prev) => ({
      ...prev,
      coastalAl: {
        ...prev.coastalAl,
        [side]: {
          ...prev.coastalAl[side],
          rows: prev.coastalAl[side].rows.filter((_, i) => i !== rowIndex),
        },
      },
    }))
    setCoastalInsertAnchor((prev) => {
      if (!prev || prev.side !== side) return prev
      if (prev.index === rowIndex) return null
      if (prev.index > rowIndex) return { ...prev, index: prev.index - 1 }
      return prev
    })
    setSectionMessages({})
  }

  const reorderCoastalRow = (
    side: 'highRisk' | 'lowRisk',
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return
    setData((prev) => {
      const rows = [...prev.coastalAl[side].rows]
      const [moved] = rows.splice(fromIndex, 1)
      rows.splice(toIndex, 0, moved)
      return {
        ...prev,
        coastalAl: {
          ...prev.coastalAl,
          [side]: { ...prev.coastalAl[side], rows },
        },
      }
    })
    setCoastalInsertAnchor((prev) => {
      if (!prev || prev.side !== side) return prev
      return { side, index: adjustIndexAfterReorder(prev.index, fromIndex, toIndex) }
    })
    setSectionMessages({})
  }

  const updateLowRiskNote = (value: string) => {
    setData((prev) => ({
      ...prev,
      lowRisk: { ...prev.lowRisk, note: value },
    }))
    setSectionMessages({})
  }

  const updateNotCoveredItem = (index: number, value: string) => {
    setData((prev) => {
      const items = [...prev.notCovered.items]
      items[index] = value
      return {
        ...prev,
        notCovered: { ...prev.notCovered, items },
      }
    })
    setSectionMessages({})
  }

  const addNotCoveredItem = (atIndex?: number) => {
    let newIndex = 0
    setData((prev) => {
      const items = [...prev.notCovered.items]
      const insertAt =
        atIndex !== undefined && atIndex >= 0 && atIndex <= items.length ? atIndex : items.length
      newIndex = insertAt
      items.splice(insertAt, 0, '')
      return {
        ...prev,
        notCovered: {
          ...prev.notCovered,
          items,
        },
      }
    })
    setHighlightedNotCoveredIndex(newIndex)
    setSectionMessages({})
  }

  const addProduct = (
    section: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    atIndex?: number,
    highlightSection?: ProductHighlight['section']
  ) => {
    let newIndex = 0
    setData((prev) => {
      const products = [...prev[section].products]
      const insertAt =
        atIndex !== undefined && atIndex >= 0 && atIndex <= products.length ? atIndex : products.length
      newIndex = insertAt
      products.splice(insertAt, 0, createEmptyProductWarranty(productLine))
      return {
        ...prev,
        [section]: {
          ...prev[section],
          products,
        },
      }
    })
    if (highlightSection) {
      setHighlightedProduct({ section: highlightSection, index: newIndex })
      setProductHighlightSeq((prev) => prev + 1)
    }
    setSectionMessages({})
  }

  const updateCustomColumn = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string,
    field: 'titleEn' | 'titleKo' | `sub:${number}`,
    value: string
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const customId = columnId.replace('custom:', '')
      const customColumns = layout.customColumns.map((column) => {
        if (column.id !== customId) return column
        if (field === 'titleEn') return { ...column, titleEn: value }
        if (field === 'titleKo') return { ...column, titleKo: value }
        if (field.startsWith('sub:')) {
          const index = Number(field.slice(4))
          const subColumns = [...(column.subColumns ?? [])]
          subColumns[index] = value
          return { ...column, subColumns }
        }
        return column
      })
      return {
        ...prev,
        [risk]: withProductTableLayoutForLine(section, productLine, { ...layout, customColumns }),
      }
    })
    setSectionMessages({})
  }

  const updateBuiltinColumn = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: 'perforation' | 'peelFlake' | 'colorFading' | 'chalk',
    field: ColumnHeaderUpdateField,
    value: string
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      return {
        ...prev,
        [risk]: withProductTableLayoutForLine(
          section,
          productLine,
          updateBuiltinColumnLabel(layout, columnId, field, value)
        ),
      }
    })
    setSectionMessages({})
  }

  const updateColumnHeader = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string,
    field: ColumnHeaderUpdateField,
    value: string
  ) => {
    if (isBuiltinColumnId(columnId)) {
      updateBuiltinColumn(risk, productLine, columnId, field, value)
      return
    }
    updateCustomColumn(risk, productLine, columnId, field, value)
  }

  const updateProductCustomColumnValue = (
    risk: 'highRisk' | 'lowRisk',
    index: number,
    columnId: string,
    value: string,
    subKey?: string
  ) => {
    setData((prev) => {
      const products = [...prev[risk].products]
      products[index] = setCustomColumnValue(products[index], columnId, value, subKey)
      return { ...prev, [risk]: { ...prev[risk], products } }
    })
    setSectionMessages({})
  }

  const updateProductCustomColumnMode = (
    risk: 'highRisk' | 'lowRisk',
    index: number,
    columnId: string,
    mode: 'detail' | 'merged'
  ) => {
    setData((prev) => {
      const products = [...prev[risk].products]
      products[index] = setCustomColumnMode(products[index], columnId, mode)
      return { ...prev, [risk]: { ...prev[risk], products } }
    })
    setSectionMessages({})
  }

  const addProductColumn = (
    sectionId: ProductHighlight['section'],
    kind: 'simple' | 'grouped',
    atColumnId?: string
  ) => {
    const risk = riskTabFromProductSection(sectionId)
    const productLine = productLineFromSection(sectionId)
    const { columnId, def } = createCustomColumnEntry(kind)
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const order = [...layout.columnOrder]
      const insertAt =
        atColumnId && order.includes(atColumnId)
          ? order.indexOf(atColumnId) + 1
          : order.length
      order.splice(insertAt, 0, columnId)
      const newLayout = {
        ...layout,
        columnOrder: order,
        customColumns: [...layout.customColumns, def],
      }
      const products = initCustomColumnOnProductsForLine(
        section.products,
        productLine,
        columnId,
        kind,
        def.subColumns
      )
      return {
        ...prev,
        [risk]: {
          ...withProductTableLayoutForLine(section, productLine, newLayout),
          products,
        },
      }
    })
    setProductColumnInsertAnchor({ risk, productLine, columnId })
    setSectionMessages({})
  }

  const changeProductCustomColumnKind = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string,
    kind: 'simple' | 'grouped'
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const nextLayout = changeCustomColumnKind(layout, columnId, kind)
      const def = nextLayout.customColumns.find((column) => column.id === columnId.replace('custom:', ''))
      const products = mapProductsForLine(section.products, productLine, (product) =>
        migrateProductCustomColumnKind(product, columnId, kind, def?.subColumns)
      )
      return {
        ...prev,
        [risk]: {
          ...withProductTableLayoutForLine(section, productLine, nextLayout),
          products,
        },
      }
    })
    setSectionMessages({})
  }

  const deleteProductCustomColumn = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const nextLayout = removeCustomColumnFromLayout(layout, columnId)
      const products = mapProductsForLine(section.products, productLine, (product) =>
        removeCustomColumnFromProduct(product, columnId)
      )
      return {
        ...prev,
        [risk]: {
          ...withProductTableLayoutForLine(section, productLine, nextLayout),
          products,
        },
      }
    })
    setProductColumnInsertAnchor((prev) =>
      prev?.risk === risk && prev.productLine === productLine && prev.columnId === columnId
        ? null
        : prev
    )
    setSectionMessages({})
  }

  const addProductCustomSubColumn = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const nextLayout = addCustomSubColumn(layout, columnId)
      const def = getCustomColumnDef(nextLayout, columnId)
      const newLabel = def?.subColumns?.[def.subColumns.length - 1] ?? '열'
      const products = mapProductsForLine(section.products, productLine, (product) =>
        addCustomSubColumnOnProducts([product], columnId, newLabel)[0]
      )
      return {
        ...prev,
        [risk]: {
          ...withProductTableLayoutForLine(section, productLine, nextLayout),
          products,
        },
      }
    })
    setSectionMessages({})
  }

  const removeProductCustomSubColumn = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    columnId: string,
    subIndex: number
  ) => {
    setData((prev) => {
      const section = prev[risk]
      const layout = getProductTableLayoutForLine(section, productLine)
      const result = removeCustomSubColumn(layout, columnId, subIndex)
      if (!result) return prev
      const products = mapProductsForLine(section.products, productLine, (product) =>
        removeCustomSubColumnOnProducts([product], columnId, result.removedKey)[0]
      )
      return {
        ...prev,
        [risk]: {
          ...withProductTableLayoutForLine(section, productLine, result.layout),
          products,
        },
      }
    })
    setSectionMessages({})
  }

  const deleteProduct = (
    productSection: ProductHighlight['section'],
    index: number
  ) => {
    const section = riskTabFromProductSection(productSection)
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        products: prev[section].products.filter((_, i) => i !== index),
      },
    }))
    setHighlightedProduct((prev) => {
      if (!prev || prev.section !== productSection) return prev
      if (prev.index === index) return null
      if (prev.index > index) return { ...prev, index: prev.index - 1 }
      return prev
    })
    setProductInsertAnchor((prev) => {
      if (!prev || prev.section !== productSection) return prev
      if (prev.index === index) return null
      if (prev.index > index) return { ...prev, index: prev.index - 1 }
      return prev
    })
    setSectionMessages({})
  }

  const reorderProduct = (
    productSection: ProductHighlight['section'],
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return
    const section = riskTabFromProductSection(productSection)
    setData((prev) => {
      const products = [...prev[section].products]
      const [moved] = products.splice(fromIndex, 1)
      products.splice(toIndex, 0, moved)
      return {
        ...prev,
        [section]: { ...prev[section], products },
      }
    })
    setHighlightedProduct((prev) => {
      if (!prev || prev.section !== productSection) return prev
      return {
        section: productSection,
        index: adjustIndexAfterReorder(prev.index, fromIndex, toIndex),
      }
    })
    setProductInsertAnchor((prev) => {
      if (!prev || prev.section !== productSection) return prev
      return {
        section: productSection,
        index: adjustIndexAfterReorder(prev.index, fromIndex, toIndex),
      }
    })
    setSectionMessages({})
  }

  const deleteNotCoveredItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      notCovered: {
        ...prev.notCovered,
        items: prev.notCovered.items.filter((_, i) => i !== index),
      },
    }))
    setHighlightedNotCoveredIndex((prev) => (prev === index ? null : prev))
    setNotCoveredInsertAnchor((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
    setSectionMessages({})
  }

  const reorderNotCoveredItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setData((prev) => {
      const items = [...prev.notCovered.items]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return {
        ...prev,
        notCovered: { ...prev.notCovered, items },
      }
    })
    setHighlightedNotCoveredIndex((prev) =>
      prev === null ? null : adjustIndexAfterReorder(prev, fromIndex, toIndex)
    )
    setNotCoveredInsertAnchor((prev) =>
      prev === null ? null : adjustIndexAfterReorder(prev, fromIndex, toIndex)
    )
    setSectionMessages({})
  }

  const highRiskProducts = filterProducts(data.highRisk.products)
  const lowRiskProducts = filterProducts(data.lowRisk.products)
  const highRiskPaintProducts = useMemo(
    () => highRiskProducts.filter(({ product }) => resolveProductLine(product) === 'paint'),
    [highRiskProducts]
  )
  const highRiskPrintProducts = useMemo(
    () => highRiskProducts.filter(({ product }) => resolveProductLine(product) === 'print'),
    [highRiskProducts]
  )
  const lowRiskPaintProducts = useMemo(
    () => lowRiskProducts.filter(({ product }) => resolveProductLine(product) === 'paint'),
    [lowRiskProducts]
  )
  const lowRiskPrintProducts = useMemo(
    () => lowRiskProducts.filter(({ product }) => resolveProductLine(product) === 'print'),
    [lowRiskProducts]
  )

  const buildProductColumnProps = (
    risk: 'highRisk' | 'lowRisk',
    productLine: ProductLine,
    editing: boolean
  ) => ({
    columnLayout: getProductTableLayoutForLine(data[risk], productLine),
    columnInsertAnchorId:
      productColumnInsertAnchor?.risk === risk &&
      productColumnInsertAnchor.productLine === productLine
        ? productColumnInsertAnchor.columnId
        : null,
    onSelectColumnInsertAnchor: editing
      ? (columnId: string) => setProductColumnInsertAnchor({ risk, productLine, columnId })
      : undefined,
    onUpdateColumnHeader: editing
      ? (columnId: string, field: ColumnHeaderUpdateField, value: string) =>
          updateColumnHeader(risk, productLine, columnId, field, value)
      : undefined,
    onUpdateCustomColumnValue: editing
      ? (index: number, columnId: string, value: string, subKey?: string) =>
          updateProductCustomColumnValue(risk, index, columnId, value, subKey)
      : undefined,
    onUpdateCustomColumnMode: editing
      ? (index: number, columnId: string, mode: 'detail' | 'merged') =>
          updateProductCustomColumnMode(risk, index, columnId, mode)
      : undefined,
    onChangeCustomColumnKind: editing
      ? (columnId: string, kind: 'simple' | 'grouped') =>
          changeProductCustomColumnKind(risk, productLine, columnId, kind)
      : undefined,
    onDeleteCustomColumn: editing
      ? (columnId: string) => deleteProductCustomColumn(risk, productLine, columnId)
      : undefined,
    onAddCustomSubColumn: editing
      ? (columnId: string) => addProductCustomSubColumn(risk, productLine, columnId)
      : undefined,
    onRemoveCustomSubColumn: editing
      ? (columnId: string, subIndex: number) =>
          removeProductCustomSubColumn(risk, productLine, columnId, subIndex)
      : undefined,
  })

  const cardSectionId: PeriodSectionId | null = activeTab === 'notCovered' ? 'notCovered' : null

  const sectionTitle =
    activeTab === 'highRisk' ? (
      <span className={periodCardTitleClass}>
        위도 5~30° <RiskBadge variant="high" />
      </span>
    ) : activeTab === 'lowRisk' ? (
      <span className={periodCardTitleClass}>
        위도 30° 이상 <RiskBadge variant="low" />
      </span>
    ) : activeTab === 'coastalAl' ? (
      <span className={periodCardTitleClass}>
        AL 소재 적용 불소 제품
        <span className="text-sm font-normal text-text-secondary sm:text-base">(해안 거리별 보증)</span>
      </span>
    ) : (
      <span className={periodCardTitleClass}>{data.notCovered.title}</span>
    )

  const cardHeaderNotice =
    activeTab === 'notCovered' ? (
      <div className={periodCautionRowClass}>
        <p className={periodCautionNoticeClass}>
          <PageHeaderCautionIcon className="h-[1em] w-[1em] shrink-0" />
          <span>다음 항목은 보증 대상에서 제외됩니다.</span>
        </p>
        {canEdit && (
          <PeriodSectionEditButton
            canEdit={canEdit}
            editing={isSectionEditing('notCovered')}
            onEdit={() => startSectionEdit('notCovered')}
            size="compact"
          />
        )}
      </div>
    ) : activeTab === 'coastalAl' ? (
      <p className={periodCautionNoticeClass}>
        <PageHeaderCautionIcon className="h-[1em] w-[1em] shrink-0" />
        <span>소재 부식은 보증 제외 대상이며, 주기적인 정수 세척 관리가 필요합니다.</span>
      </p>
    ) : undefined

  return (
    <div>
      <PageHeader
        subtitle="SEAH·CM WARRANTY GUIDE"
        title="세아씨엠 보증연한"
        actions={user ? <WarrantyGuideDownloadButton userEmail={user.email} /> : null}
        description={
          <p>제품의 판매 활성화를 위한 지역별 / 수지별 품질 보증 가이드라인입니다.</p>
        }
        descriptionNote={
          <p className="flex items-center gap-1.5 font-bold text-text-primary">
            <PageHeaderCautionIcon className="h-[1em] w-[1em] shrink-0 text-white" />
            <span>
              단, 구체적인 사안별 (색상 / 시공 지역 / 환경 / 용도)에 따라 기준이 달라질 수 있습니다.
            </span>
          </p>
        }
      />

      <nav className="sticky top-[var(--app-header-offset)] z-40 mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-bg-tertiary/95 p-1 shadow-sm backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id)
              setEditingSections(new Set())
              setSectionMessages({})
              setHighlightedProduct(null)
              setHighlightedNotCoveredIndex(null)
              setProductInsertAnchor(null)
              setProductColumnInsertAnchor(null)
              setNotCoveredInsertAnchor(null)
              setCoastalInsertAnchor(null)
            }}
            className={`rounded-md px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-5 sm:text-sm ${
              activeTab === tab.id
                ? 'bg-bg-secondary text-accent shadow-sm ring-1 ring-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <Card label="WARRANTY GUIDE" title={sectionTitle} headerNotice={cardHeaderNotice}>
        {canEdit && cardSectionId && (
          <CardSectionToolbar
            editing={isSectionEditing(cardSectionId)}
            saveMessage={sectionMessage(cardSectionId)}
            canAdd={cardSectionId === 'notCovered' && notCoveredInsertAnchor !== null}
            onSave={() => saveSection(cardSectionId)}
            onAdd={() => handleSectionAdd(cardSectionId)}
            onReset={() => resetSection(cardSectionId)}
          />
        )}

        {activeTab === 'highRisk' && (
          <>
            <PeriodSection
              title="고위험 국가 LIST"
              hideEditButton
              canEdit={canEdit}
              editing={isSectionEditing('highRisk:countries')}
              saveMessage={sectionMessage('highRisk:countries')}
              canAdd
              onEdit={() => startSectionEdit('highRisk:countries')}
              onSave={() => saveSection('highRisk:countries')}
              onReset={() => resetSection('highRisk:countries')}
              onAdd={() => handleSectionAdd('highRisk:countries')}
            >
              <CountryGuideGrid
                countries={data.highRisk.countries}
                editing={isSectionEditing('highRisk:countries')}
                riskVariant="high"
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('highRisk:countries'),
                  onEdit: () => startSectionEdit('highRisk:countries'),
                }}
                onUpdate={(index, field, value) => updateCountry('highRisk', index, field, value)}
                onDelete={
                  isSectionEditing('highRisk:countries')
                    ? (index) => deleteCountry('highRisk', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('highRisk:countries')
                    ? (from, to) => reorderCountry('highRisk', from, to)
                    : undefined
                }
              />
            </PeriodSection>

            <PeriodSection
              title="제품군별 보증연한"
              hideEditButton
              canEdit={canEdit}
              editing={isSectionEditing('highRisk:paint')}
              saveMessage={sectionMessage('highRisk:paint')}
              canAdd
              onEdit={() => startSectionEdit('highRisk:paint')}
              onSave={() => saveSection('highRisk:paint')}
              onReset={() => resetSection('highRisk:paint')}
              onAdd={() => handleSectionAdd('highRisk:paint')}
              onAddGroupedColumn={() => handleSectionAddGroupedColumn('highRisk:paint')}
              onAddSimpleColumn={() => handleSectionAddSimpleColumn('highRisk:paint')}
            >
              <ProductGuideTable
                filterLabel="PAINT 제품군 선택"
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('highRisk:paint'),
                  onEdit: () => startSectionEdit('highRisk:paint'),
                }}
                items={highRiskPaintProducts}
                riskVariant="high"
                editing={isSectionEditing('highRisk:paint')}
                addTick={productAddTick}
                insertAnchorIndex={
                  productInsertAnchor?.section === 'highRisk:paint' ? productInsertAnchor.index : null
                }
                onSelectInsertAnchor={
                  isSectionEditing('highRisk:paint')
                    ? (index) => setProductInsertAnchor({ section: 'highRisk:paint', index })
                    : undefined
                }
                highlightedIndex={
                  highlightedProduct?.section === 'highRisk:paint' ? highlightedProduct.index : null
                }
                highlightSequence={productHighlightSeq}
                onUpdate={(index, field, value) => updateProduct('highRisk', index, field, value)}
                onDelete={
                  isSectionEditing('highRisk:paint')
                    ? (index) => deleteProduct('highRisk:paint', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('highRisk:paint')
                    ? (from, to) => reorderProduct('highRisk:paint', from, to)
                    : undefined
                }
                {...buildProductColumnProps('highRisk', 'paint', isSectionEditing('highRisk:paint'))}
              />
            </PeriodSection>

            <PeriodSection
              headerless
              canEdit={canEdit}
              editing={isSectionEditing('highRisk:print')}
              saveMessage={sectionMessage('highRisk:print')}
              canAdd
              onEdit={() => startSectionEdit('highRisk:print')}
              onSave={() => saveSection('highRisk:print')}
              onReset={() => resetSection('highRisk:print')}
              onAdd={() => handleSectionAdd('highRisk:print')}
              onAddGroupedColumn={() => handleSectionAddGroupedColumn('highRisk:print')}
              onAddSimpleColumn={() => handleSectionAddSimpleColumn('highRisk:print')}
            >
              <ProductGuideTable
                filterLabel="PRINT 제품군 선택"
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('highRisk:print'),
                  onEdit: () => startSectionEdit('highRisk:print'),
                }}
                items={highRiskPrintProducts}
                riskVariant="high"
                editing={isSectionEditing('highRisk:print')}
                addTick={productAddTick}
                insertAnchorIndex={
                  productInsertAnchor?.section === 'highRisk:print' ? productInsertAnchor.index : null
                }
                onSelectInsertAnchor={
                  isSectionEditing('highRisk:print')
                    ? (index) => setProductInsertAnchor({ section: 'highRisk:print', index })
                    : undefined
                }
                highlightedIndex={
                  highlightedProduct?.section === 'highRisk:print' ? highlightedProduct.index : null
                }
                highlightSequence={productHighlightSeq}
                onUpdate={(index, field, value) => updateProduct('highRisk', index, field, value)}
                onDelete={
                  isSectionEditing('highRisk:print')
                    ? (index) => deleteProduct('highRisk:print', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('highRisk:print')
                    ? (from, to) => reorderProduct('highRisk:print', from, to)
                    : undefined
                }
                {...buildProductColumnProps('highRisk', 'print', isSectionEditing('highRisk:print'))}
              />
            </PeriodSection>
          </>
        )}

        {activeTab === 'lowRisk' && (
          <>
            <PeriodSection
              title="저위험 국가 LIST"
              hideEditButton
              canEdit={canEdit}
              editing={isSectionEditing('lowRisk:countries')}
              saveMessage={sectionMessage('lowRisk:countries')}
              canAdd
              onEdit={() => startSectionEdit('lowRisk:countries')}
              onSave={() => saveSection('lowRisk:countries')}
              onReset={() => resetSection('lowRisk:countries')}
              onAdd={() => handleSectionAdd('lowRisk:countries')}
            >
              <CountryGuideGrid
                countries={data.lowRisk.countries}
                editing={isSectionEditing('lowRisk:countries')}
                riskVariant="low"
                note={data.lowRisk.note}
                onNoteChange={isSectionEditing('lowRisk:countries') ? updateLowRiskNote : undefined}
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('lowRisk:countries'),
                  onEdit: () => startSectionEdit('lowRisk:countries'),
                }}
                onUpdate={(index, field, value) => updateCountry('lowRisk', index, field, value)}
                onDelete={
                  isSectionEditing('lowRisk:countries')
                    ? (index) => deleteCountry('lowRisk', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('lowRisk:countries')
                    ? (from, to) => reorderCountry('lowRisk', from, to)
                    : undefined
                }
              />
            </PeriodSection>

            <PeriodSection
              title="제품군별 보증연한"
              hideEditButton
              canEdit={canEdit}
              editing={isSectionEditing('lowRisk:paint')}
              saveMessage={sectionMessage('lowRisk:paint')}
              canAdd
              onEdit={() => startSectionEdit('lowRisk:paint')}
              onSave={() => saveSection('lowRisk:paint')}
              onReset={() => resetSection('lowRisk:paint')}
              onAdd={() => handleSectionAdd('lowRisk:paint')}
              onAddGroupedColumn={() => handleSectionAddGroupedColumn('lowRisk:paint')}
              onAddSimpleColumn={() => handleSectionAddSimpleColumn('lowRisk:paint')}
            >
              <ProductGuideTable
                filterLabel="PAINT 제품군 선택"
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('lowRisk:paint'),
                  onEdit: () => startSectionEdit('lowRisk:paint'),
                }}
                items={lowRiskPaintProducts}
                riskVariant="low"
                editing={isSectionEditing('lowRisk:paint')}
                addTick={productAddTick}
                insertAnchorIndex={
                  productInsertAnchor?.section === 'lowRisk:paint' ? productInsertAnchor.index : null
                }
                onSelectInsertAnchor={
                  isSectionEditing('lowRisk:paint')
                    ? (index) => setProductInsertAnchor({ section: 'lowRisk:paint', index })
                    : undefined
                }
                highlightedIndex={
                  highlightedProduct?.section === 'lowRisk:paint' ? highlightedProduct.index : null
                }
                highlightSequence={productHighlightSeq}
                onUpdate={(index, field, value) => updateProduct('lowRisk', index, field, value)}
                onDelete={
                  isSectionEditing('lowRisk:paint')
                    ? (index) => deleteProduct('lowRisk:paint', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('lowRisk:paint')
                    ? (from, to) => reorderProduct('lowRisk:paint', from, to)
                    : undefined
                }
                {...buildProductColumnProps('lowRisk', 'paint', isSectionEditing('lowRisk:paint'))}
              />
            </PeriodSection>

            <PeriodSection
              headerless
              canEdit={canEdit}
              editing={isSectionEditing('lowRisk:print')}
              saveMessage={sectionMessage('lowRisk:print')}
              canAdd
              onEdit={() => startSectionEdit('lowRisk:print')}
              onSave={() => saveSection('lowRisk:print')}
              onReset={() => resetSection('lowRisk:print')}
              onAdd={() => handleSectionAdd('lowRisk:print')}
              onAddGroupedColumn={() => handleSectionAddGroupedColumn('lowRisk:print')}
              onAddSimpleColumn={() => handleSectionAddSimpleColumn('lowRisk:print')}
            >
              <ProductGuideTable
                filterLabel="PRINT 제품군 선택"
                sectionEdit={{
                  canEdit,
                  editing: isSectionEditing('lowRisk:print'),
                  onEdit: () => startSectionEdit('lowRisk:print'),
                }}
                items={lowRiskPrintProducts}
                riskVariant="low"
                editing={isSectionEditing('lowRisk:print')}
                addTick={productAddTick}
                insertAnchorIndex={
                  productInsertAnchor?.section === 'lowRisk:print' ? productInsertAnchor.index : null
                }
                onSelectInsertAnchor={
                  isSectionEditing('lowRisk:print')
                    ? (index) => setProductInsertAnchor({ section: 'lowRisk:print', index })
                    : undefined
                }
                highlightedIndex={
                  highlightedProduct?.section === 'lowRisk:print' ? highlightedProduct.index : null
                }
                highlightSequence={productHighlightSeq}
                onUpdate={(index, field, value) => updateProduct('lowRisk', index, field, value)}
                onDelete={
                  isSectionEditing('lowRisk:print')
                    ? (index) => deleteProduct('lowRisk:print', index)
                    : undefined
                }
                onReorder={
                  isSectionEditing('lowRisk:print')
                    ? (from, to) => reorderProduct('lowRisk:print', from, to)
                    : undefined
                }
                {...buildProductColumnProps('lowRisk', 'print', isSectionEditing('lowRisk:print'))}
              />
            </PeriodSection>
          </>
        )}

        {activeTab === 'coastalAl' && (
          <CoastalGuideTables
            coastal={data.coastalAl}
            highRiskEdit={{
              canEdit,
              editing: isSectionEditing('coastalAl:highRisk'),
              onEdit: () => startSectionEdit('coastalAl:highRisk'),
              onSave: () => saveSection('coastalAl:highRisk'),
              onReset: () => resetSection('coastalAl:highRisk'),
              onAdd: () => handleSectionAdd('coastalAl:highRisk'),
              canAdd: coastalInsertAnchor?.side === 'highRisk',
              saveMessage: sectionMessage('coastalAl:highRisk'),
            }}
            lowRiskEdit={{
              canEdit,
              editing: isSectionEditing('coastalAl:lowRisk'),
              onEdit: () => startSectionEdit('coastalAl:lowRisk'),
              onSave: () => saveSection('coastalAl:lowRisk'),
              onReset: () => resetSection('coastalAl:lowRisk'),
              onAdd: () => handleSectionAdd('coastalAl:lowRisk'),
              canAdd: coastalInsertAnchor?.side === 'lowRisk',
              saveMessage: sectionMessage('coastalAl:lowRisk'),
            }}
            insertAnchor={coastalInsertAnchor}
            onSelectInsertAnchor={(side, index) => setCoastalInsertAnchor({ side, index })}
            onUpdateRow={updateCoastalRow}
            onUpdateSideSpec={updateCoastalSideSpec}
            onDeleteRow={deleteCoastalRow}
            onReorderRow={reorderCoastalRow}
          />
        )}

        {activeTab === 'notCovered' && (
          <NotCoveredGuide
            section={data.notCovered}
            editing={isSectionEditing('notCovered')}
            highlightedIndex={highlightedNotCoveredIndex}
            insertAnchorIndex={notCoveredInsertAnchor}
            onSelectInsertAnchor={isSectionEditing('notCovered') ? setNotCoveredInsertAnchor : undefined}
            onUpdateItem={updateNotCoveredItem}
            onDeleteItem={isSectionEditing('notCovered') ? deleteNotCoveredItem : undefined}
            onReorderItem={isSectionEditing('notCovered') ? reorderNotCoveredItem : undefined}
          />
        )}
      </Card>
    </div>
  )
}
