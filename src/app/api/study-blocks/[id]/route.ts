import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getStudyBlocksCollection } from '@/lib/mongodb'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore setAll errors in Server Components
          }
        },
      },
    }
  )
}

// GET single study block
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid study block ID' }, { status: 400 })
    }

    const collection = await getStudyBlocksCollection()
    const studyBlock = await collection.findOne({
      _id: new ObjectId(id),
      user_id: user.id // Ensure user owns this block
    })

    if (!studyBlock) {
      return NextResponse.json({ error: 'Study block not found' }, { status: 404 })
    }

    return NextResponse.json({
      block: {
        ...studyBlock,
        _id: String(studyBlock._id),
        start_time: studyBlock.start_time.toISOString(),
        end_time: studyBlock.end_time.toISOString(),
        created_at: studyBlock.created_at.toISOString(),
        updated_at: studyBlock.updated_at.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching study block:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study block' },
      { status: 500 }
    )
  }
}

// UPDATE study block
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid study block ID' }, { status: 400 })
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

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const collection = await getStudyBlocksCollection()

    // Check if the block exists and user owns it
    const existingBlock = await collection.findOne({
      _id: new ObjectId(id),
      user_id: user.id
    })

    if (!existingBlock) {
      return NextResponse.json({ error: 'Study block not found' }, { status: 404 })
    }

    // Check for time conflicts (excluding current block)
    const conflictingBlocks = await collection.findOne({
      user_id: user.id,
      _id: { $ne: new ObjectId(id) }, // Exclude current block
      $or: [
        {
          start_time: { $lte: startTime },
          end_time: { $gt: startTime }
        },
        {
          start_time: { $lt: endTime },
          end_time: { $gte: endTime }
        },
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

    // Update the study block
    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      start_time: startTime,
      end_time: endTime,
      updated_at: new Date(),
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id), user_id: user.id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Study block not found' }, { status: 404 })
    }

    // Return updated block
    const updatedBlock = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      block: {
        ...updatedBlock,
        _id: String(updatedBlock!._id),
        start_time: updatedBlock!.start_time.toISOString(),
        end_time: updatedBlock!.end_time.toISOString(),
        created_at: updatedBlock!.created_at.toISOString(),
        updated_at: updatedBlock!.updated_at.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error updating study block:', error)
    return NextResponse.json(
      { error: 'Failed to update study block' },
      { status: 500 }
    )
  }
}

// DELETE study block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid study block ID' }, { status: 400 })
    }

    const collection = await getStudyBlocksCollection()

    // Delete the study block (only if user owns it)
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      user_id: user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Study block not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Study block deleted successfully' })
  } catch (error) {
    console.error('Error deleting study block:', error)
    return NextResponse.json(
      { error: 'Failed to delete study block' },
      { status: 500 }
    )
  }
}
