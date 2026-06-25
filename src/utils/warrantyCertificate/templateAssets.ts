import paintKoTemplateUrl from '../../assets/warranty-templates/PAINT_국문_260427.pptx?url'
import paintEnTemplateUrl from '../../assets/warranty-templates/PAINT_영문_260427.pptx?url'
import printKoTemplateUrl from '../../assets/warranty-templates/PRINT_국문_250624.pptx?url'
import printEnTemplateUrl from '../../assets/warranty-templates/PRINT_영문_250624.pptx?url'

type TemplateLanguage = 'ko' | 'en'

export const WARRANTY_TEMPLATE_URLS: Record<string, Record<TemplateLanguage, string>> = {
  PAINT: {
    ko: paintKoTemplateUrl,
    en: paintEnTemplateUrl,
  },
  PRINT: {
    ko: printKoTemplateUrl,
    en: printEnTemplateUrl,
  },
}
