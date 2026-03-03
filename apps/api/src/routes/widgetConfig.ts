import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { projects, projectSettings } from '../schema/index.js'
import { NotFoundError } from '../types.js'

const router = new Hono()

// ─── GET /api/widget-config/:projectId ────────────────────────────────────────
// Public endpoint — served to the widget running on external sites.

router.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  if (!project) throw new NotFoundError('Project not found')

  const settings = await db.query.projectSettings.findFirst({
    where: eq(projectSettings.projectId, projectId),
  })

  return c.json({
    data: {
      projectId,
      projectName: project.name,
      theme:       settings?.themeJson ?? {},
    },
  })
})

export { router as widgetConfigRoutes }
