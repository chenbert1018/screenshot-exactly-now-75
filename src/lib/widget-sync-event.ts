export const WIDGET_SYNC_EVENT = "idoldays:widget-sync";

export function requestWidgetSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WIDGET_SYNC_EVENT));
}
