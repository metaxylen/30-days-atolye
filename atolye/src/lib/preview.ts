import raw from '../data/previews.generated.json'

export interface Preview {
  topics: string[]
  snippet: string
  /** Anlatım cards of this day and their reading time in minutes (absent while the day's card file is missing) */
  cards?: number
  cardMin?: number
}

const previews = raw as unknown as Record<string, Preview>

/** Topics and a first code line per day, computed at build time so the home page does not ship the lessons. */
export const getPreview = (day: number): Preview => previews[String(day)] ?? { topics: [], snippet: '' }
