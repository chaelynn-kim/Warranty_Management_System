import { useEffect, useState } from 'react'
import { Pencil, Plus, RotateCcw, Save } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { CountryGuideGrid } from '../components/warranty-period/CountryGuideGrid'
import { CoastalGuideTables } from '../components/warranty-period/CoastalGuideTables'
import { NotCoveredGuide } from '../components/warranty-period/NotCoveredGuide'
import { ProductGuideTable } from '../components/warranty-period/ProductGuideTable'
import { RiskBadge } from '../components/warranty-period/RiskBadge'
import { useAuth } from '../contexts/AuthContext'
import type {
  CoastalDistanceRow,
  CountryEntry,
  ProductWarranty,
  WarrantyPeriodData,
} from '../types'
import { canEditWarrantyPeriod } from '../utils/authValidation'
import { resolveProductLine } from '../utils/productWarrantyHelpers'
import { loadWarrantyPeriod, saveWarrantyPeriod, createEmptyProductWarranty } from '../utils/warrantyPeriodStorage'
import { periodInputClass } from '../components/warranty-period/periodTheme'

type PeriodTab = 'highRisk' | 'lowRisk' | 'coastalAl' | 'notCovered'

const tabs: { id: PeriodTab; label: string }[] = [
  { id: 'highRisk', label: '고위험 지역' },
  { id: 'lowRisk', label: '저위험 지역' },
  { id: 'coastalAl', label: 'AL 소재 불소 제품' },
  { id: 'notCovered', label: '보증 제외 대상' },
]

function filterProducts(products: ProductWarranty[]): { product: ProductWarranty; index: number }[] {
  return products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => {
      if (product.productGroup === '제품군') return false
      if (product.productGroup.startsWith('* 위 LIST')) return false
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

function EditToolbar({
  editing,
  saveMessage,
  canAdd,
  onEdit,
  onSave,
  onAdd,
  onReset,
}: {
  editing: boolean
  saveMessage: string
  canAdd: boolean
  onEdit: () => void
  onSave: () => void
  onAdd: () => void
  onReset: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {editing && (
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent ring-1 ring-accent/40">
            수정 중
          </span>
        )}
        {saveMessage && (
          <span className="text-sm font-medium text-emerald-400">{saveMessage}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={editing}
          className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" />
          수정
        </button>
        {editing && (
          <>
            <button
              type="button"
              onClick={onAdd}
              disabled={!canAdd}
              aria-label="행 추가"
              title={canAdd ? '행 추가' : '이 탭에서는 행 추가를 사용할 수 없습니다'}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Save className="h-4 w-4" />
              저장
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </button>
          </>
        )}
      </div>
    </div>
  )
}

type ProductHighlight = { section: 'highRisk' | 'lowRisk'; index: number }
type CoastalInsertAnchor = { side: 'highRisk' | 'lowRisk'; index: number }

function createEmptyCoastalRow(): CoastalDistanceRow {
  return { distance: '', coat2: '', coat3: '' }
}

export function WarrantyPeriodPage() {
  const { user } = useAuth()
  const canEdit = canEditWarrantyPeriod(user?.email)
  const [data, setData] = useState<WarrantyPeriodData>(() => loadWarrantyPeriod())
  const [activeTab, setActiveTab] = useState<PeriodTab>('highRisk')
  const [editing, setEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [highlightedProduct, setHighlightedProduct] = useState<ProductHighlight | null>(null)
  const [highlightedNotCoveredIndex, setHighlightedNotCoveredIndex] = useState<number | null>(null)
  const [productHighlightSeq, setProductHighlightSeq] = useState(0)
  const [productAddTick, setProductAddTick] = useState(0)
  const [productInsertAnchor, setProductInsertAnchor] = useState<ProductHighlight | null>(null)
  const [notCoveredInsertAnchor, setNotCoveredInsertAnchor] = useState<number | null>(null)
  const [coastalInsertAnchor, setCoastalInsertAnchor] = useState<CoastalInsertAnchor | null>(null)

  const effectiveEditing = canEdit && editing

  useEffect(() => {
    if (!canEdit && editing) {
      setEditing(false)
    }
  }, [canEdit, editing])

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

  const handleEdit = () => {
    if (!canEdit) return
    setEditing(true)
    setProductInsertAnchor(null)
    setNotCoveredInsertAnchor(null)
    setCoastalInsertAnchor(null)
    setSaveMessage('')
  }

  const handleSave = () => {
    saveWarrantyPeriod(data)
    setEditing(false)
    setHighlightedProduct(null)
    setHighlightedNotCoveredIndex(null)
    setProductInsertAnchor(null)
    setNotCoveredInsertAnchor(null)
    setSaveMessage('저장되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleReset = () => {
    setData(loadWarrantyPeriod())
    setHighlightedProduct(null)
    setHighlightedNotCoveredIndex(null)
    setProductInsertAnchor(null)
    setNotCoveredInsertAnchor(null)
    setSaveMessage('초기화되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const canToolbarAdd =
    activeTab === 'highRisk' ||
    activeTab === 'lowRisk' ||
    activeTab === 'notCovered' ||
    activeTab === 'coastalAl'

  const canToolbarAddNow =
    canToolbarAdd &&
    (activeTab !== 'coastalAl' || coastalInsertAnchor !== null)

  const handleToolbarAdd = () => {
    if (activeTab === 'highRisk') {
      setProductAddTick((tick) => tick + 1)
      const atIndex =
        productInsertAnchor?.section === 'highRisk' ? productInsertAnchor.index : undefined
      addProduct('highRisk', atIndex)
    } else if (activeTab === 'lowRisk') {
      setProductAddTick((tick) => tick + 1)
      const atIndex =
        productInsertAnchor?.section === 'lowRisk' ? productInsertAnchor.index : undefined
      addProduct('lowRisk', atIndex)
    } else if (activeTab === 'notCovered') {
      addNotCoveredItem(notCoveredInsertAnchor ?? undefined)
    } else if (activeTab === 'coastalAl' && coastalInsertAnchor) {
      addCoastalRow(coastalInsertAnchor.side, coastalInsertAnchor.index)
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
    setSaveMessage('')
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
    setSaveMessage('')
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
    setSaveMessage('')
  }

  const updateCoastalWarrantyNote = (side: 'highRisk' | 'lowRisk', value: string) => {
    setData((prev) => ({
      ...prev,
      coastalAl: {
        ...prev.coastalAl,
        [side]: { ...prev.coastalAl[side], warrantyNote: value },
      },
    }))
    setSaveMessage('')
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
    setSaveMessage('')
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
    setSaveMessage('')
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
    setSaveMessage('')
  }

  const updateLowRiskNote = (value: string) => {
    setData((prev) => ({
      ...prev,
      lowRisk: { ...prev.lowRisk, note: value },
    }))
    setSaveMessage('')
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
    setSaveMessage('')
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
    setSaveMessage('')
  }

  const addProduct = (section: 'highRisk' | 'lowRisk', atIndex?: number) => {
    let newIndex = 0
    setData((prev) => {
      const products = [...prev[section].products]
      const insertAt =
        atIndex !== undefined && atIndex >= 0 && atIndex <= products.length ? atIndex : products.length
      newIndex = insertAt
      const referenceIndex =
        atIndex !== undefined && atIndex >= 0 && atIndex < products.length
          ? atIndex
          : products.length > 0
            ? products.length - 1
            : -1
      const productLine =
        referenceIndex >= 0 ? resolveProductLine(products[referenceIndex]) : 'paint'
      products.splice(insertAt, 0, createEmptyProductWarranty(productLine))
      return {
        ...prev,
        [section]: {
          ...prev[section],
          products,
        },
      }
    })
    setHighlightedProduct({ section, index: newIndex })
    setProductHighlightSeq((prev) => prev + 1)
    setSaveMessage('')
  }

  const deleteProduct = (section: 'highRisk' | 'lowRisk', index: number) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        products: prev[section].products.filter((_, i) => i !== index),
      },
    }))
    setHighlightedProduct((prev) => {
      if (!prev || prev.section !== section) return prev
      if (prev.index === index) return null
      if (prev.index > index) return { ...prev, index: prev.index - 1 }
      return prev
    })
    setProductInsertAnchor((prev) => {
      if (!prev || prev.section !== section) return prev
      if (prev.index === index) return null
      if (prev.index > index) return { ...prev, index: prev.index - 1 }
      return prev
    })
    setSaveMessage('')
  }

  const reorderProduct = (
    section: 'highRisk' | 'lowRisk',
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return
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
      if (!prev || prev.section !== section) return prev
      return {
        section,
        index: adjustIndexAfterReorder(prev.index, fromIndex, toIndex),
      }
    })
    setProductInsertAnchor((prev) => {
      if (!prev || prev.section !== section) return prev
      return {
        section,
        index: adjustIndexAfterReorder(prev.index, fromIndex, toIndex),
      }
    })
    setSaveMessage('')
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
    setSaveMessage('')
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
    setSaveMessage('')
  }

  const highRiskProducts = filterProducts(data.highRisk.products)
  const lowRiskProducts = filterProducts(data.lowRisk.products)

  const sectionTitle =
    activeTab === 'highRisk'
      ? '위도 5~30° (고위험 국가)'
      : activeTab === 'lowRisk'
        ? '위도 30° 이상 (저위험 국가)'
        : activeTab === 'coastalAl'
          ? data.coastalAl.title
          : data.notCovered.title

  const sectionBadge =
    activeTab === 'highRisk' ? (
      <RiskBadge variant="high" />
    ) : activeTab === 'lowRisk' ? (
      <RiskBadge variant="low" />
    ) : null

  return (
    <div>
      <PageHeader
        subtitle="Warranty Period Guide"
        title="세아씨엠 보증연한"
        description="제품의 판매 활성화를 위한 지역별 / 수지별 품질 보증 가이드라인입니다."
      />

      <nav className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-bg-tertiary p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id)
              setSaveMessage('')
              setHighlightedProduct(null)
              setHighlightedNotCoveredIndex(null)
              setProductInsertAnchor(null)
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

      <Card label="WARRANTY GUIDE" title={sectionTitle}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {sectionBadge}
        </div>

        {canEdit && (
          <EditToolbar
            editing={effectiveEditing}
            saveMessage={saveMessage}
            canAdd={canToolbarAddNow}
            onEdit={handleEdit}
            onSave={handleSave}
            onAdd={handleToolbarAdd}
            onReset={handleReset}
          />
        )}

        {activeTab === 'highRisk' && (
          <>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">고위험 국가 LIST</h3>
            <CountryGuideGrid
              countries={data.highRisk.countries}
              editing={effectiveEditing}
              riskVariant="high"
              onUpdate={(index, field, value) => updateCountry('highRisk', index, field, value)}
            />
            <h3 className="mb-3 text-sm font-semibold text-text-primary">제품군별 보증연한</h3>
            <ProductGuideTable
              items={highRiskProducts}
              splitByPrintPaint
              riskVariant="high"
              editing={effectiveEditing}
              addTick={productAddTick}
              insertAnchorIndex={
                productInsertAnchor?.section === 'highRisk' ? productInsertAnchor.index : null
              }
              onSelectInsertAnchor={
                effectiveEditing
                  ? (index) => setProductInsertAnchor({ section: 'highRisk', index })
                  : undefined
              }
              highlightedIndex={
                highlightedProduct?.section === 'highRisk' ? highlightedProduct.index : null
              }
              highlightSequence={productHighlightSeq}
              onUpdate={(index, field, value) => updateProduct('highRisk', index, field, value)}
              onDelete={effectiveEditing ? (index) => deleteProduct('highRisk', index) : undefined}
              onReorder={
                effectiveEditing ? (from, to) => reorderProduct('highRisk', from, to) : undefined
              }
            />
          </>
        )}

        {activeTab === 'lowRisk' && (
          <>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">저위험 국가 LIST</h3>
            <CountryGuideGrid
              countries={data.lowRisk.countries}
              editing={effectiveEditing}
              riskVariant="low"
              onUpdate={(index, field, value) => updateCountry('lowRisk', index, field, value)}
            />
            <div className="mb-4 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3">
              {effectiveEditing ? (
                <textarea
                  rows={2}
                  value={data.lowRisk.note}
                  onChange={(e) => updateLowRiskNote(e.target.value)}
                  className={`${periodInputClass} resize-y text-left text-amber-200`}
                />
              ) : (
                <p className="text-sm text-amber-200/90">{data.lowRisk.note}</p>
              )}
            </div>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">제품군별 보증연한</h3>
            <ProductGuideTable
              items={lowRiskProducts}
              splitByPrintPaint
              riskVariant="low"
              editing={effectiveEditing}
              addTick={productAddTick}
              insertAnchorIndex={
                productInsertAnchor?.section === 'lowRisk' ? productInsertAnchor.index : null
              }
              onSelectInsertAnchor={
                effectiveEditing
                  ? (index) => setProductInsertAnchor({ section: 'lowRisk', index })
                  : undefined
              }
              highlightedIndex={
                highlightedProduct?.section === 'lowRisk' ? highlightedProduct.index : null
              }
              highlightSequence={productHighlightSeq}
              onUpdate={(index, field, value) => updateProduct('lowRisk', index, field, value)}
              onDelete={effectiveEditing ? (index) => deleteProduct('lowRisk', index) : undefined}
              onReorder={
                effectiveEditing ? (from, to) => reorderProduct('lowRisk', from, to) : undefined
              }
            />
          </>
        )}

        {activeTab === 'coastalAl' && (
          <CoastalGuideTables
            coastal={data.coastalAl}
            editing={effectiveEditing}
            insertAnchor={coastalInsertAnchor}
            onSelectInsertAnchor={
              effectiveEditing ? (side, index) => setCoastalInsertAnchor({ side, index }) : undefined
            }
            onUpdateRow={updateCoastalRow}
            onUpdateWarrantyNote={updateCoastalWarrantyNote}
            onDeleteRow={effectiveEditing ? deleteCoastalRow : undefined}
            onReorderRow={effectiveEditing ? reorderCoastalRow : undefined}
          />
        )}

        {activeTab === 'notCovered' && (
          <NotCoveredGuide
            section={data.notCovered}
            editing={effectiveEditing}
            highlightedIndex={highlightedNotCoveredIndex}
            insertAnchorIndex={notCoveredInsertAnchor}
            onSelectInsertAnchor={effectiveEditing ? setNotCoveredInsertAnchor : undefined}
            onUpdateItem={updateNotCoveredItem}
            onDeleteItem={effectiveEditing ? deleteNotCoveredItem : undefined}
            onReorderItem={effectiveEditing ? reorderNotCoveredItem : undefined}
          />
        )}
      </Card>
    </div>
  )
}
