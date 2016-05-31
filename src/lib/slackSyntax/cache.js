
class LRU {
  constructor (limit = 1000) {
    this.limit = limit
    this.map = new Map()
  }

  has = key => this.map.has(key)

  set = (key, value) => {
    this.map.delete(key)
    this.map.set(key, value)

    if (this.map.size > this.limit) {
      this.map.delete(this.map.keys().next().value)
    }

    return this
  }

  get = key => {
    if (this.has(key)) {
      const value = this.map.get(key)

      this.map.delete(key)
      this.map.set(key, value)

      return value
    }
  }

  clear = _ => this.map.clear()
}

const parseCache = new LRU(50)
const emojiCache = new LRU(500)

export default LRU
export { parseCache, emojiCache }
