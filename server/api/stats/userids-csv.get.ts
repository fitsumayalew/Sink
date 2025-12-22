import type { H3Event } from 'h3'
import { QuerySchema } from '@@/schemas/query'

const { select } = SqlBricks

function query2sql(query: typeof QuerySchema._type, event: H3Event): string {
  const filter = query2filter(query)
  const { dataset } = useRuntimeConfig(event)

  // Query all userIDs with counts (no limit for CSV export)
  const sql = select('blob17 as userID, SUM(_sample_interval) as count')
    .from(dataset)
    .where(filter)
    .groupBy('userID')
    .orderBy('count DESC')

  appendTimeFilter(sql, query)
  return sql.toString()
}

export default eventHandler(async (event) => {
  const query = await getValidatedQuery(event, QuerySchema.parse)
  const sql = query2sql(query, event)
  const result = await useWAE(event, sql) as { userID: string, count: number }[]

  // Filter out empty userIDs
  const filtered = result.filter(row => row.userID && row.userID !== '')

  // Generate CSV
  const csvHeader = 'userID,count\n'
  const csvRows = filtered.map((row: { userID: string, count: number }) =>
    `"${row.userID.replace(/"/g, '""')}",${row.count}`,
  ).join('\n')

  const csv = csvHeader + csvRows

  // Set headers for file download
  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="userids.csv"')

  return csv
})
