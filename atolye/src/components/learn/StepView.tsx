import type { Exercise } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { EditStep } from './EditStep'
import { FillBlank } from './FillBlank'
import { Parsons } from './Parsons'
import { Predict } from './Predict'
import type { StepResult } from './shared'
import { Explain, TypeIt } from './TypeExplain'

export function StepView({ ex, mode, known, onDone }: { ex: Exercise; mode: 'learn' | 'review'; known?: string[]; onDone: (r: StepResult) => void }) {
  const p = { ex, mode, known, onDone }
  switch (ex.type) {
    case 'predict':
      return <Predict {...p} />
    case 'fill_blank':
      return <FillBlank {...p} />
    case 'parsons':
      return <Parsons {...p} />
    case 'explain':
      return <Explain {...p} />
    case 'type_it':
      return <TypeIt {...p} />
    default:
      return <EditStep {...p} />
  }
}

/** Getters over the dictionary, so a label read at render time follows the language switch. */
export const TYPE_LABEL = {
  get predict() {
    return t('type.predict')
  },
  get fill_blank() {
    return t('type.fill_blank')
  },
  get parsons() {
    return t('type.parsons')
  },
  get modify() {
    return t('type.modify')
  },
  get write() {
    return t('type.write')
  },
  get debug() {
    return t('type.debug')
  },
  get explain() {
    return t('type.explain')
  },
  get type_it() {
    return t('type.type_it')
  },
} as Record<Exercise['type'], string>
