import fs from 'fs'
import { spy } from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'
import path, { resolve } from 'path'

import {
  getAbsolutePath,
  parseJobs
} from '../src/util'

chai.use(sinonChai)

describe('getAbsolutePath', () => {
  const existingPath = 'src/bin/dispo.js'

  it('throws when file doesnt exist', () => {
    expect(() => getAbsolutePath(existingPath)).to.not.throw(Error)
    expect(() => getAbsolutePath('nonexisting.json')).to.throw(Error)
  })

  it('returns absolute path when file exists', () => {
    expect(getAbsolutePath(existingPath)).to.equal(resolve(existingPath))
  })

  it('uses native fs and path methods', () => {
    const accessSync = spy(fs, 'accessSync')
    const resolve = spy(path, 'resolve')
    getAbsolutePath(existingPath)
    expect(resolve).to.have.been.calledOnce
    expect(resolve).to.have.been.calledWith(existingPath)
    expect(accessSync).to.have.been.calledOnce
    expect(accessSync).to.have.been.calledWith(resolve(existingPath), fs.R_OK)
    accessSync.restore()
    resolve.restore()
  })

  it('pass 2nd parameter to fs.accessSync', () => {
    const accessSync = spy(fs, 'accessSync')
    getAbsolutePath(existingPath, fs.W_OK)
    expect(accessSync).to.have.been.calledWith(resolve(existingPath), fs.W_OK)
    accessSync.restore()
  })
})

describe('parseJobs', () => {
  const base = process.cwd()

  it(`throws for jobs without a file`, () => {
    expect(() => parseJobs({ withoutFile: {} }, base)).to.throw(Error)
    expect(() => parseJobs({ nonExistingFile: { file: '404.js' } }, base)).to.throw(Error)
    expect(() => parseJobs({ existingFile: { file: 'example/jobs/random.js' } }, base)).to.not.throw(Error)
  })

  it('returns an array of jobs containing name, attempts, fn and optional cron syntax', () => {
    const file = 'example/jobs/random.js'
    const fn = require(`../${file}`)
    const config = { random: { file, attempts: 2 }, alsoRandom: { file } }
    const result = parseJobs(config, base)

    expect(result).to.deep.equal([
      { name: 'random', attempts: 2, fn },
      { name: 'alsoRandom', attempts: 3, fn }
    ])
  })
})
