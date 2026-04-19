const KEY = 'dj_visitor_id'

export function getVisitorId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(KEY, id)
  }
  return id
}
