export default function Badge({ type = 'status', value }) {
  if (!value) return null
  const key = value.toLowerCase().replace(/ /g, '_')
  const label = value.replace(/_/g, ' ')

  return (
    <span className={`badge badge-${key}`}>
      {label}
    </span>
  )
}
