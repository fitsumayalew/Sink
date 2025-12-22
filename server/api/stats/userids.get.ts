import type { H3Event } from 'h3'
import { QuerySchema } from '@@/schemas/query'

const { select } = SqlBricks

function query2sql(query: typeof QuerySchema._type, event: H3Event): string {
  const filter = query2filter(query)
  const { dataset } = useRuntimeConfig(event)

  // Query userID (blob17) with counts, top 100
  const sql = select('blob17 as userID, SUM(_sample_interval) as count')
    .from(dataset)
    .where(filter)
    .groupBy('userID')
    .orderBy('count DESC')

  appendTimeFilter(sql, query)
  return `${sql.toString()} LIMIT 100`
}

export default eventHandler(async (event) => {
  const query = await getValidatedQuery(event, QuerySchema.parse)
  const sql = query2sql(query, event)
  const response = await useWAE(event, sql) as { data: { userID: string, count: number }[] }
  const result = response?.data || []

  // Filter out empty userIDs
  return result.filter(row => row.userID && row.userID !== '')
})
