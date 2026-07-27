import type { ProductWarranty } from '../../types'
import type { WarrantyCertificateInput } from './generateWarrantyCertificate'
import type { WarrantyCertificateTemplateProduct } from './certificateTemplateTypes'

function sampleProduct(productItem: WarrantyCertificateTemplateProduct): ProductWarranty {
  if (productItem === 'PRINT') {
    return {
      productGroup: 'ADP PRINT',
      productLine: 'print',
      peelFlake: '15년',
      perforation: '20년',
      colorFading: '10년',
      colorFadingRoof: '10년',
      colorFadingWall: '10년',
      chalk: '10년',
      chalkRoof: '10년',
      chalkWall: '10년',
      notes: '',
    }
  }

  return {
    productGroup: 'SMP',
    productLine: 'paint',
    peelFlake: '15년',
    perforation: '20년',
    colorFading: '10년',
    colorFadingRoof: '10년',
    colorFadingWall: '10년',
    chalk: '10년',
    chalkRoof: '10년',
    chalkWall: '10년',
    notes: '',
  }
}

export function buildSampleWarrantyCertificateInput(
  productItem: WarrantyCertificateTemplateProduct
): WarrantyCertificateInput {
  return {
    productItem,
    resin: productItem === 'PRINT' ? 'ADP' : 'SMP',
    resinCustom: '',
    colorName: 'SAMPLE COLOR',
    coatingStructure: productItem === 'PRINT' ? '2Coat' : '2Coat',
    detailRegionLabel: productItem === 'PRINT' ? 'South Korea' : '대한민국',
    issueDate: '2026-07-27',
    totalCoatingThickness: '25',
    primerThickness: '5',
    companyWarrantyTerms: [sampleProduct(productItem)],
  }
}
