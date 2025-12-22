<script setup>
import { Download } from 'lucide-vue-next'

const props = defineProps({
  link: {
    type: Object,
    default: () => null,
  },
})

const time = inject('time')
const filters = inject('filters')

const { data, pending, refresh } = await useFetch('/api/stats/userids', {
  query: computed(() => ({
    ...time.value,
    ...filters.value,
    id: props.link?.id,
  })),
})

watch([time, filters], () => refresh(), { deep: true })

function downloadCSV() {
  const params = new URLSearchParams({
    ...time.value,
    ...filters.value,
    ...(props.link?.id ? { id: props.link.id } : {}),
  })
  window.open(`/api/stats/userids-csv?${params.toString()}`, '_blank')
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-base font-medium">
        {{ $t('dashboard.userids_title', 'Top User IDs') }}
      </CardTitle>
      <Button
        variant="outline"
        size="sm"
        @click="downloadCSV"
      >
        <Download class="mr-2 h-4 w-4" />
        {{ $t('common.download_csv', 'Download CSV') }}
      </Button>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
      <div v-else-if="!data || data.length === 0" class="text-center py-8 text-muted-foreground">
        {{ $t('dashboard.no_userids', 'No user IDs tracked yet') }}
      </div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-16">
              #
            </TableHead>
            <TableHead>{{ $t('dashboard.userid', 'User ID') }}</TableHead>
            <TableHead class="text-right">
              {{ $t('dashboard.count', 'Count') }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(row, index) in data" :key="row.userID">
            <TableCell class="font-medium text-muted-foreground">
              {{ index + 1 }}
            </TableCell>
            <TableCell class="font-mono text-sm">
              {{ row.userID }}
            </TableCell>
            <TableCell class="text-right font-semibold">
              {{ row.count }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
