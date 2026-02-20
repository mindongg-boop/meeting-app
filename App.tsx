import React, { useMemo, useState } from 'react';

type FlowNode = {
  id: string;
  label: string;
  order: number;
};

type NodePlacement = {
  x: number;
  y: number;
  row: number;
  column: number;
};

type FlowEdge = {
  from: string;
  to: string;
};

type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

const DEFAULT_PROMPT = `아이디어 수집\n요구사항 정리\n초안 작성\n팀 리뷰\n수정 및 보완\n최종 배포`;

const sanitizeLabel = (text: string): string => text.trim().replace(/\s+/g, ' ');

const parseWorkflow = (text: string): FlowData => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { nodes: [], edges: [] };
  }

  const supportsArrows = lines.some((line) => line.includes('->'));
  const edges: FlowEdge[] = [];
  const nodeOrder: string[] = [];
  const nodeSet = new Set<string>();

  const addNode = (label: string) => {
    if (!nodeSet.has(label)) {
      nodeSet.add(label);
      nodeOrder.push(label);
    }
  };

  if (supportsArrows) {
    lines.forEach((line) => {
      const parts = line.split('->').map(sanitizeLabel).filter(Boolean);
      if (parts.length === 0) {
        return;
      }
      parts.forEach(addNode);
      for (let i = 0; i < parts.length - 1; i += 1) {
        edges.push({ from: parts[i], to: parts[i + 1] });
      }
    });
  } else {
    lines.forEach((line) => addNode(sanitizeLabel(line)));
    for (let i = 0; i < nodeOrder.length - 1; i += 1) {
      edges.push({ from: nodeOrder[i], to: nodeOrder[i + 1] });
    }
  }

  const incomingCount = new Map<string, number>();
  nodeOrder.forEach((node) => incomingCount.set(node, 0));
  edges.forEach((edge) => {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
  });

  const levelMap = new Map<string, number>();
  const queue = nodeOrder.filter((node) => (incomingCount.get(node) ?? 0) === 0);
  queue.forEach((node) => levelMap.set(node, 0));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const currentLevel = levelMap.get(current) ?? 0;

    edges
      .filter((edge) => edge.from === current)
      .forEach((edge) => {
        const nextLevel = Math.max((levelMap.get(edge.to) ?? 0), currentLevel + 1);
        levelMap.set(edge.to, nextLevel);
        incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 1) - 1);
        if ((incomingCount.get(edge.to) ?? 0) === 0) {
          queue.push(edge.to);
        }
      });
  }

  nodeOrder.forEach((node, index) => {
    if (!levelMap.has(node)) {
      levelMap.set(node, index);
    }
  });

  const nodes = nodeOrder.map((label, index) => ({
    id: label,
    label,
    order: index,
  }));

  return { nodes, edges };
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState(DEFAULT_PROMPT);
  const flowData = useMemo(() => parseWorkflow(inputText), [inputText]);

  const nodeWidth = 220;
  const nodeHeight = 56;
  const horizontalGap = 48;
  const verticalGap = 70;
  const maxNodesPerRow = 6;

  const rowCount = Math.max(1, Math.ceil(flowData.nodes.length / maxNodesPerRow));
  const columnCount = Math.min(maxNodesPerRow, Math.max(1, flowData.nodes.length));

  const width = 120 + columnCount * nodeWidth + (columnCount - 1) * horizontalGap;
  const height = 120 + rowCount * nodeHeight + (rowCount - 1) * verticalGap;

  const positionMap = new Map<string, NodePlacement>(
    flowData.nodes.map((node) => {
      const column = node.order % maxNodesPerRow;
      const row = Math.floor(node.order / maxNodesPerRow);
      const x = 60 + column * (nodeWidth + horizontalGap);
      const y = 60 + row * (nodeHeight + verticalGap);
      return [node.id, { x, y, row, column }];
    }),
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-7xl p-6 lg:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">워크플로우 플로우차트 생성기</h1>
          <p className="mt-2 text-slate-600">
            단계 내용을 입력하면 자동으로 플로우차트를 생성합니다. 줄바꿈(순차 흐름) 또는
            <code className="mx-1 rounded bg-slate-200 px-1 py-0.5">A -&gt; B -&gt; C</code>
            형식을 사용할 수 있으며, 한 줄에 최대 6개까지 좌→우로 배치됩니다.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">워크플로우 입력</h2>
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              className="mt-4 h-[420px] w-full resize-none rounded-lg border border-slate-300 p-3 text-sm leading-6 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="예: 기획 -&gt; 개발 -&gt; 테스트"
            />
          </article>

          <article className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">자동 생성 플로우차트</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                노드 {flowData.nodes.length}개
              </span>
            </div>

            <div className="h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
              {flowData.nodes.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  내용을 입력하면 플로우차트가 표시됩니다.
                </div>
              ) : (
                <svg width={width} height={height} className="min-w-full">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                    </marker>
                  </defs>

                  {flowData.edges.map((edge) => {
                    const from = positionMap.get(edge.from);
                    const to = positionMap.get(edge.to);

                    if (!from || !to) {
                      return null;
                    }

                    const isWrapToNextRow = to.row > from.row;

                    if (isWrapToNextRow) {
                      return (
                        <line
                          key={`${edge.from}-${edge.to}`}
                          x1={to.x - 40}
                          y1={to.y + nodeHeight / 2}
                          x2={to.x}
                          y2={to.y + nodeHeight / 2}
                          stroke="#6366f1"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    }

                    return (
                      <line
                        key={`${edge.from}-${edge.to}`}
                        x1={from.x + nodeWidth}
                        y1={from.y + nodeHeight / 2}
                        x2={to.x}
                        y2={to.y + nodeHeight / 2}
                        stroke="#6366f1"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}

                  {flowData.nodes.map((node) => {
                    const position = positionMap.get(node.id);
                    if (!position) {
                      return null;
                    }

                    return (
                      <g key={node.id}>
                        <rect
                          x={position.x}
                          y={position.y}
                          width={nodeWidth}
                          height={nodeHeight}
                          rx="10"
                          fill="#ffffff"
                          stroke="#a5b4fc"
                          strokeWidth="2"
                        />
                        <text
                          x={position.x + nodeWidth / 2}
                          y={position.y + nodeHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#1e293b"
                          fontSize="14"
                          fontWeight="500"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default App;
