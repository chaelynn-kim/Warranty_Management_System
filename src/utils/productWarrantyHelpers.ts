import type { ProductLine, ProductWarranty } from '../types'

export type SectionDisplayMode = 'detail' | 'merged'

function isDisplayMode(value: unknown): value is SectionDisplayMode {
  return value === 'detail' || value === 'merged'
}

function inferColorFadingMode(product: ProductWarranty): SectionDisplayMode {
  const subsEmpty = !product.colorFadingRoof.trim() && !product.colorFadingWall.trim()
  const fading = product.colorFading.trim()
  if (!subsEmpty) return 'detail'
  if (fading === '보증 불가') return 'merged'
  if (product.colorChalkMode === 'merged' && fading) return 'merged'
  return 'detail'
}

function inferChalkMode(product: ProductWarranty): SectionDisplayMode {
  const subsEmpty = !product.chalkRoof.trim() && !product.chalkWall.trim()
  const chalk = product.chalk.trim()
  if (!subsEmpty) return 'detail'
  if (chalk === '보증 불가') return 'merged'
  if (product.colorChalkMode === 'merged' && chalk) return 'merged'
  return 'detail'
}

export function resolveColorFadingMode(product: ProductWarranty): SectionDisplayMode {
  if (isDisplayMode(product.colorFadingMode)) return product.colorFadingMode
  if (product.colorChalkMode === 'merged' && !isDisplayMode(product.chalkMode)) {
    return inferColorFadingMode(product)
  }
  if (product.colorChalkMode === 'detail') return 'detail'
  return inferColorFadingMode(product)
}

export function resolveChalkMode(product: ProductWarranty): SectionDisplayMode {
  if (isDisplayMode(product.chalkMode)) return product.chalkMode
  if (product.colorChalkMode === 'merged' && !isDisplayMode(product.colorFadingMode)) {
    return inferChalkMode(product)
  }
  if (product.colorChalkMode === 'detail') return 'detail'
  return inferChalkMode(product)
}

export function isPrintProductGroup(productGroup: string): boolean {
  return productGroup.toLowerCase().includes('print')
}

export function resolveProductLine(product: ProductWarranty): ProductLine {
  if (product.productLine === 'paint' || product.productLine === 'print') {
    return product.productLine
  }
  return isPrintProductGroup(product.productGroup) ? 'print' : 'paint'
}

export function normalizeProductWarranty(product: ProductWarranty): ProductWarranty {
  return {
    ...product,
    productLine: resolveProductLine(product),
    colorFadingMode: resolveColorFadingMode(product),
    chalkMode: resolveChalkMode(product),
  }
}
