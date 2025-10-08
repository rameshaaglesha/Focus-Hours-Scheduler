import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

export interface StudyBlock {
  _id?: ObjectId
  user_id: string
  title: string
  description?: string | null
  start_time: Date
  end_time: Date
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  notification_sent: boolean
  notification_sent_at?: Date | null
  created_at: Date
  updated_at: Date
}

let client: MongoClient | undefined
let db: Db | undefined
let usingInMemory = false

// Simple in-memory collection to use when MongoDB is unavailable in dev
class InMemoryCollection<T extends { _id?: ObjectId }> {
  private items: T[] = []

  async countDocuments() {
    return this.items.length
  }

  private matches(item: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true

    // Support $or
    if (query.$or && Array.isArray(query.$or)) {
      return query.$or.some((q: any) => this.matches(item, { ...query, ...q, $or: undefined }))
    }

    for (const key of Object.keys(query)) {
      const val = query[key]

      if (key === '$in') {
        if (!val.includes(item)) return false
        continue
      }

      if (typeof val === 'object' && val !== null) {
        // operators like $lte, $gte, $ne, $in
        if ('$lte' in val || '$lt' in val || '$gte' in val || '$gt' in val || '$ne' in val || '$in' in val) {
          const fieldVal = item[key]
          if ('$lte' in val && !(fieldVal <= val.$lte)) return false
          if ('$lt' in val && !(fieldVal < val.$lt)) return false
          if ('$gte' in val && !(fieldVal >= val.$gte)) return false
          if ('$gt' in val && !(fieldVal > val.$gt)) return false
          if ('$ne' in val && fieldVal === val.$ne) return false
          if ('$in' in val && !val.$in.some((v: any) => (v && v.equals ? v.equals(fieldVal) : v === fieldVal))) return false
          continue
        }

        // nested field queries (e.g., start_time: { $lte: date })
        // if nested keys (like start_time) handled above
      }

      // direct equality (support ObjectId equals)
      if (val && val.equals && typeof val.equals === 'function') {
        if (!item[key] || !val.equals(item[key])) return false
      } else if (item[key] !== val) {
        return false
      }
    }

    return true
  }

  find(query: any = {}) {
    const matched = this.items.filter(item => this.matches(item, query))

    const self = this
    return {
      sort(sortObj: any) {
        const [[field, dir]] = Object.entries(sortObj)
        matched.sort((a: any, b: any) => {
          const av = a[field]
          const bv = b[field]
          if (av < bv) return dir === 1 ? -1 : 1
          if (av > bv) return dir === 1 ? 1 : -1
          return 0
        })
        return this
      },
      limit(n: number) {
        return { toArray: async () => matched.slice(0, n) }
      },
      toArray: async () => matched,
    }
  }

  async findOne(query: any) {
    const found = this.items.find(item => this.matches(item, query))
    return found || null
  }

  async insertOne(doc: any) {
    const toInsert = { ...doc }
    if (!toInsert._id) toInsert._id = new ObjectId()
    this.items.push(toInsert)
    return { insertedId: toInsert._id }
  }

  async updateOne(filter: any, update: any) {
    const idx = this.items.findIndex(item => this.matches(item, filter))
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 }
    const set = update.$set || {}
    this.items[idx] = { ...this.items[idx], ...set }
    return { matchedCount: 1, modifiedCount: 1 }
  }

  async updateMany(filter: any, update: any) {
    const set = update.$set || {}
    let modified = 0
    for (let i = 0; i < this.items.length; i++) {
      if (this.matches(this.items[i], filter)) {
        this.items[i] = { ...this.items[i], ...set }
        modified++
      }
    }
    return { matchedCount: modified, modifiedCount: modified }
  }

  async deleteOne(filter: any) {
    const idx = this.items.findIndex(item => this.matches(item, filter))
    if (idx === -1) return { deletedCount: 0 }
    this.items.splice(idx, 1)
    return { deletedCount: 1 }
  }
}

const inMemoryCollections: { study_blocks?: InMemoryCollection<StudyBlock> } = {}

async function initMongo() {
  if (!global._mongoClientPromise) {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI not provided; using in-memory fallback')
      usingInMemory = true
      inMemoryCollections.study_blocks = new InMemoryCollection<StudyBlock>()
      return
    }

    try {
      client = new MongoClient(process.env.MONGODB_URI)
      // start connection but don't throw to caller here; await below where needed
      global._mongoClientPromise = client.connect()
    } catch (err) {
      console.error('Failed to create MongoClient, using in-memory fallback:', err)
      usingInMemory = true
      inMemoryCollections.study_blocks = new InMemoryCollection<StudyBlock>()
    }
  }
}

async function connectToDatabase() {
  await initMongo()

  if (usingInMemory) {
    return undefined
  }

  try {
    const c = await global._mongoClientPromise
    const uri = process.env.MONGODB_URI!
    const dbName = uri.split('/')[3]?.split('?')[0] || 'quiet-hours-scheduler'
    db = c.db(dbName)
    console.log(`Connected to MongoDB database: ${dbName}`)
    return db
  } catch (error) {
    console.error('MongoDB connection failed, falling back to in-memory:', error)
    usingInMemory = true
    inMemoryCollections.study_blocks = new InMemoryCollection<StudyBlock>()
    return undefined
  }
}

export async function getStudyBlocksCollection(): Promise<Collection<StudyBlock> | InMemoryCollection<StudyBlock>> {
  if (!db && !usingInMemory) {
    await connectToDatabase()
  }

  if (usingInMemory) {
    return inMemoryCollections.study_blocks!
  }

  return db!.collection<StudyBlock>('study_blocks')
}

// For TypeScript global augmentation
declare global {
  var _mongoClientPromise: Promise<MongoClient>
}
