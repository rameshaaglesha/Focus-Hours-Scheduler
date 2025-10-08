import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getStudyBlocksCollection } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collection = await getStudyBlocksCollection()
    const studyBlocks = await collection
      .find({ user_id: user.id })
      .sort({ start_time: 1 })
      .toArray()

    // Convert MongoDB documents to JSON-serializable format
    const blocks = studyBlocks.map(block => ({
      ...block,
      _id: String(block._id),
      start_time: block.start_time.toISOString(),
      end_time: block.end_time.toISOString(),
      created_at: block.created_at.toISOString(),
      updated_at: block.updated_at.toISOString(),
    }))

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Error fetching study blocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study blocks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, start_time, end_time } = body

    // Validation
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
    }

    const startTime = new Date(start_time)
    const endTime = new Date(end_time)

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (startTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule sessions in the past' },
        { status: 400 }
      )
    }

    const collection = await getStudyBlocksCollection()

    // Check for time conflicts
    const conflictingBlocks = await collection.findOne({
      user_id: user.id,
      $or: [
        // New block starts during existing block
        {
          start_time: { $lte: startTime },
          end_time: { $gt: startTime }
        },
        // New block ends during existing block
        {
          start_time: { $lt: endTime },
          end_time: { $gte: endTime }
        },
        // New block completely contains existing block
        {
          start_time: { $gte: startTime },
          end_time: { $lte: endTime }
        }
      ]
    })

    if (conflictingBlocks) {
      return NextResponse.json(
        { error: 'Time conflict with existing study session' },
        { status: 400 }
      )
    }
    
    const studyBlock = {
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || '',
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled',
      notification_sent: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await collection.insertOne(studyBlock)

    return NextResponse.json({
      success: true,
      block: {
        ...studyBlock,
        _id: result.insertedId.toString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        created_at: studyBlock.created_at.toISOString(),
        updated_at: studyBlock.updated_at.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error creating study block:', error)
    return NextResponse.json(
      { error: 'Failed to create study block' },
      { status: 500 }
    )
  }
}
