export function isSameCalendarDay(a, b) {
    const d1 = new Date(a)
    const d2 = new Date(b)
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

export function dayDividerLabel(iso) {
    const d = new Date(iso)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (isSameCalendarDay(d, now)) return "Today"
    if (isSameCalendarDay(d, yesterday)) return "Yesterday"
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year:
            d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
}

export function formatFullTimestamp(iso) {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export function formatRelativeTime(iso) {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (sec < 10) return "just now"
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.floor(hr / 24)
    if (day < 7) return `${day}d ago`
    return formatFullTimestamp(iso)
}
