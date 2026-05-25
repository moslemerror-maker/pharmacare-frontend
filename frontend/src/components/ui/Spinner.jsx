export default function Spinner({ text='Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3"/>
      <span className="text-sm">{text}</span>
    </div>
  )
}
