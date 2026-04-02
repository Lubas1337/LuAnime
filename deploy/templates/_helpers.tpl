{{- define "luwatch.labels" -}}
app.kubernetes.io/name: luwatch
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "luwatch.selectorLabels" -}}
app: luwatch
{{- end }}

{{- define "luwatch.image" -}}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}
