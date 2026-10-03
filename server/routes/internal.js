import express from 'express'
import { cronMiddleware } from '../middleware/admin.js'
import { asyncHandler } from '../middleware/errors.js'
import { sendDailyGameReminders } from '../jobs/dailyReminderJob.js'

const router = express.Router()

router.post(
  '/daily-reminders',
  cronMiddleware,
  asyncHandler(async (req, res) => {
    const result = await sendDailyGameReminders()
    return res.json(result)
  })
)

export default router
