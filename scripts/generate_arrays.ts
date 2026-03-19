// read jobs_library.json

import fs from 'fs'
import path from 'path'

const jobsLibraryPath = path.join(process.cwd(), 'jobs_library.json')
const jobsLibrary = JSON.parse(fs.readFileSync(jobsLibraryPath, 'utf8'))

const roles = jobsLibrary.roles
const jobTitles = roles.map((job: any) => job.title)

fs.writeFileSync(
  path.join(process.cwd(), 'src', 'lib', 'arrays.ts'),
  `export const jobs_title: string[] = [${jobTitles.map((x: any) => `"${x}"`)}]`,
)

console.log(jobTitles)
