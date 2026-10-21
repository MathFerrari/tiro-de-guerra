
"use client";

import { useState } from "react";

type MilitaryType = "ATIRADOR" | "CB_DE_DIA";
type Filter = "TODOS" | MilitaryType;

type ChartItem = {
    date: string;
    militares: {
        id: string;
        registration: string;
        warName: string;
        type: MilitaryType;
    }[];
};


const colors = [
    // Verdes militares
    "#344E41", "#3A5545", "#405B49", "#46594A", "#4F6348",
    "#53694B", "#586D4E", "#5D7251", "#627653", "#687653",
    "#6B7355", "#707A59", "#737C69", "#77815F", "#7C8565",

    // Verdes-oliva
    "#646B45", "#6B7149", "#71784D", "#777F52", "#7D8557",
    "#838B5C", "#899161", "#8F9766", "#959D6B", "#9BA370",
    "#5B6342", "#626A46", "#69724A", "#707A4E", "#778252",

    // Verdes-floresta
    "#263D32", "#2D4537", "#344C3B", "#3B533F", "#425A43",
    "#496147", "#50684B", "#576F4F", "#5E7653", "#658057",
    "#304638", "#374E3C", "#3E5640", "#455E44", "#4C6648",

    // Verdes-sálvia e acinzentados
    "#84906A", "#8B9672", "#929C7A", "#99A382", "#A0AA8A",
    "#A3AA98", "#ABB2A0", "#B3BAA8", "#BBC2B0", "#C3CAB8",
    "#7C8578", "#858D80", "#8E9688", "#979F90", "#A0A898",

    // Cáqui e areia
    "#81785B", "#898063", "#91886B", "#999073", "#A1987B",
    "#9A9674", "#A29E7C", "#AAA684", "#B1A17A", "#B9A982",
    "#B7AD91", "#BFB599", "#C7BD A1".replace(" ", ""), "#CFC5A9", "#D7CDB1",

    // Marrons terrosos
    "#5C4B3D", "#665443", "#705D49", "#7A664F", "#847055",
    "#756653", "#81705B", "#8B7A63", "#95846B", "#9F8E73",
    "#6A5847", "#735F4C", "#7C6651", "#856D56", "#8E745B",

    // Cinzas e tons neutros
    "#4B5550", "#545E58", "#5D6760", "#667068", "#6F7970",
    "#58656A", "#626F73", "#6C797D", "#768387", "#808D91",
    "#656B65", "#70766F", "#7B8179", "#868C83", "#91978D",

    // Olivas escuros e tons complementares
    "#3E4633", "#474F39", "#50583F", "#596145", "#626A4B",
    "#6B7351", "#747C57", "#7D855D", "#868E63", "#8F9769",
    "#485044", "#51594A", "#5A624F", "#636B54", "#6C7459",
];


export function MilitaryChart({ data }: { data: ChartItem[] }) {
    const [filter, setFilter] = useState<Filter>("TODOS");
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const counts = new Map<string, {
        registration: string;
        warName: string;
        type: MilitaryType;
        total: number;
    }>();

    data.forEach((escala) => {
        escala.militares.forEach((m) => {
            if (filter !== "TODOS" && m.type !== filter) return;

            const current = counts.get(m.id);
            counts.set(m.id, {
                registration: m.registration,
                warName: m.warName,
                type: m.type,
                total: (current?.total ?? 0) + 1,
            });
        });
    });

    const entries = [...counts.entries()]
        .map(([id, military]) => ({ id, ...military }))
        .sort((a, b) => b.total - a.total);

    const total = entries.reduce((sum, m) => sum + m.total, 0);
    let accumulated = 0;

    const segments = entries.map((m, index) => {
        const start = accumulated;
        accumulated += total ? (m.total / total) * 100 : 0;

        return {
            ...m,
            color: colors[index % colors.length],
            start,
            end: accumulated,
            percentage: total ? (m.total / total) * 100 : 0,
        };
    });

    const hovered = segments.find((m) => m.id === hoveredId);

    const pieBackground = total
        ? `conic-gradient(${segments.map((m) => `${m.color} ${m.start}% ${m.end}%`).join(", ")})`
        : "#E5E7EB";

    const filters: { label: string; value: Filter }[] = [
        { label: "Todos", value: "TODOS" },
        { label: "Atiradores", value: "ATIRADOR" },
        { label: "Cabo de dia", value: "CB_DE_DIA" },
    ];


    function getPieSlice(startAngle: number, endAngle: number, radius = 100) {
        const round = (value: number) => Number(value.toFixed(3));

        const point = (angle: number) => {
            const rad = ((angle - 90) * Math.PI) / 180;

            return {
                x: round(110 + radius * Math.cos(rad)),
                y: round(110 + radius * Math.sin(rad)),
            };
        };

        if (endAngle - startAngle >= 359.99) {
            return `M 110 10 A 100 100 0 1 1 109.99 10 Z`;
        }

        const start = point(startAngle);
        const end = point(endAngle);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `M 110 110 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    }


    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                    <h2 className="text-base font-semibold tracking-tight text-military-green-dark">
                        Distribuição de guardas
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Participação de cada militar nas últimas {data.length} escalas
                    </p>
                </div>

                <div className="flex w-fit flex-wrap gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
                    {filters.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                setFilter(item.value);
                                setHoveredId(null);
                            }}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${filter === item.value
                                ? "bg-white text-military-green-dark shadow-sm ring-1 ring-gray-200/70"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <span className="text-xl">◔</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Nenhuma atribuição encontrada</p>
                    <p className="mt-1 text-xs text-gray-400">
                        Não há militares para exibir nesse filtro.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 items-center gap-8 p-5 sm:p-6 md:grid-cols-[minmax(220px,0.9fr)_1.1fr]">
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-[300px]">
                            <svg viewBox="0 0 220 220" className="h-auto w-full overflow-visible">
                                {segments.map((m) => (
                                    <path
                                        key={m.id}
                                        d={getPieSlice(m.start * 3.6, m.end * 3.6)}
                                        fill={m.color}
                                        stroke="#F8FAF8"
                                        strokeWidth="2"
                                        className="cursor-pointer transition-opacity duration-150"
                                        opacity={hoveredId && hoveredId !== m.id ? 0.45 : 1}
                                        onMouseEnter={() => setHoveredId(m.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => setHoveredId(hoveredId === m.id ? null : m.id)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`${m.registration} - ${m.warName}: ${m.total} guardas`}
                                        onFocus={() => setHoveredId(m.id)}
                                        onBlur={() => setHoveredId(null)}
                                    />
                                ))}
                            </svg>

                            <div className="pointer-events-none absolute inset-[30%] flex flex-col items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white px-2 text-center shadow-sm">
                                {hovered ? (
                                    <>
                                        <span className="w-full truncate text-xs font-semibold text-gray-700">
                                            {hovered.registration} — {hovered.warName}
                                        </span>
                                        <span className="mt-1 text-3xl font-bold text-military-green-dark">
                                            {hovered.total}
                                        </span>
                                        <span className="text-[11px] text-gray-500">
                                            {hovered.total === 1 ? "guarda" : "guardas"} · {hovered.percentage.toFixed(1)}%
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-3xl font-bold text-military-green-dark">{total}</span>
                                        <span className="text-xs text-gray-500">Guardas atribuídas</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="mt-2 text-center text-xs text-gray-400">
                            Passe o cursor sobre uma fatia para ver o militar
                        </p>
                    </div>

                    <div className="min-w-0">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800">Legenda de militares</h3>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    Quantidade e participação individual
                                </p>
                            </div>
                            <span className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100">
                                {entries.length} militares
                            </span>
                        </div>

                        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                            {segments.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onMouseEnter={() => setHoveredId(m.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onFocus={() => setHoveredId(m.id)}
                                    onBlur={() => setHoveredId(null)}
                                    onClick={() => setHoveredId(hoveredId === m.id ? null : m.id)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${hoveredId === m.id
                                        ? "border-gray-200 bg-gray-50 shadow-sm"
                                        : "border-transparent hover:bg-gray-50"
                                        }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full ring-4 ring-gray-50"
                                            style={{ backgroundColor: m.color }}
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-700">
                                                {m.registration} — {m.warName}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-gray-400">
                                                {m.type === "ATIRADOR" ? "Atirador" : "Cabo de dia"}
                                            </span>
                                        </span>
                                    </span>

                                    <span className="shrink-0 text-right">
                                        <span className="block text-sm font-semibold tabular-nums text-gray-700">
                                            {m.total}
                                        </span>
                                        <span className="block text-[11px] tabular-nums text-gray-400">
                                            {m.percentage.toFixed(1)}%
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
