"use client";

import { Button } from "@repo/ui";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  BrainIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LinkIcon,
  PlayIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  SendIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface IntelligenceItem {
  id: string;
  category: string;
  question: string;
  context: string | null;
  priority: number;
  status: string;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface IntelligenceData {
  exists: boolean;
  id?: string;
  completenessScore?: number;
  confidenceScores?: Record<string, number>;
  lastAuditAt?: string;
  items?: IntelligenceItem[];
  _count?: {
    items: number;
    auditLogs: number;
  };
}

interface TrendPoint {
  score: number;
  trigger: string;
  date: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  MISSING_PATH: "Camino faltante",
  MISSING_ROLE: "Rol faltante",
  MISSING_EXCEPTION: "Excepción faltante",
  MISSING_DECISION: "Decisión faltante",
  MISSING_TRIGGER: "Trigger faltante",
  MISSING_OUTPUT: "Output faltante",
  CONTRADICTION: "Contradicción",
  UNCLEAR_HANDOFF: "Handoff confuso",
  MISSING_SLA: "SLA faltante",
  MISSING_SYSTEM: "Sistema faltante",
  GENERAL_GAP: "Gap general",
};

const CATEGORY_COLORS: Record<string, string> = {
  MISSING_PATH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  MISSING_ROLE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MISSING_EXCEPTION: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  MISSING_DECISION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  MISSING_TRIGGER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  MISSING_OUTPUT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  CONTRADICTION: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  UNCLEAR_HANDOFF: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MISSING_SLA: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  MISSING_SYSTEM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  GENERAL_GAP: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function getPriorityColor(priority: number) {
  if (priority >= 70) return "text-red-500";
  if (priority >= 40) return "text-yellow-500";
  return "text-gray-400";
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-500";
  if (score >= 30) return "text-yellow-500";
  return "text-red-500";
}

function getScoreBg(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function IntelligenceTab({ processId }: { processId: string }) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveText, setResolveText] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [resolvedItems, setResolvedItems] = useState<IntelligenceItem[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [intelRes, trendRes] = await Promise.all([
        fetch(`/api/processes/${processId}/intelligence`),
        fetch(`/api/processes/${processId}/intelligence/trend`),
      ]);
      const intelData = await intelRes.json();
      const trendData = await trendRes.json();
      setData(intelData);
      setTrend(trendData.trend || []);
    } catch (error) {
      console.error("Failed to fetch intelligence:", error);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAudit = async (action: "initialize" | "audit") => {
    setAuditing(true);
    try {
      await fetch(`/api/processes/${processId}/intelligence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchData();
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setAuditing(false);
    }
  };

  const handleResolve = async (itemId: string) => {
    if (!resolveText.trim()) return;
    try {
      await fetch(
        `/api/processes/${processId}/intelligence/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution: resolveText,
            status: "RESOLVED",
          }),
        },
      );
      setResolvingId(null);
      setResolveText("");
      await fetchData();
    } catch (error) {
      console.error("Resolve failed:", error);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch(
        `/api/processes/${processId}/intelligence/share`,
        { method: "POST" },
      );
      const { shareUrl: url } = await res.json();
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const fetchResolved = async () => {
    try {
      const res = await fetch(
        `/api/processes/${processId}/intelligence/items?status=RESOLVED&limit=50`,
      );
      const { items } = await res.json();
      setResolvedItems(items || []);
      setShowResolved(!showResolved);
    } catch (error) {
      console.error("Failed to fetch resolved:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────
  if (!data?.exists) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <SparklesIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            Este proceso no ha sido analizado
          </h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            La IA puede analizar todo lo que se sabe de este proceso, encontrar
            gaps de logica, contradicciones, y generar preguntas priorizadas.
          </p>
          <Button onClick={() => handleAudit("initialize")} disabled={auditing}>
            {auditing ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <BrainIcon className="mr-2 h-4 w-4" />
                Analizar proceso
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Data State ─────────────────────────────────────────────────────────
  const openItems = (data.items || []).filter(
    (item) => filter === "all" || item.category === filter,
  );
  const score = data.completenessScore ?? 0;
  const scores = (data.confidenceScores ?? {}) as Record<string, number>;
  const auditCount = data._count?.auditLogs ?? 0;

  // Estimate sessions to 80%
  let estimateText = "";
  if (trend.length >= 3 && score < 80) {
    const recentScores = trend.slice(-3);
    const avgIncrease =
      (recentScores[recentScores.length - 1].score - recentScores[0].score) /
      recentScores.length;
    if (avgIncrease > 0) {
      const sessionsNeeded = Math.ceil((80 - score) / avgIncrease);
      const low = Math.max(1, sessionsNeeded - 1);
      const high = sessionsNeeded + 1;
      estimateText = `~${low}-${high} sesiones mas para 80%`;
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Completeness Overview ──────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Completeness</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAudit("audit")}
            disabled={auditing}
          >
            {auditing ? (
              <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-1 h-3 w-3" />
            )}
            Re-auditar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="flex flex-col items-center">
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
              {estimateText && (
                <span className="mt-1 flex items-center text-xs text-muted-foreground">
                  <TrendingUpIcon className="mr-1 h-3 w-3" />
                  {estimateText}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex-1">
              <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBg(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Confidence dimensions */}
              <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                {Object.entries(scores)
                  .filter(([key]) => key !== "contradictions")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="truncate text-muted-foreground">
                        {key}
                      </span>
                      <span className={getScoreColor((value as number) * 100)}>
                        {Math.round((value as number) * 100)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Trend mini-chart */}
          {trend.length > 1 && (
            <div className="mt-4 flex items-end gap-1 h-12">
              {trend.map((point, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${getScoreBg(point.score)} opacity-80`}
                  style={{ height: `${Math.max(4, point.score)}%` }}
                  title={`${point.score}% — ${new Date(point.date).toLocaleDateString()}`}
                />
              ))}
            </div>
          )}

          {data.lastAuditAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ultima auditoria:{" "}
              {new Date(data.lastAuditAt).toLocaleString()}
              {auditCount > 0 && ` (${auditCount} auditorias total)`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Open Questions ────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">
            Preguntas abiertas ({openItems.length})
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {openItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter === "all"
                ? "No hay preguntas abiertas. El proceso esta completo o necesita una auditoria."
                : "No hay preguntas en esta categoria."}
            </p>
          ) : (
            <div className="space-y-3">
              {openItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <AlertTriangleIcon
                          className={`h-4 w-4 ${getPriorityColor(item.priority)}`}
                        />
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-800"}`}
                        >
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          P{item.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{item.question}</p>
                      {item.context && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.context}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline resolve */}
                  {resolvingId === item.id ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={resolveText}
                        onChange={(e) => setResolveText(e.target.value)}
                        placeholder="Escribe la respuesta..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleResolve(item.id);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleResolve(item.id)}
                        disabled={!resolveText.trim()}
                      >
                        <SendIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setResolvingId(null);
                          setResolveText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1"
                      onClick={() => setResolvingId(item.id)}
                    >
                      Responder
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Resolved Items ────────────────────────────────────── */}
      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={fetchResolved}
      >
        <span className="flex items-center">
          <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
          Resueltas
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${showResolved ? "rotate-180" : ""}`}
        />
      </Button>
      {showResolved && resolvedItems.length > 0 && (
        <div className="space-y-2 pl-4">
          {resolvedItems.map((item) => (
            <div
              key={item.id}
              className="rounded border p-2 text-sm opacity-70"
            >
              <p className="font-medium line-through">{item.question}</p>
              {item.resolution && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.resolution}
                </p>
              )}
              {item.resolvedBy && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Resuelto por: {item.resolvedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Actions ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Button variant="outline" onClick={handleShare}>
            <LinkIcon className="mr-2 h-4 w-4" />
            {copying ? "Link copiado!" : "Preparar cliente"}
          </Button>
          {shareUrl && (
            <span className="flex items-center text-xs text-muted-foreground">
              {shareUrl}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
