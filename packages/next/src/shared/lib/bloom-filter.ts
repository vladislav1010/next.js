// minimal implementation MurmurHash2 hash function
function murmurhash2(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h = Math.imul(h ^ c, 0x5bd1e995)
    h ^= h >>> 13
    h = Math.imul(h, 0x5bd1e995)
  }
  return h >>> 0
}

export class BloomFilter {
  numItems: number
  errorRate: number
  numBits: number
  numHashes: number
  bitArray: number[]

  constructor(numItems: number, errorRate: number) {
    this.numItems = numItems
    this.errorRate = errorRate
    this.numBits = Math.ceil(
      -(numItems * Math.log(errorRate)) / (Math.log(2) * Math.log(2))
    )
    this.numHashes = Math.ceil((this.numBits / numItems) * Math.log(2))
    this.bitArray = new Array(this.numBits).fill(0)
  }

  static from(items: string[], errorRate = 0.01) {
    const filter = new BloomFilter(items.length, errorRate)

    for (const item of items) {
      filter.add(item)
    }
    return filter
  }

  export() {
    const data = {
      numItems: this.numItems,
      errorRate: this.errorRate,
      numBits: this.numBits,
      numHashes: this.numHashes,
      bitArray: this.bitArray,
    }

    if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
      if (this.errorRate < 0.01) {
        const filterData = JSON.stringify(data)
        const gzipSize = require('next/dist/compiled/gzip-size').sync(
          filterData
        )

        if (gzipSize > 1024) {
          console.warn(
            `Creating filter with error rate less than 1% (0.01) can increase the size dramatically proceed with caution. Received error rate ${this.errorRate} resulted in size ${filterData.length} bytes, ${gzipSize} bytes (gzip)`
          )
        }
      }
    }

    return data
  }

  import(data: ReturnType<typeof this['export']>) {
    this.numItems = data.numItems
    this.errorRate = data.errorRate
    this.numBits = data.numBits
    this.numHashes = data.numHashes
    this.bitArray = data.bitArray
  }

  add(item: string) {
    const hashValues = this.getHashValues(item)
    hashValues.forEach((hash) => {
      this.bitArray[hash] = 1
    })
  }

  contains(item: string) {
    const hashValues = this.getHashValues(item)
    return hashValues.every((hash) => this.bitArray[hash])
  }

  getHashValues(item: string) {
    const hashValues = []
    for (let i = 1; i <= this.numHashes; i++) {
      const hash = murmurhash2(`${item}${i}`) % this.numBits
      hashValues.push(hash)
    }
    return hashValues
  }
}
