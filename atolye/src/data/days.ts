import { t, type Key } from '../lib/i18n'

export interface Part {
  id: string
  name: string
  from: number
  to: number
  field: 1 | 2 | 3 | 4
  blurb: string
  /** One line: what the learner writes in this part. */
  build: string
  /** An exercise-shaped snippet ("predict this") for the home page card. */
  sample: string
}

export interface DayMeta {
  n: number
  /** Title in the current language */
  title: string
  /** English title of the upstream lesson */
  en: string
  part: number
  /** Short line in the current language, shown in the day index preview. */
  teaser: string
  /** Needs a server, network or local files: runs only in the repo's .venv. */
  local?: boolean
}

/** Text fields are getters over the dictionary, so a language switch shows without rebuilding the lists. */
const part = (id: string, from: number, to: number, field: 1 | 2 | 3 | 4, code: string, ask = false): Part => ({
  id,
  from,
  to,
  field,
  get sample() {
    return ask ? `${code}\n${t('part.ask')}` : code
  },
  get name() {
    return t(`part.${id}.name` as Key)
  },
  get blurb() {
    return t(`part.${id}.blurb` as Key)
  },
  get build() {
    return t(`part.${id}.build` as Key)
  },
})

export const PARTS: Part[] = [
  part('temeller', 1, 7, 1, 'age = 20\nprint(age ** 2)', true),
  part('akis', 8, 12, 2, 'for i in range(3):\n    print(i * 2)', true),
  part('fonksiyonel', 13, 18, 3, 'sq = [i * i for i in range(4)]\nprint(sq)', true),
  part('nesneler', 19, 23, 4, 'class Dog:\n    def speak(self):\n        return "Hav"\nprint(Dog().speak())'),
  part('veri', 24, 30, 1, 'import statistics\nprint(statistics.mean([2, 4, 6]))', true),
]

const D = (n: number, part: number, en: string, local = false): DayMeta => ({
  n,
  part,
  en,
  local,
  get title() {
    return t(`day.${n}.title` as Key)
  },
  get teaser() {
    return t(`day.${n}.teaser` as Key)
  },
})

export const DAYS: DayMeta[] = [
  D(1, 0, 'Introduction'),
  D(2, 0, 'Variables, Built-in Functions'),
  D(3, 0, 'Operators'),
  D(4, 0, 'Strings'),
  D(5, 0, 'Lists'),
  D(6, 0, 'Tuples'),
  D(7, 0, 'Sets'),
  D(8, 1, 'Dictionaries'),
  D(9, 1, 'Conditionals'),
  D(10, 1, 'Loops'),
  D(11, 1, 'Functions'),
  D(12, 1, 'Modules'),
  D(13, 2, 'List Comprehension'),
  D(14, 2, 'Higher Order Functions'),
  D(15, 2, 'Python Type Errors'),
  D(16, 2, 'Python Date time'),
  D(17, 2, 'Exception Handling'),
  D(18, 2, 'Regular Expressions'),
  D(19, 3, 'File Handling'),
  D(20, 3, 'Python Package Manager'),
  D(21, 3, 'Classes and Objects'),
  D(22, 3, 'Web Scraping', true),
  D(23, 3, 'Virtual Environment'),
  D(24, 4, 'Statistics'),
  D(25, 4, 'Pandas'),
  D(26, 4, 'Python web', true),
  D(27, 4, 'Python with MongoDB', true),
  D(28, 4, 'API', true),
  D(29, 4, 'Building API', true),
  D(30, 4, 'Conclusions'),
]

export const daysOfPart = (part: number): number[] => DAYS.filter((d) => d.part === part).map((d) => d.n)
export const dayOf = (n: number): DayMeta | undefined => DAYS.find((d) => d.n === n)
export const partOfDay = (n: number): Part => PARTS[dayOf(n)?.part ?? 0]

/** Folder name of each day inside the course repository, used to route lesson-to-lesson links. */
export const FOLDER_DAY: Record<string, number> = {
  '01_Day_Introduction': 1,
  '02_Day_Variables_builtin_functions': 2,
  '03_Day_Operators': 3,
  '04_Day_Strings': 4,
  '05_Day_Lists': 5,
  '06_Day_Tuples': 6,
  '07_Day_Sets': 7,
  '08_Day_Dictionaries': 8,
  '09_Day_Conditionals': 9,
  '10_Day_Loops': 10,
  '11_Day_Functions': 11,
  '12_Day_Modules': 12,
  '13_Day_List_comprehension': 13,
  '14_Day_Higher_order_functions': 14,
  '15_Day_Python_type_errors': 15,
  '16_Day_Python_date_time': 16,
  '17_Day_Exception_handling': 17,
  '18_Day_Regular_expressions': 18,
  '19_Day_File_handling': 19,
  '20_Day_Python_package_manager': 20,
  '21_Day_Classes_and_objects': 21,
  '22_Day_Web_scraping': 22,
  '23_Day_Virtual_environment': 23,
  '24_Day_Statistics': 24,
  '25_Day_Pandas': 25,
  '26_Day_Python_web': 26,
  '27_Day_Python_with_mongodb': 27,
  '28_Day_API': 28,
  '29_Day_Building_API': 29,
  '30_Day_Conclusions': 30,
}
