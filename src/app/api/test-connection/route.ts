import { NextResponse } from 'next/server'
import { getStudyBlocksCollection } from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Testing MongoDB connection...')
    console.log(' MongoDB URI exists:', !!process.env.MONGODB_URI)
    console.log('MongoDB URI preview:', process.env.MONGODB_URI?.substring(0, 50) + '...')
    
    // This will trigger the connection
    const collection = await getStudyBlocksCollection()
    console.log('Got collection successfully')
    
    // Test basic operation
    const count = await collection.countDocuments()
    console.log(`Document count: ${count}`)
    
    // List all documents for debugging
    const allDocs = await collection.find({}).toArray()
    console.log(`All documents:`, allDocs)
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful!',
      documentCount: count,
      documents: allDocs.map(doc => ({
        ...doc,
        _id: String(doc._id),
        start_time: doc.start_time?.toISOString(),
        end_time: doc.end_time?.toISOString(),
        created_at: doc.created_at?.toISOString(),
        updated_at: doc.updated_at?.toISOString(),
      }))
    })
    
  } catch (error) {
    console.error(' Connection test failed:', error)
    const err = error as Error
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
